import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Users, BarChart3, Activity, Trash2,
  ToggleLeft, ToggleRight, Crown, User as UserIcon,
  RefreshCw, AlertTriangle, CheckCircle2, Clock,
  Mail, Globe, ChevronDown, Lock
} from 'lucide-react';

export default function NexusView({ apiBaseUrl, token, user }) {
  const [tab, setTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [sRes, uRes, aRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/v1/nexus/stats`, { headers }),
        fetch(`${apiBaseUrl}/api/v1/nexus/users`, { headers }),
        fetch(`${apiBaseUrl}/api/v1/nexus/audit-log`, { headers }),
      ]);
      if (sRes.ok) setStats(await sRes.json());
      if (uRes.ok) setUsers(await uRes.json());
      if (aRes.ok) setAuditLog(await aRes.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const showMsg = (msg, ok = true) => {
    setActionMsg({ text: msg, ok });
    setTimeout(() => setActionMsg(null), 3500);
  };

  const handleRoleToggle = async (u) => {
    const newRole = u.role === 'admin' ? 'user' : 'admin';
    const res = await fetch(`${apiBaseUrl}/api/v1/nexus/users/${u.id}/role`, {
      method: 'PATCH',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole })
    });
    if (res.ok) {
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: newRole } : x));
      showMsg(`${u.email} is now ${newRole}`);
    } else showMsg('Role update failed', false);
  };

  const handleToggleActive = async (u) => {
    const res = await fetch(`${apiBaseUrl}/api/v1/nexus/users/${u.id}/toggle-active`, {
      method: 'PATCH', headers
    });
    if (res.ok) {
      const data = await res.json();
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_active: data.is_active } : x));
      showMsg(`${u.email} ${data.is_active ? 'enabled' : 'disabled'}`);
    } else showMsg('Toggle failed', false);
  };

  const handleDelete = async (u) => {
    const res = await fetch(`${apiBaseUrl}/api/v1/nexus/users/${u.id}`, {
      method: 'DELETE', headers
    });
    if (res.ok) {
      setUsers(prev => prev.filter(x => x.id !== u.id));
      showMsg(`${u.email} deleted`);
    } else showMsg('Delete failed', false);
    setConfirmDelete(null);
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center text-slate-500 gap-3">
      <RefreshCw className="w-5 h-5 animate-spin text-violet-500" />
      <span className="text-sm font-semibold">Loading Nexus Control Center…</span>
    </div>
  );

  const TABS = [
    { id: 'stats',   label: 'Platform Stats',  icon: BarChart3 },
    { id: 'users',   label: 'User Management', icon: Users },
    { id: 'audit',   label: 'Audit Log',        icon: Activity },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shadow-lg shadow-violet-500/10">
            <ShieldCheck className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Nexus Control Center
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/25 uppercase tracking-wider">Admin Only</span>
            </h2>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Platform-wide user management, analytics & audit trail
            </p>
          </div>
        </div>
        <button onClick={fetchAll}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 transition-colors cursor-pointer">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Action Banner */}
      {actionMsg && (
        <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${actionMsg.ok ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'}`}>
          {actionMsg.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          {actionMsg.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center bg-slate-900/80 border border-slate-800 p-1 rounded-xl gap-1 w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${tab === t.id ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}>
            <t.icon className="w-3.5 h-3.5" />{t.label}
          </button>
        ))}
      </div>

      {/* ── STATS TAB ── */}
      {tab === 'stats' && stats && (
        <div className="space-y-6">
          {/* KPI Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Users',       value: stats.users.total,       sub: `${stats.users.active} active`,       color: 'violet', icon: Users },
              { label: 'Disabled Accounts', value: stats.users.disabled,    sub: 'Need review',                        color: 'rose',   icon: Lock },
              { label: 'Workspaces',        value: stats.workspaces,        sub: 'Active orgs',                        color: 'blue',   icon: Globe },
              { label: 'Search Sessions',   value: stats.search_sessions,   sub: 'AI agent runs',                      color: 'cyan',   icon: Activity },
            ].map(k => (
              <div key={k.label} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{k.label}</span>
                  <k.icon className={`w-4 h-4 text-${k.color}-400 opacity-70`} />
                </div>
                <p className={`text-3xl font-black text-${k.color}-400`}>{k.value.toLocaleString()}</p>
                <p className="text-[11px] text-slate-500">{k.sub}</p>
              </div>
            ))}
          </div>

          {/* Leads + Emails */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2"><BarChart3 className="w-4 h-4 text-blue-400" /> Lead Pipeline</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Total Leads</span>
                  <span className="font-bold text-white">{stats.leads.total.toLocaleString()}</span>
                </div>
                {Object.entries(stats.leads.by_status).map(([status, count]) => (
                  <div key={status} className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 capitalize">{status}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${stats.leads.total ? (count / stats.leads.total) * 100 : 0}%` }} />
                      </div>
                      <span className="font-semibold text-slate-300 w-6 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2"><Mail className="w-4 h-4 text-emerald-400" /> Email Dispatch</h3>
              <div className="space-y-3">
                {[
                  { label: 'Total Sent',  value: stats.emails.total,     color: 'text-white' },
                  { label: 'Real SMTP',   value: stats.emails.sent,      color: 'text-emerald-400' },
                  { label: 'Simulated',   value: stats.emails.simulated, color: 'text-blue-400' },
                ].map(e => (
                  <div key={e.label} className="flex justify-between text-xs">
                    <span className="text-slate-400">{e.label}</span>
                    <span className={`font-bold ${e.color}`}>{e.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── USERS TAB ── */}
      {tab === 'users' && (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Workspaces</th>
                <th className="py-3 px-4">Leads</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map(u => (
                <tr key={u.id} className={`hover:bg-slate-800/30 transition-colors ${!u.is_active ? 'opacity-50' : ''}`}>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${u.role === 'admin' ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' : 'bg-slate-700 text-slate-300'}`}>
                        {u.role === 'admin' ? <Crown className="w-3.5 h-3.5" /> : <UserIcon className="w-3.5 h-3.5" />}
                      </div>
                      <span className="font-semibold text-slate-100">{u.name || '—'}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400">{u.email}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${u.role === 'admin' ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' : 'bg-slate-700/50 text-slate-400 border-slate-600'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-semibold">{u.workspaces}</td>
                  <td className="py-3 px-4 text-center font-semibold">{u.leads_generated}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${u.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                      {u.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Don't allow actions on self */}
                      {u.email !== user?.email ? (
                        <>
                          <button onClick={() => handleRoleToggle(u)} title={`Make ${u.role === 'admin' ? 'user' : 'admin'}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-violet-400 hover:bg-violet-500/10 transition-colors cursor-pointer">
                            <Crown className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleToggleActive(u)} title={u.is_active ? 'Disable' : 'Enable'}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer">
                            {u.is_active ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => setConfirmDelete(u)} title="Delete user"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] text-slate-600 italic px-2">you</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── AUDIT LOG TAB ── */}
      {tab === 'audit' && (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="py-3 px-4">Recipient</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">User ID</th>
                <th className="py-3 px-4">Step</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {auditLog.map(l => (
                <tr key={l.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-300">{l.recipient_email}</td>
                  <td className="py-3 px-4 text-slate-400 max-w-xs truncate">{l.subject}</td>
                  <td className="py-3 px-4 text-slate-500">#{l.user_id}</td>
                  <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold">Step {l.step_number}</span></td>
                  <td className="py-3 px-4">
                    {l.status === 'sent' ? <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Sent</span>
                      : l.status === 'simulated' ? <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">Simulated</span>
                      : <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">Failed</span>}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-500 text-[11px] font-mono">
                    {l.sent_at ? new Date(l.sent_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                </tr>
              ))}
              {auditLog.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-slate-500">No dispatch activity recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111827] border border-rose-500/30 rounded-2xl w-full max-w-sm p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/25 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Delete User</h3>
                <p className="text-xs text-slate-400 mt-0.5">This action is permanent and cannot be undone.</p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700 text-xs font-mono text-slate-300">
              {confirmDelete.email}
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700 cursor-pointer">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-500/20 cursor-pointer">
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
