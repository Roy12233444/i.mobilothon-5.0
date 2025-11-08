import networkx as nx
import numpy as np
from typing import Dict, List, Tuple, Optional
import osmnx as ox
from geopy.distance import geodesic

class RouteGraphBuilder:
    """
    A class to build and manage a graph representation of the road network
    for route optimization.
    """
    
    def __init__(self, location: str = "Bangalore, India", 
                 network_type: str = 'drive', 
                 simplify: bool = True):
        """
        Initialize the RouteGraphBuilder.
        
        Args:
            location (str): Location to fetch the map for
            network_type (str): Type of street network to get ('drive', 'walk', 'bike', etc.)
            simplify (bool): If True, simplify the graph topology
        """
        self.location = location
        self.network_type = network_type
        self.simplify = simplify
        self.graph = None
        
    def fetch_road_network(self):
        """Fetch the road network using OSMnx."""
        print(f"Fetching road network for {self.location}...")
        self.graph = ox.graph_from_place(
            self.location, 
            network_type=self.network_type,
            simplify=self.simplify
        )
        print(f"Graph with {len(self.graph)} nodes and {self.graph.size()} edges created.")
        return self.graph
    
    def add_traffic_data(self, traffic_data: Dict[Tuple[float, float], float]):
        """
        Add traffic data to the graph edges.
        
        Args:
            traffic_data: Dictionary mapping (u, v) edge tuples to traffic levels (0-1)
        """
        if self.graph is None:
            raise ValueError("Graph not initialized. Call fetch_road_network() first.")
            
        for (u, v, key), data in self.graph.edges(keys=True, data=True):
            # Default traffic factor (1.0 means no delay)
            data['traffic_factor'] = 1.0
            
            # Check if we have traffic data for this edge
            for (lat, lon), traffic_level in traffic_data.items():
                # Simple check: if edge's midpoint is close to traffic point
                # In a real app, you'd use a spatial index for this
                edge_center = (
                    (data['geometry'].centroid.y + data['geometry'].centroid.y) / 2,
                    (data['geometry'].centroid.x + data['geometry'].centroid.x) / 2
                )
                dist = geodesic(edge_center, (lat, lon)).meters
                
                # If within 100m of traffic point, apply traffic factor
                if dist < 100:  # 100 meters
                    # Higher traffic level means slower speed
                    data['traffic_factor'] = 1.0 + traffic_level  # 1.0-2.0 multiplier
                    break
    
    def calculate_edge_weights(self, vehicle_type: str = 'truck', 
                             load_kg: float = 0, 
                             time_of_day: str = 'day') -> nx.MultiDiGraph:
        """
        Calculate edge weights based on various factors.
        
        Args:
            vehicle_type: Type of vehicle
            load_kg: Vehicle load in kg
            time_of_day: 'day' or 'night'
            
        Returns:
            NetworkX graph with updated edge weights
        """
        if self.graph is None:
            raise ValueError("Graph not initialized. Call fetch_road_network() first.")
            
        # Make a copy to avoid modifying the original graph
        G = self.graph.copy()
        
        # Time of day factors (simplified)
        time_factor = 1.2 if time_of_day == 'day' else 1.0  # Daytime is typically slower
        
        # Vehicle type factors (simplified)
        vehicle_factors = {
            'sedan': 1.0,
            'suv': 1.1,
            'truck': 1.3,
            'van': 1.15
        }
        vehicle_factor = vehicle_factors.get(vehicle_type.lower(), 1.0)
        
        # Calculate edge weights
        for u, v, key, data in G.edges(keys=True, data=True):
            # Get base attributes
            length = data.get('length', 1)  # meters
            maxspeed = self._parse_maxspeed(data.get('maxspeed', '50'))
            
            # Calculate base travel time (seconds)
            speed_kph = min(maxspeed, 100)  # Cap at 100 km/h
            base_time = (length / 1000) / speed_kph * 3600  # seconds
            
            # Apply factors
            traffic_factor = data.get('traffic_factor', 1.0)
            weight = base_time * traffic_factor * time_factor * vehicle_factor
            
            # Store the weight
            data['weight'] = weight
            
            # Also store the base time for reference
            data['base_time'] = base_time
        
        return G
    
    def _parse_maxspeed(self, maxspeed) -> float:
        """Parse maxspeed value which can be string, list, or number."""
        if isinstance(maxspeed, (int, float)):
            return float(maxspeed)
        elif isinstance(maxspeed, list):
            # If multiple speed limits, take the minimum
            return min(float(s) if isinstance(s, (int, float)) else 50 for s in maxspeed)
        elif isinstance(maxspeed, str):
            try:
                return float(maxspeed.split()[0])  # Handle '50 km/h' format
            except (ValueError, IndexError):
                return 50.0  # Default speed limit
        return 50.0  # Default speed limit
    
    def get_shortest_path(self, origin: Tuple[float, float], 
                         destination: Tuple[float, float],
                         weight: str = 'weight') -> Optional[Tuple[List, float]]:
        """
        Find the shortest path between two points.
        
        Args:
            origin: (lat, lon) of start point
            destination: (lat, lon) of end point
            weight: Edge attribute to use as weight
            
        Returns:
            Tuple of (path_nodes, path_length) or None if no path found
        """
        if self.graph is None:
            raise ValueError("Graph not initialized. Call fetch_road_network() first.")
            
        # Find nearest nodes to origin and destination
        orig_node = ox.distance.nearest_nodes(self.graph, origin[1], origin[0])
        dest_node = ox.distance.nearest_nodes(self.graph, destination[1], destination[0])
        
        try:
            # Find shortest path
            path = nx.shortest_path(self.graph, orig_node, dest_node, weight=weight)
            
            # Calculate total weight (distance, time, etc.)
            total_weight = sum(
                self.graph[u][v][0].get(weight, 0) 
                for u, v in zip(path[:-1], path[1:])
            )
            
            return path, total_weight
            
        except nx.NetworkXNoPath:
            print("No path found between the specified points.")
            return None

# Example usage
if __name__ == "__main__":
    # Initialize the graph builder
    graph_builder = RouteGraphBuilder(location="Whitefield, Bangalore, India")
    
    # Fetch the road network
    G = graph_builder.fetch_road_network()
    
    # Example traffic data (in a real app, this would come from a traffic API)
    traffic_data = {
        (12.9716, 77.5946): 0.8,  # Heavy traffic near MG Road
        (12.9352, 77.6245): 0.6   # Moderate traffic near Koramangala
    }
    
    # Add traffic data to the graph
    graph_builder.add_traffic_data(traffic_data)
    
    # Calculate edge weights for a truck
    weighted_graph = graph_builder.calculate_edge_weights(
        vehicle_type='truck',
        load_kg=5000,
        time_of_day='day'
    )
    
    # Example: Find shortest path between two points
    origin = (12.9716, 77.5946)  # MG Road
    destination = (12.9352, 77.6245)  # Koramangala
    
    result = graph_builder.get_shortest_path(origin, destination)
    
    if result:
        path_nodes, total_time = result
        print(f"\nFound path with {len(path_nodes)} nodes")
        print(f"Estimated travel time: {total_time/60:.1f} minutes")
    else:
        print("No path found.")