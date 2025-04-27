from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta

from app.database import get_db
from app.models import models, schemas
from app.models.learning_models import PerformanceMetric
from app.utils import auth

router = APIRouter()

@router.post("/metrics/", response_model=schemas.PerformanceMetric)
def create_performance_metric(
    metric: schemas.PerformanceMetricCreate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(auth.get_current_user)
):
    """
    Record a new performance metric for an agent
    """
    # Verify the agent exists and user has access
    agent = db.query(models.Agent).filter(models.Agent.id == metric.agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    if agent.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to record metrics for this agent")
    
    # If session_id is provided, verify it exists and user has access
    if metric.session_id:
        session = db.query(models.Session).filter(models.Session.id == metric.session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        if session.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to record metrics for this session")
    
    # Create the performance metric
    db_metric = PerformanceMetric(
        agent_id=metric.agent_id,
        session_id=metric.session_id,
        metric_name=metric.metric_name,
        metric_value=metric.metric_value,
        metadata=metric.metadata
    )
    
    db.add(db_metric)
    db.commit()
    db.refresh(db_metric)
    
    return db_metric

@router.get("/metrics/", response_model=List[schemas.PerformanceMetric])
def read_performance_metrics(
    agent_id: Optional[int] = None,
    session_id: Optional[int] = None,
    metric_name: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(auth.get_current_user)
):
    """
    Retrieve performance metrics with optional filtering
    """
    query = db.query(PerformanceMetric)
    
    # Apply filters
    if agent_id:
        # Verify user has access to this agent
        agent = db.query(models.Agent).filter(models.Agent.id == agent_id).first()
        if not agent or agent.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to access metrics for this agent")
        
        query = query.filter(PerformanceMetric.agent_id == agent_id)
    else:
        # If no agent specified, only return metrics for agents owned by the user
        query = query.join(models.Agent).filter(models.Agent.owner_id == current_user.id)
    
    if session_id:
        # Verify user has access to this session
        session = db.query(models.Session).filter(models.Session.id == session_id).first()
        if not session or session.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to access metrics for this session")
        
        query = query.filter(PerformanceMetric.session_id == session_id)
    
    if metric_name:
        query = query.filter(PerformanceMetric.metric_name == metric_name)
    
    if start_date:
        query = query.filter(PerformanceMetric.timestamp >= start_date)
    
    if end_date:
        query = query.filter(PerformanceMetric.timestamp <= end_date)
    
    # Apply pagination and return results
    metrics = query.order_by(PerformanceMetric.timestamp.desc()).offset(skip).limit(limit).all()
    return metrics

@router.get("/metrics/{metric_id}", response_model=schemas.PerformanceMetric)
def read_performance_metric_by_id(
    metric_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(auth.get_current_user)
):
    """
    Retrieve a specific performance metric
    """
    metric = db.query(PerformanceMetric).filter(PerformanceMetric.id == metric_id).first()
    
    if not metric:
        raise HTTPException(status_code=404, detail="Performance metric not found")
    
    # Verify user has access to the agent this metric belongs to
    agent = db.query(models.Agent).filter(models.Agent.id == metric.agent_id).first()
    if not agent or agent.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this metric")
    
    return metric

@router.delete("/metrics/{metric_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_performance_metric(
    metric_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(auth.get_current_user)
):
    """
    Delete a performance metric
    """
    db_metric = db.query(PerformanceMetric).filter(PerformanceMetric.id == metric_id).first()
    
    if not db_metric:
        raise HTTPException(status_code=404, detail="Performance metric not found")
    
    # Verify user has access to the agent this metric belongs to
    agent = db.query(models.Agent).filter(models.Agent.id == db_metric.agent_id).first()
    if not agent or agent.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this metric")
    
    db.delete(db_metric)
    db.commit()
    
    return None

@router.get("/metrics/summary/agent/{agent_id}", response_model=schemas.AgentPerformanceSummary)
def get_agent_performance_summary(
    agent_id: int,
    time_period: Optional[str] = "all",  # all, month, week, day
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(auth.get_current_user)
):
    """
    Get a summary of performance metrics for a specific agent
    """
    # Verify the agent exists and user has access
    agent = db.query(models.Agent).filter(models.Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    if agent.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access metrics for this agent")
    
    # Apply time period filter
    query = db.query(PerformanceMetric).filter(PerformanceMetric.agent_id == agent_id)
    
    if time_period == "month":
        query = query.filter(PerformanceMetric.timestamp >= datetime.now() - timedelta(days=30))
    elif time_period == "week":
        query = query.filter(PerformanceMetric.timestamp >= datetime.now() - timedelta(days=7))
    elif time_period == "day":
        query = query.filter(PerformanceMetric.timestamp >= datetime.now() - timedelta(days=1))
    
    # Get all metrics for this agent in the specified time period
    metrics = query.all()
    
    if not metrics:
        return {
            "agent_id": agent_id,
            "agent_name": agent.name,
            "total_metrics_count": 0,
            "time_period": time_period,
            "metrics_by_name": {},
            "recent_metrics": [],
            "trend_data": {}
        }
    
    # Group metrics by name and calculate statistics
    metrics_by_name = {}
    for metric in metrics:
        if metric.metric_name not in metrics_by_name:
            metrics_by_name[metric.metric_name] = {
                "count": 0,
                "sum": 0,
                "min": float('inf'),
                "max": float('-inf'),
                "values": []
            }
        
        metrics_by_name[metric.metric_name]["count"] += 1
        metrics_by_name[metric.metric_name]["sum"] += metric.metric_value
        metrics_by_name[metric.metric_name]["min"] = min(metrics_by_name[metric.metric_name]["min"], metric.metric_value)
        metrics_by_name[metric.metric_name]["max"] = max(metrics_by_name[metric.metric_name]["max"], metric.metric_value)
        metrics_by_name[metric.metric_name]["values"].append(metric.metric_value)
    
    # Calculate averages and clean up
    for name, stats in metrics_by_name.items():
        stats["avg"] = stats["sum"] / stats["count"]
        # Remove the values list as it's not needed in the response
        del stats["values"]
    
    # Get recent metrics
    recent_metrics = db.query(PerformanceMetric).filter(
        PerformanceMetric.agent_id == agent_id
    ).order_by(PerformanceMetric.timestamp.desc()).limit(10).all()
    
    # Generate trend data for each metric type
    trend_data = {}
    for name in metrics_by_name.keys():
        # Get metrics for this name, ordered by timestamp
        trend_metrics = db.query(PerformanceMetric).filter(
            PerformanceMetric.agent_id == agent_id,
            PerformanceMetric.metric_name == name
        ).order_by(PerformanceMetric.timestamp.asc()).all()
        
        # Group by day for the trend
        trend_by_day = {}
        for metric in trend_metrics:
            day = metric.timestamp.date().isoformat()
            if day not in trend_by_day:
                trend_by_day[day] = []
            trend_by_day[day].append(metric.metric_value)
        
        # Calculate daily averages
        trend_data[name] = {
            "dates": [],
            "values": []
        }
        
        for day, values in trend_by_day.items():
            trend_data[name]["dates"].append(day)
            trend_data[name]["values"].append(sum(values) / len(values))
    
    return {
        "agent_id": agent_id,
        "agent_name": agent.name,
        "total_metrics_count": len(metrics),
        "time_period": time_period,
        "metrics_by_name": metrics_by_name,
        "recent_metrics": recent_metrics,
        "trend_data": trend_data
    }

@router.get("/metrics/summary/session/{session_id}", response_model=schemas.SessionPerformanceSummary)
def get_session_performance_summary(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(auth.get_current_user)
):
    """
    Get a summary of performance metrics for a specific session
    """
    # Verify the session exists and user has access
    session = db.query(models.Session).filter(models.Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access metrics for this session")
    
    # Get all metrics for this session
    metrics = db.query(PerformanceMetric).filter(PerformanceMetric.session_id == session_id).all()
    
    if not metrics:
        return {
            "session_id": session_id,
            "session_name": session.name,
            "total_metrics_count": 0,
            "metrics_by_name": {},
            "metrics_by_agent": {},
            "recent_metrics": []
        }
    
    # Group metrics by name and calculate statistics
    metrics_by_name = {}
    for metric in metrics:
        if metric.metric_name not in metrics_by_name:
            metrics_by_name[metric.metric_name] = {
                "count": 0,
                "sum": 0,
                "min": float('inf'),
                "max": float('-inf'),
                "values": []
            }
        
        metrics_by_name[metric.metric_name]["count"] += 1
        metrics_by_name[metric.metric_name]["sum"] += metric.metric_value
        metrics_by_name[metric.metric_name]["min"] = min(metrics_by_name[metric.metric_name]["min"], metric.metric_value)
        metrics_by_name[metric.metric_name]["max"] = max(metrics_by_name[metric.metric_name]["max"], metric.metric_value)
        metrics_by_name[metric.metric_name]["values"].append(metric.metric_value)
    
    # Calculate averages and clean up
    for name, stats in metrics_by_name.items():
        stats["avg"] = stats["sum"] / stats["count"]
        # Remove the values list as it's not needed in the response
        del stats["values"]
    
    # Group metrics by agent
    metrics_by_agent = {}
    for metric in metrics:
        agent = db.query(models.Agent).filter(models.Agent.id == metric.agent_id).first()
        agent_name = agent.name if agent else f"Agent {metric.agent_id}"
        
        if agent_name not in metrics_by_agent:
            metrics_by_agent[agent_name] = {
                "count": 0,
                "metrics": {}
            }
        
        metrics_by_agent[agent_name]["count"] += 1
        
        if metric.metric_name not in metrics_by_agent[agent_name]["metrics"]:
            metrics_by_agent[agent_name]["metrics"][metric.metric_name] = {
                "count": 0,
                "sum": 0,
                "values": []
            }
        
        metrics_by_agent[agent_name]["metrics"][metric.metric_name]["count"] += 1
        metrics_by_agent[agent_name]["metrics"][metric.metric_name]["sum"] += metric.metric_value
        metrics_by_agent[agent_name]["metrics"][metric.metric_name]["values"].append(metric.metric_value)
    
    # Calculate averages for agent metrics and clean up
    for agent_name, agent_stats in metrics_by_agent.items():
        for metric_name, metric_stats in agent_stats["metrics"].items():
            metric_stats["avg"] = metric_stats["sum"] / metric_stats["count"]
            # Remove the values list as it's not needed in the response
            del metric_stats["values"]
    
    # Get recent metrics
    recent_metrics = db.query(PerformanceMetric).filter(
        PerformanceMetric.session_id == session_id
    ).order_by(PerformanceMetric.timestamp.desc()).limit(10).all()
    
    return {
        "session_id": session_id,
        "session_name": session.name,
        "total_metrics_count": len(metrics),
        "metrics_by_name": metrics_by_name,
        "metrics_by_agent": metrics_by_agent,
        "recent_metrics": recent_metrics
    }

@router.post("/metrics/calculate", status_code=status.HTTP_204_NO_CONTENT)
async def calculate_performance_metrics(
    calculation_request: schemas.MetricCalculationRequest,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(auth.get_current_user)
):
    """
    Calculate and store performance metrics for an agent or session
    """
    # Verify the agent exists and user has access
    agent = db.query(models.Agent).filter(models.Agent.id == calculation_request.agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    if agent.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to calculate metrics for this agent")
    
    # If session_id is provided, verify it exists and user has access
    session = None
    if calculation_request.session_id:
        session = db.query(models.Session).filter(models.Session.id == calculation_request.session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        if session.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to calculate metrics for this session")
    
    # Get session agent if session is provided
    session_agent = None
    if session:
        session_agent = db.query(models.SessionAgent).filter(
            models.SessionAgent.session_id == session.id,
            models.SessionAgent.agent_id == agent.id
        ).first()
        
        if not session_agent:
            raise HTTPException(status_code=404, detail="Agent not found in this session")
    
    # Calculate metrics based on the requested types
    for metric_type in calculation_request.metric_types:
        if metric_type == "response_time":
            await calculate_response_time_metrics(db, agent, session_agent, session)
        elif metric_type == "message_length":
            await calculate_
(Content truncated due to size limit. Use line ranges to read in chunks)