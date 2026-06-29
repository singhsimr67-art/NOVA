export interface FileNode {
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  description: string;
  details?: string;
}

export interface TableColumn {
  name: string;
  type: string;
  constraints: string[];
  description: string;
}

export interface DatabaseTable {
  name: string;
  description: string;
  columns: TableColumn[];
  sqlalchemyModel: string;
  sqliteDdl: string;
}

export interface ServiceLayerDetail {
  id: string;
  name: string;
  purpose: string;
  inputs: string[];
  outputs: string[];
  strategy: string;
  architectureDetails: string;
}

export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  summary: string;
  description: string;
  requestBody?: string;
  responseBody: string;
}

export const FOLDER_STRUCTURE: FileNode = {
  name: "last_minute_saver",
  type: "folder",
  description: "The root Python package for the application containing configuration, API handlers, core scheduling services, database configurations, and LangChain reactive agent logic.",
  children: [
    {
      name: "app",
      type: "folder",
      description: "Application core folder housing all source code directories for modularization.",
      children: [
        {
          name: "main.py",
          type: "file",
          description: "Application entry point. Initializes FastAPI, configures CORS, registers exception handlers, and mounts standard versioned routers.",
          details: `### Responsibilities
- Bootstraps the \`FastAPI\` core app object.
- Instantiates lifetime state managers to prepare database tables and background task daemon loops.
- Sets up central error-handling middleware for SQLite locks, validation errors, and Gemini API connection timeouts.
- Serves as the primary entry point for Uvicorn/Gunicorn production servers.`
        },
        {
          name: "config.py",
          type: "file",
          description: "Global settings manager utilizing Pydantic BaseSettings to handle environment variables, database URLs, secrecy validation, and API rate limits.",
          details: `### Key Design Choices
- Reads configuration directly from system environment variables or local \`.env\` files.
- Uses strict typing for configurations, including encryption keys, API thresholds, and logging overrides.
- Ensures immediate system crash-on-startup if critical keys like \`GEMINI_API_KEY\` or \`DATABASE_URL\` are absent or misconfigured.`
        },
        {
          name: "api",
          type: "folder",
          description: "Houses versioned REST endpoints and Pydantic dependency injections.",
          children: [
            {
              name: "deps.py",
              type: "file",
              description: "FastAPI Dependency Injection container. Provisions database sessions, rate-limit controllers, and decodes JWT tokens for user context extraction.",
              details: `### Injection Mechanics
- \`get_db\`: Yields an active SQLAlchemy session per request and guarantees session closing after responses are flushed.
- \`get_current_user\`: Validates token, queries active \`User\` record, and denies access to unauthenticated sessions.
- \`get_agent_context\`: Instantiates or retrieves transient state for user's LangGraph executive agent.`
            },
            {
              name: "v1",
              type: "folder",
              description: "Version 1 router folder preserving modular endpoint boundaries.",
              children: [
                {
                  name: "router.py",
                  type: "file",
                  description: "Aggregates and tags API sub-routers (/tasks, /reminders, /agent, /system) for cleaner code organization.",
                  details: `### Routing Layout
Combines and structures the OpenAPI specification docs:
- \`/tasks\` -> \`v1.tasks.router\`
- \`/reminders\` -> \`v1.reminders.router\`
- \`/agent\` -> \`v1.agents.router\``
                },
                {
                  name: "tasks.py",
                  type: "file",
                  description: "Handlers for creating, listing, updating, and deleting tasks. Triggers proactive scheduling calculations on creation.",
                  details: `### Endpoints Supported
- \`GET /\`: Fetches task list with dynamic SQL filtering on completed status and urgency score thresholds.
- \`POST /ingest\`: Implements heavy AI ingestion designed to parse natural, chaotic descriptions into distinct sub-tasks.
- \`PATCH /{id}\`: Performs inline adjustments to custom priority modifiers or status flags.`
                },
                {
                  name: "reminders.py",
                  type: "file",
                  description: "Controls proactive alarm setups, escalations, user snooze logs, and channels tracking.",
                  details: `### Notifications Routing
- Allows client apps to register snooze events which dynamically scale downstream warning coefficients.
- Logs delivery channel outcomes (Web Push, Twilio SMS) inside the database state.`
                },
                {
                  name: "agents.py",
                  type: "file",
                  description: "Websocket and REST channels interacting with the active LangChain agent brain. Supports streaming responses.",
                  details: `### Streaming Orchestration
- Stream-enabled endpoint returning server-sent thoughts from LangChain execution stages.
- Enables interactive chat sessions with history context loaded directly from Sqlite state.`
                }
              ]
            }
          ]
        },
        {
          name: "db",
          type: "folder",
          description: "Contains persistence systems, SQLAlchemy engine initializations, and base metadata mappings.",
          children: [
            {
              name: "session.py",
              type: "file",
              description: "Initializes SQLite connection pool. Configures WAL (Write-Ahead Logging) hooks to prevent database locking.",
              details: `### Concurrent Writing Optimization
- Multi-threaded applications writing to SQLite often face \`database is locked\` errors.
- SQLite WAL configuration turns on write-ahead logging:
  - SQLite executes reads directly against shared memory segments while a single write commits to parallel write logs.
  - Generates \`Pragma journal_mode=WAL;\` and \`Pragma synchronous=NORMAL;\` hooks on database session initialization.`
            },
            {
              name: "base_class.py",
              type: "file",
              description: "Base declarative system mapping containing automated attributes such as auto-incremented primary keys, tables naming conventions, and created_at timestamps.",
              details: `### Dynamic Helpers
- Overrides declarative \`__tablename__\` generation to camel_case or snake_case matching model names.
- Attaches unified serialization dictionaries allowing quick casting of schemas to standard dictionaries.`
            },
            {
              name: "models",
              type: "folder",
              description: "SQLAlchemy declarative mapping files representing structural database tables.",
              children: [
                {
                  name: "task.py",
                  type: "file",
                  description: "SQLAlchemy 'tasks' DB table definition. Declares columns for deadline thresholds, inferred complexity, and computed urgency coefficients.",
                  details: `### Attributes Mapped
- Columns: \`id\`, \`user_id\`, \`title\`, \`description\`, \`original_deadline\`, \`adjusted_deadline\`, \`urgency_score\`, \`is_completed\`, \`complexity_level\`.
- Indexes: Single B-Tree index on \`urgency_score\`, Compound index on \`user_id\` + \`is_completed\`.`
                },
                {
                  name: "reminder.py",
                  type: "file",
                  description: "Defines 'reminders' and escalations registry. Stores status logs (PENDING, SENT, SNOOZED, ESCALATED) and channel options.",
                  details: `### State Tracking
- Declares relationship linking reminders to specific backstop parent tasks.
- Column \`escalation_level\` defines warning stage: INFO, Warning, Severe Panic.`
                },
                {
                  name: "user.py",
                  type: "file",
                  description: "User profiles DB schema. Stores timezone variables and custom 'focus block' periods to shield users from sleep-disrupting warnings.",
                  details: `### Sleep Protection Windows
- \`quiet_hours_start\` and \`quiet_hours_end\` dictate low-urgency suppression criteria.
- Proactively buffers panic-level calls, only bypassing restrictions in extreme warnings (e.g., deadline is within 60 minutes).`
                }
              ]
            }
          ]
        },
        {
          name: "services",
          type: "folder",
          description: "Core service boundary separating route handlers from domain execution. Decoupled from framework interfaces.",
          children: [
            {
              name: "task_service.py",
              type: "file",
              description: "Executes ACID compliant tasks manipulations. Contains mathematical algorithms to calculate urgency scores dynamically.",
              details: `### Score Computation Strategy
- Deconstructs Urgency dynamically via:
  $$UrgencyScore = \\frac{Complexity^{1.2} \\times DelayFactor}{TimeRemainingHours + B}$$
- Ingests user behavior factors (e.g., historically how close to deadlines the user completes tasks).`
            },
            {
              name: "scheduling_engine.py",
              type: "file",
              description: "The calendar assembler. Reorganizes open hours into buffered schedule blocks, establishing non-negotiable workspace blocks around upcoming deadlines.",
              details: `### Time-Blocking Algorithm
- Scans user schedule for blank availability.
- Inserts "Deep Work Sessions" paired with tasks, reserving 30% of remaining time as safety margin ("Proactive Elastic Buffers").`
            },
            {
              name: "reminder_service.py",
              type: "file",
              description: "Active timer loop and push dispatcher. Scans upcoming task horizons, triggers alerts, increments warning escalations, and delivers via active gateways.",
              details: `### Escalation Mechanics
- Continuously scans pending reminders.
- Escalates from standard application push alerts up to urgent SMS triggers if critical task milestone targets are ignored for more than 45 minutes.`
            }
          ]
        },
        {
          name: "agents",
          type: "folder",
          description: "LangChain orchestrations, StateGraph logic, custom system prompts, and tool libraries.",
          children: [
            {
              name: "agent.py",
              type: "file",
              description: "Assembles the core agent StateGraph. Coordinates state transitions, handles route decisions, and manages the execution loop.",
              details: `### LangChain StateGraph Wiring
- Defines a cyclic state flow where Gemini output evaluates active tasks state, triggers schema tools sequentially, collects result metadata, and resolves to final summaries.`
            },
            {
              name: "state.py",
              type: "file",
              description: "Defines the custom State dict passing contextual logs, validation issues, tool execution receipts, and active user priorities.",
              details: `### Context Window Protection
- Keeps strict control over length of previous message lists.
- Truncates old tool outputs, preserving high-level summaries to protect token usage limits during multi-turn chats.`
            },
            {
              name: "prompts.py",
              type: "file",
              description: "Consolidates large, structured AI instructions ensuring stress-reducing UI framing, realistic planning, and zero tolerance for default procrastination excuses.",
              details: `### Cognitive Reframing Guardrails
- Instructs Gemini to use calm, supportive language.
- Explicitly warns Gemini NOT to create complex 'analysis paralysis' schedules; instead, enforce single-chunk task starts.
- Dictates rules of Parkinson's Law: tasks expand to fill time available. Proactively slice tasks into shorter, rigid spans.`
            },
            {
              name: "tools",
              type: "folder",
              description: "Pydantic-typed tool adapters registered directly into LangChain's execution engine.",
              children: [
                {
                  name: "task_tools.py",
                  type: "file",
                  description: "Tools for querying tasks in database, auto-creating sub-tasks list, and editing completion milestones.",
                  details: `### Tool Methods
- \`query_tasks_database\`: Inspects deadlines and status context.
- \`add_decomposition_steps\`: Decomposes large tasks into linear, granular checklists.`
                },
                {
                  name: "schedule_tools.py",
                  type: "file",
                  description: "Tools to inspect available calendars, block buffers, and register focused session slots.",
                  details: `### Calendar Manipulation
- \`allocate_deep_work_block\`: Places blocks in availability window.
- \`flag_schedule_collisions\`: Highlights overload days and alerts agent to suggest shifting other low-priority events.`
                },
                {
                  name: "reminder_tools.py",
                  type: "file",
                  description: "Tools allowing the agent to dynamically schedule a proactive warning, register wakeups, or trigger SMS cascades.",
                  details: `### Reminders Hooks
- \`schedule_panic_alarm\`: Bypasses soft timers to place instant reminders if deadline safety criteria fail.`
                }
              ]
            }
          ]
        },
        {
          name: "schemas",
          type: "folder",
          description: "Pydantic schemas dictating type boundaries for data inputs and API responses.",
          children: [
            {
              name: "task.py",
              type: "file",
              description: "Declares TaskCreate, TaskResponse, and TaskUpdate schemas enforcing strong data validation.",
              details: `### Pydantic Validation Constraints
- Validates date boundaries using custom Pydantic decorators (\`@field_validator\`):
  - Guarantees \`original_deadline\` is always in the relative future.
  - Filters out suspicious timeline dates.`
            },
            {
              name: "reminder.py",
              type: "file",
              description: "Input and Output schemas representing alert logs and custom snooze timings config.",
              details: `### Configuration Schemes
- \`SnoozeRequest\`: Encapsulates snooze duration (in minutes) and enforces a ceiling on maximum snooze counts.`
            }
          ]
        }
      ]
    },
    {
      name: "requirements.txt",
      type: "file",
      description: "Lists production and development python dependencies with locked version constraints.",
      details: `### Key Environment Packages
- \`fastapi>=0.110.0\`
- \`uvicorn[standard]>=0.28.0\`
- \`sqlalchemy>=2.0.28\`
- \`pydantic>=2.6.4\`
- \`google-genai>=2.4.0\`
- \`langchain-core>=0.1.30\`
- \`langchain-google-genai>=1.0.1\`
- \`alembic>=1.13.1\`
- \`structlog>=24.1.0\``
    },
    {
      name: "alembic.ini",
      type: "file",
      description: "Alembic deployment properties file configuring metadata paths and output formats for active database migrations.",
      details: `### Migration Targets
- Integrates database connection hooks, pulling \`db_url\` out of Pydantic config to handle smooth SQLite migrations.`
    }
  ]
};

