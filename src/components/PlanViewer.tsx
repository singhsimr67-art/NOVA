import React, { useState } from 'react';
import { Sparkles, Play, Flame, Headphones, Timer, CheckCircle2, ShieldCheck, HeartPulse } from 'lucide-react';
import { Task, AIPlan } from '../types';
import FocusTimer from './FocusTimer';

interface PlanViewerProps {
  task: Task | null;
  plan: AIPlan | null;
  isLoading: boolean;
  onGeneratePlan: (task: Task) => void;
}

export default function PlanViewer({ task, plan, isLoading, onGeneratePlan }: PlanViewerProps) {
  // Focus Timer States
  const [activeMilestoneTitle, setActiveMilestoneTitle] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  const handleStartTimer = (title: string, minutes: number) => {
    setActiveMilestoneTitle(null);
    setTimeout(() => {
      setActiveMilestoneTitle(title);
    }, 50);
  };

  const handleToggleStep = (stepNumber: number) => {
    setCompletedSteps(prev => ({
      ...prev,
      [stepNumber]: !prev[stepNumber]
    }));
  };

  if (!task) {
    return (
      <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-8 text-center shadow-xl backdrop-blur-md flex flex-col items-center justify-center min-h-[300px]">
        <Timer size={36} className="text-slate-700 mb-3 animate-pulse" />
        <p className="text-xs font-semibold text-slate-400">Select a commitment from your workload list</p>
        <p className="text-[10px] text-slate-600 mt-1 max-w-xs leading-normal">
          NOVA will isolate your active target, evaluate safety cushions, and generate cognitive momentum plans to break paralysis.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 shadow-xl backdrop-blur-md space-y-6">
      
      {/* Visual Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-4">
        <div>
          <span className="text-[9px] font-mono tracking-widest text-indigo-400 font-bold uppercase block">3. MOMENTUM ENGINE</span>
          <h3 className="text-sm font-bold text-white mt-1">Cognitive Action Blueprint</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Target: <span className="text-slate-300 font-mono font-bold uppercase">{task.title}</span></p>
        </div>

        {!plan && !isLoading && (
          <button
            onClick={() => onGeneratePlan(task)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold font-mono rounded-xl cursor-pointer transition select-none flex items-center gap-2"
          >
            <Sparkles size={12} />
            <span>Formulate Plan</span>
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="py-20 text-center space-y-3">
          <Sparkles size={24} className="animate-spin text-indigo-400 mx-auto" />
          <p className="text-xs text-slate-500">Gemini breaking down commitment complexity...</p>
        </div>
      ) : !plan ? (
        <div className="py-12 text-center space-y-3 bg-slate-950/20 border border-dashed border-slate-900 rounded-2xl p-6">
          <HeartPulse size={24} className="text-indigo-400/80 mx-auto" />
          <p className="text-xs font-semibold text-slate-400">No active plan formulated yet</p>
          <p className="text-[10px] text-slate-600 max-w-xs mx-auto">
            Click the 'Formulate Plan' button above to call Google Gemini in structured JSON output mode. It will generate a high-focus milestone set.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Immediate First Step - Mental Paralysis Breaker */}
          <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-5 space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] text-indigo-400 select-none pointer-events-none">
              <Sparkles size={80} />
            </div>

            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-indigo-400 animate-pulse" />
              <span className="text-[10px] font-mono tracking-wider font-bold text-indigo-400 uppercase">Frictionless Starter Block</span>
            </div>
            
            <p className="text-xs font-bold text-slate-100 leading-relaxed pl-1">
              {plan.immediate_first_step}
            </p>
            
            <p className="text-[10px] text-indigo-300 pl-1 leading-normal">
              <strong>Why this works:</strong> Starting is 90% of the friction. By locking your attention to an action requiring under 120 seconds, we short-circuit anxiety filters.
            </p>
          </div>

          {/* Focus Trigger & Cushion Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="p-4 bg-slate-950/60 border border-slate-900 rounded-2xl space-y-1.5 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-[10px] font-mono tracking-wider font-bold text-slate-500 uppercase">
                <Headphones size={12} className="text-indigo-400" />
                <span>Focus Stimulus</span>
              </div>
              <p className="text-xs font-medium text-slate-300 leading-normal mt-1">
                {plan.focus_trigger}
              </p>
            </div>

            <div className="p-4 bg-slate-950/60 border border-slate-900 rounded-2xl space-y-1.5 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-[10px] font-mono tracking-wider font-bold text-slate-500 uppercase">
                <ShieldCheck size={12} className="text-emerald-400 animate-pulse" />
                <span>Parkinson Cushion</span>
              </div>
              <p className="text-xs font-bold text-emerald-400 leading-normal mt-1">
                {plan.parkinsons_cushion_minutes} minutes buffer added
              </p>
              <span className="text-[9px] text-slate-500 leading-normal font-mono block">
                Targeting completion {plan.parkinsons_cushion_minutes}m before real deadline.
              </span>
            </div>

          </div>

          {/* Modular Focus Timer */}
          <FocusTimer 
            activeMilestoneTitle={activeMilestoneTitle} 
            defaultMinutes={15} 
          />

          {/* Suggested Milestone Checklists */}
          <div className="space-y-3">
            <span className="text-[10px] font-mono tracking-wider font-bold text-slate-500 uppercase">Suggested work milestones</span>
            
            <div className="space-y-2">
              {plan.suggested_milestones?.map((step) => {
                const isStepCompleted = !!completedSteps[step.step_number];

                return (
                  <div 
                    key={step.step_number}
                    className={`p-4 rounded-xl border flex items-start justify-between gap-4 transition-all duration-150 ${
                      isStepCompleted 
                        ? 'bg-slate-950/40 border-slate-900 opacity-60 saturate-50' 
                        : 'bg-slate-950/80 border-slate-900 hover:border-slate-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => handleToggleStep(step.step_number)}
                        className={`h-5 w-5 rounded border flex items-center justify-center transition cursor-pointer mt-0.5 ${
                          isStepCompleted 
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' 
                            : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-transparent'
                        }`}
                      >
                        <CheckCircle2 size={11} className={isStepCompleted ? 'stroke-[2.5px] text-emerald-400' : ''} />
                      </button>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/5 border border-indigo-500/10 px-1.5 py-0.1 rounded">
                            Step {step.step_number}
                          </span>
                          <h4 className={`text-xs font-bold ${isStepCompleted ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                            {step.title}
                          </h4>
                        </div>
                        <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                          {step.focus_guideline}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex flex-col items-end justify-between gap-2">
                      <span className="text-[10px] font-mono text-slate-500 font-bold">{step.estimated_minutes} mins</span>
                      
                      {!isStepCompleted && (
                        <button
                          onClick={() => handleStartTimer(step.title, step.estimated_minutes)}
                          className="p-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded transition cursor-pointer select-none"
                          title={`Launch ${step.estimated_minutes}m Focus session`}
                        >
                          <Play size={10} />
                        </button>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
