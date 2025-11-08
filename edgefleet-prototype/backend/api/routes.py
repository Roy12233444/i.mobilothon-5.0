from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import logging
from datetime import datetime
import uuid

router = APIRouter()
logger = logging.getLogger(__name__)

# In-memory storage for routes (replace with database in production)
routes_db = {}

class RouteStop(BaseModel):
    lat: float
    lng: float
    name: Optional[str] = None
    address: Optional[str] = None
    demand_kg: float = 0

class RouteVehicle(BaseModel):
    id: str
    name: str
    type: str
    capacity: float

class RouteCreate(BaseModel):
    name: str
    waypoints: List[RouteStop]
    optimized_route: Optional[Dict[str, Any]] = None
    vehicle: Optional[RouteVehicle] = None
    settings: Optional[Dict[str, Any]] = None

class RouteResponse(RouteCreate):
    id: str
    created_at: str
    updated_at: str

@router.post("/routes", response_model=RouteResponse)
async def create_route(route: RouteCreate):
    """
    Create a new route
    """
    try:
        route_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        
        # Handle both frontend and backend formats
        optimized_route = route.optimized_route if hasattr(route, 'optimized_route') else route.dict().get('optimizedRoute')
        
        # Convert waypoints to standard format
        processed_waypoints = []
        for wp in route.waypoints:
            if hasattr(wp, 'position') and isinstance(wp.position, list) and len(wp.position) == 2:
                # Handle frontend format
                processed_waypoints.append({
                    'lat': wp.position[0],
                    'lng': wp.position[1],
                    'name': getattr(wp, 'name', ''),
                    'address': getattr(wp, 'address', ''),
                    'demand_kg': getattr(wp, 'demand_kg', 0)
                })
            else:
                # Handle backend format
                processed_waypoints.append({
                    'lat': wp.lat,
                    'lng': wp.lng,
                    'name': getattr(wp, 'name', ''),
                    'address': getattr(wp, 'address', ''),
                    'demand_kg': getattr(wp, 'demand_kg', 0)
                })
        
        new_route = {
            "id": route_id,
            "name": route.name,
            "waypoints": processed_waypoints,
            "optimized_route": optimized_route,
            "vehicle": route.vehicle.dict() if hasattr(route, 'vehicle') and route.vehicle else None,
            "settings": route.settings if hasattr(route, 'settings') else {},
            "created_at": now,
            "updated_at": now,
            "status": "active"
        }
        
        routes_db[route_id] = new_route
        logger.info(f"Created new route: {route_id}")
        
        return new_route
        
    except Exception as e:
        logger.error(f"Error creating route: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create route")

@router.get("/routes", response_model=List[Dict[str, Any]])
async def list_routes():
    """
    List all saved routes
    """
    try:
        return list(routes_db.values())
    except Exception as e:
        logger.error(f"Error listing routes: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to list routes")

@router.get("/routes/{route_id}", response_model=RouteResponse)
async def get_route(route_id: str):
    """
    Get a specific route by ID
    """
    if route_id not in routes_db:
        raise HTTPException(status_code=404, detail="Route not found")
    return routes_db[route_id]

@router.delete("/routes/{route_id}")
async def delete_route(route_id: str):
    """
    Delete a route by ID
    """
    if route_id not in routes_db:
        raise HTTPException(status_code=404, detail="Route not found")
    
    try:
        del routes_db[route_id]
        return {"status": "success", "message": f"Route {route_id} deleted"}
    except Exception as e:
        logger.error(f"Error deleting route {route_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to delete route")
