from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import random

from app.database import get_db
from app.models import models, schemas
from app.models.learning_models import ABTest, ABTestSession, AgentVersion
from app.utils import auth

router = APIRouter()

@router.post("/ab_tests/", response_model=schemas.ABTest)
def create_ab_test(
    test: schemas.ABTestCreate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(auth.get_current_user)
):
    """
    Create a new A/B test for comparing agent versions
    """
    # Verify the control version exists and user has access
    control_version = db.query(AgentVersion).filter(AgentVersion.id == test.control_version_id).first()
    if not control_version:
        raise HTTPException(status_code=404, detail="Control version not found")
    
    # Verify the variant version exists and user has access
    variant_version = db.query(AgentVersion).filter(AgentVersion.id == test.variant_version_id).first()
    if not variant_version:
        raise HTTPException(status_code=404, detail="Variant version not found")
    
    # Verify both versions belong to the same agent
    if control_version.agent_id != variant_version.agent_id:
        raise HTTPException(status_code=400, detail="Control and variant versions must belong to the same agent")
    
    # Verify user has access to the agent
    agent = db.query(models.Agent).filter(models.Agent.id == control_version.agent_id).first()
    if not agent or agent.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to create A/B tests for this agent")
    
    # Create the A/B test
    db_test = ABTest(
        name=test.name,
        description=test.description,
        user_id=current_user.id,
        control_version_id=test.control_version_id,
        variant_version_id=test.variant_version_id,
        test_parameters=test.test_parameters,
        status=test.status
    )
    
    db.add(db_test)
    db.commit()
    db.refresh(db_test)
    
    return db_test

@router.get("/ab_tests/", response_model=List[schemas.ABTest])
def read_ab_tests(
    agent_id: Optional[int] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(auth.get_current_user)
):
    """
    Retrieve A/B tests with optional filtering
    """
    query = db.query(ABTest).filter(ABTest.user_id == current_user.id)
    
    # Apply filters
    if agent_id:
        # Find all versions for this agent
        agent_versions = db.query(AgentVersion.id).filter(AgentVersion.agent_id == agent_id).all()
        agent_version_ids = [v[0] for v in agent_versions]
        
        # Filter tests where either control or variant is from this agent
        query = query.filter(
            (ABTest.control_version_id.in_(agent_version_ids)) | 
            (ABTest.variant_version_id.in_(agent_version_ids))
        )
    
    if status:
        query = query.filter(ABTest.status == status)
    
    # Apply pagination and return results
    tests = query.order_by(ABTest.created_at.desc()).offset(skip).limit(limit).all()
    return tests

@router.get("/ab_tests/{test_id}", response_model=schemas.ABTest)
def read_ab_test_by_id(
    test_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(auth.get_current_user)
):
    """
    Retrieve a specific A/B test
    """
    test = db.query(ABTest).filter(ABTest.id == test_id).first()
    
    if not test:
        raise HTTPException(status_code=404, detail="A/B test not found")
    
    # Verify user has access to this test
    if test.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this A/B test")
    
    return test

@router.put("/ab_tests/{test_id}/start", response_model=schemas.ABTest)
def start_ab_test(
    test_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(auth.get_current_user)
):
    """
    Start an A/B test
    """
    test = db.query(ABTest).filter(ABTest.id == test_id).first()
    
    if not test:
        raise HTTPException(status_code=404, detail="A/B test not found")
    
    # Verify user has access to this test
    if test.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this A/B test")
    
    # Verify test is in created status
    if test.status != "created":
        raise HTTPException(status_code=400, detail="Test can only be started from 'created' status")
    
    # Update test status
    test.status = "running"
    test.start_date = datetime.now()
    
    db.commit()
    db.refresh(test)
    
    return test

@router.put("/ab_tests/{test_id}/stop", response_model=schemas.ABTest)
def stop_ab_test(
    test_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(auth.get_current_user)
):
    """
    Stop an A/B test
    """
    test = db.query(ABTest).filter(ABTest.id == test_id).first()
    
    if not test:
        raise HTTPException(status_code=404, detail="A/B test not found")
    
    # Verify user has access to this test
    if test.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this A/B test")
    
    # Verify test is in running status
    if test.status != "running":
        raise HTTPException(status_code=400, detail="Test can only be stopped from 'running' status")
    
    # Update test status
    test.status = "completed"
    test.end_date = datetime.now()
    
    db.commit()
    db.refresh(test)
    
    return test

