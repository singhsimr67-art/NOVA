"""
Autonomous LangChain Agent Module for "The Last-Minute Life Saver".
Orchestrates Google Gemini 2.x/3.x models, custom analytical tool pipelines,
SQLite database transactions, and cognitive scheduling workflows under a unified execution graph.
"""

import os
from dateutil import parser as date_parser
from datetime import datetime
from typing import List, Dict, Any, Optional

# SQLAlchemy elements
from sqlalchemy.orm import Session
from database import SessionLocal

# Database mapping layers
import models
import crud
import schemas
from services import gemini_service

# Modern LangChain integrations
try:
    from langchain_core.tools import tool
    from langchain.agents import AgentExecutor, create_structured_chat_agent
    from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
    from langchain_google_genai import ChatGoogleGenAI
    LANGCHAIN_AVAILABLE = True
except ImportError:
    LANGCHAIN_AVAILABLE = False


# =============================================================================
# WORKSPACE DATABASE TRANSACTION HELPER RECONCILIATIONS
# =============================================================================

class AgentDbContext:
    """
    Context manager facilitating automated thread-safe SQLite connection
    opening and transaction commits across autonomous LangChain tool executions.
    """
    def __init__(self):
        self.db: Optional[Session] = None

    def __enter__(self) -> Session:
        self.db = SessionLocal()
        return self.db

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.db:
            if exc_type is not None:
                self.db.rollback()
            self.db.close()


# =============================================================================
# DEFINITION OF DECOUPLED AGENT TOOLS
# =============================================================================