export const DATABASE_TABLES: DatabaseTable[] = [
  {
    name: "users",
    description: "Stores user accounts, profile settings, focus preferences, and quiet periods. Restricting alerts during quiet windows relieves user stress while maintaining safety boundaries.",
    sqliteDdl: `CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    quiet_hours_start TIME DEFAULT '22:00:00',
    quiet_hours_end TIME DEFAULT '07:00:00',
    delay_coefficient REAL DEFAULT 1.0, -- Inferred laziness factor based on historical user delay patterns
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX idx_users_email ON users(email);`,
    sqlalchemyModel: `class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    timezone = Column(String(50), default="UTC", nullable=False)
    quiet_hours_start = Column(Time, default=time(22, 0, 0))
    quiet_hours_end = Column(Time, default=time(7, 0, 0))
    delay_coefficient = Column(Float, default=1.0) # Historical inertia multiplier
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    tasks = relationship("Task", back_populates="user", cascade="all, delete-orphan")`,
    columns: [
      { name: "id", type: "INTEGER", constraints: ["PRIMARY KEY", "AUTOINCREMENT"], description: "Unique identifier for users." },
      { name: "name", type: "VARCHAR(100)", constraints: ["NOT NULL"], description: "The full display name of the user." },
      { name: "email", type: "VARCHAR(255)", constraints: ["NOT NULL", "UNIQUE"], description: "User email address, optimized with custom unique index." },
      { name: "timezone", type: "VARCHAR(50)", constraints: ["NOT NULL", "DEFAULT 'UTC'"], description: "Standard timezone used for relative calculations of cron reminders." },
      { name: "quiet_hours_start", type: "TIME", constraints: ["DEFAULT '22:00:00'"], description: "Local time boundaries suppressing non-emergency warning alerts." },
      { name: "quiet_hours_end", type: "TIME", constraints: ["DEFAULT '07:00:00'"], description: "Local time boundary exiting shielded notifications suppression." },
      { name: "delay_coefficient", type: "REAL", constraints: ["DEFAULT 1.0"], description: "Dynamic index calculated via task performance. Scales countdown equations based on user's past behaviors." }
    ]
  },
  {
    name: "tasks",
    description: "Captures core tasks data, computed panic triggers, hard deadlines, complexities, and estimated hours. Keeps the agent focused on actual deadline risks.",
    sqliteDdl: `CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    original_deadline TIMESTAMP NOT NULL,
    adjusted_deadline TIMESTAMP NOT NULL, -- Proactively shifted ahead of original deadline as safety cushion
    estimated_hours REAL NOT NULL DEFAULT 1.0,
    complexity_level INTEGER NOT NULL DEFAULT 1, -- Inferred complexity 1 (Simple) to 5 (Heavy monolithic)
    urgency_score REAL DEFAULT 0.0, -- Computed Priority metric used to organize user task dashboard
    is_completed BOOLEAN NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX idx_tasks_user_uncompleted ON tasks(user_id, is_completed);
CREATE INDEX idx_tasks_urgency ON tasks(urgency_score DESC);`,
    sqlalchemyModel: `class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    original_deadline = Column(DateTime, nullable=False)
    adjusted_deadline = Column(DateTime, nullable=False) # Visual safety cushion
    estimated_hours = Column(Float, default=1.0, nullable=False)
    complexity_level = Column(Integer, default=1, nullable=False) # 1 - 5 Scale
    urgency_score = Column(Float, default=0.0) # Sorted Priority index
    is_completed = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="tasks")
    schedules = relationship("ScheduleWindow", back_populates="task", cascade="all, delete-orphan")
    reminders = relationship("Reminder", back_populates="task", cascade="all, delete-orphan")`,
    columns: [
      { name: "id", type: "INTEGER", constraints: ["PRIMARY KEY", "AUTOINCREMENT"], description: "Unique task key." },
      { name: "user_id", type: "INTEGER", constraints: ["NOT NULL", "REFERENCES users(id)"], description: "Points to owner, triggers Cascade Delete." },
      { name: "title", type: "VARCHAR(200)", constraints: ["NOT NULL"], description: "Concrete target (e.g., 'Submit Tax Returns')." },
      { name: "description", type: "TEXT", constraints: ["NULLABLE"], description: "Detailed summary. Statically parsed by Gemini to extract individual parts." },
      { name: "original_deadline", type: "TIMESTAMP", constraints: ["NOT NULL"], description: "The actual hard deadline set by teachers, bosses, or commitments." },
      { name: "adjusted_deadline", type: "TIMESTAMP", constraints: ["NOT NULL"], description: "The calculated target, factoring in safety buffers to guarantee completion." },
      { name: "estimated_hours", type: "REAL", constraints: ["DEFAULT 1.0"], description: "Active effort hours required, parsed by AI or hand-tuned." },
      { name: "complexity_level", type: "INTEGER", constraints: ["DEFAULT 1"], description: "Inferred ranking of complexity from 1 to 5. Adjusts urgency multiplier curves." },
      { name: "urgency_score", type: "REAL", constraints: ["DEFAULT 0.0"], description: "Dynamic priority coefficient calculated dynamically across user timelines." }
    ]
  },
  {
    name: "schedule_windows",
    description: "Visual blocks of allocated focus time reserved in the user's availability timeline. Guarantees quiet focus blocks for tasks before chaos spikes.",
    sqliteDdl: `CREATE TABLE schedule_windows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    is_buffer_zone BOOLEAN NOT NULL DEFAULT 0, -- Safety buffer zone protecting deadline margins
    is_locked BOOLEAN NOT NULL DEFAULT 0, -- Prevents automated rescheduling algorithms from overriding slot
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
);
CREATE INDEX idx_schedules_bounds ON schedule_windows(start_time, end_time);`,
    sqlalchemyModel: `class ScheduleWindow(Base):
    __tablename__ = "schedule_windows"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    is_buffer_zone = Column(Boolean, default=False, nullable=False)
    is_locked = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    task = relationship("Task", back_populates="schedules")`,
    columns: [
      { name: "id", type: "INTEGER", constraints: ["PRIMARY KEY", "AUTOINCREMENT"], description: "Unique schedule node identifier." },
      { name: "task_id", type: "INTEGER", constraints: ["NOT NULL", "REFERENCES tasks(id)"], description: "Target task tied to block, Cascade Delete enabled." },
      { name: "start_time", type: "TIMESTAMP", constraints: ["NOT NULL"], description: "Beginning of execution timeline." },
      { name: "end_time", type: "TIMESTAMP", constraints: ["NOT NULL"], description: "Ending target of deep work session." },
      { name: "is_buffer_zone", type: "BOOLEAN", constraints: ["NOT NULL", "DEFAULT 0"], description: "If true, registers a safeguard padding span that cannot be shifted." },
      { name: "is_locked", type: "BOOLEAN", constraints: ["NOT NULL", "DEFAULT 0"], description: "Locks down schedule slots, indicating manual user adjustments." }
    ]
  },
  {
    name: "reminders",
    description: "Handles scheduled alerts, delivery gateways state, snooze counts, and warning transitions. Powers the proactive alarm dispatcher.",
    sqliteDdl: `CREATE TABLE reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    trigger_time TIMESTAMP NOT NULL,
    delivery_status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, SENT, SNOOZED, CANCELLED, ESCALATED
    delivery_channel VARCHAR(30) NOT NULL DEFAULT 'PUSH', -- PUSH, SMS, EMAIL, WEBHOOK
    escalation_level VARCHAR(30) NOT NULL DEFAULT 'INFO', -- INFO, WARNING, PANIC
    snooze_count INTEGER NOT NULL DEFAULT 0,
    alert_message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
);
CREATE INDEX idx_reminders_trigger ON reminders(trigger_time, delivery_status);`,
    sqlalchemyModel: `class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    trigger_time = Column(DateTime, nullable=False)
    delivery_status = Column(String(30), default="PENDING", nullable=False) # Enum validation handled in Pydantic
    delivery_channel = Column(String(30), default="PUSH", nullable=False)
    escalation_level = Column(String(30), default="INFO", nullable=False) # INFO, WARNING, PANIC
    snooze_count = Column(Integer, default=0, nullable=False)
    alert_message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    task = relationship("Task", back_populates="reminders")`,
    columns: [
      { name: "id", type: "INTEGER", constraints: ["PRIMARY KEY", "AUTOINCREMENT"], description: "Unique database representation value." },
      { name: "task_id", type: "INTEGER", constraints: ["NOT NULL", "REFERENCES tasks(id)"], description: "Identifies parent task triggers." },
      { name: "trigger_time", type: "TIMESTAMP", constraints: ["NOT NULL"], description: "The time clock boundary when the alarm firing event is launched." },
      { name: "delivery_status", type: "VARCHAR(30)", constraints: ["NOT NULL", "DEFAULT 'PENDING'"], description: "PENDING -> SENT -> SNOOZED or ESCALATED depending on user interaction pattern." },
      { name: "delivery_channel", type: "VARCHAR(30)", constraints: ["NOT NULL", "DEFAULT 'PUSH'"], description: "Active outlet stream: Web Push notifications, Discord webhook, or direct SMS." },
      { name: "escalation_level", type: "VARCHAR(30)", constraints: ["NOT NULL", "DEFAULT 'INFO'"], description: "Controls psychological threshold of alert text. escalates towards aggressive formats." },
      { name: "snooze_count", type: "INTEGER", constraints: ["NOT NULL", "DEFAULT 0"], description: "Incremental indicator used to trigger channel shifts after limit breaches." }
    ]
  }
];

