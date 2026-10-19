import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Target,
  Send,
  History,
  Users,
  Settings,
  Sparkles,
  LogOut,
  ChevronDown,
  Building2,
  ShieldCheck,
  Crown
} from 'lucide-react';

export default function Sidebar({ user, workspaces, currentWorkspace, onSwitchWorkspace, onLogout }) {
  const navigate = useNavigate();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { to: '/leads', label: 'Lead Finder', icon: Target, badge: 'AI Agent' },
    { to: '/campaigns', label: 'Outreach & SMTP', icon: Send, badge: null },
    { to: '/history', label: 'History & CRM', icon: History, badge: null },
    { to: '/team', label: 'Team Workspaces', icon: Users, badge: null },
    { to: '/settings', label: 'Settings', icon: Settings, badge: null },
  ];

  return (
    <aside className="w-64 bg-[#0F172A]/95 border-r border-slate-800/80 flex flex-col justify-between shrink-0 h-screen sticky top-0 z-30 select-none">
      <div>
        {/* Brand Logo & Header */}
        <div className="p-5 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-white">LeadGen</span>
                <span className="text-xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">AI</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">B2B SaaS Growth Engine</p>
            </div>
          </div>

          {/* Workspace Switcher Pill */}
          <div className="mt-4 pt-3 border-t border-slate-800/60">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Active Workspace
            </label>
            <div className="relative">
              <select
                value={currentWorkspace?.id || ''}
                onChange={(e) => onSwitchWorkspace(Number(e.target.value))}
                className="w-full appearance-none bg-slate-900/80 border border-slate-700/70 hover:border-slate-600 text-xs text-slate-200 font-medium rounded-lg px-3 py-2 pr-8 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
              >
                {workspaces && workspaces.length > 0 ? (
                  workspaces.map((ws) => (
                    <option key={ws.id} value={ws.id} className="bg-slate-900 text-slate-200">
                      {ws.name} ({ws.role || 'Member'})
                    </option>
                  ))
                ) : (
                  <option value="">Default Workspace</option>
                )}
              </select>
              <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none hidden" />
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}

          {/* Admin-only Nexus link — only visible to platform admins */}
          {user?.role === 'admin' && (
            <>
              <div className="pt-2 pb-1">
                <div className="border-t border-slate-800/60" />
              </div>
              <NavLink
                to="/nexus"
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                    isActive
                      ? 'bg-violet-600/15 text-violet-400 border border-violet-500/30 shadow-sm'
                      : 'text-slate-500 hover:text-violet-400 hover:bg-violet-500/10 border border-transparent'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4 transition-transform group-hover:scale-110" />
                  <span>Nexus Panel</span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/25">Admin</span>
              </NavLink>
            </>
          )}
        </nav>
      </div>

      {/* User Profile & Logout Bottom Section */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 ${
              user?.role === 'admin'
                ? 'bg-gradient-to-br from-violet-500 to-purple-600'
                : 'bg-gradient-to-br from-indigo-500 to-purple-600'
            }`}>
              {user?.role === 'admin'
                ? <Crown className="w-4 h-4" />
                : (user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U')
              }
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.name || 'LeadGen User'}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email || 'user@example.com'}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
