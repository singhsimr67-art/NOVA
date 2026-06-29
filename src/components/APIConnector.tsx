import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, Server, Send, AlertCircle, Database, CheckCircle, ShieldAlert } from 'lucide-react';
import { Task, Reminder, AIPlan, APIDiagnostic } from '../types';

export const BACKEND_BASE_URL = 'http://127.0.0.1:8000';

// Mock DB Cache to keep simulated state consistent across calls
const SIMULATED_DB = {
  tasks: [] as Task[],
  reminders: [] as Reminder[],
  plans: {} as Record<number, AIPlan>
};

// Seed simulated DB if empty
const seedSimulatedDB = () => {
  if (SIMULATED_DB.tasks.length === 0) {
    SIMULATED_DB.tasks = [
      {
        id: 101,
        user_id: 1,
        title: "Hackathon Slide Deck Submission",
        description: "Prepare final slide deck for NOVA demo, including architecture layouts, backend database diagrams, and future roadmap.",
        deadline: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(), // 4 hours from now
        original_deadline: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(),
        adjusted_deadline: new Date(Date.now() + 1000 * 60 * 60 * 3).toISOString(), // 3 hours (cushioned)
        estimated_minutes: 90,
        estimated_hours: 1.5,
        priority: 'high',
        status: 'in_progress',
        complexity_level: 4,
        is_completed: false,
        urgency_score: 8.45,
        created_at: new Date().toISOString()
      },
      {
        id: 102,
        user_id: 1,
        title: "Database Index Squeeze & WAL Setup",
        description: "Write SQLAlchemy migrations to activate write-ahead logging (WAL) and index foreign keys on the SQLite relational database.",
        deadline: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(), // 12 hours from now
        original_deadline: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(),
        adjusted_deadline: new Date(Date.now() + 1000 * 60 * 60 * 10).toISOString(),
        estimated_minutes: 45,
        estimated_hours: 0.75,
        priority: 'medium',
        status: 'pending',
        complexity_level: 3,
        is_completed: false,
        urgency_score: 4.12,
        created_at: new Date().toISOString()
      },
      {
        id: 103,
        user_id: 1,
        title: "Buy groceries & dry cleaning",
        description: "Need to grab energy drinks, protein bars, and drop off formal shirts for the presentation.",
        deadline: new Date(Date.now() + 1000 * 60 * 60 * 36).toISOString(), // 36 hours from now
        original_deadline: new Date(Date.now() + 1000 * 60 * 60 * 36).toISOString(),
        adjusted_deadline: new Date(Date.now() + 1000 * 60 * 60 * 30).toISOString(),
        estimated_minutes: 30,
        estimated_hours: 0.5,
        priority: 'low',
        status: 'pending',
        complexity_level: 1,
        is_completed: false,
        urgency_score: 1.25,
        created_at: new Date().toISOString()
      }
    ];

    SIMULATED_DB.reminders = [
      {
        id: 201,
        task_id: 101,
        reminder_time: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
        trigger_time: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
        reminder_message: "👋 Take a slow breath. It is time to work on Hackathon Slide Deck. Open your presentation tab now. Just edit 1 slide.",
        alert_message: "⚠️ Warning: Slide deck is due in less than 4 hours! Let's get 15 minutes of solid focus. Put away social media.",
        delivery_status: 'PENDING',
        delivery_channel: 'PUSH',
        escalation_level: 'INFO',
        sent: false,
        snooze_count: 0,
        created_at: new Date().toISOString()
      },
      {
        id: 202,
        task_id: 101,
        reminder_time: new Date(Date.now() + 1000 * 60 * 90).toISOString(),
        trigger_time: new Date(Date.now() + 1000 * 60 * 90).toISOString(),
        reminder_message: "⚠️ Attention: The Slide Deck cushion deadline is approaching fast. Break your work into 10-minute sprints.",
        alert_message: "🚨 Critical: Slide Deck is dangerously close to buffer breach! Stop scrolling. Initiate focus immediately.",
        delivery_status: 'PENDING',
        delivery_channel: 'SMS',
        escalation_level: 'WARNING',
        sent: false,
        snooze_count: 0,
        created_at: new Date().toISOString()
      },
      {
        id: 203,
        task_id: 101,
        reminder_time: new Date(Date.now() + 1000 * 60 * 180).toISOString(),
        trigger_time: new Date(Date.now() + 1000 * 60 * 180).toISOString(),
        reminder_message: "🚨 Emergency: Slide Deck buffer has collapsed completely! Start immediately to prevent failure.",
        alert_message: "🔥 [NOVA ESCALATION] EMERGENCY ALARM: Put down everything. Open slides. Go live. Every second counts now!",
        delivery_status: 'PENDING',
        delivery_channel: 'SMS',
        escalation_level: 'PANIC',
        sent: false,
        snooze_count: 0,
        created_at: new Date().toISOString()
      }
    ];

    SIMULATED_DB.plans = {
      101: {
        immediate_first_step: "💻 Open your browser, type 'slides.new', and name the presentation 'NOVA Demo Slides'. That's it. Do not write any slides yet.",
        focus_trigger: "🎧 Put on noise-cancelling headphones and play a single fast lofi synth wave loop.",
        parkinsons_cushion_minutes: 30,
        suggested_milestones: [
          { step_number: 1, title: "Title Slide & 3 Problem Statements", estimated_minutes: 15, focus_guideline: "Lock all tabs. Just outline the 3 major productivity traps we are solving." },
          { step_number: 2, title: "Architecture & Tech Stack Layout", estimated_minutes: 20, focus_guideline: "Explain SQLite, FastAPI, and Google Gemini. Insert screenshots of your code." },
          { step_number: 3, title: "Demo Walkthrough Outline & Slide Formatting", estimated_minutes: 20, focus_guideline: "Flesh out the flow of the 3-minute pitch. Add glowing styling." }
        ]
      },
      102: {
        immediate_first_step: "💾 Open your SQLite visual client or terminal and write the raw text 'ALTER TABLE' inside a blank scratchpad file.",
        focus_trigger: "🕯️ Touch your physical notebook, writing down today's goal 'DB WAL ACTIVE' in heavy black ink.",
        parkinsons_cushion_minutes: 15,
        suggested_milestones: [
          { step_number: 1, title: "Verify SQLAlchemy Database Session Connections", estimated_minutes: 10, focus_guideline: "Check database.py connection strings and engine arguments." },
          { step_number: 2, title: "Add SQLite WAL Journal Mode Query Command", estimated_minutes: 15, focus_guideline: "Edit engine parameters to run 'PRAGMA journal_mode=WAL' on session connection connect." },
          { step_number: 3, title: "Test DB Concurrent Ingestion Operations", estimated_minutes: 10, focus_guideline: "Run a simple multi-threaded insert script to confirm WAL speed enhancements." }
        ]
      }
    };
  }
};

