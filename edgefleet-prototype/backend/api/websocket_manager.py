import asyncio
import json
import logging
from typing import Dict, List
from fastapi import WebSocket, WebSocketDisconnect
from datetime import datetime
import uuid

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.subscriptions: Dict[str, List[str]] = {}  # topic: [connection_ids]
        self.connection_topics: Dict[str, List[str]] = {}  # connection_id: [topics]
        
    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        self.connection_topics[client_id] = []
        logger.info(f"Client {client_id} connected")
        
    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            # Remove from all subscriptions
            for topic in list(self.connection_topics.get(client_id, [])):
                self.unsubscribe(client_id, topic)
            if client_id in self.active_connections:
                del self.active_connections[client_id]
            if client_id in self.connection_topics:
                del self.connection_topics[client_id]
            logger.info(f"Client {client_id} disconnected")
            
    def subscribe(self, client_id: str, topic: str):
        if topic not in self.subscriptions:
            self.subscriptions[topic] = []
        if client_id not in self.subscriptions[topic]:
            self.subscriptions[topic].append(client_id)
            self.connection_topics[client_id].append(topic)
            logger.debug(f"Client {client_id} subscribed to {topic}")
            
    def unsubscribe(self, client_id: str, topic: str):
        if topic in self.subscriptions and client_id in self.subscriptions[topic]:
            self.subscriptions[topic].remove(client_id)
            if client_id in self.connection_topics and topic in self.connection_topics[client_id]:
                self.connection_topics[client_id].remove(topic)
            logger.debug(f"Client {client_id} unsubscribed from {topic}")
            
    async def send_personal_message(self, message: str, client_id: str):
        if client_id in self.active_connections:
            try:
                await self.active_connections[client_id].send_text(message)
            except Exception as e:
                logger.error(f"Error sending message to {client_id}: {e}")
                self.disconnect(client_id)
                
    async def broadcast(self, message: str, topic: str = None):
        if topic and topic in self.subscriptions:
            for client_id in list(self.subscriptions[topic]):  # Create a copy of the list
                await self.send_personal_message(message, client_id)
        elif not topic:
            for client_id in list(self.active_connections.keys()):  # Create a copy of the dict keys
                await self.send_personal_message(message, client_id)

# Global instance
manager = ConnectionManager()

async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket, client_id)
    try:
        while True:
            try:
                data = await websocket.receive_text()
                try:
                    message = json.loads(data)
                    if message.get("type") == "subscribe" and "topic" in message:
                        manager.subscribe(client_id, message["topic"])
                    elif message.get("type") == "unsubscribe" and "topic" in message:
                        manager.unsubscribe(client_id, message["topic"])
                except json.JSONDecodeError:
                    logger.warning(f"Invalid JSON received from {client_id}")
            except WebSocketDisconnect:
                raise
            except Exception as e:
                logger.error(f"Error processing message: {e}")
    except WebSocketDisconnect:
        manager.disconnect(client_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(client_id)

# Background task for broadcasting updates
async def broadcast_updates():
    while True:
        try:
            # Broadcast a ping to keep connections alive
            await manager.broadcast(
                json.dumps({
                    "type": "ping",
                    "timestamp": datetime.utcnow().isoformat()
                })
            )
            await asyncio.sleep(30)  # Send ping every 30 seconds
        except Exception as e:
            logger.error(f"Error in broadcast_updates: {e}")
            await asyncio.sleep(5)  # Wait before retrying
