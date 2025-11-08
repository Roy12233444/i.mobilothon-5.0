import numpy as np
from typing import List, Dict, Tuple, Optional
from itertools import permutations
from .fuel_calculator import FuelCalculator
from .graph_builder import RouteGraphBuilder
import networkx as nx

class RouteOptimizer:
    """
    A class to handle route optimization for multiple vehicles and stops.
    """
    
    def __init__(self, location: str = "Bangalore, India"):
        """
        Initialize the RouteOptimizer.
        
        Args:
            location: Location for the road network
        """
        self.location = location
        self.graph_builder = RouteGraphBuilder(location=location)
        self.fuel_calculator = FuelCalculator()
        
    def optimize_routes(self, 
                       vehicles: List[Dict],
                       stops: List[Tuple[float, float]],
                       depot: Tuple[float, float],
                       time_of_day: str = 'day',
                       max_stops_per_vehicle: int = 5) -> Dict:
        """
        Optimize routes for multiple vehicles.
        
        Args:
            vehicles: List of vehicle dictionaries with 'id' and 'type'
            stops: List of (lat, lon) tuples for delivery/pickup locations
            depot: (lat, lon) of the depot/warehouse
            time_of_day: 'day' or 'night'
            max_stops_per_vehicle: Maximum number of stops per vehicle
            
        Returns:
            Dictionary with optimized routes and metrics
        """
        # Fetch road network if not already done
        if self.graph_builder.graph is None:
            self.graph_builder.fetch_road_network()
        
        # Simple clustering: assign stops to nearest vehicles
        # In a real implementation, you'd use a proper clustering algorithm
        num_vehicles = len(vehicles)
        clusters = self._cluster_stops(stops, num_vehicles, max_stops_per_vehicle)
        
        optimized_routes = []
        total_distance = 0
        total_time = 0
        total_fuel = 0
        
        # Optimize route for each vehicle
        for i, (vehicle, vehicle_stops) in enumerate(zip(vehicles, clusters)):
            if not vehicle_stops:
                continue
                
            # Add depot as start and end point
            route_stops = [depot] + vehicle_stops + [depot]
            
            # Find optimal order of stops (TSP)
            optimal_order = self._solve_tsp(route_stops)
            
            # Calculate route details
            route_info = self._calculate_route_metrics(
                vehicle, 
                [route_stops[i] for i in optimal_order],
                time_of_day
            )
            
            optimized_routes.append({
                'vehicle_id': vehicle['id'],
                'vehicle_type': vehicle['type'],
                'stops': [route_stops[i] for i in optimal_order],
                'distance_km': route_info['distance_km'],
                'time_minutes': route_info['time_minutes'],
                'fuel_liters': route_info['fuel_liters'],
                'emissions_kg': route_info['emissions_kg']
            })
            
            total_distance += route_info['distance_km']
            total_time += route_info['time_minutes']
            total_fuel += route_info['fuel_liters']
        
        return {
            'routes': optimized_routes,
            'summary': {
                'total_distance_km': total_distance,
                'total_time_minutes': total_time,
                'total_fuel_liters': total_fuel,
                'total_emissions_kg': total_fuel * 2.31,  # CO2 emissions
                'num_vehicles_used': len([r for r in optimized_routes if len(r['stops']) > 2])
            }
        }
    
    def _cluster_stops(self, 
                      stops: List[Tuple[float, float]], 
                      num_clusters: int,
                      max_per_cluster: int) -> List[List[Tuple[float, float]]]:
        """
        Simple clustering of stops for multiple vehicles.
        In a real implementation, use k-means or similar.
        """
        # Simple round-robin assignment
        clusters = [[] for _ in range(num_clusters)]
        for i, stop in enumerate(stops):
            clusters[i % num_clusters].append(stop)
            
        # Ensure no cluster exceeds max_stops_per_vehicle
        final_clusters = []
        for cluster in clusters:
            while len(cluster) > max_per_cluster:
                final_clusters.append(cluster[:max_per_cluster])
                cluster = cluster[max_per_cluster:]
            if cluster:
                final_clusters.append(cluster)
                
        return final_clusters
    
    def _solve_tsp(self, stops: List[Tuple[float, float]]) -> List[int]:
        """
        Solve Traveling Salesman Problem for the given stops.
        Uses a simple nearest neighbor heuristic for small instances,
        and a more sophisticated approach for larger ones.
        """
        num_stops = len(stops)
        
        # For small number of stops, use brute force
        if num_stops <= 8:
            return self._brute_force_tsp(stops)
        else:
            return self._nearest_neighbor_tsp(stops)
    
    def _brute_force_tsp(self, stops: List[Tuple[float, float]]) -> List[int]:
        """Brute force TSP solver (only for small instances)."""
        num_stops = len(stops)
        if num_steps <= 1:
            return list(range(num_steps))
            
        # Generate all possible paths (excluding the fixed start/end at index 0)
        best_path = None
        best_distance = float('inf')
        
        for perm in permutations(range(1, num_stops)):
            # Always start and end at the depot (first stop)
            path = [0] + list(perm) + [0]
            
            # Calculate total distance
            distance = sum(
                self._calculate_distance(stops[path[i]], stops[path[i+1]])
                for i in range(len(path)-1)
            )
            
            if distance < best_distance:
                best_distance = distance
                best_path = path
                
        return best_path[1:-1]  # Exclude the duplicate depot
    
    def _nearest_neighbor_tsp(self, stops: List[Tuple[float, float]]) -> List[int]:
        """Nearest neighbor heuristic for TSP."""
        num_stops = len(stops)
        visited = [False] * num_stops
        path = [0]  # Start at the depot
        visited[0] = True
        
        for _ in range(1, num_stops):
            last = path[-1]
            nearest = None
            min_dist = float('inf')
            
            for j in range(num_stops):
                if not visited[j]:
                    dist = self._calculate_distance(stops[last], stops[j])
                    if dist < min_dist:
                        min_dist = dist
                        nearest = j
            
            if nearest is not None:
                path.append(nearest)
                visited[nearest] = True
        
        return path[1:]  # Exclude the starting depot
    
    def _calculate_distance(self, point1: Tuple[float, float], point2: Tuple[float, float]) -> float:
        """Calculate great-circle distance between two points in km."""
        # In a real implementation, use the road network distance
        from geopy.distance import geodesic
        return geodesic(point1, point2).km
    
    def _calculate_route_metrics(self, 
                               vehicle: Dict, 
                               route: List[Tuple[float, float]],
                               time_of_day: str) -> Dict:
        """Calculate distance, time, and fuel consumption for a route."""
        total_distance = 0
        total_time = 0
        
        # Calculate segment distances and times
        for i in range(len(route) - 1):
            origin = route[i]
            dest = route[i+1]
            
            # Get shortest path between points
            result = self.graph_builder.get_shortest_path(origin, dest)
            
            if result:
                _, segment_time = result
                segment_distance = self._calculate_distance(origin, dest)
                
                total_distance += segment_distance
                total_time += segment_time
        
        # Calculate fuel consumption
        fuel_info = self.fuel_calculator.calculate_fuel_consumption(
            distance_km=total_distance,
            vehicle_type=vehicle['type'],
            load_kg=vehicle.get('load_kg', 0),
            avg_speed_kmh=50,  # Approximate average speed
            road_condition='average'
        )
        
        return {
            'distance_km': total_distance,
            'time_minutes': total_time / 60,  # Convert seconds to minutes
            'fuel_liters': fuel_info['total_fuel_liters'],
            'emissions_kg': fuel_info['emissions_kg_co2']
        }