seedSimulatedDB();

// Global configuration for our API layer
export let globalForceSimulation = false;
export const setGlobalForceSimulation = (val: boolean) => {
  globalForceSimulation = val;
};

export interface ApiLog {
  timestamp: string;
  method: string;
  url: string;
  status: 'SUCCESS' | 'MOCKED' | 'ERROR';
  details: string;
}

const apiLogsListeners: ((logs: ApiLog[]) => void)[] = [];
let apiLogs: ApiLog[] = [];

const addApiLog = (method: string, url: string, status: 'SUCCESS' | 'MOCKED' | 'ERROR', details: string) => {
  const newLog: ApiLog = {
    timestamp: new Date().toLocaleTimeString(),
    method,
    url,
    status,
    details
  };
  apiLogs = [newLog, ...apiLogs].slice(0, 50);
  apiLogsListeners.forEach(listener => listener(apiLogs));
};

export const subscribeToApiLogs = (listener: (logs: ApiLog[]) => void) => {
  apiLogsListeners.push(listener);
  listener(apiLogs);
  return () => {
    const idx = apiLogsListeners.indexOf(listener);
    if (idx !== -1) apiLogsListeners.splice(idx, 1);
  };
};

// =============================================================================
// API SERVICE HELPERS WITH AUTOMATIC OFFLINE FALLBACKS
// =============================================================================