export const SERVICE_LAYERS: ServiceLayerDetail[] = [
  {
    id: "task_service",
    name: "Task Service (Ingestion & Urgency Engine)",
    purpose: "Handles ACID transaction processes for tasks. Computes dynamic priority matrices based on deadlines combined with inferred complexity and historical inertia parameters.",
    inputs: ["Raw prompt / natural language query", "Database Connection Session (get_db)", "Authenticated User context"],
    outputs: ["Aggregated Task database row", "A checklist of decomposed sub-tasks", "Initial Priority classification"],
    strategy: "Instead of relying on simple chronological sorting, this service runs an underlying calculation analyzing effort metrics. High complexity tasks due in 4 hours will score massively above simple emails due in 2 hours, reflecting cognitive fatigue parameters.",
    architectureDetails: `### Core Execution Lifecycle
1. Ingests crude commands into the \`Gemini Integration Adapter\` (\`parsed_tasks\` endpoint).
2. Sets adjusted deadline variables:
   - For an actual physical deadline $T_d$ and estimated effort duration $E_h$, the adjusted deadline $T_a$ is:
     $$T_a = T_d - \\max(1.5 \\times E_h,\\ 2\\text{ hours})$$
3. Persists records to the SQLite database.
4. Generates a custom task breakdown framework allocating smaller milestones to distribute focus evenly.`
  },
  {
    id: "scheduling_engine",
    name: "Autonomous Scheduling Engine",
    purpose: "Bridges the gap between 'knowing a task exists' and 'actively reserving time to execute it'. Automates block schedulers with flexible focus constraints.",
    inputs: ["Active Task Entity", "Active Calendar / open schedules list", "User focus parameters"],
    outputs: ["Allocated focus windows instances", "Lock indicators", "Reschedule vectors"],
    strategy: "Maintains calendar control for the user by mapping available hours, parsing existing calendar hooks, and injecting unmovable focus sessions. Implements Parkinson's Law countermeasures by setting constrained target blocks.",
    architectureDetails: `### Scheduling Strategy
1. Queries the database for all user events overlapping the milestone.
2. Identifies blocks of free space within the timeline boundary.
3. Automatically reserves "Deep Work" timeslots. Each session is limited to a maximum of 90 minutes to ensure focus.
4. Inserts a rigid **Buffer Warning Block** directly preceding the deadline. If this block is penetrated without task completion, the system executes escalations.`
  },
  {
    id: "reminder_service",
    name: "Proactive Reminder Service",
    purpose: "Checks pending queues, handles snooze events, and executes escalation logic if user ignores task buffers. Guarantees warnings pierce procrastination blocks.",
    inputs: ["SQLite database context", "Timer tick trigger", "SMS / Web Push client tokens"],
    outputs: ["Dispatched messages", "Updated statuses on tables", "Active alert levels escalation"],
    strategy: "Implements adaptive alert frequency feedback. When a user ignores a notification, the frequency increases and the delivery mechanism switches to more invasive pathways.",
    architectureDetails: `### Escalation Mechanics
\`\`\`
[INFO STAGE] -> Push Alert -> User Snoozes
           -> [WARNING STAGE] -> Invasive SMS alert + Dashboard banner -> User Snoozes
                      -> [PANIC STAGE] -> Repeated SMS + Webhook Alert Cascade
\`\`\`
- If highly critical alerts happen during users quiet hours, the service evaluates urgency. If the computed urgency score is above $0.85$, it overrides quiet boundaries to alert user.`
  }
];

