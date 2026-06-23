"""
Google Gemini AI service integration module for "The Last-Minute Life Saver".
Defines predictive prompts and structured JSON schemas to handle cognitive behavioral coaching,
effort calculations, deadline scheduling buffers, and alarm escalation messages.
"""

import os
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# =============================================================================
# PYDANTIC RESPONSE SCHEMAS FOR STRUCTURED GEMINI OUTPUTS
# =============================================================================

class ActionStep(BaseModel):
    """A direct, bite-sized step defining a structured focus interval."""
    step_number: int = Field(..., description="Chronological step number commencing from 1")
    title: str = Field(..., description="Short, non-intimidating title matching the micro-milestone")
    estimated_minutes: int = Field(..., description="Focused duration target (recommending 10-30 minutes)")
    focus_guideline: str = Field(..., description="Instructions to lock out external distractions during this block")


class TaskAnalysisResult(BaseModel):
    """The analytical assessment detailing scores, cognitive reasoning, and plan of action."""
    urgency_score: float = Field(..., description="Calculated urgency index ranging from 0.0 (low) to 10.0 (extreme)")
    importance_score: float = Field(..., description="Inherent value importance ranking from 0.0 to 10.0")
    risk_score: float = Field(..., description="Stress factor calculation projecting risk of missed deadlines from 0.0 to 10.0")
    ai_reasoning: str = Field(..., description="A calm, supportive, cognitive reframing explaining these scores")
    suggested_steps: List[ActionStep] = Field(..., description="Decomposed 3-step action steps to combat inertia")


class TaskPriorityItem(BaseModel):
    """Task metadata paired with ranked urgency mappings."""
    task_id: int = Field(..., description="Original database primary key identifier")
    title: str = Field(..., description="Commitment title")
    urgency_rank: int = Field(..., description="Target scheduled execution rank from 1 (highest priority) onward")
    calculated_urgency: float = Field(..., description="0.0 - 10.0 urgency index mapping relative deadline squeeze")
    risk_weight: float = Field(..., description="Dynamic risk probability coefficient")
    priority_reasoning: str = Field(..., description="Logical reason why this task ranks ahead or behind others")


class TaskPriorityList(BaseModel):
    """Calculated list of tasks ranked relative to deadlines and mental friction."""
    ranked_tasks: List[TaskPriorityItem] = Field(..., description="Collection of tasks sorted by absolute priority")
    overall_strategy: str = Field(..., description="High-level strategic narrative explaining workload scheduling order")


class TimeBlock(BaseModel):
    """Allocated time window structured for deep concentration."""
    task_id: int = Field(..., description="Target task database identifier")
    task_title: str = Field(..., description="Short title of the task")
    start_time: str = Field(..., description="ISO 8601 formatted start timestamp or relative time description")
    end_time: str = Field(..., description="ISO 8601 formatted end timestamp or relative time description")
    is_buffer_zone: bool = Field(..., description="True if this is a protective cushion space guarding the deadline")
    focus_milestone: str = Field(..., description="Singular milestone outcome desired during this block")


class BufferCalendarSchedule(BaseModel):
    """Time-blocked calendar with cushion windows and breaks."""
    scheduled_blocks: List[TimeBlock] = Field(..., description="Ordered schedule windows")
    break_periods: List[str] = Field(..., description="Planned interval gaps designed for cognitive recovery")
    coaching_advice: str = Field(..., description="Coaching thoughts focusing on momentum and stress tolerance")


class ReminderEscalationProfile(BaseModel):
    """Progressive reminders engineered to scale pressure dynamically."""
    level_1_standard: str = Field(..., description="Calm, supportive reminder to nudge focus")
    level_2_warning: str = Field(..., description="Strong warning message emphasizing consequences of failure")
    level_3_panic: str = Field(..., description="Invasive, sleep-supplying bypassing message to trigger immediate start")
    snooze_multiplier: float = Field(..., description="Coefficient modifier specifying snooze limit growth")
    trigger_offsets_minutes: List[int] = Field(..., description="Minutes offset offsets prior to deadline for triggers, e.g. [120, 60, 15]")


class QuickStartPlan(BaseModel):
    """An antidote to executive dysfunction by creating a tiny launch sequence."""
    immediate_first_step: str = Field(..., description="Extremely small action taking under 2 minutes (e.g. 'Turn on computer and open blank tab')")
    milestones_minutes: List[int] = Field(..., description="Chronological duration segments for successive focus bursts")
    parkinsons_cushion_minutes: int = Field(..., description="Minutes of time created by compressing target execution durations")
    focus_trigger: str = Field(..., description="Physical or sensory cue to trigger action immediately (e.g. 'Touch a physical notebook')")


# =============================================================================
# GEMINI CLIENT UTILITIES & LAZY INITIALIZATION
# =============================================================================

_client = None

