import os
import sys
from pathlib import Path

# Add the backend directory to the Python path
sys.path.append(str(Path(__file__).parent))

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Request, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.routing import APIRouter
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import json
import asyncio
import random
import logging
import time
import math
import uuid
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import database and models
from database import engine, Base
import models  # This will import all models and register them with SQLAlchemy

# Import routers
# Temporarily disabled route_optimizer due to dependency issues
    # from api.route_optimizer import router as route_optimizer_router
# Using built-in WebSocket endpoint instead of external router
from api.routes import router as routes_router
from api.vehicles import router as vehicles_router
from api.drivers import router as drivers_router
from api.alerts import router as alerts_router
from api.ai_agents import router as ai_agents_router
from api.camera_endpoints import router as camera_router
from services.broadcast_service import broadcast_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="EdgeFleet API",
    version="1.0.0",
    description="EdgeFleet API for real-time fleet management and optimization"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
    # app.include_router(route_optimizer_router, prefix="/api/route-optimization", tags=["route-optimization"])
app.include_router(drivers_router, prefix="/api/drivers", tags=["drivers"])
app.include_router(alerts_router, prefix="/api/alerts", tags=["alerts"])
app.include_router(camera_router, tags=["camera-management"])
app.include_router(vehicles_router, prefix="/api/vehicles", tags=["vehicles"])
app.include_router(ai_agents_router)  # Already has /api/ai-agents prefix