export const LANGCHAIN_AGENT = {
  graphNodes: [
    { id: "input_parsing", name: "Input Parser Node", desc: "Ingests raw speech or message text. Decides whether request is a task query, a task creation query, or a schedule adjustment." },
    { id: "agent_brain", name: "Gemini Orchestration Node", desc: "Coordinates tools, references system guidelines, evaluates goals, and outputs target choices." },
    { id: "tools_execution", name: "Action Tools Execution", desc: "Executes Pydantic-mapped python functions, returning database records or API outcomes back to State." },
    { id: "urgency_validator", name: "Safety Valve Check", desc: "Inspects proposed timelines. Overrides inputs if the user underestimates effort or overrides buffer boundaries." },
    { id: "stress_reducer", name: "Context Framer Responder", desc: "Translates technical JSON responses into supportive, stress-reducing, direct task commands." }
  ],
  systemPrompt: `### ROLE DESCRIPTION:
You are "The Last-Minute Life Saver" executive brain. Your design is optimized to combat Parkinson's Law, analysis paralysis, and chaotic overloads. Your voice is calm, deeply supportive, absolutely objective, and highly actionable.

### OPERATIONAL POLICIES:
1. **The Principle of atomic action**: When a user is panicked, NEVER provide a 10-step schedule. Suggest ONE single task they can start within 5 minutes.
2. **The Cushion Mandate**: If a user says "deadline is 10 PM", treat the target deadline as 8 PM. Automatically configure safeguards behind the scenes.
3. **No Bullsh*t Buffer**: If the user sets estimated effort hours that clash with physical timeline constraints (e.g., "5-hour math paper in 3 hours"), IMMEDIATELY invoke escalation triggers and alert user of overload.`,
  tools: [
    {
      name: "task_decomposition_tool",
      description: "Decomposes complex, overwhelming milestones into tiny, highly linear checklist items.",
      pydanticSchema: `class DecompositionArgs(BaseModel):
    task_id: int = Field(..., description="ID of parent task in sqlite table")
    num_steps: int = Field(3, description="Ideal quantity of micro-steps (Max 4 to prevent paralysis)")`
    },
    {
      name: "time_reserve_tool",
      description: "Allocates blocks on calendar space and sets locked buffers before real deadlines.",
      pydanticSchema: `class AllocationArgs(BaseModel):
    task_id: int = Field(..., description="Task ID to plan work session for")
    estimated_duration_hours: float = Field(..., description="Estimated focus span")`
    },
    {
      name: "critical_escalation_trigger_tool",
      description: "Sends high-urgency notifications and bypasses non-alarm boundaries to reach safe states.",
      pydanticSchema: `class EscalationArgs(BaseModel):
    task_id: int = Field(..., description="Task breaching timeline parameters")
    panic_message: str = Field(..., description="Actionable command telling user exact direct step")`
    }
  ]
};