@router.put("/ab_tests/{test_id}/analyze", response_model=schemas.ABTest)
async def analyze_ab_test(
    test_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(auth.get_current_user)
):
    """
    Analyze the results of a completed A/B test
    """
    test = db.query(ABTest).filter(ABTest.id == test_id).first()
    
    if not test:
        raise HTTPException(status_code=404, detail="A/B test not found")
    
    # Verify user has access to this test
    if test.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to analyze this A/B test")
    
    # Verify test is in completed status
    if test.status != "completed":
        raise HTTPException(status_code=400, detail="Test can only be analyzed from 'completed' status")
    
    # Get all test sessions
    test_sessions = db.query(ABTestSession).filter(ABTestSession.ab_test_id == test.id).all()
    
    if not test_sessions:
        raise HTTPException(status_code=400, detail="No test sessions found for this A/B test")
    
    # Group sessions by version
    control_sessions = [s for s in test_sessions if s.version_used == "control"]
    variant_sessions = [s for s in test_sessions if s.version_used == "variant"]
    
    if not control_sessions or not variant_sessions:
        raise HTTPException(status_code=400, detail="Both control and variant must have test sessions")
    
    # Analyze metrics
    from app.models.learning_models import AgentFeedback, PerformanceMetric
    
    # Get agent ID from the control version
    control_version = db.query(AgentVersion).filter(AgentVersion.id == test.control_version_id).first()
    agent_id = control_version.agent_id
    
    # Initialize results
    results = {
        "control": {
            "session_count": len(control_sessions),
            "feedback": {
                "count": 0,
                "avg_rating": 0,
                "positive_percentage": 0
            },
            "performance": {
                "response_time": 0,
                "message_length": 0,
                "task_completion_rate": 0
            }
        },
        "variant": {
            "session_count": len(variant_sessions),
            "feedback": {
                "count": 0,
                "avg_rating": 0,
                "positive_percentage": 0
            },
            "performance": {
                "response_time": 0,
                "message_length": 0,
                "task_completion_rate": 0
            }
        },
        "comparison": {
            "winner": None,
            "rating_diff": 0,
            "response_time_diff": 0,
            "completion_rate_diff": 0,
            "confidence": 0
        }
    }
    
    # Analyze control sessions
    control_session_ids = [s.session_id for s in control_sessions]
    
    # Get feedback for control sessions
    control_feedback = db.query(AgentFeedback).filter(
        AgentFeedback.session_id.in_(control_session_ids)
    ).all()
    
    if control_feedback:
        results["control"]["feedback"]["count"] = len(control_feedback)
        
        # Calculate average rating
        rating_feedback = [f for f in control_feedback if f.rating is not None]
        if rating_feedback:
            avg_rating = sum(f.rating for f in rating_feedback) / len(rating_feedback)
            results["control"]["feedback"]["avg_rating"] = avg_rating
        
        # Calculate positive feedback percentage
        thumbs_feedback = [f for f in control_feedback if f.is_positive is not None]
        if thumbs_feedback:
            positive_count = sum(1 for f in thumbs_feedback if f.is_positive)
            positive_percentage = (positive_count / len(thumbs_feedback)) * 100
            results["control"]["feedback"]["positive_percentage"] = positive_percentage
    
    # Get performance metrics for control sessions
    for session_id in control_session_ids:
        # Response time
        response_time_metrics = db.query(PerformanceMetric).filter(
            PerformanceMetric.session_id == session_id,
            PerformanceMetric.metric_name == "response_time"
        ).all()
        
        if response_time_metrics:
            avg_response_time = sum(m.metric_value for m in response_time_metrics) / len(response_time_metrics)
            results["control"]["performance"]["response_time"] += avg_response_time
        
        # Message length
        message_length_metrics = db.query(PerformanceMetric).filter(
            PerformanceMetric.session_id == session_id,
            PerformanceMetric.metric_name == "message_length"
        ).all()
        
        if message_length_metrics:
            avg_message_length = sum(m.metric_value for m in message_length_metrics) / len(message_length_metrics)
            results["control"]["performance"]["message_length"] += avg_message_length
        
        # Task completion rate
        completion_metrics = db.query(PerformanceMetric).filter(
            PerformanceMetric.session_id == session_id,
            PerformanceMetric.metric_name == "task_completion_rate"
        ).all()
        
        if completion_metrics:
            avg_completion_rate = sum(m.metric_value for m in completion_metrics) / len(completion_metrics)
            results["control"]["performance"]["task_completion_rate"] += avg_completion_rate
    
    # Calculate averages for control performance metrics
    if control_session_ids:
        results["control"]["performance"]["response_time"] /= len(control_session_ids) or 1
        results["control"]["performance"]["message_length"] /= len(control_session_ids) or 1
        results["control"]["performance"]["task_completion_rate"] /= len(control_session_ids) or 1
    
    # Analyze variant sessions
    variant_session_ids = [s.session_id for s in variant_sessions]
    
    # Get feedback for variant sessions
    variant_feedback = db.query(AgentFeedback).filter(
        AgentFeedback.session_id.in_(variant_session_ids)
    ).all()
    
    if variant_feedback:
        results["variant"]["feedback"]["count"] = len(variant_feedback)
        
        # Calculate average rating
        rating_feedback = [f for f in variant_feedback if f.rating is not None]
        if rating_feedback:
            avg_rating = sum(f.rating for f in rating_feedback) / len(rating_feedback)
            results["variant"]["feedback"]["avg_rating"] = avg_rating
        
        # Calculate positive feedback percentage
        thumbs_feedback = [f for f in variant_feedback if f.is_positive is not None]
        if thumbs_feedback:
            positive_count = sum(1 for f in thumbs_feedback if f.is_positive)
            positive_percentage = (positive_count / len(thumbs_feedback)) * 100
            results["variant"]["feedback"]["positive_percentage"] = positive_percentage
    
    # Get performance metrics for variant sessions
    for session_id in variant_session_ids:
        # Response time
        response_time_metrics = db.query(PerformanceMetric).filter(
            PerformanceMetric.session_id == session_id,
            PerformanceMetric.metric_name == "response_time"
        ).all()
        
        if response_time_metrics:
            avg_response_time = sum(m.metric_value for m in response_time_metrics) / len(response_time_metrics)
            results["variant"]["performance"]["response_time"] += avg_response_time
        
        # Message length
        message_length_metrics = db.query(PerformanceMetric).filter(
            PerformanceMetric.session_id == session_id,
            PerformanceMetric.metric_name == "message_length"
        ).all()
        
        if message_length_metrics:
            avg_message_length = sum(m.metric_value for m in message_length_metrics) / len(message_length_metrics)
            results["variant"]["performance"]["message_length"] += avg_message_length
        
        # Task completion rate
        completion_metrics = db.query(PerformanceMetric).filter(
            PerformanceMetric.session_id == session_id,
            PerformanceMetric.metric_name == "task_completion_rate"
        ).all()
        
        if completion_metrics:
            avg_completion_rate = sum(m.metric_value for m in completion_metrics) / len(completion_metrics)
            results["variant"]["performance"]["task_completion_rate"] += avg_completion_rate
    
    # Calculate averages for variant performance metrics
    if variant_session_ids:
        results["variant"]["performance"]["response_time"] /= len(variant_session_ids) or 1
        results["variant"]["performance"]["message_length"] /= len(variant_session_ids) or 1
        results["variant"]["performance"]["task_completion_rate"] /= len(variant_session_ids) or 1
    
    # Compare results and determine winner
    # This is a simplified comparison - in a real system, you would use statistical significance testing
    
    # Compare ratings
    rating_diff = results["variant"]["feedback"]["avg_rating"] - results["control"]["feedback"]["avg_rating"]
    results["comparison"]["rating_diff"] = rating_diff
    
    # Compare response times (lower is better)
    response_time_diff = results["control"]["performance"]["response_time"] - results["variant"]["performance"]["response_time"]
    results["comparison"]["response_time_diff"] = response_time_diff
    
    # Compare task completion rates
    completion_rate_diff = results["variant"]["performance"]["task_completion_rate"] - results["control"]["performance"]["task_completion_rate"]
    results["comparison"]["completion_rate_diff"] = completion_rate_diff
    
    # Determine winner based on a weighted score
    # This is a simplified approach - in a real system, you would use more sophisticated methods
    variant_score = 0
    control_score = 0
    
    # Weight rating differences (scale: 0-5)
    if abs(rating_diff) >= 0.2:  # Only consider meaningful differences
        if rating_diff > 0:
            variant_score += (rating_diff / 5) * 40  # 40% weight to ratings
        else:
            control_score += (abs(rating_diff) / 5) * 40
    
    # Weight response time differences (scale varies, normalize to 0-1 range)
    max_response_
(Content truncated due to size limit. Use line ranges to read in chunks)