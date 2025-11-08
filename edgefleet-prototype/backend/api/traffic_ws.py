import base64
import json
import asyncio
import cv2
import numpy as np
from fastapi import WebSocket, WebSocketDisconnect
from fastapi.routing import APIRouter
import logging
from datetime import datetime
import uuid
from typing import Dict, Optional

logger = logging.getLogger(__name__)
router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        logger.info(f"Client connected: {client_id}")

    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]
            logger.info(f"Client disconnected: {client_id}")

    async def send_personal_message(self, message: str, client_id: str):
        if client_id in self.active_connections:
            await self.active_connections[client_id].send_text(message)

manager = ConnectionManager()

class TrafficAnalysisConnectionManager:
    def __init__(self):
        self.active_connections = {}
        self.agent_instances = {}
        
    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        self.agent_instances[client_id] = {
            'last_update': datetime.utcnow(),
            'traffic_data': {},
            'settings': {
                'enable_tracking': True,
                'alert_threshold': 0.7,
                'update_interval': 1.0  # seconds
            }
        }
        logger.info(f"Client connected: {client_id}")
        
    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]
        if client_id in self.agent_instances:
            del self.agent_instances[client_id]
        logger.info(f"Client disconnected: {client_id}")
    
    async def send_message(self, client_id: str, message: dict):
        if client_id in self.active_connections:
            try:
                await self.active_connections[client_id].send_json(message)
            except Exception as e:
                logger.error(f"Error sending message to {client_id}: {e}")
    
    async def broadcast(self, message: dict, client_id: str = None):
        if client_id:
            await self.send_message(client_id, message)
        else:
            for connection_id in list(self.active_connections.keys()):
                await self.send_message(connection_id, message)
    
    def update_settings(self, client_id: str, settings: dict):
        if client_id in self.agent_instances:
            self.agent_instances[client_id]['settings'].update(settings)
            return True
        return False

@router.websocket("/traffic/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket, client_id)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                if message.get('type') == 'ping':
                    await manager.send_personal_message(
                        json.dumps({
                            'type': 'pong',
                            'timestamp': datetime.utcnow().isoformat()
                        }),
                        client_id
                    )
            except json.JSONDecodeError:
                logger.warning(f"Received invalid JSON from client {client_id}")
    except WebSocketDisconnect:
        manager.disconnect(client_id)
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        manager.disconnect(client_id)

@router.websocket("/ws/traffic/{client_id}")
async def traffic_websocket_endpoint(websocket: WebSocket, client_id: str = None):
    """
    WebSocket endpoint for real-time traffic analysis.
    Handles video frames and returns analysis results.
    """
    if not client_id:
        client_id = f"traffic_{uuid.uuid4().hex[:8]}"
    
    await traffic_manager.connect(websocket, client_id)
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive()
            
            if 'text' in data:
                # Handle text messages (commands, settings, etc.)
                message = json.loads(data['text'])
                await handle_text_message(websocket, client_id, message)
                
            elif 'bytes' in data:
                # Handle binary data (video frames)
                await process_video_frame(client_id, data['bytes'])
                
    except WebSocketDisconnect:
        logger.info(f"Client disconnected: {client_id}")
    except Exception as e:
        logger.error(f"Error in WebSocket connection {client_id}: {e}")
    finally:
        traffic_manager.disconnect(client_id)

async def handle_text_message(websocket: WebSocket, client_id: str, message: dict):
    """Handle incoming text messages from WebSocket clients"""
    message_type = message.get('type')
    
    if message_type == 'settings':
        # Update client settings
        settings = message.get('settings', {})
        traffic_manager.update_settings(client_id, settings)
        await traffic_manager.send_message(client_id, {
            'type': 'settings_updated',
            'settings': traffic_manager.agent_instances[client_id]['settings']
        })
        
    elif message_type == 'status':
        # Return current status
        await traffic_manager.send_message(client_id, {
            'type': 'status',
            'status': 'connected',
            'client_id': client_id,
            'last_update': traffic_manager.agent_instances[client_id]['last_update'].isoformat(),
            'settings': traffic_manager.agent_instances[client_id]['settings']
        })

async def process_video_frame(client_id: str, frame_data: bytes):
    """Process a video frame and return traffic analysis"""
    try:
        # Convert frame data to OpenCV format
        nparr = np.frombuffer(frame_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            logger.warning(f"Failed to decode frame from client {client_id}")
            return
        
        # Get client settings
        settings = traffic_manager.agent_instances[client_id]['settings']
        
        # Process frame with route optimization agent
        traffic_data = route_agent._analyze_traffic(frame)
        
        # Update last update time
        traffic_manager.agent_instances[client_id]['last_update'] = datetime.utcnow()
        traffic_manager.agent_instances[client_id]['traffic_data'] = traffic_data
        
        # Send analysis results back to client
        await traffic_manager.send_message(client_id, {
            'type': 'traffic_update',
            'timestamp': datetime.utcnow().isoformat(),
            'data': traffic_data
        })
        
    except Exception as e:
        logger.error(f"Error processing frame from {client_id}: {e}")
        await traffic_manager.send_message(client_id, {
            'type': 'error',
            'message': str(e),
            'timestamp': datetime.utcnow().isoformat()
        })