def get_gemini_client() -> Any:
    """
    Retrieves and lazily instantiates the modern google-genai Client.
    Safely raises RuntimeError if credentials are unset, preventing platform-level startup crashes.
    """
    global _client
    if _client is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key or api_key == "MY_GEMINI_API_KEY":
            raise RuntimeError(
                "GEMINI_API_KEY is not configured or holds default placeholder. "
                "Ensure a valid secret is declared in settings.py or within a .env file."
            )
        
        # Deferred import ensures clean microservice deployments
        try:
            from google import genai
            from google.genai import types
        except ImportError:
            raise ImportError(
                "Unable to load 'google-genai' SDK from runtime. "
                "Ensure 'google-genai' and 'pydantic' libraries are properly installed."
            )
            
        # Instantiate with aistudio-build telemetry headers
        _client = genai.Client(
            api_key=api_key,
            http_options={
                "headers": {
                    "User-Agent": "aistudio-build"
                }
            }
        )
    return _client


# =============================================================================
# SYSTEM-WIDE IMPLEMENTATIONS
# =============================================================================

def analyze_task(
    title: str, 
    description: Optional[str], 
    deadline: datetime, 
    delay_coefficient: float = 1.0,
    model_name: str = "gemini-3.5-flash"
) -> TaskAnalysisResult:
    """
    Ingests raw task details, calculates relative urgency/importance index scores,
    synthesizes calm cognitive-reframing support text, and drafts a structured 3-step action plan.
    
    Arg:
        title: Singular target task title.
        description: Granular details or unstructured context.
        deadline: Exact datetime targeted for task delivery boundaries.
        delay_coefficient: User's historical friction coefficient offset multiplier.
    """
    client = get_gemini_client()
    from google.genai import types

    sys_instruction = (
        "You are an expert cognitive behavioral therapist and task-planning engine. "
        "Your goal is to parse chaotic, stressful deadlines into clear, structured, and "
        "approachable focus targets. You employ Parkinson's Law to eliminate planning "
        "paralysis, framing tasks with extreme kindness and clarity while calculating strict "
        "urgency, importance, and risk metrics."
    )

    prompt = (
        f"Analyze this task commitment details:\n"
        f"- Title: {title}\n"
        f"- Context Details: {description or 'None provided'}\n"
        f"- Hard Deadline: {deadline.isoformat()} UTC\n"
        f"- Procrastination Coefficient: {delay_coefficient:.2f} (values > 1.0 signal historic risk of delay)\n"
        f"- Current Timestamp: {datetime.utcnow().isoformat()} UTC\n"
        f"\n"
        f"Calculate realistic metrics based on hours remaining. Design a 3-step action plan using "
        "extremely specific, low-friction micro-milestones to defeat initial cognitive freeze."
    )

    response = client.models.generate_content(
        model=model_name,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=sys_instruction,
            response_mime_type="application/json",
            response_schema=TaskAnalysisResult,
            temperature=0.2
        )
    )

    # Directly parse the type-safe structured JSON result returned by google-genai response
    return TaskAnalysisResult.model_validate_json(response.text)


def prioritize_tasks(
    tasks: List[Dict[str, Any]], 
    model_name: str = "gemini-3.5-flash"
) -> TaskPriorityList:
    """
    Ranks a set of pending commitments based on remaining timelines, complexity levels,
    and stress profiles to produce an optimized scheduling sequence.
    
    Arg:
        tasks: List of dictionary models representing records to evaluate.
               e.g. [{'id': 1, 'title': 'Prep Pitch Deck', 'deadline': '2026-06-25T12:00', 'complexity': 4}]
    """
    client = get_gemini_client()
    from google.genai import types

    sys_instruction = (
        "You are an elite productivity strategist trained to resolve competing timelines. "
        "Your purpose is to rank a chaotic workload into a strict sequential queue. "
        "Prioritize items with shrinking windows (Parkinson's Law) and high complexity "
        "first, explaining the prioritizations clearly in supportive, direct terms."
    )

    tasks_context = ""
    for idx, t in enumerate(tasks):
        tasks_context += (
            f"[{idx + 1}] Task ID: {t.get('id')}\n"
            f"    - Title: {t.get('title')}\n"
            f"    - Target Deadline: {t.get('deadline')}\n"
            f"    - Complexity Level (1-5): {t.get('complexity_level', 3)}\n"
            f"    - Current Status: {t.get('status', 'pending')}\n\n"
        )

    prompt = (
        f"The current UTC time is {datetime.utcnow().isoformat()} UTC.\n"
        f"Prioritize these pending tasks:\n\n"
        f"{tasks_context}"
        f"Evaluate the relative risk coefficients and deadlines of each commitment. Return the complete ranked list "
        "sorted descendingly, starting with the task that must be started immediately to prevent failure."
    )

    response = client.models.generate_content(
        model=model_name,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=sys_instruction,
            response_mime_type="application/json",
            response_schema=TaskPriorityList,
            temperature=0.1
        )
    )

    return TaskPriorityList.model_validate_json(response.text)


