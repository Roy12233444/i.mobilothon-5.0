from fastapi import WebSocket, WebSocketDisconnect
from fastapi.routing import APIRouter
import logging
import json
from datetime import datetime
from .websocket_manager import manager, websocket_endpoint
from .ws_topics import WSTopics
import uuid

logger = logging.getLogger(__name__)
router = APIRouter()

@router.websocket("/ws/{client_id}")
async def websocket_route(websocket: WebSocket, client_id: str = None):
    """
    WebSocket endpoint for real-time updates.
    Clients can connect using a unique client_id or let the server generate one.
    """
    # Generate a client ID if not provided
    if not client_id:
        client_id = f"client_{uuid.uuid4().hex[:8]}"
    
    await websocket_endpoint(websocket, client_id)

# WebSocket topics for different types of updates
# Function to broadcast updates to specific topics
async def broadcast_update(topic: str, data: dict):
    """Broadcast data to all clients subscribed to the given topic"""
    message = {
        "type": "update",
        "topic": topic,
        "data": data,
        "timestamp": datetime.utcnow().isoformat()
    }
    await manager.broadcast(json.dumps(message), topic)
    
    # Also send to clients subscribed to 'all' topic
    if topic != WSTopics.ALL:
        await manager.broadcast(json.dumps({
            **message,
            "topic": WSTopics.ALL
        }), WSTopics.ALL)