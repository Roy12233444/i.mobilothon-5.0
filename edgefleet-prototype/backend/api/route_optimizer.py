from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import logging
import sys
import os
import time
from pathlib import Path

# Add the ml directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'ml'))
from route_optimization import RouteOptimizer
from services.traffic_sign_service import get_traffic_sign_detector

router = APIRouter()
logger = logging.getLogger(__name__)

class VehicleRequest(BaseModel):
    id: str
    type: str  # truck, van, suv, sedan
    capacity_kg: Optional[float] = None
    current_load_kg: Optional[float] = 0

class RouteOptimizationRequest(BaseModel):
    vehicles: List[VehicleRequest]
    stops: List[Dict[str, float]]  # List of {lat: float, lng: float}
    depot: Dict[str, float]  # {lat: float, lng: float}
    time_of_day: str = 'day'  # 'day' or 'night'
    max_stops_per_vehicle: int = 5
    location: str = "Bangalore, India"

# Global variable to store the route optimizer instance
_route_optimizer = None

# Initialize traffic sign detector with the YOLOv5 model
TRAFFIC_SIGN_MODEL_PATH = os.path.join(
    os.path.dirname(__file__), '..', '..', 'ml', 'saved_models', 'traffic_sign_yolov5.pt'
)

def get_route_optimizer():
    """Get or create a route optimizer instance with ML models loaded."""
    global _route_optimizer
    if _route_optimizer is None:
        try:
            # Initialize with the default location
            _route_optimizer = RouteOptimizer(location="Bangalore, India")
            logger.info("Successfully initialized RouteOptimizer with ML models")
            
            # Initialize traffic sign detector
            get_traffic_sign_detector(TRAFFIC_SIGN_MODEL_PATH)
            
        except Exception as e:
            logger.error(f"Failed to initialize RouteOptimizer: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Failed to initialize route optimization service"
            )
    return _route_optimizer

