"""
Relational models module defining the database schema using SQLAlchemy 2.x.
Ensures strict validation, type hinting, cascading deletions, and comprehensive alignment
between user request attributes and the pre-existing architect specification.
"""

from datetime import datetime, time
from typing import List, Optional
from sqlalchemy import String, Integer, Float, DateTime, Boolean, Text, Time, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class User(Base):
    """
    User entity representing system accounts, timezones, and stress-reduction parameters.
    """
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    
    # Stress protection settings (from developer specs)
    timezone: Mapped[str] = mapped_column(String(50), default="UTC", nullable=False)
    quiet_hours_start: Mapped[Optional[time]] = mapped_column(Time, default=time(22, 0, 0), nullable=True)
    quiet_hours_end: Mapped[Optional[time]] = mapped_column(Time, default=time(7, 0, 0), nullable=True)
    delay_coefficient: Mapped[float] = mapped_column(Float, default=1.0, nullable=False) # Historical procrastination offset
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    # Ensures deleting a user completely purges all associated downstream records without leaving orphans.
    tasks: Mapped[List["Task"]] = relationship(
        "Task", 
        back_populates="user", 
        cascade="all, delete-orphan",
        passive_deletes=True
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} username={self.username!r} email={self.email!r}>"


class Task(Base):
    """
    Task entity tracking user commitments, Parkinson's Law cushions, and calculated urgency.
    """
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, 
        ForeignKey("users.id", ondelete="CASCADE"), 
        nullable=False
    )
    
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Deadlines (supports user prompt 'deadline' and data.ts 'original_deadline' / 'adjusted_deadline')
    deadline: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    original_deadline: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    adjusted_deadline: Mapped[datetime] = mapped_column(DateTime, nullable=False) # Visual safety cushion
    
    # Efforts (supports both formats to reconcile task engine calculations)
    estimated_minutes: Mapped[int] = mapped_column(Integer, default=60, nullable=False)
    estimated_hours: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    
    # Priority & Status classifications
    priority: Mapped[str] = mapped_column(String(30), default="medium", nullable=False) # high, medium, low
    status: Mapped[str] = mapped_column(String(30), default="pending", nullable=False) # pending, completed, in_progress
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Advanced AI priority weights
    complexity_level: Mapped[int] = mapped_column(Integer, default=1, nullable=False) # 1 - 5 target
    urgency_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="tasks")
    
    schedules: Mapped[List["ScheduleWindow"]] = relationship(
        "ScheduleWindow", 
        back_populates="task", 
        cascade="all, delete-orphan",
        passive_deletes=True
    )
    reminders: Mapped[List["Reminder"]] = relationship(
        "Reminder", 
        back_populates="task", 
        cascade="all, delete-orphan",
        passive_deletes=True
    )
    ai_analyses: Mapped[List["AIAnalysis"]] = relationship(
        "AIAnalysis", 
        back_populates="task", 
        cascade="all, delete-orphan",
        passive_deletes=True
    )

    def __repr__(self) -> str:
        return f"<Task id={self.id} title={self.title!r} status={self.status!r} urgency_score={self.urgency_score}>"


class ScheduleWindow(Base):
    """
    ScheduleWindow represents allocated focused blocks of deep work to prevent procrastination.
    """
    __tablename__ = "schedule_windows"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    task_id: Mapped[int] = mapped_column(
        Integer, 
        ForeignKey("tasks.id", ondelete="CASCADE"), 
        nullable=False
    )
    
    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    is_buffer_zone: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_locked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    task: Mapped["Task"] = relationship("Task", back_populates="schedules")

    def __repr__(self) -> str:
        return f"<ScheduleWindow id={self.id} task_id={self.task_id} start={self.start_time} end={self.end_time}>"


class Reminder(Base):
    """
    Reminder registers passive timer wakeups and proactive alarm notifications with channels escalations.
    """
    __tablename__ = "reminders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    task_id: Mapped[int] = mapped_column(
        Integer, 
        ForeignKey("tasks.id", ondelete="CASCADE"), 
        nullable=False
    )
    
    # Reminder timing variables (user and system dual-channel mapping)
    reminder_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    trigger_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    
    # Message payloads
    reminder_message: Mapped[str] = mapped_column(Text, nullable=False)
    alert_message: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Delivery Status constraints
    sent: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    delivery_status: Mapped[str] = mapped_column(String(30), default="PENDING", nullable=False) # PENDING, SENT, SNOOZED, ESCALATED
    delivery_channel: Mapped[str] = mapped_column(String(30), default="PUSH", nullable=False) # PUSH, SMS, EMAIL
    escalation_level: Mapped[str] = mapped_column(String(30), default="INFO", nullable=False) # INFO, WARNING, PANIC
    snooze_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    task: Mapped["Task"] = relationship("Task", back_populates="reminders")

    def __repr__(self) -> str:
        return f"<Reminder id={self.id} status={self.delivery_status} escalation={self.escalation_level}>"


class AIAnalysis(Base):
    """
    AIAnalysis holds complex data matrices generated by Google Gemini models for deep cognitive analysis.
    """
    __tablename__ = "ai_analyses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    task_id: Mapped[int] = mapped_column(
        Integer, 
        ForeignKey("tasks.id", ondelete="CASCADE"), 
        nullable=False
    )
    
    # Analytical Scores
    urgency_score: Mapped[float] = mapped_column(Float, nullable=False)
    importance_score: Mapped[float] = mapped_column(Float, nullable=False)
    risk_score: Mapped[float] = mapped_column(Float, nullable=False)
    
    # Conceptual Text Outputs
    ai_reasoning: Mapped[str] = mapped_column(Text, nullable=False)
    generated_plan: Mapped[str] = mapped_column(Text, nullable=False) # Stores decomposed 3-step JSON breakdown
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    task: Mapped["Task"] = relationship("Task", back_populates="ai_analyses")

    def __repr__(self) -> str:
        return f"<AIAnalysis id={self.id} task_id={self.task_id} urgency={self.urgency_score}>"


# -----------------------------------------------------------------------------
# Database Indexes optimizing standard daemon search queries
# -----------------------------------------------------------------------------
# Speeds up query processing for uncompleted user tasks during cron runs
Index("idx_tasks_user_uncompleted", Task.user_id, Task.is_completed)
Index("idx_tasks_urgency_desc", Task.urgency_score.desc())

# Speeds up scheduling lookups for windows overlap check
Index("idx_schedules_bounds", ScheduleWindow.start_time, ScheduleWindow.end_time)

# Speeds up active cron checks for scheduled alerts
Index("idx_reminders_trigger", Reminder.trigger_time, Reminder.delivery_status)
