import asyncio
import random
import json
from datetime import datetime
import aiohttp

API_BASE_URL = "http://localhost:8000"

# Bangalore coordinates for realistic simulation
BANGALORE_BOUNDS = {
    "lat_min": 12.85,
    "lat_max": 13.10,
    "lng_min": 77.45,
    "lng_max": 77.75
}

class FleetSimulator:
    def __init__(self):
        self.vehicles = []
        self.alert_counter = 0
        
    def generate_initial_vehicles(self, count=4):
        """Generate initial vehicle data"""
        vehicle_names = ["Truck Alpha", "Van Beta", "Truck Gamma", "Van Delta", 
                        "Truck Epsilon", "Van Zeta"]
        driver_names = ["Rajesh Kumar", "Amit Sharma", "Priya Singh", "Vikram Mehta",
                       "Sunita Patel", "Arjun Reddy"]
        
        for i in range(count):
            self.vehicles.append({
                "id": f"V{str(i+1).zfill(3)}",
                "name": vehicle_names[i],
                "driver_id": f"D{str(i+1).zfill(3)}",
                "driver_name": driver_names[i],
                "status": random.choice(["active", "active", "active", "idle"]),
                "lat": random.uniform(BANGALORE_BOUNDS["lat_min"], BANGALORE_BOUNDS["lat_max"]),
                "lng": random.uniform(BANGALORE_BOUNDS["lng_min"], BANGALORE_BOUNDS["lng_max"]),
                "speed": random.uniform(0, 60) if random.random() > 0.3 else 0,
                "fuel_level": random.uniform(30, 100),
                "direction": random.uniform(0, 360),  # Heading in degrees
                "harsh_braking_count": 0,
                "speeding_count": 0
            })
    
    def update_vehicle_position(self, vehicle):
        """Simulate realistic vehicle movement"""
        if vehicle["status"] == "idle":
            vehicle["speed"] = 0
            return
        
        # Update position based on speed and direction
        # 1 degree ≈ 111 km, speed is in km/h
        movement_distance = vehicle["speed"] / 3600 / 111  # per second in degrees
        
        # Add some randomness to direction
        vehicle["direction"] += random.uniform(-15, 15)
        vehicle["direction"] = vehicle["direction"] % 360
        
        # Calculate new position
        import math
        vehicle["lat"] += movement_distance * math.cos(math.radians(vehicle["direction"]))
        vehicle["lng"] += movement_distance * math.sin(math.radians(vehicle["direction"]))
        
        # Keep within Bangalore bounds
        vehicle["lat"] = max(BANGALORE_BOUNDS["lat_min"], 
                            min(BANGALORE_BOUNDS["lat_max"], vehicle["lat"]))
        vehicle["lng"] = max(BANGALORE_BOUNDS["lng_min"], 
                            min(BANGALORE_BOUNDS["lng_max"], vehicle["lng"]))
        
        # Vary speed realistically
        speed_change = random.uniform(-5, 5)
        vehicle["speed"] = max(0, min(80, vehicle["speed"] + speed_change))
        
        # Fuel consumption
        vehicle["fuel_level"] -= vehicle["speed"] * 0.0001
        vehicle["fuel_level"] = max(0, vehicle["fuel_level"])
    
    async def generate_alert(self, vehicle):
        """Generate realistic alerts based on vehicle behavior"""
        alerts = []
        
        # Harsh braking detection (sudden speed drop)
        if vehicle["speed"] > 40 and random.random() < 0.02:
            vehicle["harsh_braking_count"] += 1
            self.alert_counter += 1
            alert = {
                "id": f"A{str(self.alert_counter).zfill(4)}",
                "vehicle_id": vehicle["id"],
                "driver_name": vehicle["driver_name"],
                "type": "harsh_braking",
                "severity": "medium",
                "message": f"Harsh braking detected for {vehicle['name']}",
                "timestamp": datetime.now().isoformat(),
                "location": {"lat": vehicle["lat"], "lng": vehicle["lng"]}
            }
            alerts.append(alert)
            print(f"🚨 ALERT: Harsh braking - {vehicle['name']}")
        
        # Speeding detection
        if vehicle["speed"] > 70 and random.random() < 0.03:
            vehicle["speeding_count"] += 1
            self.alert_counter += 1
            alert = {
                "id": f"A{str(self.alert_counter).zfill(4)}",
                "vehicle_id": vehicle["id"],
                "driver_name": vehicle["driver_name"],
                "type": "speeding",
                "severity": "high",
                "message": f"Speeding detected: {vehicle['name']} at {vehicle['speed']:.1f} km/h",
                "timestamp": datetime.now().isoformat(),
                "location": {"lat": vehicle["lat"], "lng": vehicle["lng"]}
            }
            alerts.append(alert)
            print(f"⚠️  ALERT: Speeding - {vehicle['name']} at {vehicle['speed']:.1f} km/h")
        
        # Low fuel warning
        if vehicle["fuel_level"] < 20 and random.random() < 0.01:
            self.alert_counter += 1
            alert = {
                "id": f"A{str(self.alert_counter).zfill(4)}",
                "vehicle_id": vehicle["id"],
                "driver_name": vehicle["driver_name"],
                "type": "low_fuel",
                "severity": "medium",
                "message": f"Low fuel alert: {vehicle['name']} at {vehicle['fuel_level']:.1f}%",
                "timestamp": datetime.now().isoformat(),
                "location": {"lat": vehicle["lat"], "lng": vehicle["lng"]}
            }
            alerts.append(alert)
            print(f"⛽ ALERT: Low fuel - {vehicle['name']}")
        
        # Maintenance due (random)
        if random.random() < 0.005:
            self.alert_counter += 1
            alert = {
                "id": f"A{str(self.alert_counter).zfill(4)}",
                "vehicle_id": vehicle["id"],
                "driver_name": vehicle["driver_name"],
                "type": "maintenance",
                "severity": "low",
                "message": f"Maintenance due soon for {vehicle['name']}",
                "timestamp": datetime.now().isoformat(),
                "location": {"lat": vehicle["lat"], "lng": vehicle["lng"]}
            }
            alerts.append(alert)
            print(f"🔧 ALERT: Maintenance - {vehicle['name']}")
        
        return alerts
    
    async def send_telemetry(self):
        """Send telemetry data to API"""
        try:
            async with aiohttp.ClientSession() as session:
                # In real implementation, send to API
                # For now, just print
                pass
        except Exception as e:
            print(f"Error sending telemetry: {e}")
    
    async def run_simulation(self):
        """Main simulation loop"""
        print("=" * 50)
        print("🚛 EdgeFleet Simulator Started")
        print("=" * 50)
        
        self.generate_initial_vehicles(4)
        
        print(f"\n📊 Simulating {len(self.vehicles)} vehicles...")
        for v in self.vehicles:
            print(f"  • {v['name']} (Driver: {v['driver_name']}) - {v['status']}")
        
        print("\n▶️  Starting real-time simulation (Press Ctrl+C to stop)...\n")
        
        iteration = 0
        while True:
            iteration += 1
            
            # Update all vehicles
            for vehicle in self.vehicles:
                self.update_vehicle_position(vehicle)
                
                # Generate alerts
                alerts = await self.generate_alert(vehicle)
            
            # Print status every 10 seconds
            if iteration % 10 == 0:
                print(f"\n⏱️  {datetime.now().strftime('%H:%M:%S')} - Status Update:")
                for v in self.vehicles:
                    status_icon = "🟢" if v["status"] == "active" else "🔴"
                    print(f"  {status_icon} {v['name']}: {v['speed']:.1f} km/h | "
                          f"Fuel: {v['fuel_level']:.1f}% | "
                          f"Pos: ({v['lat']:.4f}, {v['lng']:.4f})")
                print(f"  📊 Alerts generated: {self.alert_counter}")
            
            await asyncio.sleep(1)  # Update every second

async def main():
    simulator = FleetSimulator()
    try:
        await simulator.run_simulation()
    except KeyboardInterrupt:
        print("\n\n🛑 Simulator stopped by user")
        print(f"📊 Total alerts generated: {simulator.alert_counter}")
        print("=" * 50)

if __name__ == "__main__":
    asyncio.run(main())