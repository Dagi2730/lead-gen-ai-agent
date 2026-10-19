import React, { useState, useEffect } from 'react';
import {
  Users,
  Building2,
  Plus,
  Shield,
  UserCheck,
  User,
  Trash2,
  Mail,
  CheckCircle2,
  Loader2,
  X
} from 'lucide-react';

export default function WorkspacesView({ apiBaseUrl, token, currentWorkspace, onWorkspaceCreated }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Workspace Modal
  const [showCreateWs, setShowCreateWs] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [creatingWs, setCreatingWs] = useState(false);

  // Invite Member Modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState(null);

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  useEffect(() => {
    if (currentWorkspace?.id) {
      fetchMembers(currentWorkspace.id);
    }
  }, [currentWorkspace]);

  const fetchWorkspaces = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiBaseUrl}/api/v1/workspaces`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWorkspaces(data);
      }
    } catch (err) {
      console.error('Failed to load workspaces:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async (wsId) => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/workspaces/${wsId}/members`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (err) {
      console.error('Failed to fetch workspace members:', err);
    }
  };

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!newWsName.trim()) return;

    setCreatingWs(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/workspaces`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: newWsName.trim() })
      });

      if (res.ok) {
        setNewWsName('');
        setShowCreateWs(false);
        fetchWorkspaces();
        if (onWorkspaceCreated) onWorkspaceCreated();
      }
    } catch (err) {
      console.error('Failed to create workspace:', err);
    } finally {
      setCreatingWs(false);
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !currentWorkspace) return;

    setInviting(true);
    setInviteMsg(null);

    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/workspaces/${currentWorkspace.id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to add member');

      setInviteMsg({ success: true, message: data.message || 'Teammate added successfully!' });
      setInviteEmail('');
      fetchMembers(currentWorkspace.id);
    } catch (err) {
      setInviteMsg({ success: false, message: err.message });
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Are you sure you want to remove this member from the workspace?')) return;

    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/workspaces/${currentWorkspace.id}/members/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchMembers(currentWorkspace.id);
      }
    } catch (err) {
      console.error('Failed to remove member:', err);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-blue-400" />
            Team Workspaces & Roles
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Collaborate across shared lead lists, manage team member permissions, and organize multi-user sales pipelines.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateWs(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-blue-400" />
            <span>New Workspace</span>
          </button>

          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Mail className="w-4 h-4" />
            <span>Invite Teammate</span>
          </button>
        </div>
      </div>

      {/* Workspaces Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          Your Organizations & Workspaces
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {workspaces.map((ws) => (
            <div
              key={ws.id}
              className={`p-5 rounded-2xl border transition-all ${
                ws.id === currentWorkspace?.id
                  ? 'bg-blue-600/10 border-blue-500/40 shadow-lg shadow-blue-500/10'
                  : 'glass-card border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400">
                  <Building2 className="w-4 h-4" />
                </div>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {ws.role || 'Member'}
                </span>
              </div>
              <h4 className="text-base font-bold text-white">{ws.name}</h4>
              <p className="text-xs text-slate-400 mt-1">
                {ws.member_count} member{ws.member_count !== 1 ? 's' : ''} • {ws.lead_count} saved leads
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Members Table for Current Workspace */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-blue-400" />
              Members in {currentWorkspace?.name || 'Current Workspace'} ({members.length})
            </h3>
            <p className="text-xs text-slate-400">Users with access to generate leads and dispatch sequences</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Workspace Role</th>
                <th className="py-3 px-4">Joined Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-semibold text-white flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center text-xs">
                      {m.name ? m.name.charAt(0).toUpperCase() : m.email.charAt(0).toUpperCase()}
                    </div>
                    <span>{m.name || 'Teammate'}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{m.email}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        m.role === 'owner'
                          ? 'bg-purple-500/10 text-purple-300 border border-purple-500/30'
                          : m.role === 'admin'
                          ? 'bg-blue-500/10 text-blue-300 border border-blue-500/30'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {m.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {new Date(m.joined_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {m.role !== 'owner' && (
                      <button
                        onClick={() => handleRemoveMember(m.user_id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Remove Member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Workspace Modal */}
      {showCreateWs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#111827] border border-slate-700/80 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Create New Workspace</h3>
              <button onClick={() => setShowCreateWs(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Workspace Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Inbound Enterprise Team"
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateWs(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingWs}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {creatingWs ? 'Creating...' : 'Create Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Teammate Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#111827] border border-slate-700/80 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Invite Teammate</h3>
              <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {inviteMsg && (
              <div
                className={`p-3 rounded-xl border text-xs ${
                  inviteMsg.success
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                {inviteMsg.message}
              </div>
            )}

            <form onSubmit={handleInviteMember} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Teammate Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Role & Permissions
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="member">Member (Prospecting & Sequencing)</option>
                  <option value="admin">Admin (Manage Members & Settings)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {inviting ? 'Adding...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
