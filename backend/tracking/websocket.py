"""
WebSocket connection manager for real-time location updates
"""
from typing import Dict, Set
from fastapi import WebSocket, WebSocketDisconnect
import json
import logging

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections for package tracking"""
    
    def __init__(self):
        # Map tracking_id -> Set of WebSocket connections
        self.active_connections: Dict[str, Set[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, tracking_id: str):
        """Connect a client to a tracking room"""
        await websocket.accept()
        
        if tracking_id not in self.active_connections:
            self.active_connections[tracking_id] = set()
        
        self.active_connections[tracking_id].add(websocket)
        logger.info(f"Client connected to tracking room: {tracking_id} (Total: {len(self.active_connections[tracking_id])})")
    
    def disconnect(self, websocket: WebSocket, tracking_id: str):
        """Disconnect a client from a tracking room"""
        if tracking_id in self.active_connections:
            self.active_connections[tracking_id].discard(websocket)
            
            # Clean up empty rooms
            if not self.active_connections[tracking_id]:
                del self.active_connections[tracking_id]
            
            logger.info(f"Client disconnected from tracking room: {tracking_id}")
    
    async def broadcast_location_update(self, tracking_id: str, location_data: dict):
        """Broadcast location update to all connected clients for a tracking ID"""
        if tracking_id not in self.active_connections:
            logger.debug(f"No active connections for tracking_id: {tracking_id}")
            return
        
        # Create message payload
        message = {
            "type": "location_update",
            "tracking_id": tracking_id,
            "data": location_data
        }
        
        # Send to all connected clients
        disconnected = set()
        for connection in self.active_connections[tracking_id]:
            try:
                await connection.send_text(json.dumps(message, default=str))
            except Exception as e:
                logger.error(f"Error sending message to client: {e}")
                disconnected.add(connection)
        
        # Remove disconnected clients
        for connection in disconnected:
            self.disconnect(connection, tracking_id)
        
        logger.info(f"Broadcasted location update for {tracking_id} to {len(self.active_connections[tracking_id])} clients")
    
    async def send_message(self, websocket: WebSocket, message: dict):
        """Send a message to a specific client"""
        try:
            await websocket.send_text(json.dumps(message, default=str))
        except Exception as e:
            logger.error(f"Error sending message: {e}")
            raise
    
    def get_connection_count(self, tracking_id: str) -> int:
        """Get the number of connected clients for a tracking ID"""
        return len(self.active_connections.get(tracking_id, set()))


# Global connection manager instance
manager = ConnectionManager()

