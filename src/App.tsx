/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Terminal,
  Folder,
  FolderOpen,
  FileCode,
  Database,
  Cpu,
  Server,
  GitBranch,
  Layers,
  Sliders,
  Clock,
  Bell,
  Code,
  Activity,
  AlertTriangle,
  ArrowRight,
  Key,
  ChevronRight,
  Copy,
  Check,
  BookOpen,
  LineChart,
  Brain,
  ShieldCheck,
  Repeat
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FOLDER_STRUCTURE,
  DATABASE_TABLES,
  SERVICE_LAYERS,
  LANGCHAIN_AGENT,
  GEMINI_INTEGRATION,
  API_ENDPOINTS,
  FileNode,
  TableColumn,
  DatabaseTable,
  ServiceLayerDetail,
  ApiEndpoint
} from './data';

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'files' | 'db' | 'services' | 'agent' | 'api'>('overview');
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [selectedTable, setSelectedTable] = useState<string>('tasks');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Quick simulator state
  const [simComplexity, setSimComplexity] = useState<number>(3);
  const [simHoursRemaining, setSimHoursRemaining] = useState<number>(12);
  const [simProcrastination, setSimProcrastination] = useState<number>(1.2);

  // Flowchart animation scenario
  const [activeScenario, setActiveScenario] = useState<'panic' | 'escalation'>('panic');
  const [scenarioStep, setScenarioStep] = useState<number>(0);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Urgency logic: Score = (Complexity^1.2 * Procrastination) / (HoursRemaining + 1)
  const calculatedUrgency = parseFloat(
    ((Math.pow(simComplexity, 1.2) * simProcrastination) / (simHoursRemaining + 1.5)).toFixed(3)
  );

  const getUrgencyStatus = (score: number) => {
    if (score > 0.8) return { label: 'EXTREME DANGER ZONE', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
    if (score > 0.4) return { label: 'HEAVY HORIZON', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    return { label: 'STABLE TASK', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
  };

  const status = getUrgencyStatus(calculatedUrgency);

  // File structure tree renderer helper
  const renderFileTree = (node: FileNode, depth = 0) => {
    const isFolder = node.type === 'folder';
    const isSelected = selectedFile?.name === node.name;
    const hasChildren = isFolder && node.children && node.children.length > 0;

    return (
      <div key={node.name} style={{ marginLeft: `${depth * 12}px` }} className="select-none">
        <div
          onClick={() => {
            setSelectedFile(node);
          }}
          className={`flex items-center gap-2.5 py-2 px-3 my-1 rounded-xl cursor-pointer transition-all duration-150 border text-xs ${isSelected
            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 shadow-[0_4px_12px_rgba(99,102,241,0.08)] font-medium'
            : 'hover:bg-slate-900/60 text-slate-300 border-transparent'
            }`}
        >
          {isFolder ? (
            <FolderOpen className={`h-4 w-4 text-amber-500 shrink-0`} />
          ) : (
            <FileCode className={`h-4 w-4 text-indigo-400 shrink-0`} />
          )}
          <span className="font-mono">{node.name}</span>
          {!isFolder && (
            <span className="text-[9px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded-md uppercase font-mono tracking-wide">file</span>
          )}
        </div>
        {hasChildren && (
          <div className="border-l border-slate-800/80 ml-4.5 pl-1.5 my-0.5">
            {node.children!.map(child => renderFileTree(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const panicScenarioSteps = [
    { title: "User Input Ingested", desc: "User posts panicked, vague text via REST Gateway to `/api/v1/tasks/ingest`." },
    { title: "Structured Gemini Analysis", desc: "Vite/Express endpoints delegate to Gemini 2.5 Flash, returning highly structured parameters and breaking down the monolith into a 3-step checklist." },
    { title: "SQLAlchemy ACID Save", desc: "Original deadlines are stored along with computed Proactive Cushions (target milestone mapped 2-12 hours in advance of real deadline)." },
    { title: "Time Blocking Execution", desc: "SchedulingEngine analyzes active calendars, automatically clamping down 90-minute locked blocks in SQLite to block off work intervals before the buffer collapses." },
    { title: "Escalation Queue Registered", desc: "ReminderService schedules incremental backstop alarms (INFO notifications leading to twilio SMS triggers is milestone targets are repeatedly breached)." },
    { title: "Stress-Reduced Response Delivered", desc: "Agent consolidates state into a calm, focus-directed greeting: 'I have locked 90 minutes for chemistry. Open sheet 1. Breath in. Let's do this.'" }
  ];

  const escalationScenarioSteps = [
    { title: "System Cron Tick", desc: "Service daemon runs periodic inspections on overdue alarm benchmarks." },
    { title: "Buffer Breach Evaluation", desc: "System detects user penetrated a buffer block for task ID 102 ('Chemistry report') without tagging it as completed." },
    { title: "Initial Push Escalated", desc: "Delivers an INFO push reminder telling user task block has initiated. Set snooze threshold timer to 15 minutes." },
    { title: "User Snoozes Frequently", desc: "User ignores the snooze warning three times, ticking table snooze counter key. System shifts communication pathway parameters." },
    { title: "Critical Escalation Activated", desc: "The channel shifts dynamically to Invasive. Escalation level transitions from WARNING to panic stage." },
    { title: "Bypassing Focus Suppression", desc: "System triggers direct Twilio telephone cascades, dialing SMS text pipelines directly to verify the emergency lock-out." }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans selection:bg-indigo-500/30 selection:text-indigo-300">

      {/* PROFESSIONAL SIDEBAR (ASIDE) */}
      <aside className="w-full md:w-72 border-b md:border-b-0 md:border-r border-slate-900 bg-slate-950 flex flex-col justify-between shrink-0 sticky top-0 md:h-screen z-50">
        <div className="p-6 flex flex-col gap-6 overflow-y-auto">
          {/* Brand/System Logo */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl relative overflow-hidden group shrink-0">
              <div className="absolute inset-0 bg-indigo-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Activity className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-tight text-white leading-tight uppercase font-sans">
                NOVA
                <span className="block text-indigo-400 font-medium lowercase tracking-wide mt-0.5">NOVA</span>
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[9px] font-mono font-bold tracking-wider text-slate-500 bg-slate-900/60 border border-slate-900 px-1.5 py-0.2 rounded">v1.0.0 SPEC</span>
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-900" />

          {/* Core System Navigation Links */}
          <nav className="flex flex-row md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
            {[
              { id: 'overview', label: 'Architecture Overview', icon: Layers },
              { id: 'files', label: 'File Tree', icon: FolderOpen },
              { id: 'db', label: 'Relational DB Schema', icon: Database },
              { id: 'services', label: 'Service Engines', icon: Cpu },
              { id: 'agent', label: 'LangChain & Gemini Brain', icon: Brain },
              { id: 'api', label: 'API Specs', icon: Server }
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    if (tab.id === 'files' && !selectedFile) {
                      setSelectedFile(FOLDER_STRUCTURE);
                    }
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold cursor-pointer transition-all duration-150 whitespace-nowrap md:w-full select-none ${active
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-[0_4px_16px_rgba(99,102,241,0.25)] border-t border-indigo-500/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/50'
                    }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-white' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Aside Footer info */}
        <div className="hidden md:block p-5 bg-slate-950/60 border-t border-slate-900/40">
          <div className="text-[10px] font-mono text-slate-500 space-y-1">
            <div className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">ENGINE ARCHITECT</div>
            <div className="truncate">singhsimr67@gmail.com</div>
            <div className="mt-2 text-[9px] bg-slate-900/80 p-2 rounded-lg border border-slate-900 text-slate-400 flex items-center justify-between">
              <span>STATUS:</span>
              <span className="text-indigo-400 font-bold uppercase animate-pulse">DESIGN READY</span>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT FRAME */}
      <main className="flex-1 flex flex-col min-w-0 md:h-screen md:overflow-y-auto">
        {/* Top-bar specification identifier */}
        <header className="border-b border-slate-900 bg-slate-950/40 backdrop-blur-md px-8 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            <span className="text-xs font-mono font-bold tracking-widest text-indigo-400 uppercase">FASTAPI + SQLALCHEMY ARCHITECT SPECIFICATION</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <Clock className="h-3.5 w-3.5 text-indigo-500" />
            <span>June 2026 SPECS</span>
          </div>
        </header>

        {/* Tab views content area */}
        <div className="flex-1 flex flex-col">
          <AnimatePresence mode="wait">

            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="p-8 max-w-7xl w-full mx-auto space-y-8"
              >
                {/* Introduction Banner */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-8 space-y-5 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-900 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.015] text-indigo-500 select-none">
                      <Terminal size={320} />
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-indigo-400 tracking-wider bg-indigo-500/5 border border-indigo-500/10 rounded-md py-0.5 px-2.5 w-fit">
                      <ShieldCheck className="h-4 w-4 text-indigo-400" /> HIGH-LEVEL SYSTEM BLUEPRINT
                    </div>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
                      System Concept &amp; Architectural Thesis
                    </h2>
                    <p className="text-slate-400 leading-relaxed text-sm">
                      Procrastination and deadline panic are major cognitive hurdles. Modern task managers act as cold, transactional lists that often aggravate analysis paralysis. <strong className="text-white">NOVA NOVA</strong> introduces an autonomous, highly secure task-scheduling and proactively-escalating assistant that bridges cognitive fatigue gaps.
                    </p>
                    <p className="text-slate-400 leading-relaxed text-sm">
                      By combining <strong className="text-indigo-400 font-mono">FastAPI's asynchronous ecosystem</strong>, <strong className="text-white">SQLite's zero-dependency file-based storage</strong>, and <strong className="text-indigo-400 font-mono">LangChain graph orchestration tied to Google's Gemini-2.5-flash API</strong>, this system is capable of parsing cluttered, panicked speech ("Chemistry finals tomorrow morning and i haven't started. laundry too"), breaking them into tiny milestones, time-blocking calendar windows, and executing custom communication escalation grids.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-900/85 font-mono text-xs">
                      <div className="p-4 bg-slate-950 rounded-2xl border border-slate-900/60">
                        <div className="text-[10px] text-slate-500 font-bold tracking-wider">BACKEND RUNTIME</div>
                        <div className="text-xs font-bold text-slate-200 mt-1">Python 3.14 + FastAPI</div>
                      </div>
                      <div className="p-4 bg-slate-950 rounded-2xl border border-slate-900/60">
                        <div className="text-[10px] text-slate-500 font-bold tracking-wider">COGNITIVE ENGINES</div>
                        <div className="text-xs font-bold text-slate-200 mt-1">LangChain + Gemini API</div>
                      </div>
                      <div className="p-4 bg-slate-950 rounded-2xl border border-slate-900/60">
                        <div className="text-[10px] text-slate-500 font-bold tracking-wider">TRANSACTIONAL DB</div>
                        <div className="text-xs font-bold text-slate-200 mt-1">SQLite + SQLAlchemy ORM</div>
                      </div>
                    </div>
                  </div>

                  {/* Checklist Panel */}
                  <div className="lg:col-span-4 bg-slate-900/40 border border-slate-900 rounded-3xl p-8 flex flex-col justify-between shadow-lg">
                    <div className="space-y-5">
                      <h3 className="font-bold text-slate-200 text-xs tracking-wider uppercase flex items-center gap-2">
                        <Sliders className="h-4 w-4 text-indigo-400" /> System Design Guidelines
                      </h3>
                      <ul className="space-y-4">
                        {[
                          { title: "Stress-Reduced UI Framing", desc: "No flashing alerts or toxic clutter. Focused linear task guides." },
                          { title: "Proactive Buffer Placement", desc: "Creates 10%-25% buffer windows before real physical deadlines." },
                          { title: "Parkinson's Law Defense", desc: "Intentionally limits focus scopes to force progressive work blocks." },
                          { title: "Invasive Notification Grids", desc: "Escalates pushing systems dynamically when user penetrates buffer targets." }
                        ].map((item, index) => (
                          <li key={index} className="flex gap-3 text-xs leading-relaxed">
                            <Check className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                            <div>
                              <strong className="text-slate-200 text-xs block font-bold">{item.title}</strong>
                              <span className="text-slate-400 text-[11px] mt-0.5 block leading-normal">{item.desc}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-8 pt-4 border-t border-slate-900/60 text-[10px] text-slate-500 font-mono text-center">
                      Author: Singh Simar (singhsimr67@gmail.com)
                    </div>
                  </div>
                </div>

                {/* Central Block Diagram SVG */}
                <div className="bg-slate-900/20 border border-slate-900 rounded-3xl p-8 space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-200">Global Structural Blueprint &amp; Connectivity Flow</h3>
                    <p className="text-xs text-slate-500 mt-1">High-level architectural decoupling showing routing pipelines, background daemons, state persistence, and third-party API gateways.</p>
                  </div>

                  {/* SVG Architecture Diagram */}
                  <div className="overflow-x-auto py-2">
                    <div className="min-w-[850px] bg-slate-950/60 rounded-2xl p-6 border border-slate-900 relative">
                      <svg viewBox="0 0 1000 370" className="w-full text-slate-300 font-mono">

                        {/* CLIENT STACK */}
                        <g transform="translate(10, 45)">
                          <rect width="130" height="280" rx="10" fill="#020617" stroke="#1e293b" strokeWidth="1.5" />
                          <text x="65" y="24" textAnchor="middle" className="text-xs font-semibold fill-slate-400">CLIENT LAYER</text>

                          <rect x="15" y="55" width="100" height="50" rx="6" fill="#0f172a" stroke="#6366f1" strokeWidth="1.5" />
                          <text x="65" y="80" textAnchor="middle" className="text-[10px] fill-indigo-400 font-bold">Web App (React)</text>
                          <text x="65" y="93" textAnchor="middle" className="text-[8px] fill-slate-500">PWA Viewport</text>

                          <rect x="15" y="125" width="100" height="50" rx="6" fill="#0f172a" stroke="#1e293b" strokeWidth="1" />
                          <text x="65" y="150" textAnchor="middle" className="text-[10px] fill-slate-300">HTTP REST Client</text>
                          <text x="65" y="163" textAnchor="middle" className="text-[8px] fill-slate-500">Requests Handlers</text>

                          <rect x="15" y="195" width="100" height="50" rx="6" fill="#0f172a" stroke="#1e293b" strokeWidth="1" />
                          <text x="65" y="220" textAnchor="middle" className="text-[10px] fill-slate-300">SSE Listener</text>
                          <text x="65" y="233" textAnchor="middle" className="text-[8px] fill-slate-500">Real-Time Sync</text>
                        </g>

                        {/* API GATEWAY (FASTAPI) */}
                        <g transform="translate(190, 45)">
                          <rect width="180" height="280" rx="10" fill="#090d16" stroke="#1e293b" strokeWidth="1.5" />
                          <text x="90" y="24" textAnchor="middle" className="text-xs font-semibold fill-slate-400">FASTAPI ENTRANCE</text>

                          <rect x="15" y="55" width="150" height="50" rx="6" fill="#020617" stroke="#3b82f6" strokeWidth="1" />
                          <text x="90" y="80" textAnchor="middle" className="text-[10px] fill-blue-400 font-semibold font-mono">Router v1 (REST)</text>
                          <text x="90" y="93" textAnchor="middle" className="text-[8px] fill-slate-400">Payload Validation</text>

                          <rect x="15" y="125" width="150" height="50" rx="6" fill="#020617" stroke="#3b82f6" strokeWidth="1" />
                          <text x="90" y="150" textAnchor="middle" className="text-[10px] fill-blue-400 font-semibold font-mono">Authentication (JWT)</text>
                          <text x="90" y="163" textAnchor="middle" className="text-[8px] fill-slate-400">Rate Limit Filter</text>

                          <rect x="15" y="195" width="150" height="50" rx="6" fill="#020617" stroke="#3b82f6" strokeWidth="1" />
                          <text x="90" y="220" textAnchor="middle" className="text-[10px] fill-blue-400 font-semibold font-mono">SSE Controller</text>
                          <text x="90" y="233" textAnchor="middle" className="text-[8px] fill-slate-400">Client Alert Piping</text>
                        </g>

                        {/* SERVICE LAYERS & LANGCHAIN AGENT */}
                        <g transform="translate(420, 15)">
                          <rect width="250" height="340" rx="10" fill="#030712" stroke="#1e293b" strokeWidth="1.5" />
                          <text x="125" y="22" textAnchor="middle" className="text-xs font-semibold fill-slate-400">CORE SERVICES &amp; COGNITIVE EDGE</text>

                          <rect x="15" y="45" width="220" height="60" rx="8" fill="#090d16" stroke="#f59e0b" strokeWidth="1.5" />
                          <text x="125" y="68" textAnchor="middle" className="text-[10px] fill-amber-400 font-semibold font-mono">LangChain Agent Core</text>
                          <text x="125" y="82" textAnchor="middle" className="text-[8px] fill-slate-400">StateGraph execution loop</text>
                          <text x="125" y="95" textAnchor="middle" className="text-[8px] fill-slate-500">Evaluating sub-task decompositions</text>

                          <rect x="15" y="125" width="220" height="55" rx="6" fill="#090d16" stroke="#6366f1" strokeWidth="1" />
                          <text x="125" y="146" textAnchor="middle" className="text-[10px] fill-indigo-400 font-semibold">Task Service</text>
                          <text x="125" y="161" textAnchor="middle" className="text-[8px] fill-slate-400">Mathematical Urgency Engine</text>

                          <rect x="15" y="195" width="220" height="55" rx="6" fill="#090d16" stroke="#6366f1" strokeWidth="1" />
                          <text x="125" y="216" textAnchor="middle" className="text-[10px] fill-indigo-400 font-semibold">Scheduling Engine</text>
                          <text x="125" y="231" textAnchor="middle" className="text-[8px] fill-slate-400">Proactive Elastic Buffer Slices</text>

                          <rect x="15" y="265" width="220" height="60" rx="6" fill="#090d16" stroke="#6366f1" strokeWidth="1" />
                          <text x="125" y="286" textAnchor="middle" className="text-[10px] fill-indigo-400 font-semibold">Reminder Service</text>
                          <text x="125" y="301" textAnchor="middle" className="text-[8px] fill-slate-400">Passive alarm checker &amp; SMS escalators</text>
                          <text x="125" y="313" textAnchor="middle" className="text-[8px] fill-slate-500">Fires Twilio API hooks upon buffer failure</text>
                        </g>

                        {/* LOCAL DATA PERSISTENCE */}
                        <g transform="translate(720, 20)">
                          <rect width="250" height="155" rx="10" fill="#020617" stroke="#1e293b" strokeWidth="1.5" />
                          <text x="125" y="24" textAnchor="middle" className="text-xs font-semibold fill-slate-400">SQLITE STORAGE</text>

                          <rect x="15" y="45" width="220" height="90" rx="8" fill="#0f172a" stroke="#d946ef" strokeWidth="1.5" />
                          <text x="125" y="70" textAnchor="middle" className="text-[11px] fill-magenta text-fuchsia-400 font-semibold">SQLAlchemy ORM Engine</text>
                          <text x="125" y="85" textAnchor="middle" className="text-[8px] fill-slate-400">Write-Ahead Logging (WAL) Mode active</text>
                          <text x="125" y="100" textAnchor="middle" className="text-[8px] fill-slate-500">Supports concurrent transactions (SQLite)</text>
                          <text x="125" y="115" textAnchor="middle" className="text-[8px] fill-slate-500">Indexes on foreign keys and urgency scores</text>
                        </g>

                        {/* EXTERNAL API GATEWAYS */}
                        <g transform="translate(720, 195)">
                          <rect width="250" height="155" rx="10" fill="#020617" stroke="#1e293b" strokeWidth="1.5" />
                          <text x="125" y="24" textAnchor="middle" className="text-xs font-semibold fill-slate-400">EXTERNAL API INTEGRATIONS</text>

                          <rect x="15" y="45" width="220" height="42" rx="6" fill="#1e1b4b" stroke="#a5b4fc" strokeWidth="1" />
                          <text x="125" y="65" textAnchor="middle" className="text-[10px] fill-indigo-200 font-semibold">Google Gemini API Gateway</text>
                          <text x="125" y="77" textAnchor="middle" className="text-[8px] fill-indigo-300">Structured JSON Output Parsing</text>

                          <rect x="15" y="97" width="220" height="42" rx="6" fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />
                          <text x="125" y="115" textAnchor="middle" className="text-[10px] fill-slate-100 font-semibold">Twilio SMS / Web Push Channels</text>
                          <text x="125" y="127" textAnchor="middle" className="text-[8px] fill-slate-300">Escalated Priority Warning Delivery</text>
                        </g>

                        {/* FLOW CONNECTIONS */}
                        <path d="M 140 185 L 190 185" stroke="#1e293b" strokeWidth="2" strokeDasharray="3,3" />
                        <line x1="370" y1="185" x2="420" y2="185" stroke="#475569" strokeWidth="2" />

                        {/* Bidirectional DB link */}
                        <path d="M 670 100 L 720 100" stroke="#f59e0b" strokeWidth="2" />

                        {/* Services to external */}
                        <path d="M 670 280 L 720 280" stroke="#818cf8" strokeWidth="2" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Scenarios and Active Data Flows (Interactive) */}
                <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-8 space-y-6 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-200">Interactive System Data Flow Simulations</h3>
                      <p className="text-xs text-slate-500 mt-1 font-mono">Trace how data flows across Python services, LLM parsing hooks, and DB operations step-by-step.</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => { setActiveScenario('panic'); setScenarioStep(0); }}
                        className={`px-4 py-2.5 rounded-xl text-xs font-mono transition-all duration-150 cursor-pointer ${activeScenario === 'panic' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-900 hover:bg-slate-800 text-slate-400'}`}
                      >
                        Panic Ingestion Scenario
                      </button>
                      <button
                        onClick={() => { setActiveScenario('escalation'); setScenarioStep(0); }}
                        className={`px-4 py-2.5 rounded-xl text-xs font-mono transition-all duration-150 cursor-pointer ${activeScenario === 'escalation' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-900 hover:bg-slate-800 text-slate-400'}`}
                      >
                        Proactive Alarm Escalation
                      </button>
                    </div>
                  </div>

                  {/* Scenario visual map */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    <div className="lg:col-span-4 bg-slate-950/60 rounded-2xl p-6 border border-slate-900 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
                          <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-bold">
                            {activeScenario === 'panic' ? 'Ingestion Pipeline' : 'Backstop Pipeline'}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-200">
                          {activeScenario === 'panic'
                            ? '"Chemistry Finals tomorrow morning, havent started!"'
                            : 'Checking schedule and enforcing task buffer targets'}
                        </h4>
                        <p className="text-xs text-slate-400 leading-relaxed leading-normal">
                          {activeScenario === 'panic'
                            ? 'This scenario traces how chaotic language gets parsed via structured outputs from Gemini to populate SQLite with calculated boundaries.'
                            : 'This scenario showcases the proactive cron daemon scanning table boundaries and initiating messaging pathways.'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-4 mt-8 pt-4 border-t border-slate-900">
                        <div className="text-[11px] font-mono text-slate-500">STEP {scenarioStep + 1} OF 6</div>
                        <div className="flex gap-2">
                          <button
                            disabled={scenarioStep === 0}
                            onClick={() => setScenarioStep(prev => Math.max(0, prev - 1))}
                            className="px-3 py-1.5 text-xs bg-slate-900 hover:bg-slate-800 disabled:opacity-30 rounded-lg text-slate-300 cursor-pointer transition"
                          >
                            Prev
                          </button>
                          <button
                            disabled={scenarioStep === 5}
                            onClick={() => setScenarioStep(prev => Math.min(5, prev + 1))}
                            className="px-3 py-1.5 text-xs bg-indigo-600 disabled:opacity-30 rounded-lg text-white font-bold hover:bg-indigo-500 cursor-pointer transition shadow-[0_2px_8px_rgba(99,102,241,0.25)]"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-3">
                      {(activeScenario === 'panic' ? panicScenarioSteps : escalationScenarioSteps).map((step, idx) => {
                        const isActive = scenarioStep === idx;
                        const isPast = scenarioStep > idx;
                        return (
                          <div
                            key={idx}
                            onClick={() => setScenarioStep(idx)}
                            className={`p-5 rounded-2xl border transition-all duration-150 cursor-pointer flex flex-col justify-between ${isActive
                              ? 'bg-indigo-500/10 border-indigo-500/40 shadow-[0_4px_16px_rgba(99,102,241,0.08)]'
                              : isPast
                                ? 'bg-slate-900/10 border-slate-900/60 opacity-55'
                                : 'bg-slate-900/30 border-slate-900/80 hover:border-slate-800'
                              }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2">
                                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${isActive
                                  ? 'bg-indigo-600 text-white'
                                  : isPast
                                    ? 'bg-slate-800 text-slate-400'
                                    : 'bg-slate-900 text-slate-500'
                                  }`}>
                                  0{idx + 1}
                                </span>
                                {isActive && (
                                  <span className="text-[9px] text-indigo-400 bg-indigo-400/5 border border-indigo-400/20 px-1.5 py-0.2 rounded font-mono uppercase">
                                    ACTIVE STEP
                                  </span>
                                )}
                              </div>
                              <h5 className={`text-xs font-bold mt-3 ${isActive ? 'text-white' : 'text-slate-300'}`}>
                                {step.title}
                              </h5>
                              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                                {step.desc}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* FILES / FOLDER TREE TAB */}
            {activeTab === 'files' && (
              <motion.div
                key="files"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="p-8 max-w-7xl w-full mx-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8"
              >
                {/* Python Folder Explorer (Left Column) */}
                <div className="lg:col-span-5 bg-slate-900/40 border border-slate-900 rounded-3xl flex flex-col h-[560px] overflow-hidden shadow-xl">
                  <div className="px-5 py-4 bg-slate-900/90 border-b border-slate-950 flex items-center justify-between">
                    <span className="text-xs font-mono tracking-wider font-bold text-slate-300 uppercase flex items-center gap-2">
                      <Folder className="h-4 w-4 text-indigo-400" /> Standardized Folder Assembly
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">Python 3.14</span>
                  </div>

                  {/* Scrollable folder tree listing */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-slate-950/40 font-mono">
                    {renderFileTree(FOLDER_STRUCTURE)}
                  </div>
                </div>

                {/* Explainer Sidebar (Right Column) */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-8 min-h-[380px] flex flex-col justify-between shadow-xl">
                    {selectedFile ? (
                      <div className="space-y-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            {selectedFile.type === 'folder' ? (
                              <Folder className="h-5 w-5 text-amber-500 shrink-0" />
                            ) : (
                              <FileCode className="h-5 w-5 text-indigo-400 shrink-0" />
                            )}
                            <h3 className="text-base font-bold font-mono text-white tracking-tight">{selectedFile.name}</h3>
                          </div>
                          <span className="text-[10px] font-mono bg-slate-950 text-indigo-400 border border-indigo-500/10 px-2 rounded-md py-0.5 tracking-wider font-semibold uppercase">
                            {selectedFile.type}
                          </span>
                        </div>

                        <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-900">
                          <p className="text-xs text-slate-300 leading-relaxed font-sans">
                            {selectedFile.description}
                          </p>
                        </div>

                        {selectedFile.details && (
                          <div className="bg-slate-950/30 rounded-2xl p-5 text-xs space-y-2 border border-slate-900/60 leading-relaxed text-slate-400 font-sans">
                            {/* Parse quick markdown headings/bullet elements */}
                            {selectedFile.details.split('\n').map((line, lidx) => {
                              if (line.startsWith('###')) {
                                return <h4 key={lidx} className="font-bold text-white text-xs mt-4 mb-2 first:mt-0 uppercase tracking-wider">{line.replace('###', '')}</h4>;
                              }
                              if (line.startsWith('-')) {
                                return (
                                  <div key={lidx} className="flex gap-2 ml-2 pl-1 leading-relaxed">
                                    <span className="text-indigo-400 shrink-0">•</span>
                                    <span>{line.replace('-', '').trim()}</span>
                                  </div>
                                );
                              }
                              return <p key={lidx} className="my-1 leading-normal text-[11px]">{line}</p>;
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center py-20 text-slate-500">
                        <Folder className="h-10 w-10 mb-4 text-slate-700 animate-pulse" />
                        <p className="text-sm font-medium">Select a folder or source file on the left to inspect its role and responsibility.</p>
                      </div>
                    )}

                    <div className="pt-5 border-t border-slate-900 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <span className="text-[10px] font-mono text-slate-500 leading-relaxed">This folder layout utilizes standard Clean Architecture boundaries.</span>
                      <button
                        onClick={() => handleCopy(JSON.stringify(FOLDER_STRUCTURE, null, 2), 'schema')}
                        className="text-xs font-mono text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 px-4 py-2 border border-slate-900 rounded-xl transition cursor-pointer flex items-center gap-2 shadow-sm"
                      >
                        {copiedText === 'schema' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                        <span>Copy JSON Map</span>
                      </button>
                    </div>
                  </div>

                  {/* Technical Design Choice */}
                  <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-6 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 font-semibold uppercase">
                      <ShieldCheck className="h-4 w-4" /> Architect's Explainer: Modular Separation
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed leading-normal">
                      Splitting routing constraints (<code className="text-indigo-300">app/api</code>), business algorithms (<code className="text-indigo-300">app/services</code>), agentic triggers (<code className="text-indigo-300">app/agents</code>), and data modeling rules (<code className="text-indigo-300">app/db</code>) keeps code maintenance easy as the complexity scales. REST routes exist merely as Pydantic gateways. If the API layers shift (e.g. incorporating WebSockets or GraphQL), the mathematical core calculations in <code className="text-indigo-300">task_service</code> remain untouched.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* DATABASE DESIGN TAB */}
            {activeTab === 'db' && (
              <motion.div
                key="db"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="p-8 max-w-7xl w-full mx-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8"
              >
                {/* Table Selector Column (Left) */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-5 space-y-2 shadow-lg">
                    <span className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase block mb-4">
                      Relational Tables (SQLite)
                    </span>

                    {DATABASE_TABLES.map((table) => {
                      const active = selectedTable === table.name;
                      return (
                        <button
                          key={table.name}
                          onClick={() => setSelectedTable(table.name)}
                          className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left cursor-pointer transition-all duration-150 ${active
                            ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                            : 'bg-slate-900/30 border-slate-900 hover:border-slate-800 text-slate-300'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl ${active ? 'bg-indigo-500/15 text-indigo-400' : 'bg-slate-950 text-slate-500'}`}>
                              <Database className="h-4 w-4" />
                            </div>
                            <div>
                              <span className="font-mono text-xs font-bold block uppercase">{table.name}</span>
                              <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{table.description}</span>
                            </div>
                          </div>
                          <ChevronRight className={`h-4 w-4 shrink-0 transition-transform ${active ? 'transform translate-x-1 text-indigo-400' : 'text-slate-600'}`} />
                        </button>
                      );
                    })}
                  </div>

                  {/* Explainer panel */}
                  <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 space-y-4 shadow-lg">
                    <h4 className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center gap-2">
                      <Sliders className="h-4 w-4 text-indigo-400" /> SQLite + SQLAlchemy decisions
                    </h4>
                    <ul className="space-y-3 text-xs text-slate-400 leading-relaxed font-sans">
                      <li>
                        <strong className="text-slate-200 block">Why SQLite for a daemon agent?</strong>
                        Zero networking overhead. SQLite operates inside the application thread segment, enabling extremely fast query round-trips compared to remote cloud engines.
                      </li>
                      <li>
                        <strong className="text-slate-200 block">Parallel Write-Ahead Logging (WAL)</strong>
                        By executing <code className="text-indigo-400 bg-slate-950 font-mono px-1.5 py-0.5 rounded text-[10px]">journal_mode=WAL</code>, readers do not block write operations, allowing background cron alert executors to commit state without halting user queries.
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Schema Details & Tables Specification (Right) */}
                <div className="lg:col-span-8 space-y-6">
                  {DATABASE_TABLES.filter(t => t.name === selectedTable).map((table) => (
                    <div key={table.name} className="space-y-6">
                      {/* Header info */}
                      <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 space-y-4 shadow-xl">
                        <div>
                          <div className="flex items-center gap-2 text-[9px] font-mono text-rose-400 uppercase bg-rose-500/5 px-2.5 py-1 border border-rose-500/10 rounded-md w-fit font-bold">
                            SCHEMA SPECIFICATION
                          </div>
                          <h3 className="text-xl font-bold font-sans text-white mt-3">Table: {table.name.toUpperCase()}</h3>
                          <p className="text-xs text-slate-400 leading-relaxed mt-2">{table.description}</p>
                        </div>

                        {/* Display Columns table */}
                        <div className="overflow-x-auto border border-slate-900 rounded-2xl bg-slate-950/20">
                          <table className="w-full text-left font-mono border-collapse">
                            <thead>
                              <tr className="bg-slate-900 text-slate-400 text-[10px] border-b border-slate-950 font-bold">
                                <th className="p-3.5 pl-4">Column Name</th>
                                <th className="p-3.5">SQLite Type</th>
                                <th className="p-3.5">SQL Constraint</th>
                                <th className="p-3.5 pr-4">Description</th>
                              </tr>
                            </thead>
                            <tbody className="text-xs text-slate-300 divide-y divide-slate-950">
                              {table.columns.map((col) => (
                                <tr key={col.name} className="hover:bg-slate-900/20">
                                  <td className="p-3.5 pl-4 text-indigo-400 font-bold font-mono">{col.name}</td>
                                  <td className="p-3.5 text-slate-300 text-[11px]">{col.type}</td>
                                  <td className="p-3.5 text-slate-500 text-[10px]">
                                    {col.constraints.map((c, cnum) => (
                                      <span key={cnum} className="bg-slate-950 px-1.5 py-0.5 rounded mr-1 inline-block border border-slate-900">{c}</span>
                                    ))}
                                  </td>
                                  <td className="p-3.5 pr-4 text-slate-400 text-[11px] leading-relaxed">{col.description}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* DDL & Python SQLAlchemy Code Toggles */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 flex flex-col h-[340px] shadow-lg">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-mono text-slate-400 font-bold uppercase flex items-center gap-1.5">
                              <Code className="h-4 w-4 text-indigo-400" /> SQLAlchemy Backend Model
                            </span>
                            <button
                              onClick={() => handleCopy(table.sqlalchemyModel, 'sq_mod')}
                              className="text-[10px] font-mono text-slate-400 hover:text-white px-2.5 py-1 bg-slate-950 hover:bg-slate-900 border border-slate-900 rounded-lg transition cursor-pointer flex items-center gap-1"
                            >
                              {copiedText === 'sq_mod' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                              Copy model
                            </button>
                          </div>
                          <pre className="flex-1 overflow-auto bg-slate-950/80 p-4 rounded-2xl border border-slate-950 font-mono text-[10px] text-slate-300 leading-normal select-text">
                            {table.sqlalchemyModel}
                          </pre>
                        </div>

                        <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 flex flex-col h-[340px] shadow-lg">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-mono text-slate-400 font-bold uppercase flex items-center gap-1.5">
                              <Terminal className="h-4 w-4 text-blue-400" /> Raw SQLite DDL Schema
                            </span>
                            <button
                              onClick={() => handleCopy(table.sqliteDdl, 'sq_ddl')}
                              className="text-[10px] font-mono text-slate-400 hover:text-white px-2.5 py-1 bg-slate-950 hover:bg-slate-900 border border-slate-900 rounded-lg transition cursor-pointer flex items-center gap-1"
                            >
                              {copiedText === 'sq_ddl' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                              Copy DDL
                            </button>
                          </div>
                          <pre className="flex-1 overflow-auto bg-slate-950/80 p-4 rounded-2xl border border-slate-950 font-mono text-[10px] text-blue-300 leading-normal select-text">
                            {table.sqliteDdl}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* SERVICE LAYER TAB */}
            {activeTab === 'services' && (
              <motion.div
                key="services"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="p-8 max-w-7xl w-full mx-auto flex-1 space-y-8"
              >
                {/* Introduction to logic layers */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Services layout explainer */}
                  <div className="lg:col-span-8 space-y-6">
                    {SERVICE_LAYERS.map((service) => (
                      <div key={service.id} className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6.5 space-y-5 shadow-lg">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl">
                              <Layers className="h-5 w-5" />
                            </div>
                            <h3 className="text-base font-extrabold text-white font-sans">{service.name}</h3>
                          </div>
                          <span className="text-[9px] font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-400 tracking-wider">SERVICE CLASS</span>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-4 rounded-2xl border border-slate-950/60 font-sans">
                          {service.purpose}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                          <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-900">
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">SERVICE BOUNDARY INPUTS</div>
                            <div className="space-y-1.5 mt-2.5">
                              {service.inputs.map((inp, inIdx) => (
                                <div key={inIdx} className="flex gap-2 text-[11px] text-slate-300 leading-normal">
                                  <span className="text-indigo-400">→</span> <span>{inp}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-900">
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">SERVICE RESPONSES / ACTIONS</div>
                            <div className="space-y-1.5 mt-2.5">
                              {service.outputs.map((out, outIdx) => (
                                <div key={outIdx} className="flex gap-2 text-[11px] text-slate-300 leading-normal">
                                  <span className="text-indigo-400">←</span> <span>{out}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="text-xs text-slate-400 leading-relaxed font-sans space-y-2 border-t border-slate-900/80 pt-4.5">
                          <strong className="text-slate-300 block text-xs">Architectural Mechanics:</strong>
                          {/* Render details parsed */}
                          {service.architectureDetails.split('\n').map((line, lidx) => {
                            if (line.startsWith('###')) {
                              return <h5 key={lidx} className="font-bold text-white text-[11px] mt-3.5 mb-1 bg-slate-900/40 px-2 py-0.5 w-fit rounded">{line.replace('###', '')}</h5>;
                            }
                            if (line.startsWith('-')) {
                              return (
                                <div key={lidx} className="flex gap-2 ml-2 pl-1 leading-normal text-[11px] text-slate-400">
                                  <span className="text-indigo-400 shrink-0">•</span>
                                  <span>{line.replace('-', '').trim()}</span>
                                </div>
                              );
                            }
                            return <p key={lidx} className="text-[11px] leading-relaxed my-1">{line}</p>;
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* INTERACTIVE ALGORITHM SIMULATOR (Right Column) */}
                  <div className="lg:col-span-4 space-y-6">
                    <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-900 rounded-3xl p-6.5 sticky top-[90px] space-y-6 shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-[0.02] text-indigo-400 select-none">
                        <Sliders size={120} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 text-[9px] font-mono text-indigo-400 font-bold uppercase bg-indigo-500/5 px-2.5 py-1 border border-indigo-500/10 rounded-md w-fit">
                          <Activity className="h-3 w-3" /> Live Urgency Simulator
                        </div>
                        <h4 className="text-sm font-bold text-slate-200 mt-3">TaskService Priority Algorithm</h4>
                        <p className="text-xs text-slate-500 mt-1 leading-normal">
                          Flesh out different time horizons and complexity matrices to observe how the background service scores priority.
                        </p>
                      </div>

                      {/* Slider inputs */}
                      <div className="space-y-4 font-mono text-xs text-slate-300">

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span>Hours to Deadline:</span>
                            <span className="text-white font-bold">{simHoursRemaining} hrs</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="72"
                            value={simHoursRemaining}
                            onChange={(e) => setSimHoursRemaining(Number(e.target.value))}
                            className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                          />
                          <div className="flex justify-between text-[9px] text-slate-600">
                            <span>1 hr</span>
                            <span>24 hr</span>
                            <span>72 hr</span>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between font-mono">
                            <span>Complexity Level (1-5):</span>
                            <span className="text-white font-bold">Lvl {simComplexity}</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="5"
                            value={simComplexity}
                            onChange={(e) => setSimComplexity(Number(e.target.value))}
                            className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                          />
                          <div className="flex justify-between text-[9px] text-slate-600">
                            <span>1 (Simple)</span>
                            <span>5 (Monolithic)</span>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span>Delay Factor (Laziness Multiplier):</span>
                            <span className="text-white font-semibold">x{simProcrastination}</span>
                          </div>
                          <input
                            type="range"
                            min="0.8"
                            max="2.5"
                            step="0.1"
                            value={simProcrastination}
                            onChange={(e) => setSimProcrastination(Number(e.target.value))}
                            className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                          />
                          <div className="flex justify-between text-[9px] text-slate-600">
                            <span>0.8 (Diligent)</span>
                            <span>1.5 (Procrastinator)</span>
                            <span>2.5 (Extreme Overload)</span>
                          </div>
                        </div>

                      </div>

                      {/* Live result display */}
                      <div className="pt-5 border-t border-slate-900 space-y-4">
                        <div className="bg-slate-950 rounded-2xl p-4.5 border border-slate-900 space-y-3">
                          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-semibold">CALCULATED METRIC RESULT</div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-4xl font-extrabold text-white font-mono tracking-tight">{calculatedUrgency}</span>
                            <span className="text-slate-500 font-mono text-xs">/ 10.0</span>
                          </div>

                          {/* Dynamic category badge */}
                          <div className={`text-[10px] font-mono border font-bold px-2 py-1.5 rounded-lg text-center ${status.color}`}>
                            {status.label}
                          </div>
                        </div>

                        {/* Timeline impact */}
                        <div className="space-y-3">
                          <h5 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Scheduled Proactive Backstops</h5>

                          <div className="space-y-2 font-mono text-[10px]">
                            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-950/50 border border-slate-900/60 text-slate-400">
                              <Clock className="h-4 w-4 text-indigo-400 shrink-0" />
                              <div>
                                <strong className="text-slate-200">Elastic Buffer Locked</strong>
                                <span className="block mt-0.5 text-slate-500 leading-normal">Scheduled {Math.max(1, Math.round(simHoursRemaining * 0.25))} hours ahead of deadline.</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-950/50 border border-slate-900/60 text-slate-400">
                              <Bell className="h-4 w-4 text-amber-500 shrink-0" />
                              <div>
                                <strong className="text-slate-200">Reminders Escalation Setup</strong>
                                <span className="block mt-0.5 text-slate-500 leading-normal text-[9px]">
                                  {calculatedUrgency > 0.8
                                    ? 'Bypassing quiet boundaries. Twilio SMS fallback triggered every 15 minutes.'
                                    : 'Suppressed during quiet periods. Push notification triggered at buffer window.'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* AGENT & GEMINI INTEGRATION TAB */}
            {activeTab === 'agent' && (
              <motion.div
                key="agent"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="p-8 max-w-7xl w-full mx-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8"
              >
                {/* Agent Flow Nodes Map (Left Column) */}
                <div className="lg:col-span-6 space-y-6">
                  <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-8 space-y-6 shadow-xl">
                    <div>
                      <span className="text-[9px] font-mono tracking-widest font-bold text-amber-400 uppercase bg-amber-400/5 px-2.5 py-1 border border-amber-400/10 rounded mr-2 inline-block">
                        LANGCHAIN STATEGRAPH FLOW
                      </span>
                      <h3 className="text-lg font-bold text-white mt-3">Executive Brain Cyclic Iteration Loop</h3>
                      <p className="text-xs text-slate-400 leading-normal mt-1.5">Below represents the state boundaries running sequentially inside the Python LangChain execution thread.</p>
                    </div>

                    {/* Flow Steps Diagram */}
                    <div className="relative border-l-2 border-slate-800 ml-4 pl-6 space-y-6 my-2">
                      {LANGCHAIN_AGENT.graphNodes.map((node, nidx) => (
                        <div key={node.id} className="relative">
                          {/* Dot marker */}
                          <div className="absolute -left-[31px] top-0.5 h-4 w-4 rounded-full bg-slate-950 border-2 border-indigo-500 flex items-center justify-center scale-[1.1] shadow-md z-10">
                            <span className="text-[8px] font-mono text-indigo-400 font-bold">{nidx + 1}</span>
                          </div>
                          <h4 className="text-xs font-bold font-mono text-white tracking-wide">{node.name}</h4>
                          <p className="text-[11px] text-slate-400 leading-relaxed mt-1">{node.desc}</p>
                        </div>
                      ))}
                    </div>

                    <div className="bg-slate-950/80 p-5 border border-slate-900 rounded-2xl leading-relaxed">
                      <strong className="text-xs font-mono text-slate-300 block mb-2 font-bold uppercase tracking-wider">Cognitive Buffer Directives</strong>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        The core graph is strictly configured with linear validation valves. Procrastinating users often lie about details (e.g. "writing a 20-page thesis in 2 hours"). The <code className="text-indigo-400">urgency_validator</code> acts as a safety barrier that evaluates parameters against physical timelines prior to writing task entries.
                      </p>
                    </div>
                  </div>

                  {/* Large custom agent system prompt instructions */}
                  <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6.5 flex flex-col h-[340px] shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-mono text-slate-300 font-bold uppercase flex items-center gap-1.5">
                        <Terminal className="h-3.5 w-3.5 text-amber-500" /> Cognitive Restructuring Prompt
                      </span>
                      <button
                        onClick={() => handleCopy(LANGCHAIN_AGENT.systemPrompt, 'prompt')}
                        className="text-[10px] font-mono text-slate-400 hover:text-white px-2.5 py-1 bg-slate-950 hover:bg-slate-900 border border-slate-900 rounded-lg transition cursor-pointer flex items-center gap-1"
                      >
                        {copiedText === 'prompt' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        Copy Prompt
                      </button>
                    </div>
                    <pre className="flex-1 overflow-auto bg-slate-950 p-4 rounded-2xl border border-slate-950 font-mono text-[10.5px] text-slate-300 leading-normal select-text">
                      {LANGCHAIN_AGENT.systemPrompt}
                    </pre>
                  </div>
                </div>

                {/* Tools & Gemini Integration details (Right Column) */}
                <div className="lg:col-span-6 space-y-6">

                  {/* SDK API config details */}
                  <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-8 space-y-4 shadow-xl">
                    <div className="flex items-center gap-2.5">
                      <div className="h-6 w-6 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                        <Key className="h-4 w-4" />
                      </div>
                      <h3 className="text-sm font-extrabold text-white font-sans uppercase tracking-wider">Google Gemini integration Pipeline</h3>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/40 p-4 rounded-xl border border-slate-950 font-sans">
                      Utilizes the official modern <code className="text-indigo-300 font-bold">google-genai</code> Python package, taking advantage of Native Structured JSON output models to guarantee zero-shot parsing predictability.
                    </p>

                    <div className="space-y-4 font-mono">
                      <div className="bg-slate-900 border border-slate-950 rounded-2xl p-4.5 bg-slate-950/20">
                        <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mb-2.5">SDK Client Instantiation</div>
                        <pre className="font-mono text-[10px] text-indigo-200 overflow-x-auto bg-slate-950 p-3.5 rounded-xl border border-slate-900 select-text">
                          {GEMINI_INTEGRATION.sdkInitialization}
                        </pre>
                      </div>

                      <div className="bg-slate-900 border border-slate-950 rounded-2xl p-4.5 bg-slate-950/20">
                        <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mb-2.5">Pydantic Structured Output Constraint</div>
                        <pre className="font-mono text-[10px] text-indigo-200 overflow-x-auto bg-slate-950 p-3.5 rounded-xl border border-slate-900 select-text">
                          {GEMINI_INTEGRATION.structuredOutputSchema}
                        </pre>
                      </div>

                      <div className="bg-slate-900 border border-slate-950 rounded-2xl p-4.5 bg-slate-950/20">
                        <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mb-2.5">Execution API Logic Call</div>
                        <pre className="font-mono text-[10px] text-indigo-200 overflow-x-auto bg-slate-950 p-3.5 rounded-xl border border-slate-900 select-text">
                          {GEMINI_INTEGRATION.pipelineCall}
                        </pre>
                      </div>
                    </div>
                  </div>

                  {/* Gemini fallback strategy */}
                  <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6.5 space-y-3 shadow-xl">
                    <h4 className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center gap-1.5">
                      <ShieldCheck className="h-4.5 w-4.5 text-emerald-400" /> Pipeline Resiliency &amp; Exception Handling
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed font-sans">
                      Losing API access during high-urgency windows could leave a user stranded before a critical deadline. The scheduling service integrates explicit offline routing strategies:
                    </p>
                    <ul className="space-y-2 text-xs text-slate-400 list-disc ml-4 pl-1 font-sans">
                      <li><strong>Exponential Backoff with Jitter</strong>: Auto-retry on HTTP 429 schemas to survive brief connection gaps.</li>
                      <li><strong>Deduction Fallbacks</strong>: If unstructured boundaries leak or JSON schemas fail, the pipeline falls back to worst-case assumptions (1.5 hours of complexity, 2-hour shock shift offset).</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}

            {/* API SPECIFICATIONS TAB */}
            {activeTab === 'api' && (
              <motion.div
                key="api"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="p-8 max-w-7xl w-full mx-auto space-y-6"
              >
                {/* Introduction header */}
                <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-8 shadow-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono font-bold px-2.5 py-1 rounded border border-blue-500/20 bg-blue-500/5 text-blue-400 uppercase tracking-widest">FASTAPI SWAGGER DOCS</span>
                    <span className="text-xs text-slate-500 font-mono">http://localhost:3000/docs</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mt-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300 leading-tight">Version 1 REST Endpoints OpenAPI Reference</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mt-2 font-sans">
                    Exposes synchronous payloads, authorization token gateways, and asynchronous triggers to manage the SQLite transaction stack.
                  </p>
                </div>

                {/* Endpoints specification */}
                <div className="space-y-6">
                  {API_ENDPOINTS.map((endpoint) => (
                    <div key={endpoint.path} className="bg-slate-900/40 border border-slate-900 rounded-3xl overflow-hidden shadow-xl">
                      {/* REST Row Header */}
                      <div className="px-6 py-4.5 bg-slate-900/90 border-b border-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] font-mono font-extrabold px-3 py-1 rounded-lg shadow-sm border ${endpoint.method === 'POST' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                            }`}>
                            {endpoint.method}
                          </span>
                          <code className="text-xs font-mono font-bold text-white">{endpoint.path}</code>
                        </div>
                        <span className="text-xs text-slate-300 font-medium font-sans">{endpoint.summary}</span>
                      </div>

                      {/* Endpoint body analysis */}
                      <div className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 bg-slate-950/15">
                        <div className="lg:col-span-4 space-y-5">
                          <div>
                            <strong className="text-xs text-slate-200 font-bold block mb-1.5 font-sans uppercase tracking-wider text-[11px]">Functional Impact:</strong>
                            <p className="text-xs text-slate-400 leading-relaxed font-sans">{endpoint.description}</p>
                          </div>

                          <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-900 text-xs text-slate-400 font-sans">
                            <strong className="text-slate-200 block mb-2 font-bold uppercase tracking-wider text-[11px]">Validation Rules:</strong>
                            <ul className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-900 text-[11px] list-inside list-disc text-slate-400">
                              <li>Enforces CORS filters.</li>
                              <li>JWT bearer extraction.</li>
                              <li>Rate-limited at 20 calls/min.</li>
                            </ul>
                          </div>
                        </div>

                        {/* Code representations for JSON schemas */}
                        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6 font-mono">

                          {endpoint.requestBody ? (
                            <div className="flex flex-col h-[280px]">
                              <div className="flex items-center justify-between mb-2.5">
                                <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">Example Request Body</span>
                                <button
                                  onClick={() => handleCopy(endpoint.requestBody!, `req_${endpoint.path}`)}
                                  className="text-[10px] font-mono text-slate-400 hover:text-white px-2.5 py-1 bg-slate-900/60 hover:bg-slate-800 border border-slate-800 rounded-md cursor-pointer transition flex items-center"
                                >
                                  {copiedText === `req_${endpoint.path}` ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                                </button>
                              </div>
                              <pre className="flex-1 overflow-auto bg-slate-950 p-4 border border-slate-900 rounded-2xl text-[10.5px] text-slate-300 leading-normal select-text">
                                {endpoint.requestBody}
                              </pre>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-800/60 rounded-2xl p-8 text-slate-500 text-xs h-[280px] bg-slate-950/20 font-sans">
                              <p className="font-semibold">No Request Body required</p>
                              <span className="text-[10px] text-slate-600 block mt-1">Queries passed as paths or standard headers</span>
                            </div>
                          )}

                          <div className="flex flex-col h-[280px]">
                            <div className="flex items-center justify-between mb-2.5">
                              <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">Example Response (200 OK)</span>
                              <button
                                onClick={() => handleCopy(endpoint.responseBody, `res_${endpoint.path}`)}
                                className="text-[10px] font-mono text-slate-400 hover:text-white px-2.5 py-1 bg-slate-900/60 hover:bg-slate-800 border border-slate-800 rounded-md cursor-pointer transition flex items-center"
                              >
                                {copiedText === `res_${endpoint.path}` ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                            <pre className="flex-1 overflow-auto bg-slate-950 p-4 border border-slate-900 rounded-2xl text-[10.5px] text-blue-300 leading-normal select-text">
                              {endpoint.responseBody}
                            </pre>
                          </div>

                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Persistent Page Footer */}
        <footer className="border-t border-slate-900 bg-slate-950/90 py-6 px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500 shrink-0 select-none">
          <div>
            NOVA NOVA System Design Specification
          </div>
          <div className="flex items-center gap-4">
            <span>Author: singhsimr67@gmail.com</span>
            <span className="h-4 border-l border-slate-800" />
            <span>June 2026 Edition</span>
          </div>
        </footer>
      </main>

    </div>
  );
}
