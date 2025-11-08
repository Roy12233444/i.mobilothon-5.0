from fastapi import APIRouter, WebSocket, Depends
from fastapi.responses import HTMLResponse
from ...services.broadcast_service import broadcast_service
from ...api.websocket import router as websocket_router

router = APIRouter()

# Include the WebSocket router
router.include_router(websocket_router, prefix="/ws", tags=["websocket"])

# Simple HTML page to test WebSocket connection
html = """
<!DOCTYPE html>
<html>
    <head>
        <title>WebSocket Test</title>
    </head>
    <body>
        <h1>WebSocket Test</h1>
        <div id="messages"></div>
        <script>
            const clientId = 'test_' + Math.random().toString(16).substr(2, 8);
            const ws = new WebSocket(`ws://${window.location.host}/ws/${clientId}`);
            
            ws.onmessage = function(event) {
                const messages = document.getElementById('messages');
                const message = document.createElement('div');
                const data = JSON.parse(event.data);
                message.textContent = `${new Date().toISOString()}: ${JSON.stringify(data, null, 2)}`;
                messages.appendChild(message);
                console.log('Message from server:', data);
            };
            
            ws.onopen = function() {
                console.log('WebSocket connection established');
                // Subscribe to all topics
                ws.send(JSON.stringify({
                    type: 'subscribe',
                    topic: 'all'
                }));
            };
            
            ws.onclose = function() {
                console.log('WebSocket connection closed');
            };
            
            // Reconnect on close
            ws.onclose = function() {
                console.log('WebSocket connection closed. Reconnecting...');
                setTimeout(() => window.location.reload(), 1000);
            };
        </script>
    </body>
</html>
"""

@router.get("/test")
async def test_websocket():
    return HTMLResponse(html)

@router.on_event("startup")
async def startup_event():
    # Start the broadcast service when the app starts
    await broadcast_service.start()

@router.on_event("shutdown")
async def shutdown_event():
    # Stop the broadcast service when the app shuts down
    await broadcast_service.stop()
