from fastapi import APIRouter, HTTPException, Depends, status, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from datetime import datetime
import logging
import json
import asyncio

from ..services.camera_feed_manager import camera_manager
from ..ai_agents.route_optimization_agent import RouteOptimizationAgent

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/cameras",
    tags=["Camera Management"],
    responses={404: {"description": "Not found"}},
)

class CameraConfig(BaseModel):
    camera_id: str
    rtsp_url: str
    location: Dict[str, float]  # Should contain 'lat' and 'lon'

class CameraStatusResponse(BaseModel):
    camera_id: str
    status: str
    last_update: str
    traffic_conditions: Dict
    location: Dict[str, float]

# Global route optimization agent instance
route_agent = RouteOptimizationAgent()

@router.post("/add", response_model=Dict[str, str])
async def add_camera(camera: CameraConfig):
    """Add a new camera feed for real-time monitoring."""
    try:
        # Define callback for processed results
        def process_callback(result):
            logger.info(f"Processed frame from {result['camera_id']}: {json.dumps(result['traffic_data'], indent=2)}")
        
        # Add camera to route optimization agent
        route_agent.add_camera_feed(
            camera_id=camera.camera_id,
            rtsp_url=camera.rtsp_url,
            location=camera.location,
            callback=process_callback
        )
        
        return {"status": "success", "message": f"Camera {camera.camera_id} added successfully"}
    except Exception as e:
        logger.error(f"Error adding camera: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add camera: {str(e)}"
        )

@router.delete("/{camera_id}", response_model=Dict[str, str])
async def remove_camera(camera_id: str):
    """Remove a camera feed from monitoring."""
    try:
        route_agent.remove_camera_feed(camera_id)
        return {"status": "success", "message": f"Camera {camera_id} removed successfully"}
    except Exception as e:
        logger.error(f"Error removing camera: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to remove camera: {str(e)}"
        )

@router.get("/status", response_model=List[CameraStatusResponse])
async def get_camera_status():
    """Get the status of all monitored cameras."""
    try:
        status_data = route_agent.get_camera_status()
        return [{"camera_id": k, **v} for k, v in status_data.items()]
    except Exception as e:
        logger.error(f"Error getting camera status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get camera status: {str(e)}"
        )

@router.get("/queue-status", response_model=Dict)
async def get_queue_status():
    """Get the status of camera processing queues."""
    try:
        return camera_manager.get_queue_status()
    except Exception as e:
        logger.error(f"Error getting queue status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get queue status: {str(e)}"
        )

# WebSocket endpoint for real-time camera updates
@router.websocket("/ws/updates/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await websocket.accept()
    logger.info(f"Client {client_id} connected to camera updates")
    
    try:
        while True:
            # Send camera status updates every 2 seconds
            status_data = route_agent.get_camera_status()
            await websocket.send_json({
                "type": "status_update",
                "data": status_data,
                "timestamp": datetime.utcnow().isoformat()
            })
            await asyncio.sleep(2)
            
    except WebSocketDisconnect:
        logger.info(f"Client {client_id} disconnected")
    except Exception as e:
        logger.error(f"WebSocket error for client {client_id}: {str(e)}")
    finally:
        await websocket.close()

# Register startup and shutdown events
@router.on_event("startup")
async def startup_event():
    """Initialize camera feeds on startup."""
    logger.info("Initializing camera feeds...")
    
    # Example: Add a test camera (replace with your actual camera configs)
    try:
        # This is just an example - in production, load from config/database
        test_cameras = [
            {
                "camera_id": "test_cam_1",
                "rtsp_url": "rtsp://your_camera_stream_url_1",
                "location": {"lat": 12.9716, "lon": 77.5946}  # Example: Bangalore coordinates
            },
            # Add more test cameras as needed
        ]
        
        for cam in test_cameras:
            try:
                route_agent.add_camera_feed(
                    camera_id=cam["camera_id"],
                    rtsp_url=cam["rtsp_url"],
                    location=cam["location"]
                )
                logger.info(f"Added test camera: {cam['camera_id']}")
            except Exception as e:
                logger.error(f"Failed to add test camera {cam['camera_id']}: {str(e)}")
                
    except Exception as e:
        logger.error(f"Error initializing test cameras: {str(e)}")

@router.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown."""
    logger.info("Shutting down camera feeds...")
    camera_manager.stop()
    logger.info("Camera feeds stopped")
