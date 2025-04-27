from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import json

from app.database import get_db
from app.models import schemas, models
from app.utils import auth
from app.services.ai.gemini_service import GeminiService, LangChainService

router = APIRouter()

@router.post("/roles/", response_model=schemas.AgentRole)
def create_agent_role(
    role: schemas.AgentRoleCreate, 
    db: Session = Depends(get_db), 
    current_user: schemas.User = Depends(auth.get_current_user)
):
    """
    Create a new agent role
    """
    # Create the role
    db_role = models.AgentRole(
        name=role.name,
        description=role.description,
        permissions=role.permissions,
        role_type=role.role_type
    )
    db.add(db_role)
    db.commit()
    db.refresh(db_role)
    
    return db_role

@router.get("/roles/", response_model=List[schemas.AgentRole])
def read_agent_roles(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db), 
    current_user: schemas.User = Depends(auth.get_current_user)
):
    """
    Retrieve agent roles
    """
    roles = db.query(models.AgentRole).offset(skip).limit(limit).all()
    return roles

@router.get("/roles/{role_id}", response_model=schemas.AgentRole)
def read_agent_role(
    role_id: int, 
    db: Session = Depends(get_db), 
    current_user: schemas.User = Depends(auth.get_current_user)
):
    """
    Retrieve a specific agent role
    """
    role = db.query(models.AgentRole).filter(models.AgentRole.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return role

@router.put("/roles/{role_id}", response_model=schemas.AgentRole)
def update_agent_role(
    role_id: int, 
    role_update: schemas.AgentRoleCreate, 
    db: Session = Depends(get_db), 
    current_user: schemas.User = Depends(auth.get_current_user)
):
    """
    Update an agent role
    """
    db_role = db.query(models.AgentRole).filter(models.AgentRole.id == role_id).first()
    if not db_role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    # Update role fields
    db_role.name = role_update.name
    db_role.description = role_update.description
    db_role.permissions = role_update.permissions
    db_role.role_type = role_update.role_type
    
    db.commit()
    db.refresh(db_role)
    
    return db_role

@router.delete("/roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_agent_role(
    role_id: int, 
    db: Session = Depends(get_db), 
    current_user: schemas.User = Depends(auth.get_current_user)
):
    """
    Delete an agent role
    """
    db_role = db.query(models.AgentRole).filter(models.AgentRole.id == role_id).first()
    if not db_role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    # Check if role is assigned to any agents
    role_assignments = db.query(models.AgentRoleAssignment).filter(
        models.AgentRoleAssignment.role_id == role_id
    ).first()
    
    if role_assignments:
        raise HTTPException(
            status_code=400, 
            detail="Cannot delete role that is assigned to agents"
        )
    
    db.delete(db_role)
    db.commit()
    
    return None

@router.post("/teams/", response_model=schemas.Team)
def create_team(
    team: schemas.TeamCreate, 
    db: Session = Depends(get_db), 
    current_user: schemas.User = Depends(auth.get_current_user)
):
    """
    Create a new team
    """
    # Create the team
    db_team = models.Team(
        name=team.name,
        description=team.description,
        owner_id=current_user.id,
        is_public=team.is_public,
        hierarchy_structure=team.hierarchy_structure
    )
    db.add(db_team)
    db.commit()
    db.refresh(db_team)
    
    # Add roles to the team if provided
    if team.role_ids:
        for role_id in team.role_ids:
            role = db.query(models.AgentRole).filter(models.AgentRole.id == role_id).first()
            if role:
                db_team.available_roles.append(role)
        
        db.commit()
        db.refresh(db_team)
    
    # Add agents to the team if provided
    if team.agent_ids:
        for agent_id in team.agent_ids:
            agent = db.query(models.Agent).filter(models.Agent.id == agent_id).first()
            if agent:
                db_team.members.append(agent)
        
        db.commit()
        db.refresh(db_team)
    
    return db_team

@router.get("/teams/", response_model=List[schemas.Team])
def read_teams(
    is_public: Optional[bool] = None,
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db), 
    current_user: schemas.User = Depends(auth.get_current_user)
):
    """
    Retrieve teams
    """
    # Query teams
    query = db.query(models.Team)
    
    if is_public is None:
        # Get user's teams and public teams
        query = query.filter(
            (models.Team.owner_id == current_user.id) | 
            (models.Team.is_public == True)
        )
    elif is_public:
        # Get only public teams
        query = query.filter(models.Team.is_public == True)
    else:
        # Get only user's private teams
        query = query.filter(
            models.Team.owner_id == current_user.id,
            models.Team.is_public == False
        )
    
    # Apply pagination
    teams = query.order_by(models.Team.created_at.desc()).offset(skip).limit(limit).all()
    
    return teams

