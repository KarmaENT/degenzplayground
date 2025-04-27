import asyncio
import json
import logging
from typing import Dict, List, Any, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import models, schemas
from app.services.ai.gemini_service import GeminiService, LangChainService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class WebSocketManager:
    """
    Manager for WebSocket connections
    """
    def __init__(self):
        self.active_connections: Dict[str, Dict[str, WebSocket]] = {}
        self.gemini_service = GeminiService()
        self.langchain_service = LangChainService(self.gemini_service)
    
    async def connect(self, websocket: WebSocket, session_id: str, client_id: str):
        """
        Connect a client to a session
        """
        await websocket.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = {}
        self.active_connections[session_id][client_id] = websocket
        logger.info(f"Client {client_id} connected to session {session_id}")
        
        # Notify all clients in the session about the new connection
        await self.broadcast_notification(
            session_id,
            {
                "type": "connection",
                "client_id": client_id,
                "message": f"Client {client_id} connected"
            }
        )
    
    def disconnect(self, session_id: str, client_id: str):
        """
        Disconnect a client from a session
        """
        if session_id in self.active_connections:
            if client_id in self.active_connections[session_id]:
                del self.active_connections[session_id][client_id]
                logger.info(f"Client {client_id} disconnected from session {session_id}")
            
            if not self.active_connections[session_id]:
                del self.active_connections[session_id]
    
    async def broadcast_notification(self, session_id: str, notification: Dict[str, Any]):
        """
        Broadcast a notification to all clients in a session
        """
        if session_id in self.active_connections:
            for connection in self.active_connections[session_id].values():
                await connection.send_json(notification)
    
    async def broadcast_agent_message(self, session_id: str, message: Dict[str, Any]):
        """
        Broadcast an agent message to all clients in a session
        """
        if session_id in self.active_connections:
            formatted_message = {
                "type": "agent_message",
                "data": message
            }
            for connection in self.active_connections[session_id].values():
                await connection.send_json(formatted_message)
    
    async def send_direct_message(self, session_id: str, client_id: str, message: Dict[str, Any]):
        """
        Send a message directly to a specific client
        """
        if session_id in self.active_connections and client_id in self.active_connections[session_id]:
            await self.active_connections[session_id][client_id].send_json(message)
    
    async def process_user_message(self, session_id: str, client_id: str, message: Dict[str, Any], db: Session):
        """
        Process a user message and generate agent responses
        """
        try:
            # Get the session
            db_session = db.query(models.Session).filter(models.Session.id == int(session_id)).first()
            if not db_session:
                await self.send_direct_message(
                    session_id,
                    client_id,
                    {
                        "type": "error",
                        "message": f"Session {session_id} not found"
                    }
                )
                return
            
            # Get all agents in the session
            session_agents = db.query(models.SessionAgent).filter(
                models.SessionAgent.session_id == int(session_id)
            ).all()
            
            if not session_agents:
                await self.send_direct_message(
                    session_id,
                    client_id,
                    {
                        "type": "error",
                        "message": "No agents in this session"
                    }
                )
                return
            
            # Find the manager agent
            manager_agent = next((sa for sa in session_agents if sa.is_manager), None)
            
            if not manager_agent:
                # If no manager agent, just use the first agent
                agent_to_use = session_agents[0]
                
                # Get the agent details
                agent = db.query(models.Agent).filter(models.Agent.id == agent_to_use.agent_id).first()
                
                if not agent:
                    await self.send_direct_message(
                        session_id,
                        client_id,
                        {
                            "type": "error",
                            "message": "Agent not found"
                        }
                    )
                    return
                
                # Generate response from the agent
                agent_data = {
                    "id": agent.id,
                    "name": agent.name,
                    "role": agent.role,
                    "personality": agent.personality,
                    "system_instructions": agent.system_instructions,
                    "examples": agent.examples
                }
                
                response = await self.langchain_service.run_agent_workflow(
                    agent_data,
                    message.get("content", "")
                )
                
                # Save the message to the database
                db_message = models.Message(
                    content=message.get("content", ""),
                    session_id=int(session_id),
                    user_id=db_session.owner_id
                )
                db.add(db_message)
                db.commit()
                
                # Save the agent response to the database
                agent_db_message = models.Message(
                    content=response,
                    session_id=int(session_id),
                    session_agent_id=agent_to_use.id,
                    parent_id=db_message.id
                )
                db.add(agent_db_message)
                db.commit()
                
                # Broadcast the agent response
                await self.broadcast_agent_message(
                    session_id,
                    {
                        "id": agent_db_message.id,
                        "content": response,
                        "agent_name": agent.name,
                        "agent_role": agent.role,
                        "timestamp": agent_db_message.created_at.isoformat()
                    }
                )
            else:
                # Get all agents for the manager to delegate tasks
                available_agents = []
                for sa in session_agents:
                    agent = db.query(models.Agent).filter(models.Agent.id == sa.agent_id).first()
                    if agent:
                        available_agents.append({
                            "id": agent.id,
                            "name": agent.name,
                            "role": agent.role,
                            "personality": agent.personality,
                            "system_instructions": agent.system_instructions,
                            "examples": agent.examples
                        })
                
                # Get the manager agent details
                manager = db.query(models.Agent).filter(models.Agent.id == manager_agent.agent_id).first()
                
                if not manager:
                    await self.send_direct_message(
                        session_id,
                        client_id,
                        {
                            "type": "error",
                            "message": "Manager agent not found"
                        }
                    )
                    return
                
                # Save the user message to the database
                db_message = models.Message(
                    content=message.get("content", ""),
                    session_id=int(session_id),
                    user_id=db_session.owner_id
                )
                db.add(db_message)
                db.commit()
                
                # Run the manager workflow to delegate tasks
                delegation_result = await self.langchain_service.run_manager_workflow(
                    message.get("content", ""),
                    available_agents
                )
                
                # Process each assigned agent
                agent_responses = []
                for assignment in delegation_result.get("assigned_agents", []):
                    agent_id = assignment.get("agent_id")
                    task = assignment.get("task")
                    
                    # Find the agent in the available agents
                    agent_data = next((a for a in available_agents if str(a["id"]) == str(agent_id)), None)
                    
                    if agent_data:
                        # Generate response from the agent
                        response = await self.langchain_service.run_agent_workflow(
                            agent_data,
                            task
                        )
                        
                        # Find the session agent
                        session_agent = next((sa for sa in session_agents if sa.agent_id == int(agent_id)), None)
                        
                        if session_agent:
                            # Save the agent response to the database
                            agent_db_message = models.Message(
                                content=response,
                                session_id=int(session_id),
                                session_agent_id=session_agent.id,
                                parent_id=db_message.id
                            )
                            db.add(agent_db_message)
                            db.commit()
                            
                            # Add to agent responses
                            agent_responses.append({
                                "id": agent_db_message.id,
                                "content": response,
                                "agent_name": agent_data["name"],
                                "agent_role": agent_data["role"],
                                "timestamp": agent_db_message.created_at.isoformat()
                            })
                
                # If there are multiple responses, resolve conflicts
                if len(agent_responses) > 1:
                    resolution_result = await self.langchain_service.resolve_conflicts(agent_responses)
                    
                    # Save the resolution to the database
                    resolution_db_message = models.Message(
                        content=resolution_result.get("result", "No resolution"),
                        session_id=int(session_id),
                        session_agent_id=manager_agent.id,
                        parent_id=db_message.id
                    )
                    db.add(resolution_db_message)
                    db.commit()
                    
                    # Broadcast the resolution
                    await self.broadcast_agent_message(
                        session_id,
                        {
                            "id": resolution_db_message.id,
                            "content": resolution_result.get("result", "No resolution"),
                            "agent_name": manager.name,
                            "agent_role": manager.role,
                            "timestamp": resolution_db_message.created_at.isoformat()
                        }
                    )
                
                # Broadcast each agent response
                for response in agent_responses:
                    await self.broadcast_agent_message(session_id, response)
        
        except Exception as e:
            logger.error(f"Error processing message: {str(e)}")
            await self.send_direct_message(
                session_id,
                client_id,
                {
                    "type": "error",
                    "message": f"Error processing message: {str(e)}"
                }
            )