export const GEMINI_INTEGRATION = {
  sdkInitialization: `from google import genai
from google.genai import types

# Standardized full-stack backend initialization patterns
# Initialized lazily inside dependency containers
def get_gemini_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable is not configured")
    return genai.Client(api_key=api_key)
`,
  structuredOutputSchema: `class TaskAnalysisSchema(BaseModel):
    is_task_related: bool = Field(description="True if user text contains task/action targets")
    inferred_title: str = Field(description="Calm, descriptive title of task task")
    implied_deadline_utc: datetime = Field(description="Deduced deadline timestamp")
    estimated_hours: float = Field(description="Calculated logical work requirement in hours")
    subtasks_checklist: list[str] = Field(description="A 3-step actionable breakdown")
    complexity_rank: int = Field(description="Complexity evaluation on scale 1 (Simple) to 5 (Monolithic)")
    panic_score: float = Field(description="Calculated anxiety factor in prompt 0.0 to 1.0")`,
  pipelineCall: `async def parse_user_chaotic_prompt(prompt_text: str, user_tz: str) -> TaskAnalysisSchema:
    client = get_gemini_client()
    
    system_instruction = (
        "Analyze this text to pull structured task schedules. "
        f"Format relative dates based on Timezone: {user_tz}. "
        "Calculate estimated hours conservatively (assume tasks take 50% longer than users predict)."
    )
    
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt_text,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            # Force structured output returning JSON conformant with Pydantic class
            response_mime_type="application/json",
            response_schema=TaskAnalysisSchema,
            temperature=0.1 # Low temp ensures high consistency and predictability
        )
    )
    return TaskAnalysisSchema.model_validate_json(response.text)`,
  fallbackLogic: `### High-Reliability Strategy
1. **HTTP 429 (Rate Limits) Treatment**: Implements exponential backoff with jitter on HTTP queries.
2. **Parsing Fallback**: If Structured JSON parsing fails, the pipeline routes prompt to standard output wrapper, uses regex patterns to pull rough parameters, and defaults to standard fallbacks (1 hour effort, 2-hour shock buffer).
3. **Model Redundancy**: Falls back to previous stable versions if experimental features raise pipeline errors.`
};

