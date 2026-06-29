/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Bell, Clock, RefreshCw, Send, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Reminder, Task } from '../types';

interface RemindersPanelProps {
  reminders: Reminder[];
  selectedTask: Task | null;
  onSnooze: (id: number, minutes: number) => Promise<any>;
  isLoading: boolean;
}

export default function RemindersPanel({
  reminders,
  selectedTask,
  onSnooze,
  isLoading
}: RemindersPanelProps) {
  const [snoozingId, setSnoozingId] = useState<number | null>(null);

  // Filter reminders to show either for selectedTask, or showing all reminders
  const filteredReminders = reminders.filter(r => 
    selectedTask ? r.task_id === selectedTask.id : true
  );

  const getEscalationStyle = (level: 'INFO' | 'WARNING' | 'PANIC') => {
    switch (level) {
      case 'PANIC':
        return {
          label: '🔥 STAGE 3: PANIC ESCALATION',
          borderClass: 'border-rose-500/35 bg-rose-500/10 text-rose-400',
          indicator: 'bg-rose-500'
        };
      case 'WARNING':
        return {
          label: '⚠️ STAGE 2: INVASIVE WARNING',
          borderClass: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
          indicator: 'bg-amber-500'
        };
      default:
        return {
          label: '👋 STAGE 1: GENTLE MOMENTUM',
          borderClass: 'border-indigo-500/25 bg-indigo-500/5 text-indigo-400',
          indicator: 'bg-indigo-500'
        };
    }
  };

  const handleSnoozeClick = async (id: number) => {
    setSnoozingId(id);
    try {
      await onSnooze(id, 15); // snooze by 15 minutes by default
    } catch (err) {
      console.error('Failed to snooze reminder:', err);
    } finally {
      setSnoozingId(null);
    }
  };

  return (
    <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 shadow-xl backdrop-blur-md space-y-4">
      
      {/* Header section */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/25 rounded-xl text-indigo-400 shrink-0">
            <Bell size={16} />
          </div>
          <div>
            <span className="text-[9px] font-mono tracking-widest text-indigo-400 font-bold uppercase block">4. ESCALATION SYSTEM</span>
            <h3 className="text-sm font-bold text-white mt-0.5">Autonomous Backstops</h3>
          </div>
        </div>

        {selectedTask && (
          <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2.5 py-0.5 rounded border border-slate-900">
            Filter: Task {selectedTask.id}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="py-12 text-center space-y-2">
          <RefreshCw size={20} className="animate-spin text-indigo-500 mx-auto" />
          <p className="text-[11px] text-slate-500">Querying active triggers queue...</p>
        </div>
      ) : filteredReminders.length === 0 ? (
        <div className="py-12 text-center bg-slate-950/20 border border-dashed border-slate-900 rounded-2xl p-5">
          <ShieldCheck size={28} className="text-indigo-400/70 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-400">Escalation queue empty</p>
          <p className="text-[10px] text-slate-600 mt-1 max-w-xs mx-auto">
            {selectedTask 
              ? "This commitment doesn't have active warnings registered. Complete it early to keep it stable." 
              : "No alarms pending. Choose a commitment to explore its individual notification matrix."
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
          {filteredReminders.map((reminder) => {
            const style = getEscalationStyle(reminder.escalation_level);
            const triggerDate = new Date(reminder.trigger_time);
            const formattedTrigger = triggerDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div 
                id={`reminder-card-${reminder.id}`}
                key={reminder.id}
                className={`p-4 rounded-2xl border transition-all duration-150 space-y-3 bg-slate-950/50 ${style.borderClass}`}
              >
                {/* Stage Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${style.indicator} ${reminder.escalation_level === 'PANIC' ? 'animate-ping' : ''}`} />
                    <span className="text-[10px] font-mono font-black uppercase tracking-wider">{style.label}</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-mono">
                    <span>Snoozes: {reminder.snooze_count}</span>
                  </div>
                </div>

                {/* Message Body */}
                <div className="space-y-1 pl-1">
                  <p className="text-xs text-slate-200 leading-normal font-medium">
                    {reminder.escalation_level === 'PANIC' || reminder.snooze_count >= 2 
                      ? reminder.alert_message 
                      : reminder.reminder_message
                    }
                  </p>
                  
                  {/* Info Row: Trigger Time & Delivery Channel */}
                  <div className="flex items-center gap-3 pt-1 text-[10px] text-slate-500 font-mono">
                    <div className="flex items-center gap-1">
                      <Clock size={11} className="text-slate-600" />
                      <span>Triggers at {formattedTrigger}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1 bg-slate-900 border border-slate-900 px-1.5 py-0.2 rounded text-[9px] text-slate-400 uppercase">
                      <Send size={8} />
                      <span>Via {reminder.delivery_channel}</span>
                    </div>
                  </div>
                </div>

                {/* Snooze CTA button */}
                <div className="flex items-center justify-between gap-4 border-t border-slate-900/40 pt-2.5">
                  <span className="text-[9px] text-slate-500 leading-normal">
                    {reminder.snooze_count >= 3 
                      ? "⚠️ Critical levels reached. Snoozing now locks warning to PANIC SMS cascades." 
                      : "Snoozing delays reminder and increments defensive urgency counters."
                    }
                  </span>
                  
                  <button
                    id={`btn-snooze-${reminder.id}`}
                    onClick={() => handleSnoozeClick(reminder.id)}
                    disabled={snoozingId === reminder.id}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-[10px] font-mono font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {snoozingId === reminder.id ? (
                      <RefreshCw size={11} className="animate-spin" />
                    ) : (
                      <Clock size={11} />
                    )}
                    <span>Snooze 15m</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