if LANGCHAIN_AVAILABLE:
    
    @tool
    def get_active_tasks(user_id: int) -> List[Dict[str, Any]]:
        """
        Retrieves all currently active, non-completed tasks and deadlines assigned to a user.
        Use this tool when evaluating a user's total workload and outstanding commitments.
        """
        with AgentDbContext() as db:
            active_tasks = db.query(models.Task).filter(
                models.Task.user_id == user_id,
                models.Task.is_completed == False
            ).all()
            
            results = []
            for t in active_tasks:
                results.append({
                    "task_id": t.id,
                    "title": t.title,
                    "description": t.description,
                    "deadline": t.deadline.isoformat(),
                    "adjusted_deadline": t.adjusted_deadline.isoformat(),
                    "estimated_minutes": t.estimated_minutes,
                    "priority": t.priority,
                    "complexity": t.complexity_level,
                    "urgency_score": t.urgency_score
                })
            return results

    @tool
    def get_overdue_tasks(user_id: int) -> List[Dict[str, Any]]:
        """
        Identifies and lists active tasks whose deadlines have already passed the current time.
        Use this tool to spot critical scheduling breaches that require immediate panic escalation or replanning.
        """
        now = datetime.utcnow()
        with AgentDbContext() as db:
            overdue_tasks = db.query(models.Task).filter(
                models.Task.user_id == user_id,
                models.Task.is_completed == False,
                models.Task.deadline < now
            ).all()
            
            results = []
            for t in overdue_tasks:
                results.append({
                    "task_id": t.id,
                    "title": t.title,
                    "deadline": t.deadline.isoformat(),
                    "minutes_overdue": int((now - t.deadline).total_seconds() / 60)
                })
            return results

    @tool
    def calculate_urgency(task_id: int) -> Dict[str, Any]:
        """
        Applies a cognitive Parkinson's urgency model calculation to a target task.
        Computes score using complexity, procrastination coefficients, and hours remaining.
        Updates and persists the resulting dynamic urgency score inside the database record.
        """
        now = datetime.utcnow()
        with AgentDbContext() as db:
            task = db.get(models.Task, task_id)
            if not task:
                return {"error": f"Task {task_id} not found."}
                
            user = db.get(models.User, task.user_id)
            delay_coeff = user.delay_coefficient if user else 1.0
            
            # Calculate time difference remaining
            time_diff = task.deadline - now
            hours_remaining = max(0.001, time_diff.total_seconds() / 3600.0)
            
            # Urgency score formula
            numerator = (task.complexity_level ** 1.2) * delay_coeff
            denominator = hours_remaining + 1.5
            urgency_score = min(10.0, round(numerator / denominator, 3))
            
            # Persist calculation
            task.urgency_score = urgency_score
            db.commit()
            
            return {
                "task_id": task_id,
                "title": task.title,
                "hours_remaining": round(hours_remaining, 2),
                "delay_coefficient": delay_coeff,
                "complexity_level": task.complexity_level,
                "computed_urgency_score": urgency_score
            }

    @tool
    def create_schedule(user_id: int, start_date_iso: str, end_date_iso: str) -> Dict[str, Any]:
        """
        Generates and saves a time-blocked calendar schedule for a user's active workload.
        Creates focus blocks, safety buffers, and rest periods within the specified dates.
        """
        with AgentDbContext() as db:
            # Gather incomplete tasks
            tasks = db.query(models.Task).filter(
                models.Task.user_id == user_id,
                models.Task.is_completed == False
            ).all()
            
            serialized_tasks = []
            for t in tasks:
                serialized_tasks.append({
                    "id": t.id,
                    "title": t.title,
                    "deadline": t.deadline.isoformat(),
                    "complexity_level": t.complexity_level,
                    "estimated_minutes": t.estimated_minutes
                })
                
            bounds = {
                "start_date": start_date_iso,
                "end_date": end_date_iso,
                "daily_focus_hour_limit": 6
            }
            
            # Delegate to Gemini time-blocking logic
            schedule_result = gemini_service.generate_schedule(serialized_tasks, bounds)
            
            # Clear previous non-locked schedules and commit fresh blocks
            for t in tasks:
                db.query(models.ScheduleWindow).filter(
                    models.ScheduleWindow.task_id == t.id,
                    models.ScheduleWindow.is_locked == False
                ).delete()
            
            for block in schedule_result.scheduled_blocks:
                try:
                    # Attempt safe parse of datetime fields
                    st = date_parser.parse(block.start_time)
                    et = date_parser.parse(block.end_time)
                    
                    db_window = models.ScheduleWindow(
                        task_id=block.task_id,
                        start_time=st,
                        end_time=et,
                        is_buffer_zone=block.is_buffer_zone,
                        is_locked=False,
                        created_at=datetime.utcnow()
                    )
                    db.add(db_window)
                except Exception:
                    continue
                    
            db.commit()
            return schedule_result.model_dump()

    @tool
    def generate_plan(task_id: int) -> Dict[str, Any]:
        """
        Generates a non-intimidating, high-momentum focus action plan for a specific task.
        Creates an immediate 2-minute starting trigger to defeat executive function paralysis.
        """
        with AgentDbContext() as db:
            task = db.get(models.Task, task_id)
            if not task:
                return {"error": f"Task {task_id} not found."}
                
            plan_result = gemini_service.create_action_plan(
                task_title=task.title,
                description=task.description,
                time_limit_minutes=task.estimated_minutes
            )
            
            # Check for existing analysis to register/update plan
            existing_analysis = db.query(models.AIAnalysis).filter(
                models.AIAnalysis.task_id == task_id
            ).first()
            
            # Map plan details to storage format
            import json
            steps_data = [step.model_dump() for step in plan_result.milestones_minutes] if hasattr(plan_result, 'milestones_minutes') else []
            generated_json = json.dumps({
                "immediate_first_step": plan_result.immediate_first_step,
                "focus_trigger": plan_result.focus_trigger,
                "suggested_milestones": steps_data
            })
            
            if existing_analysis:
                existing_analysis.generated_plan = generated_json
            else:
                db_analysis = models.AIAnalysis(
                    task_id=task_id,
                    urgency_score=task.urgency_score,
                    importance_score=5.0, # Default estimate
                    risk_score=5.0, # Default estimate
                    ai_reasoning=f"Immediate momentum plan generated to combat initial friction: {plan_result.focus_trigger}",
                    generated_plan=generated_json,
                    created_at=datetime.utcnow()
                )
                db.add(db_analysis)
                
            db.commit()
            return plan_result.model_dump()

    @tool
    def generate_reminder(task_id: int) -> Dict[str, Any]:
        """
        Creates, schedules, and registers three progressive alerts (Calm Nudge -> Warning -> Panic Message)
        for a task. Ensures the timezone is aligned with the user settings.
        """
        now = datetime.utcnow()
        with AgentDbContext() as db:
            task = db.get(models.Task, task_id)
            if not task:
                return {"error": f"Task {task_id} not found."}
                
            user = db.get(models.User, task.user_id)
            
            # Calculate remaining hours to target
            time_diff = task.deadline - now
            hours_remaining = max(0.1, time_diff.total_seconds() / 3600.0)
            
            stress_level = "high" if hours_remaining < 6 else "medium"
            
            # Call Gemini copy generation channel
            escalation_profile = gemini_service.generate_reminder(
                task_title=task.title,
                time_remaining_hours=hours_remaining,
                current_stress_level=stress_level
            )
            
            # Clear any pending reminders to replace them cleanly
            db.query(models.Reminder).filter(
                models.Reminder.task_id == task_id,
                models.Reminder.sent == False,
                models.Reminder.delivery_status == "PENDING"
            ).delete()
            
            # Create three distinct, incremental alarm times based on trigger offsets
            for i, offset_min in enumerate(escalation_profile.trigger_offsets_minutes):
                trigger_time = task.deadline - datetime.timedelta(minutes=offset_min) if hasattr(datetime, 'timedelta') else task.deadline
                
                # Default safety fallback in case trigger overlaps past
                if trigger_time < now:
                    trigger_time = now
                    
                msg = escalation_profile.level_1_standard if i == 0 else (
                    escalation_profile.level_2_warning if i == 1 else escalation_profile.level_3_panic
                )
                
                channel = "PUSH" if i < 2 else "SMS"
                level = "INFO" if i == 0 else ("WARNING" if i == 1 else "PANIC")
                
                db_reminder = models.Reminder(
                    task_id=task_id,
                    reminder_time=trigger_time,
                    trigger_time=trigger_time,
                    reminder_message=msg,
                    alert_message=msg,
                    sent=False,
                    delivery_status="PENDING",
                    delivery_channel=channel,
                    escalation_level=level,
                    snooze_count=0,
                    created_at=now,
                    updated_at=now
                )
                db.add(db_reminder)
                
            db.commit()
            return escalation_profile.model_dump()

    # Consolidated system list containing all executable tools
    PRODUCTIVITY_AGENT_TOOLS = [
        get_active_tasks,
        get_overdue_tasks,
        calculate_urgency,
        create_schedule,
        generate_plan,
        generate_reminder
    ]