# Example usage
if __name__ == "__main__":
    # Initialize the optimizer
    optimizer = RouteOptimizer(location="Whitefield, Bangalore, India")
    
    # Define vehicles
    vehicles = [
        {"id": "Truck-1", "type": "truck", "capacity_kg": 10000},
        {"id": "Van-1", "type": "van", "capacity_kg": 2000}
    ]
    
    # Define depot (warehouse) location
    depot = (12.9698, 77.7500)  # Example coordinates in Bangalore
    
    # Define delivery/pickup locations (example coordinates around Bangalore)
    stops = [
        (12.9716, 77.5946),  # MG Road
        (12.9352, 77.6245),  # Koramangala
        (13.0356, 77.5974),  # Yelahanka
        (12.9784, 77.6408),  # Indiranagar
        (12.9141, 77.6843),  # HSR Layout
        (13.0105, 77.5512),  # Malleshwaram
        (12.9719, 77.6412),  # Domlur
        (12.9538, 77.5803)   # Jayanagar
    ]
    
    # Optimize routes
    result = optimizer.optimize_routes(
        vehicles=vehicles,
        stops=stops,
        depot=depot,
        time_of_day='day',
        max_stops_per_vehicle=5
    )
    
    # Print results
    print("\nOptimized Routes:")
    for i, route in enumerate(result['routes']):
        print(f"\nVehicle {route['vehicle_id']} ({route['vehicle_type']}):")
        print(f"  Stops: {len(route['stops'])}")
        print(f"  Distance: {route['distance_km']:.1f} km")
        print(f"  Estimated time: {route['time_minutes']:.1f} minutes")
        print(f"  Estimated fuel: {route['fuel_liters']:.1f} L")
        print(f"  Estimated CO2: {route['emissions_kg']:.1f} kg")
    
    print("\nSummary:")
    print(f"Total distance: {result['summary']['total_distance_km']:.1f} km")
    print(f"Total time: {result['summary']['total_time_minutes']:.1f} minutes")
    print(f"Total fuel: {result['summary']['total_fuel_liters']:.1f} L")
    print(f"Total CO2 emissions: {result['summary']['total_emissions_kg']:.1f} kg")
    print(f"Vehicles used: {result['summary']['num_vehicles_used']}")