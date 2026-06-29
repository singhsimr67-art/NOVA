/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Timer, Play, Pause, Square, Sparkles } from 'lucide-react';

interface FocusTimerProps {
  activeMilestoneTitle: string | null;
  onTimerComplete?: () => void;
  defaultMinutes?: number;
}

export default function FocusTimer({
  activeMilestoneTitle,
  onTimerComplete,
  defaultMinutes = 15
}: FocusTimerProps) {
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(defaultMinutes * 60);
  const timerRef = useRef<any>(null);

  // Sync timer when active milestone changes
  useEffect(() => {
    if (activeMilestoneTitle) {
      setTimerActive(true);
    }
  }, [activeMilestoneTitle]);

  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
      
      // Synthesis audio chime
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
          osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15); // E5
          osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.3); // G5
          
          gain.gain.setValueAtTime(0.35, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
          
          osc.start();
          osc.stop(ctx.currentTime + 1.2);
        }
      } catch (err) {
        console.warn('Synth failed:', err);
      }

      if (onTimerComplete) {
        onTimerComplete();
      } else {
        alert(`🎉 Momentum block completed: "${activeMilestoneTitle || 'Sprint'}"! Give your mind a 3-minute breather.`);
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive, timeLeft, activeMilestoneTitle, onTimerComplete]);

  const formatClock = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleReset = () => {
    setTimerActive(false);
    setTimeLeft(defaultMinutes * 60);
  };

  return (
    <div className="p-4 bg-slate-950 border border-slate-900 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-5 relative overflow-hidden">
      {timerActive && (
        <div className="absolute inset-0 bg-indigo-500/[0.01] animate-pulse pointer-events-none" />
      )}

      <div className="flex items-center gap-3.5">
        <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
          <Timer size={20} className={timerActive ? 'animate-spin' : ''} style={{ animationDuration: '6s' }} />
        </div>
        <div>
          <span className="text-[10px] font-mono font-bold text-slate-500 block uppercase">
            {timerActive ? `Focusing: ${activeMilestoneTitle || 'Active Block'}` : 'Interactive Milestones Timer'}
          </span>
          <span className="text-xs font-bold text-slate-200 mt-0.5 block leading-tight">
            {timerActive ? 'Keep your focus locked. Avoid closing this workspace.' : 'Click any milestone play icon below to initiate focus blocks.'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0 font-mono">
        <div className="text-2xl font-black tracking-tight text-white select-all">
          {formatClock(timeLeft)}
        </div>
        
        <div className="flex gap-1.5">
          {timerActive ? (
            <button
              onClick={() => setTimerActive(false)}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg cursor-pointer transition select-none"
              title="Pause Focus block"
            >
              <Pause size={12} />
            </button>
          ) : (
            <button
              onClick={() => setTimerActive(true)}
              className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg cursor-pointer transition select-none"
              title="Resume/Start focus block"
            >
              <Play size={12} />
            </button>
          )}
          
          <button
            onClick={handleReset}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-500 hover:text-slate-300 rounded-lg cursor-pointer transition select-none"
            title="Reset Timer"
          >
            <Square size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
