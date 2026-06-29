/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Clock, Trash2, Brain, Check, ShieldCheck } from 'lucide-react';
import { Task } from '../types';
import { getUrgencyBadge } from '../utils/urgencyBadge';

interface TaskListItemProps {
  key?: React.Key;
  task: Task;
  isSelected: boolean;
  onSelect: () => void;
  onMarkCompleted: (task: Task, e: React.MouseEvent) => void;
  onDelete: (id: number, e: React.MouseEvent) => void;
  onGeneratePlan: (task: Task, e: React.MouseEvent) => void;
}

export default function TaskListItem({
  task,
  isSelected,
  onSelect,
  onMarkCompleted,
  onDelete,
  onGeneratePlan
}: TaskListItemProps) {
  const badge = getUrgencyBadge(task.urgency_score);

  // Calculate Parkinson's Law cushion time if present
  let cushionMins = 0;
  if (task.original_deadline && task.adjusted_deadline) {
    const originalTime = new Date(task.original_deadline).getTime();
    const adjustedTime = new Date(task.adjusted_deadline).getTime();
    cushionMins = Math.max(0, Math.round((originalTime - adjustedTime) / (1000 * 60)));
  } else {
    // If no adjusted_deadline, calculate a default 20% Parkinson buffer based on duration
    const timeLeftMins = (new Date(task.deadline).getTime() - Date.now()) / (1000 * 60);
    if (timeLeftMins > 0) {
      cushionMins = Math.round(timeLeftMins * 0.2);
    }
  }

  const calculateHoursRemaining = (isoString: string) => {
    const hours = (new Date(isoString).getTime() - Date.now()) / (1000 * 60 * 60);
    if (hours <= 0) return 'OVERDUE';
    if (hours < 1) return `${Math.round(hours * 60)}m left`;
    return `${hours.toFixed(1)} hrs left`;
  };

  return (
    <div
      id={`task-item-${task.id}`}
      onClick={onSelect}
      className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 relative overflow-hidden select-none ${
        isSelected
          ? 'bg-slate-900/90 border-indigo-500/40 shadow-[0_4px_16px_rgba(99,102,241,0.06)]'
          : `border-slate-900 hover:border-slate-800 bg-slate-950/20 hover:bg-slate-900/10`
      } ${task.is_completed ? 'opacity-60 saturate-50' : ''}`}
    >
      {/* Complete Task Visual Top Bar */}
      {task.is_completed && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500/80" />
      )}

      <div className="flex items-start justify-between gap-3.5">
        {/* Left Section: Custom Checkbox + Task Metadata */}
        <div className="flex items-start gap-3">
          <button
            id={`btn-complete-${task.id}`}
            type="button"
            onClick={(e) => onMarkCompleted(task, e)}
            className={`h-5 w-5 shrink-0 rounded-lg border flex items-center justify-center transition cursor-pointer mt-0.5 select-none ${
              task.is_completed
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                : 'bg-slate-950 border-slate-900 hover:border-slate-700 text-transparent'
            }`}
            title={task.is_completed ? "Mark Pending" : "Mark Completed"}
          >
            <Check size={12} className={task.is_completed ? 'stroke-[3px]' : ''} />
          </button>

          <div className="space-y-1">
            <h4 className={`text-xs font-bold leading-tight font-sans ${
              task.is_completed ? 'text-slate-500 line-through font-normal' : 'text-slate-100'
            }`}>
              {task.title}
            </h4>
            {task.description && (
              <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                {task.description}
              </p>
            )}
          </div>
        </div>

        {/* Right Section: Urgency Score Indicators */}
        <div className="text-right shrink-0">
          <span className="text-[9px] font-mono text-slate-500 block uppercase">URGENCY SCORE</span>
          <span className={`text-base font-black tracking-tight block ${
            task.is_completed ? 'text-slate-500' : badge.colorClass
          }`}>
            {task.is_completed ? 'DONE' : task.urgency_score.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Buffer Alert - Parkinson Cushion block */}
      {!task.is_completed && cushionMins > 0 && (
        <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-2 flex items-center gap-2 text-[10px] text-indigo-400 font-mono">
          <ShieldCheck size={12} className="text-indigo-400 animate-pulse" />
          <span>
            <strong>Parkinson Cushion:</strong> Intentionally locked {cushionMins}m earlier to prevent margin fatigue.
          </span>
        </div>
      )}

      {/* Footer Details Strip */}
      <div className="flex items-center justify-between gap-2 border-t border-slate-900/60 pt-2.5 font-mono text-[10px]">
        <div className="flex items-center gap-2 text-slate-400">
          <span className={`px-1.5 py-0.2 rounded font-bold uppercase text-[9px] ${
            task.priority === 'high' ? 'text-rose-400 bg-rose-500/5 border border-rose-500/10' :
            task.priority === 'medium' ? 'text-amber-400 bg-amber-500/5' : 'text-emerald-400 bg-emerald-500/5'
          }`}>
            {task.priority}
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1">
            <Clock size={11} className="text-slate-500" />
            <span>{calculateHoursRemaining(task.deadline)}</span>
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-500">Complexity: {task.complexity_level}/5</span>
        </div>

        {/* Core Quick Buttons */}
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {!task.is_completed && (
            <button
              id={`btn-plan-${task.id}`}
              type="button"
              onClick={(e) => onGeneratePlan(task, e)}
              className="p-1.5 bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-500/25 rounded-lg text-indigo-400 hover:text-indigo-300 transition cursor-pointer select-none"
              title="Generate Momentum Milestones"
            >
              <Brain size={12} />
            </button>
          )}
          <button
            id={`btn-delete-${task.id}`}
            type="button"
            onClick={(e) => onDelete(task.id, e)}
            className="p-1.5 bg-slate-950/40 hover:bg-rose-500/10 border border-slate-900 hover:border-rose-500/20 rounded-lg text-slate-500 hover:text-rose-400 transition cursor-pointer select-none"
            title="Delete Commitment"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Urgency Badge Status Strip */}
      {!task.is_completed && (
        <div className={`mt-1.5 text-[8px] font-mono font-bold tracking-wider rounded-lg px-2 py-1 text-center border uppercase ${badge.bgClass} ${badge.borderClass} ${badge.colorClass}`}>
          <span>{badge.label} ZONE</span>
        </div>
      )}
    </div>
  );
}