def analyze_route_with_traffic_signs(route: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyze a route segment for traffic signs and their impact.
    
    Args:
        route: Dictionary containing route information
        
    Returns:
        Dictionary with traffic sign analysis
    """
    # This is a placeholder - in a real implementation, you would:
    # 1. Get street view images along the route
    # 2. Run traffic sign detection on the images
    # 3. Calculate the impact on the route
    
    # For now, we'll simulate some traffic sign detections
    # based on the route's distance and location
    
    # Simulate finding traffic signs with some probability
    import random
    
    # Base delay in seconds per km
    base_delay_per_km = 30  # seconds
    
    # Calculate route distance in km (approximate)
    distance_km = route.get('distance_meters', 0) / 1000
    
    # Simulate number of traffic signs based on distance
    num_signs = min(int(distance_km * 0.5), 10)  # Up to 1 sign per 2 km, max 10
    
    # Generate random traffic signs
    traffic_signs = []
    sign_types = [
        'speed limit 40', 'stop', 'yield', 'construction ahead',
        'pedestrian crossing', 'school zone', 'traffic light ahead'
    ]
    
    for _ in range(num_signs):
        sign_type = random.choice(sign_types)
        traffic_signs.append({
            'type': sign_type,
            'confidence': random.uniform(0.7, 0.99),
            'distance_along_route': random.uniform(0.1, 0.9)  # 10% to 90% of the route
        })
    
    # Calculate impact
    total_delay = 0
    warnings = []
    speed_limit = None
    
    for sign in traffic_signs:
        sign_type = sign['type'].lower()
        
        if 'speed limit' in sign_type:
            try:
                # Extract speed limit number
                limit = int(''.join(filter(str.isdigit, sign_type)))
                if speed_limit is None or limit < speed_limit:
                    speed_limit = limit
                warnings.append(f"Speed limit {limit} km/h detected")
            except (ValueError, AttributeError):
                pass
                
        elif any(sign in sign_type for sign in ['stop', 'yield']):
            delay = 15  # seconds
            total_delay += delay
            warnings.append(f"{sign_type.capitalize()} sign - adding {delay}s delay")
            
        elif 'construction' in sign_type or 'school zone' in sign_type:
            delay = 30  # seconds
            total_delay += delay
            warnings.append(f"{sign_type.capitalize()} - adding {delay}s delay")
    
    # Add base delay based on distance
    total_delay += int(distance_km * base_delay_per_km)
    
    return {
        'traffic_signs': traffic_signs,
        'total_delay_seconds': total_delay,
        'speed_limit_kmh': speed_limit,
        'warnings': warnings,
        'distance_km': distance_km
    }

@router.post("/optimize", response_model=Dict[str, Any])
async def optimize_route(request: Dict[str, Any]):
    """
    Optimize a single route with multiple waypoints.
    This is a simplified version of optimize_routes that matches the frontend's request format.
    """
    try:
        logger.info(f"Received simplified route optimization request")
        
        # Convert the frontend's format to the format expected by optimize_routes
        vehicles = request.get('vehicles', [
            {
                'id': 'truck-1',
                'type': 'truck',
                'capacity_kg': 10000,
                'current_load_kg': 0
            }
        ])
        
        # Extract stops from waypoints
        stops = []
        depot = None
        
        # The first waypoint is considered the depot
        if request.get('stops') and len(request['stops']) > 0:
            depot = {
                'lat': request['stops'][0].get('lat'),
                'lng': request['stops'][0].get('lng')
            }
            
            # The rest are stops
            for stop in request['stops'][1:]:
                stops.append({
                    'lat': stop.get('lat'),
                    'lng': stop.get('lng'),
                    'name': stop.get('name', ''),
                    'address': stop.get('address', '')
                })
        
        # Create the request for optimize_routes
        optimized_routes = await optimize_routes({
            'vehicles': vehicles,
            'stops': stops,
            'depot': depot or {'lat': 12.9716, 'lng': 77.5946},  # Default to Bangalore coordinates
            'time_of_day': request.get('time_of_day', 'day'),
            'max_stops_per_vehicle': request.get('max_stops_per_vehicle', 10),
            'location': request.get('location', 'Bangalore, India')
        })
        
        # Return the first route (since we're only optimizing one route)
        if optimized_routes and 'routes' in optimized_routes and len(optimized_routes['routes']) > 0:
            return optimized_routes['routes'][0]
        else:
            raise HTTPException(status_code=500, detail="No optimized route was generated")
            
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error in optimize_route: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/optimize-routes", response_model=Dict[str, Any])
async def optimize_routes(request: Dict[str, Any]):
    """
    Optimize routes for multiple vehicles using ML models.
    
    Request format:
    {
        "vehicles": [
            {"id": "truck-1", "type": "truck", "capacity_kg": 10000, "current_load_kg": 2000}
        ],
        "stops": [
            {"lat": 12.9716, "lng": 77.5946, "demand_kg": 0}
        ],
        "depot": {"lat": 12.9698, "lng": 77.7500},
        "time_of_day": "day",
        "max_stops_per_vehicle": 10,
        "location": "Bangalore, India"
    }
    """
    try:
        logger.info(f"Received route optimization request")
        start_time = time.time()
        
        # Validate request
        if not request.get('vehicles') or not request.get('stops') or not request.get('depot'):
            raise HTTPException(status_code=400, detail="Missing required fields (vehicles, stops, or depot)")
            
        # Get or create the route optimizer with ML models
        optimizer = get_route_optimizer()
        
        # Prepare data for optimization
        vehicles = [
            {
                'id': v.get('id', f'vehicle-{i+1}'),
                'type': v.get('type', 'truck'),
                'capacity_kg': v.get('capacity_kg', 10000 if v.get('type') == 'truck' else 2000),
                'current_load_kg': v.get('current_load_kg', 0)
            }
            for i, v in enumerate(request.get('vehicles', []))
        ]
        
        stops = [
            {
                'lat': stop.get('lat'),
                'lng': stop.get('lng'),
                'demand_kg': stop.get('demand_kg', 0),
                'name': stop.get('name', ''),
                'address': stop.get('address', '')
            }
            for stop in request.get('stops', [])
        ]
        
        depot = {
            'lat': request['depot'].get('lat'),
            'lng': request['depot'].get('lng')
        }
        
        # Validate coordinates
        if not all([stop['lat'] is not None and stop['lng'] is not None for stop in stops]):
            raise HTTPException(status_code=400, detail="Invalid coordinates in stops")
            
        if not depot['lat'] or not depot['lng']:
            raise HTTPException(status_code=400, detail="Invalid depot coordinates")
        
        # Run the optimization
        logger.info(f"Starting optimization for {len(vehicles)} vehicles and {len(stops)} stops")
        
        # Call the optimizer with the request data
        result = optimizer.optimize_routes({
            'vehicles': vehicles,
            'stops': stops,
            'depot': depot,
            'time_of_day': request.get('time_of_day', 'day'),
            'max_stops_per_vehicle': request.get('max_stops_per_vehicle', 10)
        })
        
        # Format the response
        response = {
            'status': 'success',
            'routes': [],
            'analysis': {}
        }
        
        if result and 'routes' in result:
            for i, route in enumerate(result['routes']):
                # Analyze the route for traffic signs and their impact
                route_analysis = analyze_route_with_traffic_signs(route)
                
                # Calculate adjusted duration with traffic sign delays
                base_duration = route.get('duration_seconds', 0)
                adjusted_duration = base_duration + route_analysis.get('total_delay_seconds', 0)
                
                route_data = {
                    'vehicle_id': route.get('vehicle_id', f'vehicle-{i+1}'),
                    'path': [],
                    'distance_meters': route.get('distance_meters', 0),
                    'duration_seconds': base_duration,
                    'adjusted_duration_seconds': adjusted_duration,
                    'stops': [],
                    'traffic_signs': route_analysis.get('traffic_signs', []),
                    'warnings': route_analysis.get('warnings', []),
                    'speed_limit_kmh': route_analysis.get('speed_limit_kmh'),
                    'delay_seconds': route_analysis.get('total_delay_seconds', 0)
                }
                
                # Convert path to the expected format
                if 'path' in route and route['path']:
                    route_data['path'] = [
                        {'lat': p[0], 'lng': p[1]} if isinstance(p, (list, tuple)) else 
                        {'lat': p.get('lat', 0), 'lng': p.get('lng', 0)}
                        for p in route['path']
                    ]
                
                # Add stops information if available
                if 'stops' in route and route['stops']:
                    route_data['stops'] = [
                        {
                            'lat': s[0] if isinstance(s, (list, tuple)) else s.get('lat', 0),
                            'lng': s[1] if isinstance(s, (list, tuple)) else s.get('lng', 0),
                            'name': s.get('name', '') if isinstance(s, dict) else ''
                        }
                        for s in route['stops']
                    ]
                
                response['routes'].append(route_data)
            
            # Calculate total statistics
            total_distance = sum(r.get('distance_meters', 0) for r in result['routes']) / 1000  # in km
            total_duration = sum(r.get('duration_seconds', 0) for r in result['routes']) / 60  # in minutes
            total_adjusted_duration = (
                sum(r.get('duration_seconds', 0) + route_analysis.get('total_delay_seconds', 0) 
                    for r in result['routes']) / 60  # in minutes
            )
            
            # Add summary information
            response['total_distance_km'] = round(total_distance, 2)
            response['total_duration_minutes'] = round(total_duration, 1)
            response['total_adjusted_duration_minutes'] = round(total_adjusted_duration, 1)
            response['optimization_time_ms'] = int((time.time() - start_time) * 1000)
            
            # Add analysis summary
            all_warnings = []
            speed_limits = []
            
            for route in response['routes']:
                all_warnings.extend(route.get('warnings', []))
                if 'speed_limit_kmh' in route and route['speed_limit_kmh'] is not None:
                    speed_limits.append(route['speed_limit_kmh'])
            
            response['analysis'] = {
                'total_warnings': len(all_warnings),
                'unique_warnings': list(set(all_warnings)),
                'recommended_speed_limit': min(speed_limits) if speed_limits else None,
                'total_delay_minutes': round(sum(r.get('delay_seconds', 0) for r in response['routes']) / 60, 1)
            }
        
        logger.info(f"Optimization completed successfully")
        return response
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error in optimize_routes: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to optimize routes: {str(e)}"
        )
