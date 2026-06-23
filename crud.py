"""
Database utility module for "The Last-Minute Life Saver".
Provides production-ready, highly typed CRUD (Create, Read, Update, Delete) methods
fully utilizing SQLAlchemy 2.x patterns, session transactions, and atomic operations.
"""

from typing import List, Optional
from datetime import datetime
from sqlalchemy import select, and_
from sqlalchemy.orm import Session

import models
import schemas


# =============================================================================
# USER CRUD OPERATIONS
# =============================================================================

def get_user(db: Session, user_id: int) -> Optional[models.User]:
    """
    Retrieves a single User account by its database primary key.
    Utilizes SQLAlchemy get() method to leverage session identity maps efficiently.
    """
    return db.get(models.User, user_id)


def get_user_by_username(db: Session, username: str) -> Optional[models.User]:
    """
    Retrieves a user by their unique username handle, optimizing login flows and signup checks.
    """
    statement = select(models.User).where(models.User.username == username)
    return db.execute(statement).scalar_one_or_none()


def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    """
    Retrieves a user by their unique validated email address.
    """
    statement = select(models.User).where(models.User.email == email.strip().lower())
    return db.execute(statement).scalar_one_or_none()


def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[models.User]:
    """
    Fetches a list of registered user records supporting pagination limits.
    """
    statement = select(models.User).offset(skip).limit(limit)
    return list(db.execute(statement).scalars().all())