@router.get("/teams/{team_id}", response_model=schemas.Team)
def read_team(
    team_id: int, 
    db: Session = Depends(get_db), 
    current_user: schemas.User = Depends(auth.get_current_user)
):
    """
    Retrieve a specific team
    """
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Check if user has access to this team
    if team.owner_id != current_user.id and not team.is_public:
        raise HTTPException(status_code=403, detail="Not authorized to access this team")
    
    return team

@router.put("/teams/{team_id}", response_model=schemas.Team)
def update_team(
    team_id: int, 
    team_update: schemas.TeamUpdate, 
    db: Session = Depends(get_db), 
    current_user: schemas.User = Depends(auth.get_current_user)
):
    """
    Update a team
    """
    db_team = db.query(models.Team).filter(models.Team.id == team_id).first()
    
    if not db_team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Check if user owns this team
    if db_team.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this team")
    
    # Update team fields
    if team_update.name is not None:
        db_team.name = team_update.name
    
    if team_update.description is not None:
        db_team.description = team_update.description
    
    if team_update.is_public is not None:
        db_team.is_public = team_update.is_public
    
    if team_update.hierarchy_structure is not None:
        db_team.hierarchy_structure = team_update.hierarchy_structure
    
    # Update roles if provided
    if team_update.role_ids is not None:
        # Clear existing roles
        db_team.available_roles = []
        
        # Add new roles
        for role_id in team_update.role_ids:
            role = db.query(models.AgentRole).filter(models.AgentRole.id == role_id).first()
            if role:
                db_team.available_roles.append(role)
    
    # Update agents if provided
    if team_update.agent_ids is not None:
        # Clear existing agents
        db_team.members = []
        
        # Add new agents
        for agent_id in team_update.agent_ids:
            agent = db.query(models.Agent).filter(models.Agent.id == agent_id).first()
            if agent:
                db_team.members.append(agent)
    
    db.commit()
    db.refresh(db_team)
    
    return db_team

@router.delete("/teams/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_team(
    team_id: int, 
    db: Session = Depends(get_db), 
    current_user: schemas.User = Depends(auth.get_current_user)
):
    """
    Delete a team
    """
    db_team = db.query(models.Team).filter(models.Team.id == team_id).first()
    
    if not db_team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Check if user owns this team
    if db_team.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this team")
    
    # Delete role assignments for this team
    db.query(models.AgentRoleAssignment).filter(
        models.AgentRoleAssignment.team_id == team_id
    ).delete()
    
    # Delete team sessions for this team
    team_sessions = db.query(models.TeamSession).filter(
        models.TeamSession.team_id == team_id
    ).all()
    
    for team_session in team_sessions:
        # Delete hierarchical messages for this team session
        db.query(models.HierarchicalMessage).filter(
            models.HierarchicalMessage.team_session_id == team_session.id
        ).delete()
    
    db.query(models.TeamSession).filter(
        models.TeamSession.team_id == team_id
    ).delete()
    
    # Delete the team
    db.delete(db_team)
    db.commit()
    
    return None

