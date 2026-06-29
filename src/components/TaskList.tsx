import React, { useState } from 'react';
import { CheckCircle, Search, RefreshCw } from 'lucide-react';
import { Task } from '../types';
import TaskListItem from './TaskListItem';

interface TaskListProps {
  tasks: Task[];
  selectedTaskId: number | null;
  onSelectTask: (task: Task) => void;
  onMarkCompleted: (task: Task) => void;
  onDeleteTask: (id: number) => void;
  onGeneratePlan: (task: Task) => void;
  isLoading: boolean;
}

export default function TaskList({ 
  tasks, 
  selectedTaskId, 
  onSelectTask, 
  onMarkCompleted, 
  onDeleteTask, 
  onGeneratePlan,
  isLoading 
}: TaskListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  // Sort and filter tasks: Sorted by urgency_score descending as requested
  const filteredAndSortedTasks = tasks
    .filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
      return matchesSearch && matchesPriority;
    })
    .sort((a, b) => {
      // Complete tasks go to bottom, uncompleted sorted by urgency_score descending
      if (a.is_completed !== b.is_completed) {
        return a.is_completed ? 1 : -1;
      }
      return b.urgency_score - a.urgency_score;
    });

  return (
    <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 shadow-xl backdrop-blur-md space-y-4">
      
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Commitments Workload</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-950 border border-slate-900 text-indigo-400">
              {tasks.filter(t => !t.is_completed).length} Pending
            </span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Dynamically arranged by calculated deadline-complexity risk ratio.</p>
        </div>

        <div className="flex items-center gap-2 font-mono text-[10px]">
          <span className="text-slate-500 uppercase">Sort order:</span>
          <span className="text-indigo-400 font-bold bg-indigo-500/5 px-2 py-1 rounded border border-indigo-500/10">URGENCY SCORE ↓</span>
        </div>
      </div>

      {/* Search and priority pill selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        <div className="sm:col-span-7 relative">
          <Search size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text"
            placeholder="Search commitments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500/75 rounded-xl pl-9 pr-4 py-2 text-xs text-white outline-none outline-0 font-sans transition"
          />
        </div>

        <div className="sm:col-span-5 bg-slate-950 rounded-xl p-1 border border-slate-900 grid grid-cols-4 text-[10px] font-mono font-bold select-none text-center">
          {['all', 'high', 'medium', 'low'].map((p) => (
            <button
              key={p}
              onClick={() => setFilterPriority(p as any)}
              className={`py-1 rounded uppercase cursor-pointer transition ${
                filterPriority === p ? 'bg-slate-900 text-white border-t border-slate-800' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Main Task List Content */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
        {isLoading && filteredAndSortedTasks.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <RefreshCw size={24} className="animate-spin text-indigo-500 mx-auto" />
            <p className="text-xs text-slate-500">Querying SQLite database engines...</p>
          </div>
        ) : filteredAndSortedTasks.length === 0 ? (
          <div className="text-center py-12 bg-slate-950/20 border border-dashed border-slate-900 rounded-2xl p-6">
            <CheckCircle size={28} className="text-slate-700 mx-auto mb-2.5" />
            <p className="text-xs font-semibold text-slate-400">No active commitments match criteria</p>
            <p className="text-[10px] text-slate-600 mt-1 max-w-xs mx-auto">Either you are fully caught up, or your filters exclude all tasks. Breathe and enjoy the horizon.</p>
          </div>
        ) : (
          filteredAndSortedTasks.map((task) => (
            <TaskListItem
              key={task.id}
              task={task}
              isSelected={selectedTaskId === task.id}
              onSelect={() => onSelectTask(task)}
              onMarkCompleted={(task, e) => {
                e.stopPropagation();
                onMarkCompleted(task);
              }}
              onDelete={(id, e) => {
                e.stopPropagation();
                onDeleteTask(id);
              }}
              onGeneratePlan={(task, e) => {
                e.stopPropagation();
                onGeneratePlan(task);
              }}
            />
          ))
        )}
      </div>

    </div>
  );
}
