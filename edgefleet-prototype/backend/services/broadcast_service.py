import asyncio
import logging
import json
from datetime import datetime
from typing import Dict, Any, Optional
from api.websocket import broadcast_update
from api.ws_topics import WSTopics
from api.websocket_manager import manager

logger = logging.getLogger(__name__)

class BroadcastService:
    def __init__(self):
        self.last_updates: Dict[str, Any] = {}
        self.update_intervals = {
            WSTopics.VEHICLES: 1.0,  # 1 second
            WSTopics.DRIVERS: 5.0,    # 5 seconds
            WSTopics.ALERTS: 2.0,     # 2 seconds
            WSTopics.ANALYTICS: 10.0  # 10 seconds
        }
        self._running = False
        self._tasks = []

    async def start(self):
        """Start all broadcast tasks"""
        if self._running:
            return
            
        self._running = True
        
        # Start a broadcast task for each topic
        for topic in self.update_intervals.keys():
            task = asyncio.create_task(self._broadcast_loop(topic))
            self._tasks.append(task)
        
        logger.info("Broadcast service started")

    async def stop(self):
        """Stop all broadcast tasks"""
        self._running = False
        for task in self._tasks:
            task.cancel()
        await asyncio.gather(*self._tasks, return_exceptions=True)
        self._tasks = []
        logger.info("Broadcast service stopped")

    async def _broadcast_loop(self, topic: str):
        """Background task to broadcast updates for a specific topic"""
        while self._running:
            try:
                # Get fresh data (you'll need to implement get_data_for_topic)
                data = await self.get_data_for_topic(topic)
                
                # Only broadcast if data has changed
                if data != self.last_updates.get(topic):
                    self.last_updates[topic] = data
                    await broadcast_update(topic, data)
                
                # Wait for the next update interval
                await asyncio.sleep(self.update_intervals[topic])
                
            except asyncio.CancelledError:
                raise
            except Exception as e:
                logger.error(f"Error in {topic} broadcast loop: {e}")
                await asyncio.sleep(5)  # Wait before retrying

    async def get_data_for_topic(self, topic: str) -> Any:
        """
        Get fresh data for a specific topic.
        This should be implemented to fetch data from your data sources.
        """
        # This is a placeholder - implement based on your data sources
        return {"topic": topic, "timestamp": datetime.utcnow().isoformat()}
        
    async def broadcast_update(self, topic: str, data: dict):
        """Broadcast data to all clients subscribed to the given topic"""
        try:
            message = {
                "type": "update",
                "topic": topic,
                "data": data,
                "timestamp": datetime.utcnow().isoformat()
            }
            await manager.broadcast(json.dumps(message), topic)
            
            # Also send to clients subscribed to 'all' topic
            if topic != WSTopics.ALL:
                all_message = message.copy()
                all_message["topic"] = WSTopics.ALL
                await manager.broadcast(json.dumps(all_message), WSTopics.ALL)
                
        except Exception as e:
            logger.error(f"Error in broadcast_update: {e}")

# Global instance
broadcast_service = BroadcastService()

# Start the service when this module is imported
async def start_service():
    await broadcast_service.start()

# Stop the service when the application shuts down
async def stop_service():
    await broadcast_service.stop()
