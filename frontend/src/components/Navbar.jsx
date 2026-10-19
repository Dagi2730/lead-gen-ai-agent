import React from 'react';
import { Bell, Sparkles, Shield, Zap, Search } from 'lucide-react';

export default function Navbar({ title = "Dashboard", subtitle = "Real-time Prospecting & Intelligence", currentWorkspace }) {
  return (
    <header className="h-16 border-b border-slate-800/80 bg-[#0F172A]/70 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          {title}
        </h1>
        <p className="text-xs text-slate-400 font-medium">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Status indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>AI Engine Active</span>
        </div>

        {/* Workspace badge */}
        {currentWorkspace && (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>{currentWorkspace.name}</span>
          </div>
        )}
      </div>
    </header>
  );
}