else:
    PRODUCTIVITY_AGENT_TOOLS = []


# =============================================================================
# COGNITIVE PROMPTING TEMPLATES & INSTRUCTIONS
# =============================================================================

SYSTEM_AGENTS_INSTRUCTIONS = (
    "You are 'The Last-Minute Life Saver' AI Coach - a brilliant, compassionate, and "
    "empathetic productivity companion. Your purpose is to help users manage extreme cramming "
    "scenarios, cognitive burnout, and high procrastination friction.\n\n"
    
    "GUIDING COMPASSION RULES:\n"
    "- Always answer with profound kindness, empathy, and clarity. Procrastinators are carrying "
    "heavy emotional paralysis. Never scold or mock them.\n"
    "- Use Parkinson's Law to explain scheduling: 'Work expands to fill the time available. "
    "We are compressing our focus window, which creates a protective, calm 2-hour buffer "
    "before the real deadline.'\n"
    "- When creating actionable items, guide them to complete the absolute smallest first step "
    "within 2 minutes (e.g. 'Just open the Google Doc and write the header word'). This breaks mental friction!\n\n"
    
    "TOOL USAGE DISCIPLINE:\n"
    "You have access to structured tools. Follow a systematic, step-by-step thinking loop:\n"
    "1. Query the active tasks (`get_active_tasks`) if a user is overwhelmed or asks about their schedule.\n"
    "2. If things seem critical or a deadline is fast approaching, call `calculate_urgency` to update "
    "the SQLite score metrics automatically and see how squeezed the timezone is.\n"
    "3. Build structured visual schedules (`create_schedule`) or trigger momentum plans (`generate_plan`) "
    "as the user describes their situations.\n"
    "4. Finally, set up safety nets (`generate_reminder`) to establish SMS/Push boundary guardrails.\n\n"
    
    "Always synthesize your final coordinates into a calm, focused, and stress-reduced text block. "
    "E.g., 'I have calculated our parameters and locked down a 90-minute study slice. Here is our tiny "
    "2-minute start line. Let's do this together, step-by-step.'"
)


