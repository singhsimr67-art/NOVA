import React, { useState } from 'react';
import { Plus, Sparkles, AlertCircle, RefreshCw, Layers, Clock, Flame, Sliders } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Task } from '../types';

interface TaskFormProps {
  onIngestTask: (taskPayload: Partial<Task>) => Promise<void>;
  onPanicSpeechIngest: (panicText: string) => Promise<void>;
  isLoading: boolean;
}

export default function TaskForm({ onIngestTask, onPanicSpeechIngest, isLoading }: TaskFormProps) {
  // Toggle Mode: Standard Form vs AI Panic Speech Ingestion
  const [isPanicMode, setIsPanicMode] = useState(false);

  // Form Controlled States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [hoursLeft, setHoursLeft] = useState('4');
  const [estimatedMinutes, setEstimatedMinutes] = useState(60);
  const [complexity, setComplexity] = useState(3);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  // Panic Text Input State
  const [panicText, setPanicText] = useState('');

  // Validation States
  const [validationError, setValidationError] = useState<string | null>(null);

  // Submit Handler for Standard Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validation Rules
    if (!title.trim()) {
      setValidationError("Commitment Title is required.");
      return;
    }
    if (title.length > 100) {
      setValidationError("Title should be less than 100 characters.");
      return;
    }
    const hours = parseFloat(hoursLeft);
    if (isNaN(hours) || hours <= 0) {
      setValidationError("Hours to deadline must be a valid positive number.");
      return;
    }
    if (hours > 720) {
      setValidationError("Deadlines exceeding 30 days are handled by general calendar slots, not the panic matrix.");
      return;
    }
    const mins = parseInt(estimatedMinutes.toString());
    if (isNaN(mins) || mins <= 1) {
      setValidationError("Estimated minutes must be a positive integer greater than 1.");
      return;
    }

    // Prepare payload
    const deadlineTime = new Date(Date.now() + 1000 * 60 * 60 * hours);
    const taskPayload: Partial<Task> = {
      title: title.trim(),
      description: description.trim() || "No additional description specified.",
      deadline: deadlineTime.toISOString(),
      estimated_minutes: mins,
      priority,
      complexity_level: complexity
    };

    try {
      await onIngestTask(taskPayload);
      // Clean form on success
      setTitle('');
      setDescription('');
      setHoursLeft('4');
      setEstimatedMinutes(60);
      setComplexity(3);
      setPriority('medium');
    } catch (err: any) {
      setValidationError(err.message || "Failed to submit task.");
    }
  };

  // Submit Handler for Panic Mode
  const handlePanicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!panicText.trim()) {
      setValidationError("Please enter your chaotic panic comments. e.g. 'I have a test tomorrow!'");
      return;
    }
    if (panicText.trim().length < 10) {
      setValidationError("Describe your panic in slightly more detail (minimum 10 characters). Let NOVA parse it.");
      return;
    }

    try {
      await onPanicSpeechIngest(panicText.trim());
      setPanicText('');
    } catch (err: any) {
      setValidationError(err.message || "Gemini parsing failed.");
    }
  };

  const getUrgencyFactor = () => {
    const hours = parseFloat(hoursLeft) || 4;
    const factor = (Math.pow(complexity, 1.2) * 1.25) / (hours + 1.5);
    return Math.min(10, Math.max(0.1, factor * 10)).toFixed(1);
  };

  return (
    <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 shadow-xl backdrop-blur-md space-y-5">
      
      {/* Top Header */}
      <div>
        <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
          <Plus size={16} className="text-indigo-400" /> Ingest New Commitment
        </h3>
        <p className="text-[11px] text-slate-500 mt-1">Submit clean task variables, or write unstructured panic comments to parse via Gemini.</p>
      </div>

      {/* Mode Switcher Buttons */}
      <div className="bg-slate-950/60 p-1.5 rounded-xl border border-slate-900/85 grid grid-cols-2 text-xs font-mono font-bold select-none">
        <button 
          type="button"
          onClick={() => { setIsPanicMode(false); setValidationError(null); }}
          className={`py-2 rounded-lg text-center cursor-pointer transition flex items-center justify-center gap-1.5 ${
            !isPanicMode ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders size={12} />
          <span>Standard Input</span>
        </button>
        <button 
          type="button"
          onClick={() => { setIsPanicMode(true); setValidationError(null); }}
          className={`py-2 rounded-lg text-center cursor-pointer transition flex items-center justify-center gap-1.5 ${
            isPanicMode ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles size={12} />
          <span>AI Panic Ingest</span>
        </button>
      </div>

      {/* Error Output */}
      {validationError && (
        <div className="text-[10px] text-rose-400 border border-rose-500/10 bg-rose-500/5 px-3 py-2.5 rounded-xl flex items-start gap-2 leading-relaxed">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Active Form Component */}
      <AnimatePresence mode="wait">
        {!isPanicMode ? (
          // STANDARD PARAMETRIC FORM
          <motion.form 
            key="std-form"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.12 }}
            onSubmit={handleSubmit} 
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Commitment Title</label>
              <input 
                type="text" 
                placeholder="e.g. Slide deck presentation draft" 
                value={title}
                onChange={(e) => { setTitle(e.target.value); setValidationError(null); }}
                className="w-full bg-slate-950 border border-slate-900 hover:border-slate-800 focus:border-indigo-500/80 rounded-xl px-4 py-2.5 text-xs text-white outline-none font-sans transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Context description (Optional)</label>
              <textarea 
                placeholder="Core deliverables, subtasks, resource links..." 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full bg-slate-950 border border-slate-900 hover:border-slate-800 focus:border-indigo-500/80 rounded-xl px-4 py-2.5 text-xs text-white outline-none font-sans transition resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase flex items-center gap-1">
                  <Clock size={11} className="text-indigo-400" />
                  <span>Hours to Deadline</span>
                </label>
                <input 
                  type="number" 
                  value={hoursLeft}
                  onChange={(e) => { setHoursLeft(e.target.value); setValidationError(null); }}
                  min="0.1"
                  step="0.1"
                  className="w-full bg-slate-950 border border-slate-900 hover:border-slate-800 focus:border-indigo-500/80 rounded-xl px-4 py-2.5 text-xs text-white outline-none font-mono transition"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase flex items-center gap-1">
                  <Layers size={11} className="text-indigo-400" />
                  <span>Work Mins Target</span>
                </label>
                <input 
                  type="number" 
                  value={estimatedMinutes}
                  onChange={(e) => { setEstimatedMinutes(parseInt(e.target.value) || 0); setValidationError(null); }}
                  min="5"
                  step="5"
                  className="w-full bg-slate-950 border border-slate-900 hover:border-slate-800 focus:border-indigo-500/80 rounded-xl px-4 py-2.5 text-xs text-white outline-none font-mono transition"
                />
              </div>
            </div>

            {/* Friction complexity slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase flex items-center gap-1">
                  <Flame size={11} className="text-rose-400 animate-pulse" />
                  <span>Friction Complexity: Level {complexity}</span>
                </label>
                <span className="text-[9px] font-mono text-slate-500">How much mental drag?</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-900 rounded-xl p-2 select-none">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    type="button"
                    key={level}
                    onClick={() => setComplexity(level)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all duration-150 cursor-pointer ${
                      complexity === level 
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                        : 'bg-slate-900/40 hover:bg-slate-900 text-slate-500 border border-transparent'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority and Urgency Score Predictor */}
            <div className="grid grid-cols-2 gap-4 items-center pt-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Priority Rating</label>
                <select 
                  value={priority}
                  onChange={(e: any) => setPriority(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-900 hover:border-slate-800 focus:border-indigo-500/80 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono transition"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-900 flex items-center justify-between font-mono text-[10px]">
                <div>
                  <span className="text-slate-500 block uppercase">Projected Urgency</span>
                  <span className="text-[8px] text-slate-500">(Calculated index)</span>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-black tracking-tight ${
                    parseFloat(getUrgencyFactor()) >= 8.0 ? 'text-rose-400' :
                    parseFloat(getUrgencyFactor()) >= 4.0 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {getUrgencyFactor()}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs py-3 px-4 rounded-xl transition cursor-pointer select-none shadow-[0_4px_12px_rgba(99,102,241,0.2)] flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Ingesting to SQLite...</span>
                </>
              ) : (
                <>
                  <Plus size={14} />
                  <span>Insert SQLite Commitment</span>
                </>
              )}
            </button>
          </motion.form>
        ) : (
          // AI PANIC SPEECH INGESTION FORM
          <motion.form 
            key="panic-form"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.12 }}
            onSubmit={handlePanicSubmit} 
            className="space-y-4"
          >
            <div className="space-y-2">
              <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Chaotic Mind Spill</label>
              <textarea 
                placeholder="e.g. I have a chemistry report and slides due tomorrow morning at 8 AM, I haven't even selected a topic or started. Also need to drop dry cleaning before they close at 6!" 
                value={panicText}
                onChange={(e) => { setPanicText(e.target.value); setValidationError(null); }}
                rows={5}
                className="w-full bg-slate-950 border border-slate-900 hover:border-slate-800 focus:border-indigo-500/80 rounded-xl p-4 text-xs text-slate-100 placeholder:text-slate-600 outline-none font-sans leading-relaxed transition resize-none"
              />
            </div>

            <div className="p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10 text-[10px] leading-normal text-slate-400 flex items-start gap-2.5">
              <Sparkles size={14} className="text-indigo-400 shrink-0 mt-0.5" />
              <span>
                <strong>Gemini Cognitive Filter</strong>: Input vague, panicked speech. The LLM evaluates timelines, isolates the major trap, generates defensive buffers, and structures checklists directly into SQLite.
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-40 text-white font-bold text-xs py-3.5 px-4 rounded-xl transition cursor-pointer select-none shadow-[0_4px_16px_rgba(99,102,241,0.25)] flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Gemini Structuring Pipeline...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Ingest &amp; Structure with Gemini</span>
                </>
              )}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

    </div>
  );
}
