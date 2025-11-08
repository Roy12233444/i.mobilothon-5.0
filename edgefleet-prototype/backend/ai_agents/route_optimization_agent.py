import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from typing import List, Dict, Tuple, Optional, Union, Callable
import networkx as nx
import os
import cv2
import time
from pathlib import Path
from datetime import datetime, timedelta
import requests
import logging
from ultralytics import YOLO
from services.camera_feed_manager import camera_manager
from .base_agent import BaseAgent
from .model_loader import model_loader
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import ByteTrack if available
try:
    from byte_tracker import BYTETracker
    BYTETRACK_AVAILABLE = True
except ImportError:
    BYTETRACK_AVAILABLE = False
    logger.warning("ByteTrack not available. Falling back to basic tracking.")

class RouteOptimizationAgent(BaseAgent):
    """
    AI agent for dynamic route optimization considering traffic, weather, and vehicle conditions.
    Uses a combination of graph algorithms and ML models for optimal routing.
    """
    
    def __init__(self, traffic_model_path: str = None, weather_model_path: str = None):
        """
        Initialize the Route Optimization Agent with YOLOv8 and ByteTrack
        
        Args:
            traffic_model_path: Path to the traffic prediction model (YOLOv8)
            weather_model_path: Path to the weather prediction model (not used directly)
        """
        # Initialize base class
        super().__init__(traffic_model_path or "yolov8x.pt")
        
        # Model paths
        self.traffic_model_path = traffic_model_path or os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            'ml', 'saved_models', 'yolov8x.pt'
        )
        self.bytetrack_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            'ml', 'saved_models', 'bytetrack_x_mot17.pth.tar'
        )
        self.traffic_sign_model_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            'ml', 'saved_models', 'traffic_sign_yolov5.pt'
        )
        
        # Initialize models
        self.yolo_model = None
        self.traffic_sign_model = None
        self.tracker = None
        self.road_graph = nx.DiGraph()
        self.traffic_data = {}
        self.camera_data = {}  # Store camera-specific data
        self.last_update = datetime.min
        self.update_interval = timedelta(minutes=5)  # Update traffic data every 5 minutes
        
        # Traffic analysis parameters
        self.vehicle_classes = [2, 3, 5, 7]  # COCO classes for vehicles: car, motorcycle, bus, truck
        self.traffic_sign_classes = [0, 1, 2, 3, 5]  # Traffic sign classes (adjust based on your model)
        self.traffic_jam_threshold = 10  # Number of vehicles to consider as traffic jam
        self.traffic_density = 0.0  # 0-1 scale of traffic density
        
        # Camera feed management
        self.camera_manager = camera_manager
        self.active_cameras = set()
        
        # Initialize models
        self.load_models()
    
    def add_camera_feed(self, camera_id: str, rtsp_url: str, location: Dict[str, float], 
                       callback: Optional[Callable] = None):
        """
        Add a camera feed for real-time traffic monitoring.
        
        Args:
            camera_id: Unique identifier for the camera
            rtsp_url: RTSP URL or camera index
            location: Dictionary with 'lat' and 'lon' for camera location
            callback: Optional callback function for processed results
        """
        if camera_id in self.active_cameras:
            logger.warning(f"Camera {camera_id} is already being monitored")
            return
        
        # Store camera metadata
        self.camera_data[camera_id] = {
            'location': location,
            'last_update': datetime.min,
            'traffic_conditions': {},
            'status': 'active'
        }
        
        # Define processing callback
        def process_frame(frame_data):
            return self._process_camera_frame(camera_id, frame_data, callback)
        
        # Add to camera manager
        self.camera_manager.add_camera(camera_id, rtsp_url, process_frame)
        self.active_cameras.add(camera_id)
        logger.info(f"Added camera {camera_id} at {location}")
    
    def remove_camera_feed(self, camera_id: str):
        """Remove a camera feed from monitoring."""
        if camera_id in self.active_cameras:
            self.camera_manager.remove_camera(camera_id)
            if camera_id in self.camera_data:
                del self.camera_data[camera_id]
            self.active_cameras.discard(camera_id)
            logger.info(f"Removed camera {camera_id} from monitoring")
    
    def _process_camera_frame(self, camera_id: str, frame_data: Dict, callback: Optional[Callable] = None):
        """Process a single frame from a camera feed."""
        try:
            if camera_id not in self.camera_data:
                return
            
            # Update timestamp
            self.camera_data[camera_id]['last_update'] = datetime.utcnow()
            
            # Process frame for traffic analysis
            traffic_data = self._analyze_traffic(frame_data['frame'])
            
            # Update camera data
            self.camera_data[camera_id]['traffic_conditions'] = traffic_data
            self.camera_data[camera_id]['last_update'] = datetime.utcnow()
            
            # Call the callback if provided
            if callback:
                result = {
                    'camera_id': camera_id,
                    'timestamp': frame_data['timestamp'],
                    'traffic_data': traffic_data,
                    'location': self.camera_data[camera_id]['location']
                }
                callback(result)
                
        except Exception as e:
            logger.error(f"Error processing frame from camera {camera_id}: {str(e)}")
    
    def get_camera_status(self) -> Dict:
        """Get the status of all monitored cameras."""
        status = {}
        for camera_id in self.active_cameras:
            if camera_id in self.camera_data:
                status[camera_id] = {
                    'status': self.camera_data[camera_id].get('status', 'unknown'),
                    'last_update': self.camera_data[camera_id].get('last_update').isoformat() if self.camera_data[camera_id].get('last_update') else 'never',
                    'traffic_conditions': self.camera_data[camera_id].get('traffic_conditions', {}),
                    'location': self.camera_data[camera_id].get('location', {})
                }
        return status
    
    def load_models(self):
        """Load YOLOv8 and ByteTrack models"""
        try:
            logger.info("Loading YOLOv8 model...")
            self.yolo_model = YOLO(self.traffic_model_path)
            logger.info(f"YOLOv8 model loaded from {self.traffic_model_path}")
            
            # Set model to evaluation mode
            self.yolo_model.eval()
            
            # Load traffic sign detection model
            if os.path.exists(self.traffic_sign_model_path):
                logger.info("Loading traffic sign detection model...")
                self.traffic_sign_model = YOLO(self.traffic_sign_model_path)
                self.traffic_sign_model.eval()
                logger.info(f"Traffic sign model loaded from {self.traffic_sign_model_path}")
            
            # Initialize ByteTrack if available
            if BYTETRACK_AVAILABLE and os.path.exists(self.bytetrack_path):
                logger.info("Initializing ByteTrack...")
                from byte_tracker import BYTETracker, STrack
                self.tracker = BYTETracker(
                    track_thresh=0.45,
                    track_buffer=30,
                    match_thresh=0.8,
                    frame_rate=30
                )
                logger.info("ByteTrack initialized")
            else:
                logger.warning("ByteTrack not available, using basic tracking")
                
        except Exception as e:
            logger.error(f"Error loading models: {str(e)}")
            raise
    
    def preprocess(self, data: Dict) -> Dict:
        """
        Preprocess input data for route optimization
        
        Args:
            data: Dictionary containing route data including:
                - origin: Starting location (lat, lon)
                - destination: Target location (lat, lon)
                - waypoints: List of intermediate waypoints
                - vehicle_type: Type of vehicle
                - current_time: Current timestamp
                - traffic_conditions: Current traffic conditions (optional)
                - weather_conditions: Current weather conditions (optional)
                - camera_feed: Optional camera feed for real-time analysis
                
        Returns:
            Preprocessed data dictionary
        """
        processed = {
            'origin': data.get('origin'),
            'destination': data.get('destination'),
            'waypoints': data.get('waypoints', []),
            'vehicle_type': data.get('vehicle_type', 'truck'),
            'current_time': data.get('current_time', datetime.utcnow()),
            'camera_feed': data.get('camera_feed'),
            'traffic_conditions': data.get('traffic_conditions', {}),
            'weather_conditions': data.get('weather_conditions', {})
        }
        
        # Update traffic data from camera feed if available
        if processed['camera_feed'] and self.yolo_model:
            try:
                # Process the camera feed
                traffic_data = self._analyze_traffic(processed['camera_feed'])
                processed['traffic_conditions'].update(traffic_data)
                logger.info(f"Updated traffic conditions from camera feed: {traffic_data}")
            except Exception as e:
                logger.error(f"Error processing camera feed: {str(e)}")
        
        # Update traffic data if it's time to refresh
        time_since_update = datetime.utcnow() - self.last_update
        if time_since_update >= self.update_interval:
            self._update_traffic_data(processed['origin'], processed['destination'])
            self.last_update = datetime.utcnow()
        
        # Add traffic data to processed output
        processed['traffic_conditions'].update(self.traffic_data)
            
        # Add default weather data if not provided
        if not processed['weather_conditions']:
            processed['weather_conditions'] = self._get_current_weather(processed['origin'])
            
        return processed
    
    def predict(self, data: Dict) -> Dict:
        """
        Generate optimal route based on input data
        
        Args:
            data: Preprocessed route data
            
        Returns:
            Dictionary containing optimized route and metadata
        """
        # Build road graph with current conditions
        self._build_road_graph(data)
        
        # Get all points to visit (origin + waypoints + destination)
        points = [data['origin']] + data['waypoints'] + [data['destination']]
        
        # Find optimal order of waypoints (Traveling Salesman Problem)
        optimal_order = self._solve_tsp(points, data)
        
        # Find optimal paths between waypoints
        route = []
        total_distance = 0
        total_time = 0
        
        for i in range(len(optimal_order) - 1):
            start = optimal_order[i]
            end = optimal_order[i + 1]
            
            # Find shortest path considering traffic and weather
            path, distance, time = self._find_optimal_path(start, end, data)
            route.extend(path[:-1])  # Avoid duplicate points
            total_distance += distance
            total_time += time
        
        # Add the final destination point
        route.append(optimal_order[-1])
        
        return {
            'route': route,
            'waypoint_order': optimal_order[1:-1],  # Exclude origin and destination
            'total_distance_km': total_distance,
            'estimated_time_min': total_time,
            'traffic_conditions': data['traffic_conditions'],
            'weather_conditions': data['weather_conditions']
        }
    
    def postprocess(self, predictions: Dict) -> Dict:
        """
        Format the predictions for the API response
        
        Args:
            predictions: Raw predictions from the model
            
        Returns:
            Formatted response dictionary
        """
        return {
            'status': 'success',
            'data': {
                'optimized_route': predictions['route'],
                'waypoint_order': predictions['waypoint_order'],
                'distance': {
                    'value': predictions['total_distance_km'],
                    'unit': 'km'
                },
                'estimated_time': {
                    'value': predictions['estimated_time_min'],
                    'unit': 'minutes'
                },
                'traffic_conditions': predictions['traffic_conditions'],
                'weather_conditions': predictions['weather_conditions']
            },
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def _build_road_graph(self, data: Dict):
        """Build a graph representation of the road network with current conditions"""
        # This is a simplified version - in practice, you'd use OSM or another mapping service
        # to get the actual road network
        
        # Clear existing graph
        self.road_graph = nx.DiGraph()
        
        # Add nodes (locations)
        points = [data['origin']] + data['waypoints'] + [data['destination']]
        for i, point in enumerate(points):
            self.road_graph.add_node(i, pos=point)
        
        # Add edges with weights based on distance, traffic, and weather
        for i in range(len(points)):
            for j in range(i + 1, len(points)):
                # Calculate base distance (in km)
                dist = self._haversine(points[i], points[j])
                
                # Adjust weight based on traffic and weather
                traffic_factor = self._get_traffic_factor(points[i], points[j], data['traffic_conditions'])
                weather_factor = self._get_weather_factor(points[i], data['weather_conditions'])
                
                # Calculate final weight (distance * traffic_factor * weather_factor)
                weight = dist * traffic_factor * weather_factor
                
                # Add bidirectional edges
                self.road_graph.add_edge(i, j, weight=weight, distance=dist)
                self.road_graph.add_edge(j, i, weight=weight, distance=dist)
    
    def _solve_tsp(self, points: List[Tuple[float, float]], data: Dict) -> List[Tuple[float, float]]:
        """
        Solve the Traveling Salesman Problem to find the optimal order of waypoints
        
        This is a simplified version using a greedy algorithm. For production use,
        you might want to use a more sophisticated algorithm like Christofides or LKH.
        """
        if len(points) <= 2:
            return points
            
        # Start with the first point
        unvisited = set(range(1, len(points)))
        current = 0
        path = [points[0]]
        
        while unvisited:
            # Find the nearest unvisited point
            next_point = min(
                unvisited,
                key=lambda x: self.road_graph[current][x]['weight']
            )
            path.append(points[next_point])
            unvisited.remove(next_point)
            current = next_point
            
        return path
    
    def _find_optimal_path(self, start: Tuple[float, float], end: Tuple[float, float], 
                          data: Dict) -> Tuple[List[Tuple[float, float]], float, float]:
        """
        Find the optimal path between two points considering traffic and weather
        
        Returns:
            Tuple of (path, distance_km, time_min)
        """
        # In a real implementation, this would use the road graph and routing algorithms
        # For now, return a straight line with estimated time
        distance = self._haversine(start, end)
        
        # Estimate time based on distance, traffic, and weather
        base_speed = 50  # km/h
        traffic_factor = self._get_traffic_factor(start, end, data['traffic_conditions'])
        weather_factor = self._get_weather_factor(start, data['weather_conditions'])
        
        # Adjust speed based on conditions
        speed = base_speed / (traffic_factor * weather_factor)
        time_hours = distance / max(speed, 1)  # Avoid division by zero
        
        return [start, end], distance, time_hours * 60  # Convert to minutes
    
    def _analyze_traffic(self, image: np.ndarray) -> Dict:
        """
        Analyze traffic from a camera feed using YOLOv8 and ByteTrack
        
        Args:
            image: Input image (numpy array in BGR format)
            
        Returns:
            Dictionary with traffic analysis results
        """
        if self.yolo_model is None:
            return {}
        
        try:
            # Convert BGR to RGB
            img_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Run YOLOv8 inference
            results = self.yolo_model(img_rgb)
            
            # Process detections
            detections = []
            for result in results:
                boxes = result.boxes.xyxy.cpu().numpy()
                scores = result.boxes.conf.cpu().numpy()
                class_ids = result.boxes.cls.cpu().numpy().astype(int)
                
                for box, score, class_id in zip(boxes, scores, class_ids):
                    if class_id in self.vehicle_classes:
                        x1, y1, x2, y2 = box
                        detections.append([x1, y1, x2, y2, score, class_id])
            
            # Update tracker with detections
            if self.tracker is not None and detections:
                online_targets = self.tracker.update(
                    output_results=detections,
                    img_info=image.shape,
                    img_size=image.shape[:2]
                )
                
                # Process tracked objects
                tracked_vehicles = []
                for t in online_targets:
                    tlwh = t.tlwh
                    track_id = t.track_id
                    class_id = int(t.class_id)
                    
                    if class_id in self.vehicle_classes:
                        tracked_vehicles.append({
                            'id': int(track_id),
                            'class': class_id,
                            'bbox': [float(x) for x in tlwh],
                            'confidence': float(t.score)
                        })
                
                # Calculate traffic density (simplified)
                self.traffic_density = min(1.0, len(tracked_vehicles) / 50.0)  # Normalize to 0-1
                
                return {
                    'vehicles': tracked_vehicles,
                    'density': self.traffic_density,
                    'is_congested': len(tracked_vehicles) > self.traffic_jam_threshold,
                    'vehicle_count': len(tracked_vehicles),
                    'timestamp': datetime.utcnow().isoformat()
                }
            
            return {}
            
        except Exception as e:
            logger.error(f"Error in traffic analysis: {str(e)}")
            return {}
    
    def _update_traffic_data(self, origin: Tuple[float, float], 
                           destination: Tuple[float, float]) -> None:
        """
        Update traffic data for the given route
        
        Args:
            origin: Starting location (lat, lon)
            destination: Target location (lat, lon)
        """
        try:
            # In a real implementation, this would fetch data from traffic APIs
            # For now, we'll simulate some traffic data
            self.traffic_data = {
                'congestion_level': 'moderate',
                'incidents': [],
                'average_speed': 40 + (random.random() * 20 - 10),  # Random speed between 30-50 km/h
                'density': self.traffic_density,
                'last_updated': datetime.utcnow().isoformat()
            }
            
            # Simulate traffic incidents (10% chance)
            if random.random() < 0.1:
                self.traffic_data['incidents'].append({
                    'type': random.choice(['accident', 'construction', 'hazard', 'congestion']),
                    'severity': random.choice(['low', 'medium', 'high']),
                    'location': self._get_random_point_between(origin, destination),
                    'description': random.choice([
                        'Vehicle breakdown', 'Road work ahead', 'Accident reported',
                        'Heavy traffic', 'Road closed', 'Detour in place'
                    ]),
                    'timestamp': datetime.utcnow().isoformat()
                })
                
        except Exception as e:
            logger.error(f"Error updating traffic data: {str(e)}")
    
    def _get_random_point_between(self, point1: Tuple[float, float], 
                                point2: Tuple[float, float]) -> Tuple[float, float]:
        """Get a random point between two coordinates"""
        lat1, lon1 = point1
        lat2, lon2 = point2
        
        # Simple linear interpolation
        t = random.random()
        lat = lat1 + (lat2 - lat1) * t
        lon = lon1 + (lon2 - lon1) * t
        
        return (lat, lon)
    
    def _get_current_weather(self, location: Tuple[float, float]) -> Dict:
        """
        Get current weather conditions for a location
        
        In a production environment, this would call a weather API like OpenWeatherMap
        """
        try:
            # This is a placeholder - in a real app, you would call a weather API
            # Example with OpenWeatherMap (commented out as it requires an API key):
            """
            api_key = os.getenv('OPENWEATHER_API_KEY')
            if not api_key:
                raise ValueError("OpenWeatherMap API key not found")
                
            lat, lon = location
            url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric"
            response = requests.get(url)
            response.raise_for_status()
            data = response.json()
            
            return {
                'condition': data['weather'][0]['main'].lower(),
                'temperature': data['main']['temp'],
                'precipitation': data.get('rain', {}).get('1h', 0),
                'wind_speed': data['wind']['speed'] * 3.6,  # Convert m/s to km/h
                'humidity': data['main']['humidity'],
                'visibility': data.get('visibility', 10000) / 1000,  # Convert m to km
                'timestamp': datetime.utcnow().isoformat()
            }
            """
            
            # Fallback to mock data
            conditions = ['clear', 'clouds', 'rain', 'snow', 'thunderstorm', 'fog']
            return {
                'condition': random.choice(conditions),
                'temperature': random.randint(15, 30),  # Celsius
                'precipitation': random.random() * 5,   # 0-5 mm/h
                'wind_speed': random.random() * 30,     # 0-30 km/h
                'humidity': random.randint(30, 90),     # 30-90%
                'visibility': random.uniform(1, 20),    # 1-20 km
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting weather data: {str(e)}")
            # Return default values on error
            return {
                'condition': 'clear',
                'temperature': 22,  # Celsius
                'precipitation': 0,  # mm/h
                'wind_speed': 10,    # km/h
                'humidity': 60,      # %
                'visibility': 10,    # km
                'timestamp': datetime.utcnow().isoformat()
            }
    
    def _get_traffic_factor(self, start: Tuple[float, float], end: Tuple[float, float], 
                           traffic_conditions: Dict) -> float:
        """
        Calculate a traffic factor that affects travel time (1.0 = no delay)
        
        Args:
            start: Starting location (lat, lon)
            end: Destination location (lat, lon)
            traffic_conditions: Dictionary with traffic data
            
        Returns:
            Traffic factor (>= 1.0, where higher means more delay)
        """
        base_factor = 1.0
        
        # Adjust for traffic density
        density = traffic_conditions.get('density', 0.5)  # 0-1 scale
        base_factor += density * 1.5  # 1.0 to 2.5x delay based on density
        
        # Check for incidents along the route
        for incident in traffic_conditions.get('incidents', []):
            # Calculate distance to incident (simplified)
            incident_loc = incident.get('location', (0, 0))
            dist_to_route = self._distance_to_route(start, end, incident_loc)
            
            # If incident is close to our route, increase delay
            if dist_to_route < 0.01:  # Within ~1km
                severity = incident.get('severity', 'medium')
                if severity == 'low':
                    base_factor *= 1.2
                elif severity == 'medium':
                    base_factor *= 1.5
                else:  # high
                    base_factor *= 2.0
        
        # Ensure minimum factor is 1.0
        return max(1.0, base_factor)
    
    def _distance_to_route(self, start: Tuple[float, float], 
                          end: Tuple[float, float], 
                          point: Tuple[float, float]) -> float:
        """
        Calculate the minimum distance from a point to a line segment (simplified)
        
        Args:
            start: Start of the line segment (lat, lon)
            end: End of the line segment (lat, lon)
            point: Point to measure distance to (lat, lon)
            
        Returns:
            Approximate distance in degrees (simplified for demo)
        """
        # In a real implementation, you'd use proper geodesic distance
        # This is a simplified version using Euclidean distance
        x1, y1 = start
        x2, y2 = end
        x0, y0 = point
        
        # Vector from start to end
        dx = x2 - x1
        dy = y2 - y1
        
        # If the line is just a point, return distance to that point
        if dx == 0 and dy == 0:
            return ((x0 - x1) ** 2 + (y0 - y1) ** 2) ** 0.5
        
        # Calculate projection of point onto the line
        t = ((x0 - x1) * dx + (y0 - y1) * dy) / (dx * dx + dy * dy)
        
        # Clamp t to the line segment
        t = max(0, min(1, t))
        
        # Closest point on the line segment
        closest_x = x1 + t * dx
        closest_y = y1 + t * dy
        
        # Distance to the closest point
        return ((x0 - closest_x) ** 2 + (y0 - closest_y) ** 2) ** 0.5
    
    def _get_weather_factor(self, location: Tuple[float, float], 
                           weather_conditions: Dict) -> float:
        """
        Calculate a weather factor that affects travel time (1.0 = no delay)
        
        Args:
            location: Current location (lat, lon)
            weather_conditions: Dictionary with weather data
            
        Returns:
            Weather factor (>= 1.0, where higher means more delay)
        """
        # Base factor based on weather condition
        condition_factors = {
            'clear': 1.0,
            'clouds': 1.0,
            'partly-cloudy': 1.0,
            'cloudy': 1.0,
            'rain': 1.3,
            'light rain': 1.2,
            'moderate rain': 1.4,
            'heavy rain': 1.7,
            'showers': 1.5,
            'thunderstorm': 2.0,
            'snow': 2.0,
            'light snow': 1.5,
            'heavy snow': 2.5,
            'fog': 1.5,
            'mist': 1.3,
            'haze': 1.2,
            'dust': 1.4,
            'sand': 1.6,
            'ash': 1.8,
            'squall': 2.0,
            'tornado': 3.0
        }
        
        # Get base factor from weather condition
        condition = weather_conditions.get('condition', 'clear').lower()
        factor = condition_factors.get(condition, 1.0)
        
        # Adjust for precipitation intensity
        precipitation = weather_conditions.get('precipitation', 0)  # mm/h
        if precipitation > 10:  # Heavy rain > 10mm/h
            factor = max(factor, 1.7)
        elif precipitation > 5:  # Moderate rain 5-10mm/h
            factor = max(factor, 1.5)
        elif precipitation > 2:  # Light rain 2-5mm/h
            factor = max(factor, 1.2)
        
        # Adjust for wind speed (stronger wind = more delay)
        wind_speed = weather_conditions.get('wind_speed', 0)  # km/h
        if wind_speed > 50:  # Strong storm
            factor = max(factor, 2.0)
        elif wind_speed > 30:  # Strong wind
            factor = max(factor, 1.5)
        elif wind_speed > 20:  # Moderate wind
            factor = max(factor, 1.2)
        
        # Adjust for low visibility
        visibility = weather_conditions.get('visibility', 10)  # km
        if visibility < 0.1:  # Very poor visibility
            factor = max(factor, 2.0)
        elif visibility < 0.5:  # Poor visibility
            factor = max(factor, 1.7)
        elif visibility < 1:  # Moderate visibility
            factor = max(factor, 1.3)
        
        # Adjust for temperature extremes
        temperature = weather_conditions.get('temperature', 20)  # Celsius
        if temperature > 35 or temperature < -5:  # Extreme temperatures
            factor = max(factor, 1.3)
        
        # Ensure minimum factor is 1.0
        return max(1.0, factor)
    
    @staticmethod
    def _haversine(coord1: Tuple[float, float], coord2: Tuple[float, float]) -> float:
        """
        Calculate the great circle distance between two points
        on the earth specified in decimal degrees of latitude and longitude.
        
        Returns distance in kilometers.
        """
        from math import radians, cos, sin, asin, sqrt
        
        # Convert decimal degrees to radians
        lat1, lon1 = coord1
        lat2, lon2 = coord2
        
        # Convert to radians
        lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
        
        # Haversine formula
        dlon = lon2 - lon1
        dlat = lat2 - lat1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * asin(sqrt(a))
        
        # Radius of earth in kilometers
        r = 6371
        return c * r