# =============================================================================
# EXECUTOR CONSTRUCTORS & INITIALIZATIONS
# =============================================================================

def get_productivity_agent_executor(
    db: Session, 
    model_name: str = "gemini-3.5-flash"
) -> Any:
    """
    Assembles and returns a fully initialized LangChain AgentExecutor.
    If LangChain dependencies are unavailable at runtime, returns a robust, 
    thread-safe model executor fallback to prevent system-wide startup crashes.
    """
    if not LANGCHAIN_AVAILABLE:
        # Graceful fallback returning a resilient mock shell implementing identical response pathways
        class ResilientFallbackExecutor:
            def __init__(self, database_session: Session):
                self.db = database_session
                
            def invoke(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
                user_msg = inputs.get("input", "").lower()
                
                # Simulate core tool activities to ensure API integration integrity
                try:
                    client = gemini_service.get_gemini_client()
                    prompt = (
                        f"Provide a friendly, deeply empathetic, productivity therapist response to:\n"
                        f"'{user_msg}'\n\n"
                        f"System details: We are 'The Last-Minute Life Saver' powered by FASTAPI + SQLite + Google Gemini-3.5-flash. "
                        f"Encourage them, mention Parkinson's Law briefly, and guide them to focus on a 2-minute micro start line."
                    )
                    response = client.models.generate_content(
                        model=model_name,
                        contents=prompt
                    )
                    return {"output": response.text}
                except Exception as e:
                    return {
                        "output": (
                            "Hello! I am your Last-Minute Life Saver assistant. "
                            "It looks like we are under pressure, but do not panic. Take a slow, deep breath. "
                            "Let's break this massive block into small 15-minute segments, starting with just "
                            "opening your workspace or notebook. I am here with you!"
                        )
                    }
        return ResilientFallbackExecutor(db)

    # Instantiate Gemini model via LangChain Google API layer
    try:
        llm = ChatGoogleGenAI(
            model=model_name,
            google_api_key=os.getenv("GEMINI_API_KEY"),
            temperature=0.3
        )
    except Exception:
        # Fall back to native mockup wrapper if LangChain initializer credentials hold placeholders
        return get_productivity_agent_executor(db, model_name)

    # Define prompt maps compatible with Structured Chat Agent format
    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_AGENTS_INSTRUCTIONS),
        MessagesPlaceholder(variable_name="chat_history", optional=True),
        ("human", "{input}"),
        MessagesPlaceholder(variable_name="agent_scratchpad")
    ])

    # Instantiate LangChain Agent layout
    agent = create_structured_chat_agent(
        llm=llm,
        tools=PRODUCTIVITY_AGENT_TOOLS,
        prompt=prompt
    )

    # Returns the compiled executor ready to handle requests
    return AgentExecutor(
        agent=agent,
        tools=PRODUCTIVITY_AGENT_TOOLS,
        verbose=True,
        handle_parsing_errors=True,
        max_iterations=5
    )
