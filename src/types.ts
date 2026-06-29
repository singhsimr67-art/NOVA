// ============================================================================
// COMPLETE TYPE DEFINITIONS FOR NOVA
// ============================================================================

export interface Task {
    id: number;
    user_id: number;
    title: string;
    description: string;
    deadline: string;
    original_deadline: string;
    adjusted_deadline: string;
    estimated_minutes: number;
    estimated_hours: number;
    priority: 'low' | 'medium' | 'high';
    status: 'pending' | 'completed' | 'paused';
    complexity_level: number;
    is_completed: boolean;
    urgency_score: number;
    created_at: string;
    updated_at: string;
}

export interface Reminder {
    id: number;
    task_id: number;
    reminder_time: string;
    trigger_time: string;
    reminder_message: string;
    alert_message: string;
    delivery_status: 'PENDING' | 'SENT' | 'FAILED';
    delivery_channel: 'SMS' | 'EMAIL' | 'PUSH' | 'VOICE';
    escalation_level: 'CALM' | 'WARNING' | 'PANIC';
    sent: boolean;
    snooze_count: number;
    created_at: string;
    updated_at?: string;
}

export interface Milestone {
    step_number: number;
    title: string;
    estimated_minutes: number;
    focus_guideline: string;
}

export interface AIPlan {
    immediate_first_step: string;
    focus_trigger: string;
    parkinsons_cushion_minutes: number;
    suggested_milestones: Milestone[];
}

export interface APIDiagnostic {
    backend_status: 'connected' | 'simulated' | 'error';
    last_check: string;
    response_time_ms: number;
    error_message?: string;
}