export const apiService = {
  getTasks: async (): Promise<{ tasks: Task[], simulated: boolean }> => {
    seedSimulatedDB();
    if (globalForceSimulation) {
      addApiLog('GET', `${BACKEND_BASE_URL}/api/tasks`, 'MOCKED', 'Simulated Mode Forced by User settings');
      return { tasks: [...SIMULATED_DB.tasks], simulated: true };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500); // Fail fast

      const res = await fetch(`${BACKEND_BASE_URL}/api/tasks`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      const data = await res.json();
      const formattedTasks = Array.isArray(data) ? data : (data.tasks || []);

      // Update simulated cache to keep in sync
      SIMULATED_DB.tasks = formattedTasks;
      addApiLog('GET', `${BACKEND_BASE_URL}/api/tasks`, 'SUCCESS', `Successfully fetched ${formattedTasks.length} tasks`);
      return { tasks: formattedTasks, simulated: false };
    } catch (err: any) {
      addApiLog('GET', `${BACKEND_BASE_URL}/api/tasks`, 'MOCKED', `Offline fallback: ${err.message || 'Connection Refused'}`);
      return { tasks: [...SIMULATED_DB.tasks], simulated: true };
    }
  },

  createTask: async (payload: Partial<Task>): Promise<{ task: Task, simulated: boolean }> => {
    seedSimulatedDB();

    // Math logic: Urgency Score = (Complexity^1.2 * 1.25) / (HoursRemaining + 1.5)
    const hours = payload.deadline
      ? (new Date(payload.deadline).getTime() - Date.now()) / (1000 * 60 * 60)
      : 4.0;
    const hoursClamped = Math.max(0.1, hours);
    const complexVal = payload.complexity_level || 3;
    const calculatedScore = parseFloat(
      ((Math.pow(complexVal, 1.2) * 1.25) / (hoursClamped + 1.5)).toFixed(3)
    );

    const simulatedNewTask: Task = {
      id: Date.now(),
      user_id: 1,
      title: payload.title || "Untitled Commitment",
      description: payload.description || "",
      deadline: payload.deadline || new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(),
      original_deadline: payload.deadline || new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(),
      adjusted_deadline: new Date(Date.now() + 1000 * 60 * 60 * (hoursClamped * 0.8)).toISOString(), // 20% cushion
      estimated_minutes: payload.estimated_minutes || 60,
      estimated_hours: Number(((payload.estimated_minutes || 60) / 60).toFixed(2)),
      priority: payload.priority || 'medium',
      status: 'pending',
      complexity_level: complexVal,
      is_completed: false,
      urgency_score: Math.min(10, Math.max(0.1, calculatedScore * 10)),
      created_at: new Date().toISOString()
    };

    if (globalForceSimulation) {
      SIMULATED_DB.tasks = [simulatedNewTask, ...SIMULATED_DB.tasks];
      addApiLog('POST', `${BACKEND_BASE_URL}/api/tasks`, 'MOCKED', `Created task locally ID: ${simulatedNewTask.id}`);
      return { task: simulatedNewTask, simulated: true };
    }

    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      const newTask = await res.json();

      SIMULATED_DB.tasks = [newTask, ...SIMULATED_DB.tasks];
      addApiLog('POST', `${BACKEND_BASE_URL}/api/tasks`, 'SUCCESS', `Created live task ID: ${newTask.id}`);
      return { task: newTask, simulated: false };
    } catch (err: any) {
      SIMULATED_DB.tasks = [simulatedNewTask, ...SIMULATED_DB.tasks];
      addApiLog('POST', `${BACKEND_BASE_URL}/api/tasks`, 'MOCKED', `Created locally due to API failure: ${err.message}`);
      return { task: simulatedNewTask, simulated: true };
    }
  },

  updateTask: async (id: number, payload: Partial<Task>): Promise<{ task: Task, simulated: boolean }> => {
    seedSimulatedDB();
    const existingIdx = SIMULATED_DB.tasks.findIndex(t => t.id === id);
    const simulatedUpdated: Task = existingIdx !== -1
      ? { ...SIMULATED_DB.tasks[existingIdx], ...payload }
      : { id, user_id: 1, title: "", deadline: "", original_deadline: "", adjusted_deadline: "", estimated_minutes: 0, estimated_hours: 0, priority: 'medium', status: 'completed', complexity_level: 1, is_completed: true, urgency_score: 0, created_at: "", ...payload };

    if (globalForceSimulation) {
      if (existingIdx !== -1) SIMULATED_DB.tasks[existingIdx] = simulatedUpdated;
      addApiLog('PUT', `${BACKEND_BASE_URL}/api/tasks/${id}`, 'MOCKED', `Updated task state locally`);
      return { task: simulatedUpdated, simulated: true };
    }

    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      const updated = await res.json();
      if (existingIdx !== -1) SIMULATED_DB.tasks[existingIdx] = updated;
      addApiLog('PUT', `${BACKEND_BASE_URL}/api/tasks/${id}`, 'SUCCESS', `Updated task successfully`);
      return { task: updated, simulated: false };
    } catch (err: any) {
      if (existingIdx !== -1) SIMULATED_DB.tasks[existingIdx] = simulatedUpdated;
      addApiLog('PUT', `${BACKEND_BASE_URL}/api/tasks/${id}`, 'MOCKED', `Mocked task update due to error: ${err.message}`);
      return { task: simulatedUpdated, simulated: true };
    }
  },

  deleteTask: async (id: number): Promise<{ success: boolean, simulated: boolean }> => {
    seedSimulatedDB();
    SIMULATED_DB.tasks = SIMULATED_DB.tasks.filter(t => t.id !== id);

    if (globalForceSimulation) {
      addApiLog('DELETE', `${BACKEND_BASE_URL}/api/tasks/${id}`, 'MOCKED', `Deleted task locally`);
      return { success: true, simulated: true };
    }

    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/tasks/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      addApiLog('DELETE', `${BACKEND_BASE_URL}/api/tasks/${id}`, 'SUCCESS', `Deleted task securely`);
      return { success: true, simulated: false };
    } catch (err: any) {
      addApiLog('DELETE', `${BACKEND_BASE_URL}/api/tasks/${id}`, 'MOCKED', `Mock deleted task due to API error: ${err.message}`);
      return { success: true, simulated: true };
    }
  },

  getAIPlan: async (task: Task): Promise<{ plan: AIPlan, simulated: boolean }> => {
    seedSimulatedDB();
    const mockPlan: AIPlan = SIMULATED_DB.plans[task.id] || {
      immediate_first_step: `🎯 Open up a blank scratchpad and type exactly the words: "${task.title}". Focus for 120 seconds.`,
      focus_trigger: "🎧 Take 3 deep breaths, put on focused white noise or binaural music.",
      parkinsons_cushion_minutes: Math.round(task.estimated_minutes * 0.25),
      suggested_milestones: [
        { step_number: 1, title: "Combat initial paralysis & organize materials", estimated_minutes: 10, focus_guideline: "Lock all browser tabs. Retrieve essential materials or templates." },
        { step_number: 2, title: "Heavy execution and raw sprint core drafting", estimated_minutes: Math.round(task.estimated_minutes * 0.6), focus_guideline: "Execute core deliverables without pausing for fine detailing." },
        { step_number: 3, title: "Final submission validation & details formatting", estimated_minutes: Math.round(task.estimated_minutes * 0.25), focus_guideline: "Polish, spellcheck, verify layout rules, and hit submit." }
      ]
    };

    if (globalForceSimulation) {
      addApiLog('POST', `${BACKEND_BASE_URL}/api/ai/plan`, 'MOCKED', `Fetched momentum plan from local cognitive engine`);
      return { plan: mockPlan, simulated: true };
    }

    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/ai/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: task.title,
          description: task.description || "",
          time_limit_minutes: task.estimated_minutes
        })
      });
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      const data = await res.json();

      const parsedPlan: AIPlan = {
        immediate_first_step: data.immediate_first_step || mockPlan.immediate_first_step,
        focus_trigger: data.focus_trigger || mockPlan.focus_trigger,
        parkinsons_cushion_minutes: data.parkinsons_cushion_minutes || mockPlan.parkinsons_cushion_minutes,
        suggested_milestones: data.suggested_milestones || data.milestones_minutes || mockPlan.suggested_milestones
      };

      SIMULATED_DB.plans[task.id] = parsedPlan;
      addApiLog('POST', `${BACKEND_BASE_URL}/api/ai/plan`, 'SUCCESS', `Gemini generated structured milestones`);
      return { plan: parsedPlan, simulated: false };
    } catch (err: any) {
      addApiLog('POST', `${BACKEND_BASE_URL}/api/ai/plan`, 'MOCKED', `API offline. Gemini fallback active: ${err.message}`);
      return { plan: mockPlan, simulated: true };
    }
  },

  getReminders: async (): Promise<{ reminders: Reminder[], simulated: boolean }> => {
    seedSimulatedDB();
    if (globalForceSimulation) {
      addApiLog('GET', `${BACKEND_BASE_URL}/api/reminders`, 'MOCKED', 'Simulated Reminders loaded');
      return { reminders: [...SIMULATED_DB.reminders], simulated: true };
    }

    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/reminders`);
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      const data = await res.json();
      const formattedReminders = Array.isArray(data) ? data : (data.reminders || []);
      SIMULATED_DB.reminders = formattedReminders;
      addApiLog('GET', `${BACKEND_BASE_URL}/api/reminders`, 'SUCCESS', `Fetched ${formattedReminders.length} alarms`);
      return { reminders: formattedReminders, simulated: false };
    } catch (err: any) {
      addApiLog('GET', `${BACKEND_BASE_URL}/api/reminders`, 'MOCKED', `Simulated offline alarms: ${err.message}`);
      return { reminders: [...SIMULATED_DB.reminders], simulated: true };
    }
  },

  snoozeReminder: async (id: number, snoozeDuration: number): Promise<{ reminder: Reminder, simulated: boolean }> => {
    seedSimulatedDB();
    const existingIdx = SIMULATED_DB.reminders.findIndex(r => r.id === id);
    const existing = existingIdx !== -1 ? SIMULATED_DB.reminders[existingIdx] : null;

    const simulatedSnoozed: Reminder = existing
      ? {
        ...existing,
        snooze_count: existing.snooze_count + 1,
        trigger_time: new Date(Date.now() + 1000 * 60 * snoozeDuration).toISOString(),
        delivery_status: 'SNOOZED',
        escalation_level: (existing.snooze_count >= 2) ? 'PANIC' : 'WARNING'
      }
      : {
        id,
        task_id: 101,
        reminder_time: new Date().toISOString(),
        trigger_time: new Date(Date.now() + 1000 * 60 * snoozeDuration).toISOString(),
        reminder_message: "Snoozed alarm",
        alert_message: "Emergency alarm active",
        delivery_status: 'SNOOZED',
        delivery_channel: 'PUSH',
        escalation_level: 'WARNING',
        sent: false,
        snooze_count: 1,
        created_at: new Date().toISOString()
      };

    if (globalForceSimulation) {
      if (existingIdx !== -1) SIMULATED_DB.reminders[existingIdx] = simulatedSnoozed;
      addApiLog('POST', `${BACKEND_BASE_URL}/api/reminders/${id}/snooze`, 'MOCKED', `Snoozed alarm locally by ${snoozeDuration}m`);
      return { reminder: simulatedSnoozed, simulated: true };
    }

    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/v1/reminders/${id}/snooze` || `${BACKEND_BASE_URL}/api/reminders/${id}/snooze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snooze_duration_minutes: snoozeDuration })
      });
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      const updated = await res.json();
      if (existingIdx !== -1) SIMULATED_DB.reminders[existingIdx] = updated;
      addApiLog('POST', `${BACKEND_BASE_URL}/api/reminders/${id}/snooze`, 'SUCCESS', `Snoozed alarm on server`);
      return { reminder: updated, simulated: false };
    } catch (err: any) {
      if (existingIdx !== -1) SIMULATED_DB.reminders[existingIdx] = simulatedSnoozed;
      addApiLog('POST', `${BACKEND_BASE_URL}/api/reminders/${id}/snooze`, 'MOCKED', `Simulated snooze due to API error: ${err.message}`);
      return { reminder: simulatedSnoozed, simulated: true };
    }
  }
};

// =============================================================================
// API CONNECTOR DIAGNOSTIC VISUAL PANEL COMPONENT
// =============================================================================

interface APIConnectorProps {
  onForceSimulateChange?: (forced: boolean) => void;
}

export default function APIConnector({ onForceSimulateChange }: APIConnectorProps) {
  const [diagnostic, setDiagnostic] = useState<APIDiagnostic>({
    url: BACKEND_BASE_URL,
    status: 'testing',
    latency: null,
    lastChecked: new Date().toLocaleTimeString()
  });
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [isForced, setIsForced] = useState(globalForceSimulation);
  const [isPinging, setIsPinging] = useState(false);

  useEffect(() => {
    // Listen to real-time api utility calls
    const unsubscribe = subscribeToApiLogs((updatedLogs) => {
      setLogs(updatedLogs);
    });
    // Run initial diagnostic check
    testConnection();
    return () => unsubscribe();
  }, []);

  const testConnection = async () => {
    setIsPinging(true);
    setDiagnostic(prev => ({ ...prev, status: 'testing' }));
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 seconds timeout limit

      // Check endpoints directly or do a quick get
      const res = await fetch(`${BACKEND_BASE_URL}/api/tasks`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      clearTimeout(timeoutId);

      const endTime = Date.now();
      const latency = endTime - startTime;

      if (res.ok) {
        setDiagnostic({
          url: BACKEND_BASE_URL,
          status: isForced ? 'simulated' : 'connected',
          latency,
          lastChecked: new Date().toLocaleTimeString()
        });
      } else {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
    } catch (err: any) {
      setDiagnostic({
        url: BACKEND_BASE_URL,
        status: 'simulated',
        latency: null,
        lastChecked: new Date().toLocaleTimeString(),
        error: err.message || 'Network Refused / Offline'
      });
    } finally {
      setIsPinging(false);
    }
  };

  const handleToggleForced = () => {
    const nextVal = !isForced;
    setIsForced(nextVal);
    setGlobalForceSimulation(nextVal);
    if (onForceSimulateChange) {
      onForceSimulateChange(nextVal);
    }
    // Update active diagnostic status
    setDiagnostic(prev => ({
      ...prev,
      status: nextVal ? 'simulated' : (prev.latency ? 'connected' : 'simulated')
    }));
    addApiLog('CONFIG', 'Client-Side Routing', 'MOCKED', `Manually toggled forced simulation mode to: ${nextVal}`);
  };

  return (
    <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 shadow-xl backdrop-blur-md space-y-6 text-slate-200">

      {/* Visual Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border ${diagnostic.status === 'connected'
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
            <Server size={18} className={isPinging ? 'animate-pulse' : ''} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">4. NOVA API Connector</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Real-time HTTP integration with error fail-safes</p>
          </div>
        </div>

        <button
          onClick={testConnection}
          disabled={isPinging}
          className="p-2 bg-slate-950/80 hover:bg-slate-900 border border-slate-900 hover:border-slate-800 disabled:opacity-50 text-xs font-mono text-slate-300 hover:text-white rounded-xl transition cursor-pointer flex items-center gap-2 select-none"
        >
          <RefreshCw size={12} className={isPinging ? 'animate-spin' : ''} />
          <span>Ping API</span>
        </button>
      </div>

      {/* Target specs info */}
      <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-900/60 font-mono text-xs space-y-2.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-500">Target Server:</span>
          <span className="text-indigo-400 select-all font-semibold break-all">{diagnostic.url}</span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-500">Integration Status:</span>
          <span className={`font-bold flex items-center gap-1.5 uppercase ${diagnostic.status === 'connected' ? 'text-emerald-400' : 'text-amber-400'
            }`}>
            {diagnostic.status === 'connected' ? (
              <>
                <Wifi size={12} /> Live Deployed Connected
              </>
            ) : (
              <>
                <WifiOff size={12} /> High-Fidelity Simulation fallbacks
              </>
            )}
          </span>
        </div>
        {diagnostic.latency !== null && (
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Connection Latency:</span>
            <span className="text-emerald-400 font-bold">{diagnostic.latency} ms</span>
          </div>
        )}
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-500">Last Verified:</span>
          <span className="text-slate-400">{diagnostic.lastChecked}</span>
        </div>
        {diagnostic.error && !isForced && (
          <div className="text-[10px] text-rose-400/90 border border-rose-500/10 bg-rose-500/5 p-2 rounded-xl flex items-start gap-2 leading-relaxed mt-2">
            <ShieldAlert size={14} className="shrink-0 mt-0.5" />
            <span>Connection check failed: {diagnostic.error}. Switched seamlessly to Offline Fallback simulation.</span>
          </div>
        )}
      </div>

      {/* Manual Switcher Force simulation override */}
      <div className="p-4 bg-slate-950/20 border border-slate-900/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-slate-300 block">Offline Mode Simulation Toggles</span>
          <span className="text-[10px] text-slate-500 mt-0.5 block leading-normal">
            Force local mock data storage & local math scoring, useful for showcasing offline behavior.
          </span>
        </div>

        <button
          onClick={handleToggleForced}
          className={`px-4 py-2 text-xs font-mono font-bold rounded-xl border transition cursor-pointer shrink-0 select-none ${isForced
            ? 'bg-amber-500/10 text-amber-400 border-amber-500/25 shadow-md shadow-amber-500/5'
            : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-900/60'
            }`}
        >
          {isForced ? 'Simulated Active' : 'Live Mode Requested'}
        </button>
      </div>

      {/* Diagnostic Stream Logs */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Connector Activity logs</span>
          <span className="text-[9px] font-mono text-slate-600">Showing last 4 entries</span>
        </div>

        <div className="bg-slate-950 rounded-2xl border border-slate-900 p-3 h-32 overflow-y-auto space-y-2 font-mono text-[10px] select-text">
          {logs.length === 0 ? (
            <div className="text-slate-600 text-center py-8">
              No API requests logged yet. Trigger tasks sync or ingestion to view activity.
            </div>
          ) : (
            logs.slice(0, 4).map((log, index) => (
              <div key={index} className="pb-1.5 border-b border-slate-900/60 last:border-0 last:pb-0 flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`px-1 rounded font-bold text-[8px] text-white ${log.method === 'GET' ? 'bg-indigo-600' :
                      log.method === 'POST' ? 'bg-emerald-600' :
                        log.method === 'PUT' ? 'bg-amber-600' : 'bg-rose-600'
                      }`}>
                      {log.method}
                    </span>
                    <span className="text-slate-400 font-semibold">{log.url.replace(BACKEND_BASE_URL, '')}</span>
                  </div>
                  <p className="text-slate-500 text-[9px] truncate max-w-[280px] sm:max-w-[400px]">{log.details}</p>
                </div>

                <div className="text-right shrink-0">
                  <span className={`font-bold uppercase text-[8px] px-1.5 py-0.2 rounded ${log.status === 'SUCCESS' ? 'text-emerald-400 bg-emerald-500/5' :
                    log.status === 'MOCKED' ? 'text-amber-400 bg-amber-500/5' : 'text-rose-400 bg-rose-500/5'
                    }`}>
                    {log.status}
                  </span>
                  <div className="text-slate-600 text-[8px] mt-0.5">{log.timestamp}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
