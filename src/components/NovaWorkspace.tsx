/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Clock,
  AlertTriangle,
  TrendingUp,
  Sparkles,
  Brain,
  Bell,
  Activity,
  Wifi,
  Database,
  ShieldAlert,
  Sliders,
  RefreshCw,
  ListTodo,
  Hourglass,
  Volume2,
  CheckCircle,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Task, Reminder, AIPlan } from '../types';
import APIConnector from './APIConnector';
import TaskForm from './TaskForm';
import TaskList from './TaskList';
import PlanViewer from './PlanViewer';
import RemindersPanel from './RemindersPanel';
import { useAPI } from '../hooks/useAPI';

// Temporary ambient declarations to satisfy TS in environments missing @types/react
// These are file-scoped and minimal; prefer installing @types/react in the project.
declare module 'react/jsx-runtime' {
  export function jsx(...args: any[]): any;
  export function jsxs(...args: any[]): any;
  export function jsxDEV(...args: any[]): any;
}

declare global {
  namespace JSX {
    // allow any intrinsic element to silence 'JSX.IntrinsicElements' missing errors
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

export default function NovaWorkspace() {
  const {
    tasks,
    reminders,
    loading: isLoading,
    error: errorMessage,
    simulated,
    addTask,
    modifyTask,
    removeTask,
    getTaskPlan,
    snoozeAlarm,
    toggleForceSimulation
  } = useAPI();

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activePlan, setActivePlan] = useState<AIPlan | null>(null);
  const [activeAlarm, setActiveAlarm] = useState<Reminder | null>(null);
  const [demoPrompted, setDemoPrompted] = useState(false);

  const apiStatus = simulated ? 'simulated' : 'connected';

  // Auto-select highest urgency task on load
  useEffect(() => {
    if (tasks.length > 0 && !selectedTask) {
      const sorted = [...tasks].sort((a, b) => b.urgency_score - a.urgency_score);
      const topTask = sorted[0];
      setSelectedTask(topTask);
      getTaskPlan(topTask)
        .then(plan => setActivePlan(plan))
        .catch(() => { });
    }
  }, [tasks, selectedTask, getTaskPlan]);

  // Keep selected task in sync
  useEffect(() => {
    if (selectedTask) {
      const freshTask = tasks.find(t => t.id === selectedTask.id);
      if (freshTask && freshTask.is_completed !== selectedTask.is_completed) {
        setSelectedTask(freshTask);
      }
    }
  }, [tasks, selectedTask]);

  // Demo alarm trigger after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!demoPrompted) {
        triggerDemoAlarm();
      }
    }, 8000);
    return () => clearTimeout(timer);
  }, [demoPrompted]);

  const handleSelectTask = async (task: Task) => {
    setSelectedTask(task);
    try {
      const plan = await getTaskPlan(task);
      setActivePlan(plan);
    } catch (err: any) {
      console.warn("Plan formulation returned fallbacks:", err.message);
    }
  };

  const handleIngestTask = async (payload: Partial<Task>) => {
    try {
      const task = await addTask(payload);
      setSelectedTask(task);
      const plan = await getTaskPlan(task);
      setActivePlan(plan);
    } catch (err: any) {
      console.error('Task ingestion failed:', err);
    }
  };

  const handlePanicSpeechIngest = async (panicText: string) => {
    try {
      const extractedTitle = panicText.length > 30 ? panicText.slice(0, 30) + "..." : panicText;
      const task = await addTask({
        title: `Panic Sprint: ${extractedTitle}`,
        description: panicText,
        priority: 'high',
        complexity_level: 5,
        estimated_minutes: 60
      });
      setSelectedTask(task);
      const plan = await getTaskPlan(task);
      setActivePlan(plan);
    } catch (err: any) {
      console.error('Speech NLP ingestion failed:', err);
    }
  };

  const handleGeneratePlan = async (task: Task) => {
    try {
      const plan = await getTaskPlan(task);
      setActivePlan(plan);
    } catch (err: any) {
      console.error('Momentum plan generation failed:', err);
    }
  };

  const handleMarkCompleted = async (task: Task) => {
    try {
      const nextCompleted = !task.is_completed;
      const updated = await modifyTask(task.id, {
        is_completed: nextCompleted,
        status: nextCompleted ? 'completed' : 'pending'
      });
      if (selectedTask?.id === task.id) {
        setSelectedTask(updated);
      }
    } catch (err: any) {
      console.error('Status transition failed:', err);
    }
  };

  const handleDeleteTask = async (id: number) => {
    try {
      await removeTask(id);
      if (selectedTask?.id === id) {
        setSelectedTask(null);
        setActivePlan(null);
      }
    } catch (err: any) {
      console.error('Deletion pipeline failed:', err);
    }
  };

  const handleForceSimulateChange = (forced: boolean) => {
    toggleForceSimulation(forced);
  };

  const handleSnoozeReminder = async (id: number, minutes: number) => {
    try {
      const updatedReminder = await snoozeAlarm(id, minutes);
      if (activeAlarm && activeAlarm.id === id) {
        setActiveAlarm(updatedReminder);
      }
      return updatedReminder;
    } catch (err) {
      console.error('Snooze action failed:', err);
    }
  };

  const triggerDemoAlarm = () => {
    setDemoPrompted(true);
    const demoAlarm: Reminder = {
      id: 999,
      task_id: 101,
      reminder_time: new Date().toISOString(),
      trigger_time: new Date().toISOString(),
      reminder_message: "Warning: Critical Buffer breached!",
      alert_message: "🔥 [NOVA ESCALATION] EMERGENCY ALARM: You are slipping into procrastination on 'Hackathon Slide Deck Submission'. Your 20% Parkinson Safety Cushion has completely collapsed. The deadline is in 4 hours. Start working immediately to secure victory!",
      delivery_status: 'PENDING',
      delivery_channel: 'SMS',
      escalation_level: 'PANIC',
      sent: false,
      snooze_count: 1,
      created_at: new Date().toISOString()
    };
    setActiveAlarm(demoAlarm);
  };

  const activeCount = tasks.filter(t => !t.is_completed).length;
  const criticalCount = tasks.filter(t => !t.is_completed && t.urgency_score >= 8.0).length;
  const maxScore = tasks.length > 0 ? Math.max(...tasks.map(t => t.urgency_score)) : 0.0;
  const pendingAlarms = reminders.filter(r => !r.sent).length;

  return (
    <div className="p-6 md:p-8 max-w-7xl w-full mx-auto space-y-8 text-slate-200">

      {/* DASHBOARD HEADER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 bg-slate-900/50 border border-slate-900/80 rounded-3xl p-6 flex flex-col justify-between gap-6 shadow-xl relative overflow-hidden backdrop-blur-md">
          <div className="absolute top-0 right-0 p-12 opacity-[0.02] text-indigo-500 select-none pointer-events-none">
            <Activity size={180} />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-[10px] font-mono tracking-widest text-indigo-400 font-bold uppercase">NOVA COGNITIVE INTEGRATION TERMINAL</span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight mt-1">
                Your Proactive Action Hub
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <div className={`text-[10px] font-mono font-bold tracking-wider px-3 py-1.5 rounded-xl border flex items-center gap-2 ${apiStatus === 'connected'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                {apiStatus === 'connected' ? <Wifi size={12} /> : <Database size={12} />}
                <span>{apiStatus === 'connected' ? 'LIVE DEPLOYED BACKEND' : 'OFFLINE SIMULATED MODE'}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-900/60 text-center sm:text-left">
              <div className="text-[9px] font-mono font-bold text-slate-500 tracking-wider flex items-center justify-center sm:justify-start gap-1.5">
                <ListTodo size={11} className="text-indigo-400" /> ACTIVE WORKLOAD
              </div>
              <div className="text-2xl font-black text-white mt-1.5">{activeCount}</div>
              <div className="text-[10px] text-slate-400 mt-1">commitments left</div>
            </div>

            <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-900/60 text-center sm:text-left">
              <div className="text-[9px] font-mono font-bold text-slate-500 tracking-wider flex items-center justify-center sm:justify-start gap-1.5">
                <Hourglass size={11} className="text-rose-400 animate-pulse" /> BUFFER BREACHED
              </div>
              <div className="text-2xl font-black text-rose-400 mt-1.5">{criticalCount}</div>
              <div className="text-[10px] text-rose-400/80 mt-1">extreme urgency</div>
            </div>

            <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-900/60 text-center sm:text-left">
              <div className="text-[9px] font-mono font-bold text-slate-500 tracking-wider flex items-center justify-center sm:justify-start gap-1.5">
                <TrendingUp size={11} className="text-indigo-400" /> MAX COGNITIVE RISKS
              </div>
              <div className="text-2xl font-black text-white mt-1.5">{maxScore.toFixed(1)}</div>
              <div className="text-[10px] text-slate-400 mt-1">highest stress index</div>
            </div>

            <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-900/60 text-center sm:text-left">
              <div className="text-[9px] font-mono font-bold text-slate-500 tracking-wider flex items-center justify-center sm:justify-start gap-1.5">
                <Bell size={11} className="text-amber-400 animate-pulse" /> ACTIVE ESCALATIONS
              </div>
              <div className="text-2xl font-black text-white mt-1.5">{pendingAlarms}</div>
              <div className="text-[10px] text-slate-400 mt-1">proactive monitors</div>
            </div>
          </div>
        </div>

        {/* ESCALATION MATRIX */}
        <div className="lg:col-span-4 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-900 rounded-3xl p-6 flex flex-col justify-between gap-5 shadow-xl">
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold font-mono tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
              <Sliders size={13} className="text-indigo-400" /> CRITICAL ESCALATION MATRIX
            </h3>
            <p className="text-[11px] text-slate-500 leading-normal">
              NOVA safeguards workflows by escalating alarms dynamically to Invasive stages if safety buffers collapse.
            </p>
          </div>

          <div className="space-y-2 font-mono text-[10px]">
            <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-900/80">
              <span className="flex items-center gap-2 text-slate-300">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                STAGE 1: Calm Nudges
              </span>
              <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded uppercase font-bold border border-emerald-500/20">
                PUSH
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-900/80">
              <span className="flex items-center gap-2 text-slate-300">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                STAGE 2: Alarm Warnings
              </span>
              <span className="bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded uppercase font-bold border border-amber-500/20">
                PUSH/SMS
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-900/80 animate-pulse">
              <span className="flex items-center gap-2 text-rose-400">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                STAGE 3: Invasive Bypass
              </span>
              <span className="bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded uppercase font-bold border border-rose-500/20">
                VOICE CALL
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ERROR NOTICE */}
      {errorMessage && (
        <div className="p-4 bg-rose-500/5 border border-rose-500/10 text-rose-400 rounded-2xl text-xs font-mono flex items-start gap-3">
          <AlertTriangle size={16} className="shrink-0 mt-0.5 text-rose-400" />
          <div>
            <strong className="block text-white uppercase font-bold text-[10px] tracking-wide">Sync Exception Handled</strong>
            <span className="mt-1 block leading-normal text-slate-400">{errorMessage}. Active local simulated engine safely bypassed the failure.</span>
          </div>
        </div>
      )}

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 space-y-8">
          <TaskForm
            onIngestTask={handleIngestTask}
            onPanicSpeechIngest={handlePanicSpeechIngest}
            isLoading={isLoading}
          />
          <TaskList
            tasks={tasks}
            selectedTaskId={selectedTask?.id || null}
            onSelectTask={handleSelectTask}
            onMarkCompleted={handleMarkCompleted}
            onDeleteTask={handleDeleteTask}
            onGeneratePlan={handleGeneratePlan}
            isLoading={isLoading}
          />
        </div>

        <div className="lg:col-span-7 space-y-8">
          <PlanViewer
            task={selectedTask}
            plan={activePlan}
            isLoading={isLoading}
            onGeneratePlan={handleGeneratePlan}
          />
          <RemindersPanel
            reminders={reminders}
            selectedTask={selectedTask}
            onSnooze={handleSnoozeReminder}
            isLoading={isLoading}
          />
          <APIConnector onForceSimulateChange={handleForceSimulateChange} />
        </div>
      </div>

      {/* EMERGENCY ALARM MODAL */}
      <AnimatePresence>
        {activeAlarm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/90 backdrop-blur-lg z-50 flex items-center justify-center p-4 select-none"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-rose-500 max-w-md w-full rounded-3xl p-8 text-center space-y-6 shadow-[0_0_50px_rgba(244,63,94,0.3)] relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-rose-500/5 animate-pulse" />

              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-full w-fit mx-auto text-rose-400 animate-bounce">
                <ShieldAlert size={40} className="stroke-[2.5]" />
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-mono font-black tracking-widest text-rose-500 uppercase">
                  🔥 [NOVA INVASIVE ESCALATION] ACT NOW
                </span>
                <h3 className="text-lg font-black text-white leading-tight">
                  Paralysis Bypass Trigger Initiated!
                </h3>
                <p className="text-xs font-mono text-slate-400 leading-relaxed pt-2">
                  Channel: {activeAlarm.delivery_channel} • Escalation Level: {activeAlarm.escalation_level}
                </p>
              </div>

              <div className="p-5 bg-slate-950 rounded-2xl border border-slate-900 font-sans text-xs text-slate-200 leading-relaxed shadow-inner">
                "{activeAlarm.alert_message}"
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      console.log("🔔 Snooze clicked for reminder:", activeAlarm.id);
                      await handleSnoozeReminder(activeAlarm.id, 15);
                      setActiveAlarm(null);
                      alert("⚠️ Snoozed for 15 minutes. Stay focused!");
                    } catch (error) {
                      console.error("Snooze error:", error);
                      alert("❌ Snooze failed");
                    }
                  }}
                  className="bg-slate-950 hover:bg-slate-800 active:bg-slate-700 border border-slate-800 text-slate-300 font-mono font-bold py-3.5 px-4 rounded-xl text-xs transition cursor-pointer select-none"
                >
                  Snooze Alert
                </button>
                <button
                  type="button"
                  onClick={() => {
                    console.log("✅ Acknowledge clicked");
                    setActiveAlarm(null);
                    alert("✅ Acknowledged! Begin working immediately on your commitment.");
                  }}
                  className="bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-mono font-black py-3.5 px-4 rounded-xl text-xs shadow-[0_4px_16px_rgba(244,63,94,0.3)] transition cursor-pointer select-none"
                >
                  Acknowledge (Start)
                </button>
              </div>

              <div className="text-[10px] font-mono text-slate-500 leading-none">
                Emergency countdown synced with local SQLite session thread.
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}