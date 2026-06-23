"""
FastAPI routing and endpoint controllers module for "The Last-Minute Life Saver".
Provides production-grade, highly validated REST endpoints to manage task lifecycles 
and invoke cognitive AI-driven productivity strategists.
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

import crud
import schemas
from database import get_db
from services import gemini_service

# Instantiate unified top-level API routers
router = APIRouter()

# =============================================================================
# TASK REST ENDPOINTS
# =============================================================================

@router.post(
    "/tasks",
    response_model=schemas.TaskResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Tasks"],
    summary="Create a new task commitment"
)
def create_task_endpoint(
    task_in: schemas.TaskCreate,
    user_id: int = 1,  # Uses default user_id of 1 for sandboxed API ease
    db: Session = Depends(get_db)
):
    """
    Ingests a custom task model, calculates Parkinson's Law cushion deadlines,
    and records the commitment under the active user session.
    """
    # Verify target user profile exists
    user = crud.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} does not exist. Please register a profile first."
        )

    try:
        # Save fresh task details via SQLAlchemy CRUD interface
        db_task = crud.create_task(db=db, task=task_in, user_id=user_id)
        return db_task
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unable to process task ingestion: {str(e)}"
        )


@router.get(
    "/tasks",
    response_model=List[schemas.TaskResponse],
    tags=["Tasks"],
    summary="List tasks categorized by visual urgency score"
)
def list_tasks_endpoint(
    user_id: Optional[int] = 1,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Fetches user commitments sorted descending by dynamic AI Urgency scores and nearest deadlines.
    """
    tasks = crud.get_tasks(db=db, user_id=user_id, skip=skip, limit=limit)
    return tasks


@router.get(
    "/tasks/{id}",
    response_model=schemas.TaskResponse,
    tags=["Tasks"],
    summary="Get single task details"
)
def get_task_endpoint(id: int, db: Session = Depends(get_db)):
    """
    Resolves an active task by database identity, pulling nested schedules, alert channels, and previous AI plans.
    """
    db_task = crud.get_task(db=db, task_id=id)
    if not db_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task commitment {id} not found."
        )
    return db_task


@router.put(
    "/tasks/{id}",
    response_model=schemas.TaskResponse,
    tags=["Tasks"],
    summary="Update task status or deadlines"
)
def update_task_endpoint(
    id: int,
    task_in: schemas.TaskUpdate,
    db: Session = Depends(get_db)
):
    """
    Selectively updates specific parameters of a task (e.g. status status, title adjustments, completion flags).
    """
    db_task = crud.update_task(db=db, task_id=id, task_in=task_in)
    if not db_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task commitment {id} not found."
        )
    return db_task


@router.delete(
    "/tasks/{id}",
    tags=["Tasks"],
    summary="Delete a task and its configurations"
)
def delete_task_endpoint(id: int, db: Session = Depends(get_db)):
    """
    Purges a task from database records. Cascades wipe active notifications and allocated schedules.
    """
    success = crud.delete_task(db=db, task_id=id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task commitment {id} not found."
        )
    return {"status": "success", "message": f"Successfully deleted task {id}."}


# =============================================================================
# COGNITIVE AI REST ENDPOINTS
# =============================================================================

class PrioritizeRequest(BaseModel):
    """Payload to pass custom task dictionary representations for evaluation."""
    tasks: List[Dict[str, Any]]


class ScheduleRequest(BaseModel):
    """Payload to feed scheduler available bounds and workload details."""
    tasks: List[Dict[str, Any]]
    start_date_iso: str
    end_date_iso: str


class ActionPlanRequest(BaseModel):
    """Payload to request executive function first step plans."""
    title: str
    description: Optional[str] = None
    time_limit_minutes: Optional[int] = 60


class ReminderRequestPayload(BaseModel):
    """Payload specifying inputs to build progressive warning profiles."""
    title: str
    time_remaining_hours: float
    current_stress_level: Optional[str] = "medium"


@router.post(
    "/ai/prioritize",
    tags=["AI Core Engine"],
    summary="Prioritize conflicting workloads via Gemini models"
)
def ai_prioritize_endpoint(payload: PrioritizeRequest):
    """
    Evaluates conflicting deliverables. Synthesizes urgency scores, risk weights, 
    and returns a clean, step-by-step priority sequence.
    """
    if not payload.tasks:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Minimum of one pending task is required inside prioritize payload."
        )
    
    try:
        ranked_workload = gemini_service.prioritize_tasks(tasks=payload.tasks)
        return ranked_workload
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Gemini API prioritization model failed: {str(e)}"
        )


@router.post(
    "/ai/schedule",
    tags=["AI Core Engine"],
    summary="Generate time-buffered deep work calendars"
)
def ai_schedule_endpoint(payload: ScheduleRequest):
    """
    Assembles a compressed focus schedule. Interleaves 30% safety cushion buffers,
    breaks, and helpful coaching advice to prevent burnout.
    """
    if not payload.tasks:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Tasks array must contain task properties to block calendar windows."
        )
        
    bounds = {
        "start": payload.start_date_iso,
        "end": payload.end_date_iso,
        "daily_limit_hours": 6
    }
    
    try:
        buffered_calendar = gemini_service.generate_schedule(tasks=payload.tasks, available_days_bounds=bounds)
        return buffered_calendar
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Gemini API dynamic scheduler model failed: {str(e)}"
        )


@router.post(
    "/ai/plan",
    tags=["AI Core Engine"],
    summary="Draft frictionless starter plans for a task"
)
def ai_plan_endpoint(payload: ActionPlanRequest):
    """
    Generates a tiny focus sequence. Isolate 2-minute starter triggers to overcome cognitive inertia on a complex task.
    """
    try:
        inertial_antidote = gemini_service.create_action_plan(
            task_title=payload.title,
            description=payload.description,
            time_limit_minutes=payload.time_limit_minutes or 60
        )
        return inertial_antidote
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Gemini API behavioral coordinator failed: {str(e)}"
        )


@router.post(
    "/ai/reminders",
    tags=["AI Core Engine"],
    summary="Set progressive escalated warning reminders"
)
def ai_reminders_endpoint(payload: ReminderRequestPayload):
    """
    Formulates a 3-stage alarm schedule (Calm Nudge -> Warning -> Invasive Panic Action)
    to match the stress and profile of the user.
    """
    try:
        esc_profile = gemini_service.generate_reminder(
            task_title=payload.title,
            time_remaining_hours=payload.time_remaining_hours,
            current_stress_level=payload.current_stress_level or "medium"
        )
        return esc_profile
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Gemini API copywriting system failed: {str(e)}"
        )
