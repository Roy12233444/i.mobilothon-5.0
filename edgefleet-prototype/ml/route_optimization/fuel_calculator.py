import numpy as np

class FuelCalculator:
    """
    A class to calculate fuel consumption for vehicles based on various factors.
    """
    
    def __init__(self):
        # Base fuel consumption rates (liters per 100km)
        self.base_consumption = {
            'sedan': 7.5,      # l/100km
            'suv': 10.0,       # l/100km
            'truck': 25.0,     # l/100km
            'van': 12.0        # l/100km
        }
        
        # Fuel consumption factors
        self.factors = {
            'load': 0.001,     # % increase per kg of load
            'speed': {
                'optimal': 60,  # km/h
                'penalty': 0.1  # % increase per km/h over optimal
            },
            'elevation': 0.1,  # % increase per 10m of elevation gain
            'road_condition': {
                'excellent': 0.0,
                'good': 0.1,
                'average': 0.2,
                'poor': 0.4,
                'terrible': 0.7
            }
        }
    
    def calculate_fuel_consumption(self, distance_km, vehicle_type='truck', 
                                 load_kg=0, avg_speed_kmh=60, 
                                 elevation_gain_m=0, road_condition='average'):
        """
        Calculate fuel consumption for a given route.
        
        Args:
            distance_km (float): Distance of the route in kilometers
            vehicle_type (str): Type of vehicle (sedan, suv, truck, van)
            load_kg (float): Cargo weight in kilograms
            avg_speed_kmh (float): Average speed in km/h
            elevation_gain_m (float): Total elevation gain in meters
            road_condition (str): Road condition (excellent, good, average, poor, terrible)
            
        Returns:
            dict: Fuel consumption details
        """
        # Get base consumption
        base = self.base_consumption.get(vehicle_type.lower(), 10.0)
        
        # Calculate load factor
        load_factor = 1 + (self.factors['load'] * load_kg)
        
        # Calculate speed factor
        speed_diff = max(0, avg_speed_kmh - self.factors['speed']['optimal'])
        speed_factor = 1 + (speed_diff * self.factors['speed']['penalty'] / 100)
        
        # Calculate elevation factor
        elevation_factor = 1 + ((elevation_gain_m / 10) * self.factors['elevation'] / 100)
        
        # Get road condition factor
        road_factor = 1 + self.factors['road_condition'].get(road_condition.lower(), 0.2)
        
        # Calculate total consumption
        adjusted_consumption = base * load_factor * speed_factor * elevation_factor * road_factor
        total_fuel = (adjusted_consumption / 100) * distance_km
        
        return {
            'base_consumption_l_per_100km': base,
            'adjusted_consumption_l_per_100km': adjusted_consumption,
            'total_fuel_liters': total_fuel,
            'factors': {
                'load': load_factor,
                'speed': speed_factor,
                'elevation': elevation_factor,
                'road_condition': road_factor
            },
            'emissions_kg_co2': total_fuel * 2.31  # Assuming 2.31 kg CO2 per liter of diesel
        }

# Example usage
if __name__ == "__main__":
    calculator = FuelCalculator()
    
    # Example calculation for a delivery truck
    result = calculator.calculate_fuel_consumption(
        distance_km=150,
        vehicle_type='truck',
        load_kg=5000,
        avg_speed_kmh=70,
        elevation_gain_m=300,
        road_condition='average'
    )
    
    print("\nFuel Consumption Calculation:")
    print(f"Base consumption: {result['base_consumption_l_per_100km']} l/100km")
    print(f"Adjusted consumption: {result['adjusted_consumption_l_per_100km']:.2f} l/100km")
    print(f"Total fuel needed: {result['total_fuel_liters']:.2f} liters")
    print(f"Estimated CO2 emissions: {result['emissions_kg_co2']:.2f} kg")
    
    # Print all factors
    print("\nFactors applied:")
    for factor, value in result['factors'].items():
        print(f"- {factor}: {value:.2f}x")