# CORS middleware - Allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# WebSocket endpoint
@app.websocket("/ws/traffic/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await websocket.accept()
    print(f"Client {client_id} connected")
    
    try:
        while True:
            data = await websocket.receive_text()
            print(f"Received from {client_id}: {data}")
            
            # Echo the message back to the client
            await websocket.send_text(f"Echo: {data}")
            
    except WebSocketDisconnect:
        print(f"Client {client_id} disconnected")
    except Exception as e:
        print(f"Error with client {client_id}: {str(e)}")
    finally:
        await websocket.close()

# Include routes API router
app.include_router(routes_router, prefix="/api", tags=["routes"])

# Include vehicles API router
app.include_router(vehicles_router, prefix="/api/vehicles", tags=["vehicles"])

# Add request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    request_id = str(uuid.uuid4())
    logger.info(f"Request {request_id}: {request.method} {request.url}")
    
    start_time = time.time()
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000
    
    logger.info(
        f"Response {request_id}: {response.status_code} "
        f"(took: {process_time:.2f}ms)"
    )
    
    # Add request ID to response headers for tracing
    response.headers["X-Request-ID"] = request_id
    return response

# Create database tables
def create_tables():
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created")

# Startup event - Initialize services
@app.on_event("startup")
async def startup_event():
    logger.info("Starting up...")
    
    # Create database tables
    create_tables()
    
    # Start the broadcast service
    try:
        await broadcast_service.start()
        logger.info("Broadcast service started")
    except Exception as e:
        logger.error(f"Failed to start broadcast service: {str(e)}")
        raise

# Shutdown event - Clean up resources
@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down...")
    # Stop the broadcast service
    await broadcast_service.stop()
    logger.info("Broadcast service stopped")

# ============ Data Models ============
class Vehicle(BaseModel):
    id: str
    name: str
    driver_id: str
    status: str  # active, idle, maintenance
    lat: float
    lng: float
    speed: float
    fuel_level: float

class Driver(BaseModel):
    id: str
    name: str
    score: float
    total_trips: int
    harsh_braking: int
    speeding_incidents: int

class Alert(BaseModel):
    id: str
    vehicle_id: str
    type: str  # harsh_braking, speeding, maintenance, deviation
    severity: str  # low, medium, high
    message: str
    timestamp: datetime

class RouteOptimization(BaseModel):
    vehicle_id: str
    original_distance: float
    optimized_distance: float
    fuel_saved: float
    time_saved: float

# The router is already included above with the correct prefix

# ============ In-Memory Data Store ============
vehicles_db = [
    {"id": "V001", "name": "Truck Alpha", "driver_id": "D001", "status": "active", 
     "lat": 12.9716, "lng": 77.5946, "speed": 45.5, "fuel_level": 75.0},
    {"id": "V002", "name": "Van Beta", "driver_id": "D002", "status": "active",
     "lat": 12.9352, "lng": 77.6245, "speed": 52.3, "fuel_level": 60.0},
    {"id": "V003", "name": "Truck Gamma", "driver_id": "D003", "status": "idle",
     "lat": 12.9141, "lng": 77.6411, "speed": 0.0, "fuel_level": 85.0},
    {"id": "V004", "name": "Van Delta", "driver_id": "D004", "status": "active",
     "lat": 13.0358, "lng": 77.5970, "speed": 38.7, "fuel_level": 45.0},
]

drivers_db = [
    {"id": "D001", "name": "Rajesh Kumar", "score": 85.5, "total_trips": 124, 
     "harsh_braking": 8, "speeding_incidents": 5},
    {"id": "D002", "name": "Amit Sharma", "score": 92.3, "total_trips": 98,
     "harsh_braking": 3, "speeding_incidents": 2},
    {"id": "D003", "name": "Priya Singh", "score": 78.9, "total_trips": 156,
     "harsh_braking": 15, "speeding_incidents": 12},
    {"id": "D004", "name": "Vikram Mehta", "score": 88.7, "total_trips": 87,
     "harsh_braking": 6, "speeding_incidents": 4},
]

alerts_db = []

# ============ API Endpoints ============

@app.get("/")
async def root():
    return {
        "message": "EdgeFleet API - Fleet Management System",
        "version": "1.0.0",
        "endpoints": {
            "vehicles": "/api/vehicles",
            "drivers": "/api/drivers",
            "alerts": "/api/alerts",
            "route_optimization": "/api/route-optimization",
            "websocket": "/ws"
        }
    }

@app.get("/api/vehicles")
async def get_vehicles():
    return {"vehicles": vehicles_db, "total": len(vehicles_db)}

@app.get("/api/vehicles/{vehicle_id}")
async def get_vehicle(vehicle_id: str):
    vehicle = next((v for v in vehicles_db if v["id"] == vehicle_id), None)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle

@app.get("/api/drivers")
async def get_drivers():
    return {"drivers": drivers_db, "total": len(drivers_db)}

@app.get("/api/drivers/{driver_id}")
async def get_driver(driver_id: str):
    driver = next((d for d in drivers_db if d["id"] == driver_id), None)
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    return driver

@app.get("/api/alerts")
async def get_alerts():
    return {"alerts": alerts_db[-50:], "total": len(alerts_db)}  # Last 50 alerts

@app.post("/api/alerts")
async def create_alert(alert: Alert):
    alert_dict = alert.dict()
    alerts_db.append(alert_dict)
    await manager.broadcast({"type": "new_alert", "data": alert_dict})
    return alert_dict

@app.get("/api/route-optimization/{vehicle_id}")
async def get_route_optimization(vehicle_id: str):
    # Simulated route optimization
    original_distance = random.uniform(50, 150)
    optimized_distance = original_distance * random.uniform(0.85, 0.95)
    fuel_saved = (original_distance - optimized_distance) * 0.4  # 0.4L per km
    time_saved = (original_distance - optimized_distance) / 40 * 60  # minutes
    
    return {
        "vehicle_id": vehicle_id,
        "original_distance": round(original_distance, 2),
        "optimized_distance": round(optimized_distance, 2),
        "fuel_saved": round(fuel_saved, 2),
        "time_saved": round(time_saved, 2),
        "savings_percentage": round(((original_distance - optimized_distance) / original_distance) * 100, 2)
    }

@app.get("/api/analytics/summary")
async def get_analytics_summary():
    total_vehicles = len(vehicles_db)
    active_vehicles = len([v for v in vehicles_db if v["status"] == "active"])
    avg_driver_score = sum(d["score"] for d in drivers_db) / len(drivers_db)
    total_alerts = len(alerts_db)
    high_priority_alerts = len([a for a in alerts_db if a.get("severity") == "high"])
    
    return {
        "total_vehicles": total_vehicles,
        "active_vehicles": active_vehicles,
        "idle_vehicles": total_vehicles - active_vehicles,
        "avg_driver_score": round(avg_driver_score, 2),
        "total_alerts": total_alerts,
        "high_priority_alerts": high_priority_alerts,
        "fleet_efficiency": round(random.uniform(82, 95), 2)
    }

# Import our WebSocket manager
from api.websocket_manager import manager as ws_manager

# Import broadcast service
from services.broadcast_service import broadcast_service

# WebSocket endpoint is now handled by the websocket_router
# which is included in the main app with prefix "/api/ws"

# Background task to update vehicle positions and broadcast updates
async def update_vehicle_positions():
    """Background task to update vehicle positions and broadcast updates"""
    while True:
        try:
            current_time = time.time()
            updated_vehicles = []
            
            for vehicle in vehicles_db:
                if vehicle["status"] != "active":
                    continue
                    
                # Simulate vehicle movement
                lat, lng = vehicle["lat"], vehicle["lng"]
                
                # Get current direction (in radians)
                if "direction" not in vehicle:
                    vehicle["direction"] = random.uniform(0, 2 * math.pi)
                
                # Randomly change direction slightly (5% chance)
                if random.random() < 0.05:
                    vehicle["direction"] += random.uniform(-0.5, 0.5)
                
                # Calculate new position (move 0.01 degrees in the current direction)
                # 1 degree ≈ 111 km, so this moves the vehicle ~1.1 km per update
                lat += 0.01 * math.sin(vehicle["direction"])
                lng += 0.01 * math.cos(vehicle["direction"]) / math.cos(math.radians(lat))
                
                # Update vehicle position
                vehicle["lat"] = lat
                vehicle["lng"] = lng
                
                # Random speed between 10-80 km/h
                vehicle["speed"] = random.uniform(10, 80)
                
                # Update fuel level (decrease slightly)
                vehicle["fuel_level"] = max(0, vehicle["fuel_level"] - 0.01)
                
                updated_vehicles.append(vehicle)
                
                # Randomly generate alerts (2% chance)
                if random.random() < 0.02:
                    alert_types = ["harsh_braking", "speeding", "sudden_acceleration", "idle_too_long"]
                    alert_type = random.choice(alert_types)
                    alert = {
                        "id": f"AL{len(alerts_db) + 1}",
                        "vehicle_id": vehicle["id"],
                        "type": alert_type,
                        "severity": random.choice(["low", "medium", "high"]),
                        "message": f"{alert_type.replace('_', ' ').title()} detected",
                        "timestamp": datetime.utcnow().isoformat()
                    }
                    alerts_db.append(alert)
                    if len(alerts_db) > 100:  # Keep only last 100 alerts
                        alerts_db.pop(0)
                    
                    # Broadcast new alert
                    await broadcast_service.broadcast_update("alerts", {"alert": alert, "type": "new_alert"})
            
            # Broadcast vehicle updates
            if updated_vehicles:
                await broadcast_service.broadcast_update("vehicles", {
                    "type": "vehicle_update",
                    "data": updated_vehicles,
                    "timestamp": datetime.utcnow().isoformat()
                })
            
            # Update analytics every 10 seconds
            if int(current_time) % 10 == 0:
                await update_analytics()
                
            await asyncio.sleep(1)  # Update every second
            
        except Exception as e:
            logger.error(f"Error in update_vehicle_positions: {e}")
            await asyncio.sleep(5)  # Wait before retrying

async def update_analytics():
    """Update and broadcast analytics data"""
    try:
        # Calculate some basic analytics
        active_vehicles = len([v for v in vehicles_db if v["status"] == "active"])
        total_distance = sum(v["speed"] / 3600 for v in vehicles_db)  # km per second
        
        analytics = {
            "active_vehicles": active_vehicles,
            "total_distance": round(total_distance, 2),
            "alerts_last_hour": len([a for a in alerts_db if 
                                    (datetime.utcnow() - datetime.fromisoformat(a["timestamp"].replace('Z', ''))).total_seconds() < 3600]),
            "timestamp": datetime.utcnow().isoformat()
        }
        
        await broadcast_service.broadcast_update("analytics", {
            "type": "analytics_update",
            "data": analytics
        })
        
    except Exception as e:
        logger.error(f"Error updating analytics: {e}")

# Start the background task when the app starts
@app.on_event("startup")
async def startup_event():
    logger.info("Starting up...")
    # Start the broadcast service
    await broadcast_service.start()
    # Start the background task
    asyncio.create_task(update_vehicle_positions())
    logger.info("Background tasks started")

# Clean up on shutdown
@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down...")
    await broadcast_service.stop()
    logger.info("Background tasks stopped")

# ============ Health Check ============
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)