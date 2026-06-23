"""
Pydantic v2 specifications module defining strict DTO request payloads, response serialization structures,
and attribute validation boundaries for "The Last-Minute Life Saver".
"""

from datetime import datetime, time
from typing import List, Optional, Literal
from pydantic import BaseModel, ConfigDict, Field, EmailStr, model_validator, field_validator


# =============================================================================
# USER SCHEMAS
# =============================================================================

class UserBase(BaseModel):
    """Shared base model containing common attribute constraints for a User."""
    username: str = Field(
        ..., 
        min_length=3, 
        max_length=100, 
        pattern=r"^[a-zA-Z0-9_\-]+$", 
        description="Unique alphanumeric username profile handle"
    )
    name: str = Field(..., min_length=1, max_length=100, description="Full human name of user")
    email: str = Field(..., description="Target email contact to dispatch reminders")
    timezone: str = Field(default="UTC", description="IANA Timezone descriptor for user relative clocks")
    quiet_hours_start: Optional[time] = Field(default=time(22, 0, 0), description="Time threshold beginning undisturbed hours")
    quiet_hours_end: Optional[time] = Field(default=time(7, 0, 0), description="Time threshold concluding undisturbed hours")
    delay_coefficient: float = Field(default=1.0, ge=0.5, le=5.0, description="Coefficient representing client procrastination history multiplier")

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, value: str) -> str:
        """Enforces clean basic structural format rule checks on raw incoming email strings."""
        normalized = value.strip().lower()
        if "@" not in normalized or "." not in normalized:
            raise ValueError("Invalid email formatting structure: missing '@' or '.' delimiters")
        return normalized


class UserCreate(UserBase):
    """Payload schema used when registering a new system account."""
    pass


class UserResponse(UserBase):
    """Output serializing DTO schema representing an created/updated User record."""
    model_config = ConfigDict(from_attributes=True)

    id: int = Field(..., description="Unique database identity ID primary key")
    created_at: datetime = Field(..., description="Timestamp marking table generation")
    updated_at: datetime = Field(..., description="Timestamp marking last modification update")


# =============================================================================
# AI ANALYSIS SCHEMAS
# =============================================================================

class AIAnalysisBase(BaseModel):
    """Analytical insights matrix structures evaluated by Google Gemini model API calls."""
    urgency_score: float = Field(..., ge=0.0, le=10.0, description="Urgent scaling index from 0.0 to 10.0")
    importance_score: float = Field(..., ge=0.0, le=10.0, description="Importance scaling index from 0.0 to 10.0")
    risk_score: float = Field(..., ge=0.0, le=10.0, description="Stress factor risk model estimation score")
    ai_reasoning: str = Field(..., min_length=1, description="Structured textual response describing calculated analytical deductions")
    generated_plan: str = Field(..., min_length=1, description="Structured 3-step JSON breakdown of actionable focus sub-tasks")


class AIAnalysisResponse(AIAnalysisBase):
    """Output schema representing an AI evaluation record associated with a Task."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    task_id: int
    created_at: datetime


# =============================================================================
# REMINDER SCHEMAS
# =============================================================================

class ReminderBase(BaseModel):
    """Base fields representing planned cron wakeups and invasive alert messaging blocks."""
    reminder_time: datetime = Field(..., description="Visual user reminder timestamp")
    trigger_time: datetime = Field(..., description="Physical system cron wake up boundary to evaluate buffer targets")
    reminder_message: str = Field(..., max_length=500, description="Primary notice snippet text body")
    alert_message: str = Field(..., max_length=500, description="Escalated alarm warning notice text body")
    delivery_status: Literal["PENDING", "SENT", "SNOOZED", "ESCALATED"] = Field(default="PENDING")
    delivery_channel: Literal["PUSH", "SMS", "EMAIL"] = Field(default="PUSH")
    escalation_level: Literal["INFO", "WARNING", "PANIC"] = Field(default="INFO")


class ReminderCreate(ReminderBase):
    """Payload structure to register individual backstop alerts manually beneath a Task."""
    pass


class ReminderResponse(ReminderBase):
    """Output schema for serializing registered task alarms."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    task_id: int
    sent: bool
    snooze_count: int
    created_at: datetime
    updated_at: datetime


