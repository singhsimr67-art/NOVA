/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Task, Reminder, AIPlan } from '../types';

export const BACKEND_BASE_URL = 'http://127.0.0.1:8000';

// Simulated database cache to preserve state when offline or fallback mode is active
export const SIMULATED_DB = {
    tasks: [
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
            priority: 'high' as const,
            status: 'in_progress' as const,
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
            priority: 'medium' as const,
            status: 'pending' as const,
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
            priority: 'low' as const,
            status: 'pending' as const,
            complexity_level: 1,
            is_completed: false,
            urgency_score: 1.25,
            created_at: new Date().toISOString()
        }
    ] as Task[],
    reminders: [
        {
            id: 201,
            task_id: 101,
            reminder_time: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
            trigger_time: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
            reminder_message: "👋 Take a slow breath. It is time to work on Hackathon Slide Deck. Open your presentation tab now.",
            alert_message: "⚠️ Warning: Slide deck is due in less than 4 hours! Let's get 15 minutes of solid focus. Put away social media.",
            delivery_status: 'PENDING' as const,
            delivery_channel: 'PUSH' as const,
            escalation_level: 'INFO' as const,
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
            delivery_status: 'PENDING' as const,
            delivery_channel: 'SMS' as const,
            escalation_level: 'WARNING' as const,
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
            delivery_status: 'PENDING' as const,
            delivery_channel: 'SMS' as const,
            escalation_level: 'PANIC' as const,
            sent: false,
            snooze_count: 0,
            created_at: new Date().toISOString()
        }
    ] as Reminder[],
    plans: {} as Record<number, AIPlan>
};

// Seed default simulated plans
SIMULATED_DB.plans[101] = {
    immediate_first_step: "💻 Open your browser, type 'slides.new', and name the presentation 'NOVA Demo Slides'. That's it.",
    focus_trigger: "🎧 Put on noise-cancelling headphones and play a single fast lofi synth wave loop.",
    parkinsons_cushion_minutes: 30,
    suggested_milestones: [
        { step_number: 1, title: "Title Slide & 3 Problem Statements", estimated_minutes: 15, focus_guideline: "Lock all tabs. Just outline the 3 major productivity traps we are solving." },
        { step_number: 2, title: "Architecture & Tech Stack Layout", estimated_minutes: 20, focus_guideline: "Explain SQLite, FastAPI, and Google Gemini. Insert screenshots of your code." },
        { step_number: 3, title: "Demo Walkthrough Outline & Slide Formatting", estimated_minutes: 20, focus_guideline: "Flesh out the flow of the 3-minute pitch. Add glowing styling." }
    ]
};

SIMULATED_DB.plans[102] = {
    immediate_first_step: "💾 Open your SQLite visual client or terminal and write the raw text 'ALTER TABLE' inside a blank scratchpad file.",
    focus_trigger: "🕯️ Touch your physical notebook, writing down today's goal 'DB WAL ACTIVE' in heavy black ink.",
    parkinsons_cushion_minutes: 15,
    suggested_milestones: [
        { step_number: 1, title: "Verify SQLAlchemy Database Session Connections", estimated_minutes: 10, focus_guideline: "Check database.py connection strings and engine arguments." },
        { step_number: 2, title: "Add SQLite WAL Journal Mode Query Command", estimated_minutes: 15, focus_guideline: "Edit engine parameters to run 'PRAGMA journal_mode=WAL' on session connection connect." },
        { step_number: 3, title: "Test DB Concurrent Ingestion Operations", estimated_minutes: 10, focus_guideline: "Run a simple multi-threaded insert script to confirm WAL speed enhancements." }
    ]
};

// Global state config for developer overrides
export let globalForceSimulation = false;
export const setGlobalForceSimulation = (val: boolean) => {
    globalForceSimulation = val;
};

// Custom logs stream for diagnostic panels
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

