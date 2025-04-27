from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class AgentExample(BaseModel):
    input: str
    output: str

class AgentBase(BaseModel):
    name: str
    role: str
    personality: str
    system_instructions: str
    examples: List[AgentExample] = []

class AgentCreate(AgentBase):
    pass

class Agent(AgentBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

class SessionBase(BaseModel):
    name: str
    description: Optional[str] = None

class SessionCreate(SessionBase):
    pass

class Session(SessionBase):
    id: int
    owner_id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

class MessageBase(BaseModel):
    content: str
    session_id: int
    session_agent_id: Optional[int] = None
    user_id: Optional[int] = None
    parent_id: Optional[int] = None

class MessageCreate(MessageBase):
    pass

class Message(MessageBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True

class UserBase(BaseModel):
    username: str
    email: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