@router.post("/teams/{team_id}/assign-role", response_model=schemas.AgentRoleAssignment)
def assign_role_to_agent(
    team_id: int,
    assignment: schemas.AgentRoleAssignmentCreate,
    db: Session = Depends(get_db), 
    current_user: schemas.User = Depends(auth.get_current_user)
):
    """
    Assign a role to an agent within a team
    """
    # Check if team exists and user has access
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    if team.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to manage this team")
    
    # Check if agent exists and is a member of the team
    agent = db.query(models.Agent).filter(models.Agent.id == assignment.agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    if agent not in team.members:
        raise HTTPException(status_code=400, detail="Agent is not a member of this team")
    
    # Check if role exists and is available for this team
    role = db.query(models.AgentRole).filter(models.AgentRole.id == assignment.role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    if role not in team.available_roles:
        raise HTTPException(status_code=400, detail="Role is not available for this team")
    
    # Check if agent already has this role in this team
    existing_assignment = db.query(models.AgentRoleAssignment).filter(
        models.AgentRoleAssignment.team_id == team_id,
        models.AgentRoleAssignment.agent_id == assignment.agent_id,
        models.AgentRoleAssignment.role_id == assignment.role_id
    ).first()
    
    if existing_assignment:
        raise HTTPException(status_code=400, detail="Agent already has this role in this team")
    
    # Create the role assignment
    db_assignment = models.AgentRoleAssignment(
        team_id=team_id,
        agent_id=assignment.agent_id,
        role_id=assignment.role_id,
        assigned_by=current_user.id
    )
    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)
    
    return db_assignment

@router.delete("/teams/{team_id}/remove-role/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_role_from_agent(
    team_id: int,
    assignment_id: int,
    db: Session = Depends(get_db), 
    current_user: schemas.User = Depends(auth.get_current_user)
):
    """
    Remove a role assignment from an agent within a team
    """
    # Check if team exists and user has access
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    if team.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to manage this team")
    
    # Check if assignment exists and belongs to this team
    assignment = db.query(models.AgentRoleAssignment).filter(
        models.AgentRoleAssignment.id == assignment_id,
        models.AgentRoleAssignment.team_id == team_id
    ).first()
    
    if not assignment:
        raise HTTPException(status_code=404, detail="Role assignment not found")
    
    # Delete the assignment
    db.delete(assignment)
    db.commit()
    
    return None

@router.post("/teams/{team_id}/sessions/{session_id}", response_model=schemas.TeamSession)
def create_team_session(
    team_id: int,
    session_id: int,
    team_session: schemas.TeamSessionCreate,
    db: Session = Depends(get_db), 
    current_user: schemas.User = Depends(auth.get_current_user)
):
    """
    Create a new team session
    """
    # Check if team exists and user has access
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    if team.owner_id != current_user.id and not team.is_public:
        raise HTTPException(status_code=403, detail="Not authorized to use this team")
    
    # Check if session exists and belongs to the user
    session = db.query(models.Session).filter(models.Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this session")
    
    # Check if a team session already exists for this team and session
    existing_team_session = db.query(models.TeamSession).filter(
        models.TeamSession.team_id == team_id,
        models.TeamSession.session_id == session_id
    ).first()
    
    if existing_team_session:
        raise HTTPException(status_code=400, detail="Team session already exists")
    
    # Create the team session
    db_team_session = models.TeamSession(
        team_id=team_id,
        session_id=session_id,
        active_hierarchy=team_session.active_hierarchy or team.hierarchy_structure
    )
    db.add(db_team_session)
    db.commit()
    db.refresh(db_team_session)
    
    return db_team_session

@router.get("/teams/{team_id}/sessions", response_model=List[schemas.TeamSession])
def read_team_sessions(
    team_id: int,
    db: Session = Depends(get_db), 
    current_user: schemas.User = Depends(auth.get_current_user)
):
    """
    Retrieve team sessions for a specific team
    """
    # Check if team exists and user has access
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    if team.owner_id != current_user.id and not team.is_public:
        raise HTTPException(status_code=403, detail="Not authorized to access this team")
    
    # Get team sessions
    team_sessions = db.query(models.TeamSession).filter(
        models.TeamSession.team_id == team_id
    ).all()
    
    return team_sessions

@router.post("/teams/sessions/{team_session_id}/messages", response_model=schemas.HierarchicalMessage)
async def create_hierarchical_message(
    team_session_id: int,
    message: schemas.HierarchicalMessageCreate,
    db: Session = Depends(get_db), 
    current_user: schemas.User = Depends(auth.get_current_user),
    gemini_service: GeminiService = Depends(lambda: GeminiService())
):
    """
    Create a new hierarchical message
    """
    # Check if team session exists
    team_session = db.query(models.TeamSession).filter(
        models.TeamSessi
(Content truncated due to size limit. Use line ranges to read in chunks)