// Helper to estimate hours/minutes remaining to deadline and compute urgency
export function calculateUrgency(task: Partial<Task>): number {
    const deadlineTime = task.deadline ? new Date(task.deadline).getTime() : Date.now() + 1000 * 60 * 60 * 4;
    const hours = (deadlineTime - Date.now()) / (1000 * 60 * 60);
    const hoursClamped = Math.max(0.1, hours);
    const complexity = task.complexity_level || 3;
    // Score = (Complexity^1.2 * 1.25) / (HoursRemaining + 1.5)
    const factor = (Math.pow(complexity, 1.2) * 1.25) / (hoursClamped + 1.5);
    return Math.min(10, Math.max(0.1, factor * 10));
}

// Custom Fetch Wrapper with Robust timeouts and fail-safes
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 4500): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (error: any) {
        clearTimeout(id);
        if (error.name === 'AbortError') {
            throw new Error(`Connection timed out after ${timeoutMs}ms`);
        }
        throw error;
    }
}

// Central API fetch helper
async function request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    body?: any,
    fallbackFn?: () => T
): Promise<{ data: T; simulated: boolean }> {
    const url = `${BACKEND_BASE_URL}${endpoint}`;

    if (globalForceSimulation) {
        if (fallbackFn) {
            addApiLog(method, url, 'MOCKED', 'Developer simulated override active');
            return { data: fallbackFn(), simulated: true };
        }
        throw new Error('Simulation override active with no fallback defined');
    }

    try {
        const options: RequestInit = {
            method,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        };
        if (body) {
            options.body = JSON.stringify(body);
        }

        const res = await fetchWithTimeout(url, options);

        if (res.status === 429) {
            addApiLog(method, url, 'ERROR', 'HTTP 429: Rate limit exceeded on cloud endpoint');
            if (fallbackFn) {
                return { data: fallbackFn(), simulated: true };
            }
            throw new Error('Too many requests. Please slow down and try again later.');
        }

        if (res.status >= 500) {
            addApiLog(method, url, 'ERROR', `HTTP ${res.status}: Deployed backend processing error`);
            if (fallbackFn) {
                return { data: fallbackFn(), simulated: true };
            }
            throw new Error(`Server returned internal error (${res.status})`);
        }

        if (!res.ok) {
            addApiLog(method, url, 'ERROR', `HTTP ${res.status}: Bad request parameters`);
            if (fallbackFn) {
                return { data: fallbackFn(), simulated: true };
            }
            throw new Error(`API returned HTTP status ${res.status}`);
        }

        let parsed: any;
        if (method !== 'DELETE') {
            parsed = await res.json();
        } else {
            parsed = { success: true };
        }

        addApiLog(method, url, 'SUCCESS', `Dispatched API request successfully`);
        return { data: parsed as T, simulated: false };

    } catch (err: any) {
        const errorMsg = err.message || 'Connection refused or DNS resolution failed';
        addApiLog(method, url, 'MOCKED', `Seamless offline bypass initiated: ${errorMsg}`);

        if (fallbackFn) {
            return { data: fallbackFn(), simulated: true };
        }
        throw err;
    }
}

