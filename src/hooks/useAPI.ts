/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Task, Reminder, AIPlan } from '../types';
import { apiService } from '../services/api';

export interface UseApiResult {
  tasks: Task[];
  reminders: Reminder[];
  loading: boolean;
  error: string | null;
  simulated: boolean;
  refreshTasks: () => Promise<void>;
  refreshReminders: () => Promise<void>;
  addTask: (payload: Partial<Task>) => Promise<Task>;
  modifyTask: (id: number, payload: Partial<Task>) => Promise<Task>;
  removeTask: (id: number) => Promise<void>;
  getTaskPlan: (task: Task) => Promise<AIPlan>;
  triggerEscalations: (taskId: number) => Promise<void>;
  snoozeAlarm: (id: number, minutes: number) => Promise<Reminder>;
  toggleForceSimulation: (val: boolean) => void;
  isSimulatedMode: boolean;
}

/**
 * Custom React hook for robust, production-ready full-stack state synchronization
 * Features: Loading/error track, auto-retry with exponential backoff, polling synchronizations.
 */
export function useAPI(pollIntervalMs = 5000): UseApiResult {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [simulated, setSimulated] = useState<boolean>(false);
  const [isSimulatedMode, setIsSimulatedMode] = useState<boolean>(false);

  const retryCountRef = useRef<number>(0);
  const maxRetries = 3;
  const pollTimerRef = useRef<any>(null);

  // Core task fetching with auto-retry with exponential backoff
  const refreshTasks = useCallback(async () => {
    try {
      setError(null);
      const res = await apiService.getTasks();
      
      // Sort tasks immediately by urgency_score descending
      const sortedTasks = [...res.tasks].sort((a, b) => b.urgency_score - a.urgency_score);
      setTasks(sortedTasks);
      setSimulated(res.simulated);
      retryCountRef.current = 0; // Reset retry counter on success
    } catch (err: any) {
      console.error('Fetch tasks failed:', err);
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current += 1;
        const delay = Math.pow(2, retryCountRef.current) * 1000; // 2s, 4s, 8s backoff
        console.warn(`Retrying fetch tasks in ${delay}ms (Attempt ${retryCountRef.current}/${maxRetries})`);
        setTimeout(() => refreshTasks(), delay);
      } else {
        setError(err.message || 'Failed to establish stable API link');
        setLoading(false);
      }
    }
  }, []);

  // Fetch active reminders
  const refreshReminders = useCallback(async () => {
    try {
      const res = await apiService.getReminders();
      // Keep only non-sent or active reminders or sort them
      setReminders(res.reminders);
    } catch (err) {
      console.error('Fetch reminders failed:', err);
    }
  }, []);

  // Perform initial bootstrapping with spinner
  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      await Promise.all([refreshTasks(), refreshReminders()]);
      setLoading(false);
    };
    bootstrap();
  }, [refreshTasks, refreshReminders]);

  // Handle active real-time polling synchronization (every 5 seconds)
  useEffect(() => {
    pollTimerRef.current = setInterval(() => {
      refreshTasks();
      refreshReminders();
    }, pollIntervalMs);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [refreshTasks, refreshReminders, pollIntervalMs]);

  // Task operators
  const addTask = useCallback(async (payload: Partial<Task>): Promise<Task> => {
    setLoading(true);
    try {
      setError(null);
      const res = await apiService.createTask(payload);
      // Prepend or merge
      setTasks(prev => {
        const merged = [res.task, ...prev.filter(t => t.id !== res.task.id)];
        return merged.sort((a, b) => b.urgency_score - a.urgency_score);
      });
      refreshReminders(); // fetch fresh reminder chains
      return res.task;
    } catch (err: any) {
      setError(err.message || 'Failed to create task');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refreshReminders]);

  const modifyTask = useCallback(async (id: number, payload: Partial<Task>): Promise<Task> => {
    try {
      setError(null);
      const res = await apiService.updateTask(id, payload);
      setTasks(prev => {
        const idx = prev.findIndex(t => t.id === id);
        if (idx === -1) return prev;
        const updated = [...prev];
        updated[idx] = res.task;
        return updated.sort((a, b) => b.urgency_score - a.urgency_score);
      });
      return res.task;
    } catch (err: any) {
      setError(err.message || 'Failed to update task');
      throw err;
    }
  }, []);

  const removeTask = useCallback(async (id: number): Promise<void> => {
    try {
      setError(null);
      await apiService.deleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
      setReminders(prev => prev.filter(r => r.task_id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete task');
      throw err;
    }
  }, []);

  // AI planners
  const getTaskPlan = useCallback(async (task: Task): Promise<AIPlan> => {
    try {
      const res = await apiService.generatePlan(task);
      return res.plan;
    } catch (err: any) {
      console.error('Plan formulation error:', err);
      throw err;
    }
  }, []);

  // Proactive reminder cascades
  const triggerEscalations = useCallback(async (taskId: number): Promise<void> => {
    try {
      await apiService.generateReminders(taskId);
      await refreshReminders();
    } catch (err) {
      console.error('Triggering reminders failed:', err);
    }
  }, [refreshReminders]);

  // Snoozers
  const snoozeAlarm = useCallback(async (id: number, minutes: number): Promise<Reminder> => {
    try {
      const res = await apiService.snoozeReminder(id, minutes);
      await refreshReminders();
      return res.reminder;
    } catch (err: any) {
      console.error('Snoozing failed:', err);
      throw err;
    }
  }, [refreshReminders]);

  const toggleForceSimulation = useCallback((val: boolean) => {
    // Dynamically override
    import('../services/api').then(module => {
      module.setGlobalForceSimulation(val);
      setIsSimulatedMode(val);
      refreshTasks();
      refreshReminders();
    });
  }, [refreshTasks, refreshReminders]);

  return {
    tasks,
    reminders,
    loading,
    error,
    simulated,
    refreshTasks,
    refreshReminders,
    addTask,
    modifyTask,
    removeTask,
    getTaskPlan,
    triggerEscalations,
    snoozeAlarm,
    toggleForceSimulation,
    isSimulatedMode
  };
}
export default useAPI;
