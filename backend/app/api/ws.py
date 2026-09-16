from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.realtime.ws import manager
import asyncio

router = APIRouter(tags=["websocket"])

@router.websocket("/api/v1/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # We don't expect messages from the client right now, but we need to keep the connection open.
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