// =============================================================================
// EXPORTED INTEGRATION SERVICES
// =============================================================================
export const apiService = {
    // Tasks Endpoints
    getTasks: async (): Promise<{ tasks: Task[]; simulated: boolean }> => {
        const result = await request<any>('GET', '/api/tasks', undefined, () => {
            return [...SIMULATED_DB.tasks];
        });
        const taskList = Array.isArray(result.data) ? result.data : (result.data.tasks || []);
        // Update local cache for integrity
        if (!result.simulated) {
            SIMULATED_DB.tasks = taskList;
        }
        return { tasks: SIMULATED_DB.tasks, simulated: result.simulated };
    },

    createTask: async (payload: Partial<Task>): Promise<{ task: Task; simulated: boolean }> => {
        const mockTaskCreator = () => {
            const id = Date.now();
            const calculatedScore = calculateUrgency(payload);
            const originalDeadline = payload.deadline || new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString();
            const hours = payload.deadline
                ? (new Date(payload.deadline).getTime() - Date.now()) / (1000 * 60 * 60)
                : 4.0;
            const adjustedDeadline = new Date(Date.now() + 1000 * 60 * 60 * (hours * 0.8)).toISOString(); // 20% cushion

            const newTask: Task = {
                id,
                user_id: 1,
                title: payload.title || 'Untitled Commitment',
                description: payload.description || '',
                deadline: originalDeadline,
                original_deadline: originalDeadline,
                adjusted_deadline: adjustedDeadline,
                estimated_minutes: payload.estimated_minutes || 60,
                estimated_hours: Number(((payload.estimated_minutes || 60) / 60).toFixed(2)),
                priority: payload.priority || 'medium',
                status: 'pending',
                complexity_level: payload.complexity_level || 3,
                is_completed: false,
                urgency_score: parseFloat(calculatedScore.toFixed(3)),
                created_at: new Date().toISOString()
            };

            SIMULATED_DB.tasks = [newTask, ...SIMULATED_DB.tasks];

            // Auto generate reminders in local db for simulated experience
            const infoTime = new Date(Date.now() + 1000 * 60 * 15).toISOString();
            SIMULATED_DB.reminders.push({
                id: Date.now() + 1,
                task_id: id,
                reminder_time: infoTime,
                trigger_time: infoTime,
                reminder_message: `👋 Time to lock focus on "${newTask.title}". Small sessions prevent failure!`,
                alert_message: `🚨 Critical Alert: Buffer is collapsing on "${newTask.title}". Lock down social feeds now.`,
                delivery_status: 'PENDING',
                delivery_channel: 'PUSH',
                escalation_level: 'INFO',
                sent: false,
                snooze_count: 0,
                created_at: new Date().toISOString()
            });

            return newTask;
        };

        const result = await request<Task>('POST', '/api/tasks', payload, mockTaskCreator);
        if (!result.simulated) {
            // Sync list
            const idx = SIMULATED_DB.tasks.findIndex(t => t.id === result.data.id);
            if (idx !== -1) {
                SIMULATED_DB.tasks[idx] = result.data;
            } else {
                SIMULATED_DB.tasks = [result.data, ...SIMULATED_DB.tasks];
            }
        }
        return { task: result.data, simulated: result.simulated };
    },

    updateTask: async (id: number, payload: Partial<Task>): Promise<{ task: Task; simulated: boolean }> => {
        const mockTaskUpdater = () => {
            const idx = SIMULATED_DB.tasks.findIndex(t => t.id === id);
            if (idx === -1) throw new Error('Task not found in local cache');
            const updated = { ...SIMULATED_DB.tasks[idx], ...payload };
            // Re-estimate score if deadline or complexity modified
            if (payload.deadline || payload.complexity_level) {
                updated.urgency_score = parseFloat(calculateUrgency(updated).toFixed(3));
            }
            SIMULATED_DB.tasks[idx] = updated;
            return updated;
        };

        const result = await request<Task>('PUT', `/api/tasks/${id}`, payload, mockTaskUpdater);
        if (!result.simulated) {
            const idx = SIMULATED_DB.tasks.findIndex(t => t.id === id);
            if (idx !== -1) SIMULATED_DB.tasks[idx] = result.data;
        }
        return { task: result.data, simulated: result.simulated };
    },

    deleteTask: async (id: number): Promise<{ success: boolean; simulated: boolean }> => {
        const mockTaskDeleter = () => {
            SIMULATED_DB.tasks = SIMULATED_DB.tasks.filter(t => t.id !== id);
            SIMULATED_DB.reminders = SIMULATED_DB.reminders.filter(r => r.task_id !== id);
            return { success: true };
        };

        const result = await request<{ success: boolean }>('DELETE', `/api/tasks/${id}`, undefined, mockTaskDeleter);
        return { success: result.data.success, simulated: result.simulated };
    },

    // Plan Formulations Endpoints
    generatePlan: async (task: Task): Promise<{ plan: AIPlan; simulated: boolean }> => {
        const mockPlanCreator = () => {
            if (SIMULATED_DB.plans[task.id]) {
                return SIMULATED_DB.plans[task.id];
            }
            const cushionMins = Math.round(task.estimated_minutes * 0.25);
            const generatedPlan: AIPlan = {
                immediate_first_step: `🎯 Create a blank doc or scratchpad and type exactly: "${task.title}". Focus purely for 120 seconds.`,
                focus_trigger: "🎧 Slip on noise-cancelling headphones and stream a binaural audio loop immediately.",
                parkinsons_cushion_minutes: cushionMins > 0 ? cushionMins : 15,
                suggested_milestones: [
                    { step_number: 1, title: "Combat initial friction & outline tasks", estimated_minutes: 10, focus_guideline: "Lock social tabs. List raw bullet points or resources needed." },
                    { step_number: 2, title: "Heavy core execution run", estimated_minutes: Math.round(task.estimated_minutes * 0.6), focus_guideline: "Write code, design slides, or draft content in rapid bursts." },
                    { step_number: 3, title: "Final buffer review & deployment check", estimated_minutes: Math.round(task.estimated_minutes * 0.25), focus_guideline: "Proofread layout details and hit finalize before safety deadline." }
                ]
            };
            SIMULATED_DB.plans[task.id] = generatedPlan;
            return generatedPlan;
        };

        try {
            const result = await request<any>('POST', '/api/ai/plan', {
                title: task.title,
                description: task.description || '',
                time_limit_minutes: task.estimated_minutes
            }, mockPlanCreator);

            if (!result.simulated) {
                const parsedPlan: AIPlan = {
                    immediate_first_step: result.data.immediate_first_step || mockPlanCreator().immediate_first_step,
                    focus_trigger: result.data.focus_trigger || mockPlanCreator().focus_trigger,
                    parkinsons_cushion_minutes: result.data.parkinsons_cushion_minutes || mockPlanCreator().parkinsons_cushion_minutes,
                    suggested_milestones: result.data.suggested_milestones || result.data.milestones || mockPlanCreator().suggested_milestones
                };
                SIMULATED_DB.plans[task.id] = parsedPlan;
                return { plan: parsedPlan, simulated: false };
            }

            return { plan: result.data, simulated: true };
        } catch (err) {
            console.warn('Plan generation failed, using mock fallback:', err);
            return { plan: mockPlanCreator(), simulated: true };
        }
    },

    // Schedules (Stage 2 block calendars)
    generateSchedule: async (taskId: number): Promise<{ success: boolean; simulated: boolean }> => {
        const res = await request<any>('POST', `/api/ai/schedule`, { task_id: taskId }, () => ({ success: true }));
        return { success: !!res.data?.success || true, simulated: res.simulated };
    },

    // Reminders / Escalations - FIXED WITH QUERY PARAMETERS
    getReminders: async (taskId?: number): Promise<{ reminders: Reminder[]; simulated: boolean }> => {
        const params = new URLSearchParams();
        if (taskId !== undefined) {
            params.append('task_id', taskId.toString());
        }
        params.append('active_only', 'true');
        params.append('limit', '100');

        const queryString = params.toString();
        const endpoint = `/api/reminders${queryString ? '?' + queryString : ''}`;

        const result = await request<any>('GET', endpoint, undefined, () => {
            if (taskId !== undefined) {
                return [...SIMULATED_DB.reminders.filter(r => r.task_id === taskId)];
            }
            return [...SIMULATED_DB.reminders];
        });

        const reminderList = Array.isArray(result.data) ? result.data : (result.data.reminders || []);
        if (!result.simulated) {
            SIMULATED_DB.reminders = reminderList;
        }
        return { reminders: SIMULATED_DB.reminders, simulated: result.simulated };
    },

    generateReminders: async (taskId: number): Promise<{ success: boolean; reminders: Reminder[]; simulated: boolean }> => {
        const mockRemindersCreator = () => {
            const infoTime = new Date(Date.now() + 1000 * 60 * 15).toISOString();
            const warnTime = new Date(Date.now() + 1000 * 60 * 60).toISOString();

            const newReminders: Reminder[] = [
                {
                    id: Date.now() + 10,
                    task_id: taskId,
                    reminder_time: infoTime,
                    trigger_time: infoTime,
                    reminder_message: "👋 Ready to initiate your momentum block? Just do 10 minutes.",
                    alert_message: "⚠️ Safe warning: Momentum cushion is expiring shortly. Start executing.",
                    delivery_status: 'PENDING',
                    delivery_channel: 'PUSH',
                    escalation_level: 'INFO',
                    sent: false,
                    snooze_count: 0,
                    created_at: new Date().toISOString()
                },
                {
                    id: Date.now() + 11,
                    task_id: taskId,
                    reminder_time: warnTime,
                    trigger_time: warnTime,
                    reminder_message: "🚨 Danger: Parkinson buffer has collapsed. Initiating warnings.",
                    alert_message: "🚨 Critical Danger Alert: Task has penetrated buffer block. Take immediate focus actions.",
                    delivery_status: 'PENDING',
                    delivery_channel: 'SMS',
                    escalation_level: 'WARNING',
                    sent: false,
                    snooze_count: 0,
                    created_at: new Date().toISOString()
                }
            ];
            SIMULATED_DB.reminders = [...SIMULATED_DB.reminders, ...newReminders];
            return newReminders;
        };

        const result = await request<any>('POST', `/api/reminders/generate`, { task_id: taskId }, mockRemindersCreator);
        return {
            success: true,
            reminders: Array.isArray(result.data) ? result.data : (result.data.reminders || []),
            simulated: result.simulated
        };
    },

    snoozeReminder: async (id: number, snoozeDurationMinutes: number): Promise<{ reminder: Reminder; simulated: boolean }> => {
        const mockSnoozer = () => {
            const idx = SIMULATED_DB.reminders.findIndex(r => r.id === id);
            if (idx === -1) throw new Error('Reminder not found in simulated cache');
            const current = SIMULATED_DB.reminders[idx];
            const snoozeCount = current.snooze_count + 1;

            const updated: Reminder = {
                ...current,
                snooze_count: snoozeCount,
                trigger_time: new Date(Date.now() + 1000 * 60 * snoozeDurationMinutes).toISOString(),
                delivery_status: 'SNOOZED',
                escalation_level: snoozeCount >= 3 ? 'PANIC' : snoozeCount >= 1 ? 'WARNING' : 'INFO',
                alert_message: snoozeCount >= 3
                    ? `🚨 [INVASIVE ESCALATION BYPASS] TWILIO EMERGENCY ALARM ACTIVE: Buffer collapsed completely on task! Acknowledge immediately.`
                    : current.alert_message
            };

            SIMULATED_DB.reminders[idx] = updated;
            return updated;
        };

        const result = await request<Reminder>('POST', `/api/reminders/${id}/snooze`, { snooze_duration_minutes: snoozeDurationMinutes }, mockSnoozer);
        if (!result.simulated) {
            const idx = SIMULATED_DB.reminders.findIndex(r => r.id === id);
            if (idx !== -1) SIMULATED_DB.reminders[idx] = result.data;
        }
        return { reminder: result.data, simulated: result.simulated };
    },

    // Smart Prioritization Sorting
    prioritizeTasks: async (taskList: Task[]): Promise<{ tasks: Task[]; simulated: boolean }> => {
        const sorted = [...taskList].sort((a, b) => b.urgency_score - a.urgency_score);
        return { tasks: sorted, simulated: true };
    }
};