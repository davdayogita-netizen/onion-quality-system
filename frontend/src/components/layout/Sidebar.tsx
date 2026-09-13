import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ScanSearch, 
  History, 
  Settings, 
  FileText,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/inspect', label: 'Inspect Onion', icon: ScanSearch },
    { to: '/history', label: 'Inspection History', icon: History },
    { to: '/settings', label: 'Settings & Models', icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900/40 backdrop-blur-xl flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-6">
        <div className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Operations
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer info widget */}
      <div className="p-4 m-3 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-2 text-xs text-slate-400">
        <div className="flex items-center justify-between text-slate-300 font-semibold">
          <span>FastAPI + YOLO</span>
          <span className="text-[10px] text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/10">v1.0</span>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-400">
          Smart India Hackathon 2026 computer-vision onion sorting prototype.
        </p>
        <a
          href="/docs"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-medium text-[11px] pt-1"
        >
          API Swagger Docs <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </aside>
  );
};