def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    """
    Registers a new user record within the system database.
    Handles data transfer conversion from validation schemas to active model.
    """
    db_user = models.User(
        username=user.username,
        name=user.name,
        email=user.email,
        timezone=user.timezone,
        quiet_hours_start=user.quiet_hours_start,
        quiet_hours_end=user.quiet_hours_end,
        delay_coefficient=user.delay_coefficient,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


# =============================================================================
# TASK CRUD OPERATIONS
# =============================================================================

def get_task(db: Session, task_id: int) -> Optional[models.Task]:
    """
    Fetches a unique task record by its ID, pulling its physical relationships automatically.
    """
    return db.get(models.Task, task_id)


def get_tasks(
    db: Session, 
    user_id: Optional[int] = None, 
    skip: int = 0, 
    limit: int = 100
) -> List[models.Task]:
    """
    Retrieves configured task records. If user_id is provided, filters queries to
    maintain secure sandboxed scopes. Orders results descending by computational urgency.
    """
    statement = select(models.Task)
    if user_id is not None:
        statement = statement.where(models.Task.user_id == user_id)
    
    # Sort primarily by how urgent the task is modeled, then by immediate date constraints
    statement = statement.order_by(models.Task.urgency_score.desc(), models.Task.adjusted_deadline.asc()).offset(skip).limit(limit)
    return list(db.execute(statement).scalars().all())


def create_task(db: Session, task: schemas.TaskCreate, user_id: int) -> models.Task:
    """
    Creates and records a new task under a specific user session parent.
    Automatically assigns estimated hours and default cushions if left blank.
    """
    # Enforce default effort conversions
    computed_hours = task.estimated_hours if task.estimated_hours is not None else round(task.estimated_minutes / 60.0, 3)
    orig_dl = task.original_deadline if task.original_deadline is not None else task.deadline
    adj_dl = task.adjusted_deadline if task.adjusted_deadline is not None else task.deadline

    db_task = models.Task(
        user_id=user_id,
        title=task.title,
        description=task.description,
        deadline=task.deadline,
        original_deadline=orig_dl,
        adjusted_deadline=adj_dl,
        estimated_minutes=task.estimated_minutes,
        estimated_hours=computed_hours,
        priority=task.priority,
        status=task.status,
        complexity_level=task.complexity_level,
        is_completed=False,
        urgency_score=0.0,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


def update_task(db: Session, task_id: int, task_in: schemas.TaskUpdate) -> Optional[models.Task]:
    """
    Updates specific task options on a target commit without replacing unmodified attributes.
    Updates the overall updated_at timestamp to ensure cache synchronizations.
    """
    db_task = db.get(models.Task, task_id)
    if not db_task:
        return None

    # Parse and transfer updated properties
    update_data = task_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_task, field, value)
        # Mirror boolean completion states to models properties explicitly
        if field == "is_completed":
            db_task.status = "completed" if value else "pending"

    db_task.updated_at = datetime.utcnow()
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


def delete_task(db: Session, task_id: int) -> bool:
    """
    Safely purges a task from SQLite storage. Relational CASCADE configurations
    configured on parent tables natively delete all associated schedule allocation blocks,
    system alarms, and logical AI matrices.
    """
    db_task = db.get(models.Task, task_id)
    if not db_task:
        return False
    
    db.delete(db_task)
    db.commit()
    return True


# =============================================================================
# REMINDER CRUD OPERATIONS
# =============================================================================

def create_reminder(db: Session, reminder: schemas.ReminderCreate, task_id: int) -> models.Reminder:
    """
    Registers an automated alert or escalated notification threshold block linking to a task.
    """
    db_reminder = models.Reminder(
        task_id=task_id,
        reminder_time=reminder.reminder_time,
        trigger_time=reminder.trigger_time,
        reminder_message=reminder.reminder_message,
        alert_message=reminder.alert_message,
        delivery_status=reminder.delivery_status,
        delivery_channel=reminder.delivery_channel,
        escalation_level=reminder.escalation_level,
        sent=False,
        snooze_count=0,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(db_reminder)
    db.commit()
    db.refresh(db_reminder)
    return db_reminder


def get_reminders(
    db: Session, 
    task_id: Optional[int] = None, 
    pending_only: bool = False,
    limit: int = 100
) -> List[models.Reminder]:
    """
    Queries reminders history maps. Toggles filtering based on active send status
    to allow background scheduled notification executors to fetch pending alerts instantly.
    """
    statement = select(models.Reminder)
    conditions = []

    if task_id is not None:
        conditions.append(models.Reminder.task_id == task_id)
    
    if pending_only:
        conditions.append(
            and_(
                models.Reminder.sent == False,
                models.Reminder.delivery_status == "PENDING"
            )
        )

    if conditions:
        statement = statement.where(*conditions)

    statement = statement.order_by(models.Reminder.trigger_time.asc()).limit(limit)
    return list(db.execute(statement).scalars().all())


# =============================================================================
# AI ANALYSIS CRUD OPERATIONS
# =============================================================================

def save_analysis(db: Session, analysis_in: schemas.AIAnalysisBase, task_id: int) -> models.AIAnalysis:
    """
    Saves or updates qualitative AI evaluations associated with a Task object.
    Implements standard upsert logic by removing former maps before pinning fresh records.
    """
    # Look for previous analysis blocks
    prev_statement = select(models.AIAnalysis).where(models.AIAnalysis.task_id == task_id)
    existing_analyses = db.execute(prev_statement).scalars().all()
    
    for old in existing_analyses:
        db.delete(old)
        
    db_analysis = models.AIAnalysis(
        task_id=task_id,
        urgency_score=analysis_in.urgency_score,
        importance_score=analysis_in.importance_score,
        risk_score=analysis_in.risk_score,
        ai_reasoning=analysis_in.ai_reasoning,
        generated_plan=analysis_in.generated_plan,
        created_at=datetime.utcnow()
    )
    db.add(db_analysis)
    db.commit()
    db.refresh(db_analysis)
    return db_analysis


def get_analysis(db: Session, task_id: int) -> Optional[models.AIAnalysis]:
    """
    Fetches the analytical evaluation matrix saved for a given task execution unit.
    """
    statement = select(models.AIAnalysis).where(models.AIAnalysis.task_id == task_id)
    return db.execute(statement).scalar_one_or_none()