export const API_ENDPOINTS: ApiEndpoint[] = [
  {
    method: "POST",
    path: "/api/v1/tasks/ingest",
    summary: "Ingest Chaotic Prompt",
    description: "Accepts chaotic, panicked language from clients. Calls Gemini in Structured JSON mode, deduces parameters, persists task data, and responds with checklists and timelines.",
    requestBody: `{
  "prompt": "I have a chemistry report due tomorrow morning at 8am, haven't even chosen a topic. Also need to collect prescription after.",
  "timezone": "America/New_York"
}`,
    responseBody: `{
  "status": "success",
  "task": {
    "id": 102,
    "user_id": 1,
    "title": "Chemistry Report Ingestion",
    "description": "Topic selection and lab synthesis modeling.",
    "original_deadline": "2026-06-23T08:00:00Z",
    "adjusted_deadline": "2026-06-23T03:00:00Z",
    "estimated_hours": 3.5,
    "complexity_level": 4,
    "urgency_score": 0.94,
    "is_completed": false
  },
  "suggested_steps": [
    "Choose chemistry topic and draft introduction (45m)",
    "Synthesize data and chart final experiments (90m)",
    "Format references and submit draft (45m)"
  ],
  "allocated_windows": [
    {
      "start": "2026-06-22T19:00:00Z",
      "end": "2026-06-22T20:30:00Z",
      "label": "Focus Block 1"
    },
    {
      "start": "2026-06-22T21:30:00Z",
      "end": "2026-06-22T23:00:00Z",
      "label": "Focus Block 2"
    }
  ]
}`
  },
  {
    method: "GET",
    path: "/api/v1/tasks/urgency-matrix",
    summary: "Fetch Custom Urgency Matrix",
    description: "Returns uncompleted tasks arranged in list formats scaled strictly to computed priority scores. Power the main priority user interfaces.",
    responseBody: `{
  "extreme_danger_zone": [
    {
      "id": 102,
      "title": "Chemistry Report Submission",
      "time_remaining_mins": 320,
      "urgency_score": 0.94,
      "adjusted_deadline": "2026-06-23T03:00:00Z"
    }
  ],
  "heavy_horizon": [
    {
      "id": 89,
      "title": "Collect Prescription Refill",
      "time_remaining_mins": 1440,
      "urgency_score": 0.52,
      "adjusted_deadline": "2026-06-23T17:00:00Z"
    }
  ],
  "stable_tasks": []
}`
  },
  {
    method: "POST",
    path: "/api/v1/reminders/{id}/snooze",
    summary: "Snooze Aggressive Alarm",
    description: "Acknowledges a proactive alarm reminder. Increases database snooze counters. If snooze counters cross predetermined thresholds, shifts communication paths to invasive levels.",
    requestBody: `{
  "snooze_duration_minutes": 15
}`,
    responseBody: `{
  "reminder_id": 4099,
  "status": "snoozed",
  "active_escalation_level": "WARNING",
  "snooze_count": 2,
  "next_trigger": "2026-06-22T12:15:00Z",
  "consequence_warning": "Warning: Snoozing once more will trigger Twilio voice escalation and continuous alert sequences."
}`
  },
  {
    method: "POST",
    path: "/api/v1/agent/chat",
    summary: "Interact With Task Agent",
    description: "Enables conversational chat interactions. Accesses user DB context and is powered by state structures inside the LangChain Loop.",
    requestBody: `{
  "message": "I'm feeling really stressed representation, everything is piling up. What single step do I do now?",
  "session_token": "a49f-817c-2b0e"
}`,
    responseBody: `{
  "response": "Breath in. I see you have three tasks pending. Let's ignore everything except the Chemistry Topic selection. I've locked out the next 45 minutes for you. Can you open slide 1 now? I will check on you in 15 minutes.",
  "suggested_task_id": 102,
  "suggested_tool_called": "allocate_deep_work_block",
  "thoughts_trace": [
    "User anxiety levels registered as high. Applying mental containment.",
    "Bypassing task clutter to isolate highest urgency task (ID: 102).",
    "Running allocate_deep_work_block call."
  ]
}`
  }
];