def generate_schedule(
    tasks: List[Dict[str, Any]], 
    available_days_bounds: Dict[str, Any],
    model_name: str = "gemini-3.5-flash"
) -> BufferCalendarSchedule:
    """
    Assembles a time-blocked calendar schedule specifying protective cushion buffers and rest periods around tasks.
    
    Arg:
        tasks: Ranked list of active tasks.
        available_days_bounds: Dict outlining daily focus limitations and start/end times.
    """
    client = get_gemini_client()
    from google.genai import types

    sys_instruction = (
        "You are an assistant calendar time-blocking strategist. Your objective is "
        "to insert critical work blocks into a schedule without causing cognitive burnout. "
        "Every focused unit must be followed by recovery breaks. Keep blocks realistic but "
        "compressed. Label protective buffer days or hours surrounding vital deadlines clearly."
    )

    prompt = (
        f"Configure a structured calendar time-block map.\n"
        f"Available Bounds: {available_days_bounds}\n"
        f"Current UTC Timestamp: {datetime.utcnow().isoformat()} UTC\n"
        f"Tasks to Schedule:\n {tasks}\n\n"
        "Integrate these tasks dynamically into the gaps of available work hours. "
        "Apply a 30% safety cushion buffer where appropriate. Block out clear recuperative "
        "rest periods between intensive work zones."
    )

    response = client.models.generate_content(
        model=model_name,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=sys_instruction,
            response_mime_type="application/json",
            response_schema=BufferCalendarSchedule,
            temperature=0.2
        )
    )

    return BufferCalendarSchedule.model_validate_json(response.text)


def generate_reminder(
    task_title: str, 
    time_remaining_hours: float, 
    current_stress_level: str = "medium",
    model_name: str = "gemini-3.5-flash"
) -> ReminderEscalationProfile:
    """
    Drafts dynamic reminder messages containing variable severity levels, matching the proximity of the target deadline.
    
    Arg:
        task_title: Name of target task.
        time_remaining_hours: Analytical remaining hours vector.
        current_stress_level: User self-logged stress factor setting (low, medium, high).
    """
    client = get_gemini_client()
    from google.genai import types

    sys_instruction = (
        "You are a progressive notification copywriting wizard. Your copy escalates friction "
        "from gentle nudge notifications to direct, loud, and intense warnings based on deadlines. "
        "The language must be supportive at Level 1, alert and challenging at Level 2, and "
        "completely blunt/invasive at Level 3 (avoiding placeholder cliches)."
    )

    prompt = (
        f"Generate notification copy with three distinct escalation stages:\n"
        f"- Target Task: {task_title}\n"
        f"- Hours Remaining until Deadline: {time_remaining_hours:.1f} hours\n"
        f"- Self-rated cognitive overload index: {current_stress_level}\n\n"
        "Draft tailored alerts suited for standard device screen sizes. Stage 3 must include "
        "alarm-bypassing warnings that command immediate physical action (e.g., 'Stop scrolling now, drop everything')."
    )

    response = client.models.generate_content(
        model=model_name,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=sys_instruction,
            response_mime_type="application/json",
            response_schema=ReminderEscalationProfile,
            temperature=0.4
        )
    )

    return ReminderEscalationProfile.model_validate_json(response.text)


def create_action_plan(
    task_title: str, 
    description: Optional[str], 
    time_limit_minutes: int = 60,
    model_name: str = "gemini-3.5-flash"
) -> QuickStartPlan:
    """
    Generates a high-momentum action plan focusing on low starting friction to overcome executive dysfunction.
    
    Arg:
        task_title: Name of target activity.
        description: Contextual description of the problem.
        time_limit_minutes: Desired work block limit (typically 30-90 minutes).
    """
    client = get_gemini_client()
    from google.genai import types

    sys_instruction = (
        "You are a behavioral momentum specialist. Your singular goal is to destroy procrastination "
        "by designing first steps that are so small and frictionless they are logically impossible "
        "to procrastinate (e.g., 'open the app', 'write down one title word'). Compress the milestones "
        "so the tasks fit within Parkinson's Law time limitations."
    )

    prompt = (
        f"Defeat procrastination on the following target task:\n"
        f"- Task: {task_title}\n"
        f"- Detailed Obstacles: {description or 'None provided'}\n"
        f"- Allocated Duration Limit: {time_limit_minutes} minutes\n\n"
        "Decompose this task to secure maximum micro-starts. Provide an actionable sequence starting "
        "with an immediate 2-minute trigger, paired with structured milestones and physical sensory triggers."
    )

    response = client.models.generate_content(
        model=model_name,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=sys_instruction,
            response_mime_type="application/json",
            response_schema=QuickStartPlan,
            temperature=0.3
        )
    )

    return QuickStartPlan.model_validate_json(response.text)