# =============================================================================
# SCHEDULE WINDOW SCHEMAS
# =============================================================================

class ScheduleWindowBase(BaseModel):
    """Schedule fields representing physical time blocks assigned for completing tasks."""
    start_time: datetime = Field(..., description="Boundary indicating begin focus interval block")
    end_time: datetime = Field(..., description="Boundary indicating end focus interval block")
    is_buffer_zone: bool = Field(default=False, description="Flag indicating safety boundary cushion")
    is_locked: bool = Field(default=False, description="Flag signaling non-interactive calendar space")


class ScheduleWindowResponse(ScheduleWindowBase):
    """Output schema listing block properties inside larger task queries."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    task_id: int
    created_at: datetime


# =============================================================================
# TASK SCHEMAS
# =============================================================================

class TaskBase(BaseModel):
    """Shared properties describing users commitments and stress constraints."""
    title: str = Field(..., min_length=1, max_length=200, description="Name or summary descriptive title of commitment")
    description: Optional[str] = Field(default=None, description="Detailed text context surrounding the commitment")
    deadline: datetime = Field(..., description="Physical destination limit target deadline time of task")
    estimated_minutes: int = Field(default=60, ge=1, description="Anticipated focus minutes effort allocation")
    priority: Literal["low", "medium", "high"] = Field(default="medium")
    status: Literal["pending", "completed", "in_progress"] = Field(default="pending")
    complexity_level: int = Field(default=1, ge=1, le=5, description="Effort scaling complexity matrix 1 - 5")


class TaskCreate(TaskBase):
    """
    Payload structure parsed when receiving client requests to ingest a commitment.
    Includes custom parsing logic that supports both standard and cushioned attributes.
    """
    # Pre-allocation hooks to override computed elements is made simple via optional parameters:
    original_deadline: Optional[datetime] = Field(default=None, description="Physical task target deadline")
    adjusted_deadline: Optional[datetime] = Field(default=None, description="Task deadline with buffer parameters applied")
    estimated_hours: Optional[float] = Field(default=None, description="Calculated task effort representation in hours")

    @model_validator(mode="after")
    def compute_defaults_and_hours(self) -> "TaskCreate":
        """
        Validates target parameters and computes effort hour representations automatically
        if missing, enforcing data normalization before routing payload values to SQL models.
        """
        # Ensure hours match minutes calculation
        if self.estimated_hours is None:
            self.estimated_hours = round(self.estimated_minutes / 60.0, 3)

        # Fallback missing base elements
        if self.original_deadline is None:
            self.original_deadline = self.deadline
        if self.adjusted_deadline is None:
            self.adjusted_deadline = self.deadline

        return self


class TaskUpdate(BaseModel):
    """Payload schema allowing flexible updating of task commitment metrics."""
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = Field(default=None)
    deadline: Optional[datetime] = Field(default=None)
    estimated_minutes: Optional[int] = Field(default=None, ge=1)
    priority: Optional[Literal["low", "medium", "high"]] = Field(default=None)
    status: Optional[Literal["pending", "completed", "in_progress"]] = Field(default=None)
    is_completed: Optional[bool] = Field(default=None)
    complexity_level: Optional[int] = Field(default=None, ge=1, le=5)
    
    # Internal updates
    adjusted_deadline: Optional[datetime] = Field(default=None)
    urgency_score: Optional[float] = Field(default=None)


class TaskResponse(TaskBase):
    """
    Response serialization format representing deep queries of a Task entity.
    Encapsulates all nested relations of schedules, alert paths, and AI matrices.
    """
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    
    # Target calculations synced
    original_deadline: datetime
    adjusted_deadline: datetime
    estimated_hours: float
    is_completed: bool
    urgency_score: float

    # Timing indices
    created_at: datetime
    updated_at: datetime

    # Hierarchical Relationships list mappings
    schedules: List[ScheduleWindowResponse] = Field(default_factory=list)
    reminders: List[ReminderResponse] = Field(default_factory=list)
    ai_analyses: List[AIAnalysisResponse] = Field(default_factory=list)
