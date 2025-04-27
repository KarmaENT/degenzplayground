import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.database import get_db
from app.routes import agents, sandbox, auth

app = FastAPI(title="DeGeNz Lounge API", description="API for DeGeNz Lounge - AI Agent Orchestration Platform")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(agents.router, prefix="/agents", tags=["agents"])
app.include_router(sandbox.router, prefix="/sandbox", tags=["sandbox"])
app.include_router(auth.router, prefix="/auth", tags=["auth"])

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict = {}

    async def connect(self, websocket: WebSocket, session_id: str, client_id: str):
        await websocket.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = {}
        self.active_connections[session_id][client_id] = websocket

    def disconnect(self, session_id: str, client_id: str):
        if session_id in self.active_connections:
            if client_id in self.active_connections[session_id]:
                del self.active_connections[session_id][client_id]
            if not self.active_connections[session_id]:
                del self.active_connections[session_id]

    async def send_message(self, message: dict, session_id: str, client_id: str = None):
        if session_id in self.active_connections:
            if client_id:
                if client_id in self.active_connections[session_id]:
                    await self.active_connections[session_id][client_id].send_json(message)
            else:
                for connection in self.active_connections[session_id].values():
                    await connection.send_json(message)

manager = ConnectionManager()

@app.websocket("/ws/{session_id}/{client_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str, client_id: str, db: Session = Depends(get_db)):
    await manager.connect(websocket, session_id, client_id)
    try:
        while True:
            data = await websocket.receive_json()
            # Process the message and potentially trigger AI agents
            # This is a placeholder for the actual implementation
            await manager.send_message({"status": "received", "data": data}, session_id)
    except WebSocketDisconnect:
        manager.disconnect(session_id, client_id)
        await manager.send_message({"status": "disconnected", "client_id": client_id}, session_id)

@app.get("/")
def read_root():
    return {"message": "Welcome to DeGeNz Lounge API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
