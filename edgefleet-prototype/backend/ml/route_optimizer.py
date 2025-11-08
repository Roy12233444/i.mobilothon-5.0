from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
import math
from typing import List, Dict, Any, Tuple
import logging

logger = logging.getLogger(__name__)

class RouteOptimizer:
    """
    A class to handle vehicle route optimization using Google's OR-Tools.
    Implements a solution for the Capacitated Vehicle Routing Problem (CVRP).
    """
    
    def __init__(self):
        self.data = {}
    
    def create_distance_matrix(self, locations: List[Dict[str, float]]) -> List[List[int]]:
        """
        Creates a distance matrix between all pairs of locations.
        
        Args:
            locations: List of dictionaries with 'lat' and 'lng' keys
            
        Returns:
            2D list representing the distance matrix in meters
        """
        def haversine_distance(coord1: Dict[str, float], coord2: Dict[str, float]) -> int:
            """Calculate the Haversine distance between two coordinates in meters."""
            # Earth radius in meters
            R = 6371000
            
            lat1, lon1 = math.radians(coord1['lat']), math.radians(coord1['lng'])
            lat2, lon2 = math.radians(coord2['lat']), math.radians(coord2['lng'])
            
            dlat = lat2 - lat1
            dlon = lon2 - lon1
            
            a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
            
            return int(R * c)  # Convert to meters and return as integer
        
        # Create distance matrix
        distance_matrix = []
        for i in range(len(locations)):
            row = []
            for j in range(len(locations)):
                if i == j:
                    row.append(0)
                else:
                    row.append(haversine_distance(locations[i], locations[j]))
            distance_matrix.append(row)
            
        return distance_matrix
    
    def optimize_routes(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Optimize vehicle routes using OR-Tools.
        
        Args:
            request_data: Dictionary containing:
                - vehicles: List of vehicles with 'id', 'capacity_kg', 'current_load_kg'
                - stops: List of delivery stops with 'lat', 'lng', 'demand_kg'
                - depot: Depot location with 'lat', 'lng'
                
        Returns:
            Dictionary containing optimized routes and metrics
        """
        try:
            # Prepare data for OR-Tools
            locations = [request_data['depot']] + request_data['stops']
            num_vehicles = len(request_data['vehicles'])
            num_locations = len(locations)
            
            # Create distance matrix
            distance_matrix = self.create_distance_matrix(locations)
            
            # Create routing index manager
            manager = pywrapcp.RoutingIndexManager(
                num_locations,  # number of locations
                num_vehicles,   # number of vehicles
                0               # depot index
            )
            
            # Create routing model
            routing = pywrapcp.RoutingModel(manager)
            
            # Define distance callback
            def distance_callback(from_index, to_index):
                from_node = manager.IndexToNode(from_index)
                to_node = manager.IndexToNode(to_index)
                return distance_matrix[from_node][to_node]
            
            transit_callback_index = routing.RegisterTransitCallback(distance_callback)
            routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)
            
            # Add capacity constraints
            if 'demand_kg' in request_data['stops'][0]:
                def demand_callback(from_index):
                    from_node = manager.IndexToNode(from_index)
                    return request_data['stops'][from_node-1]['demand_kg'] if from_node > 0 else 0
                
                demand_callback_index = routing.RegisterUnaryTransitCallback(demand_callback)
                
                for i, vehicle in enumerate(request_data['vehicles']):
                    routing.AddDimensionWithVehicleCapacity(
                        demand_callback_index,
                        0,  # null capacity slack
                        [vehicle['capacity_kg']] * num_vehicles,  # vehicle maximum capacities
                        True,  # start cumul to zero
                        'Capacity'
                    )
            
            # Set search parameters
            search_parameters = pywrapcp.DefaultRoutingSearchParameters()
            search_parameters.first_solution_strategy = (
                routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
            )
            search_parameters.local_search_metaheuristic = (
                routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
            )
            search_parameters.time_limit.seconds = 30
            
            # Solve the problem
            solution = routing.SolveWithParameters(search_parameters)
            
            # Prepare response
            if solution:
                return self._format_solution(manager, routing, solution, request_data, distance_matrix)
            else:
                return {"error": "No solution found"}
                
        except Exception as e:
            logger.error(f"Route optimization error: {str(e)}", exc_info=True)
            return {"error": f"Failed to optimize routes: {str(e)}"}
    
    def _format_solution(self, manager, routing, solution, request_data, distance_matrix):
        """Format the OR-Tools solution into a more readable format."""
        routes = []
        total_distance = 0
        total_load = 0
        
        for vehicle_id in range(routing.vehicles()):
            index = routing.Start(vehicle_id)
            route_distance = 0
            route_load = 0
            route = []
            
            while not routing.IsEnd(index):
                node_index = manager.IndexToNode(index)
                next_node_index = manager.IndexToNode(solution.Value(routing.NextVar(index)))
                
                route_distance += distance_matrix[node_index][next_node_index]
                
                if node_index > 0:  # Skip depot
                    route_load += request_data['stops'][node_index-1].get('demand_kg', 0)
                    route.append({
                        'location': {
                            'lat': request_data['stops'][node_index-1]['lat'],
                            'lng': request_data['stops'][node_index-1]['lng']
                        },
                        'demand_kg': request_data['stops'][node_index-1].get('demand_kg', 0)
                    })
                
                index = solution.Value(routing.NextVar(index))
            
            routes.append({
                'vehicle_id': request_data['vehicles'][vehicle_id]['id'],
                'distance_meters': route_distance,
                'load_kg': route_load,
                'stops': route
            })
            
            total_distance += route_distance
            total_load += route_load
        
        return {
            'status': 'success',
            'routes': routes,
            'total_distance_meters': total_distance,
            'total_load_kg': total_load,
            'num_vehicles_used': len([r for r in routes if r['stops']])
        }