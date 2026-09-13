import React from 'react';
import { ShieldCheck, Cpu, Bell, Activity } from 'lucide-react';

interface NavbarProps {
  inferenceMode?: string;
  modelVersion?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  inferenceMode = 'demo',
  modelVersion = 'v1.0.0-demo'
}) => {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🧅</span>
          <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 text-lg tracking-tight">
            ONIONVISION AI
          </span>
        </div>
        <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
          SIH 2026
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Model status indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs">
          <Cpu className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-400">Mode:</span>
          <span className="font-semibold uppercase tracking-wider text-emerald-400">
            {inferenceMode}
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 font-mono text-[11px]">{modelVersion}</span>
        </div>

        {/* Live system health ping */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="hidden md:inline">CV Engine Online</span>
        </div>
      </div>
    </header>
  );
};