# Create the WebSocket manager
websocket_manager = WebSocketManager()

def get_websocket_manager():
    return websocket_manager

async def websocket_endpoint(
    websocket: WebSocket,
    session_id: str,
    client_id: str,
    db: Session = Depends(get_db),
    manager: WebSocketManager = Depends(get_websocket_manager)
):
    await manager.connect(websocket, session_id, client_id)
    try:
        while True:
            data = await websocket.receive_json()
            
            # Process the message based on its type
            message_type = data.get("type", "")
            
            if message_type == "user_message":
                # Process user message
                asyncio.create_task(
                    manager.process_user_message(session_id, client_id, data, db)
                )
            elif message_type == "agent_added":
                # Notify all clients that an agent was added
                await manager.broadcast_notification(
                    session_id,
                    {
                        "type": "agent_added",
                        "agent_id": data.get("agent_id"),
                        "agent_name": data.get("agent_name", "Unknown Agent")
                    }
                )
            else:
                # Unknown message type
                await manager.send_direct_message(
                    session_id,
                    client_id,
                    {
                        "type": "error",
                        "message": f"Unknown message type: {message_type}"
                    }
                )
    
    except WebSocketDisconnect:
        manager.disconnect(session_id, client_id)
        await manager.broadcast_notification(
            session_id,
            {
                "type": "disconnection",
                "client_id": client_id,
                "message": f"Client {client_id} disconnected"
            }
        )
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        manager.disconnect(session_id, client_id)

def setup_websocket_routes(app: FastAPI):
    """
    Set up WebSocket routes for the application
    """
    app.websocket("/ws/{session_id}/{client_id}")(websocket_endpoint)
