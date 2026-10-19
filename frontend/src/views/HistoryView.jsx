import React, { useState, useEffect } from 'react';
import {
  History,
  Download,
  Trash2,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Search,
  Building2,
  Mail,
  Loader2,
  Filter,
  FileSpreadsheet
} from 'lucide-react';
import DeliverabilityBadge from '../components/DeliverabilityBadge';

export default function HistoryView({ apiBaseUrl, token, currentWorkspace }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [sessionLeads, setSessionLeads] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    fetchHistory();
  }, [currentWorkspace]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiBaseUrl}/api/v1/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
        if (data.length > 0 && !selectedSessionId) {
          loadSessionDetails(data[0].session_id);
        }
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSessionDetails = async (sessionId) => {
    setSelectedSessionId(sessionId);
    setLoadingLeads(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/history/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSessionLeads(data.leads || []);
      }
    } catch (err) {
      console.error('Failed to fetch session leads:', err);
    } finally {
      setLoadingLeads(false);
    }
  };

  const handleDeleteSession = async (sessionId, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this prospecting session?')) return;

    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/history/${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setSessions(prev => prev.filter(s => s.session_id !== sessionId));
        if (selectedSessionId === sessionId) {
          setSelectedSessionId(null);
          setSessionLeads([]);
        }
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  const handleExport = async (format) => {
    if (!selectedSessionId) return;

    try {
      const res = await fetch(
        `${apiBaseUrl}/api/v1/history/${selectedSessionId}/export?crm_format=${format}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`Export failed: ${err.detail || res.statusText}`);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads_session_${selectedSessionId}_${format}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download CSV file.');
    }
  };

  const filteredSessions = sessions.filter(s =>
    (s.industry || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
    (s.location || '').toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <History className="w-6 h-6 text-blue-400" />
            Session Archives & Multi-CRM Export
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Browse previous prospecting runs, inspect lead records, and download ready-to-import CRM datasets.
          </p>
        </div>

        {/* Multi-CRM Export Dropdown/Buttons */}
        {selectedSessionId && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport('generic')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Standard CSV</span>
            </button>
            <button
              onClick={() => handleExport('hubspot')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-600/20 hover:bg-orange-600/30 text-orange-300 border border-orange-500/30 text-xs font-semibold transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>HubSpot CSV</span>
            </button>
            <button
              onClick={() => handleExport('salesforce')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Salesforce CSV</span>
            </button>
            <button
              onClick={() => handleExport('zoho')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Zoho CSV</span>
            </button>
          </div>
        )}
      </div>

      {/* Two Column Layout: Sessions List & Session Lead Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Sessions List */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 lg:col-span-1">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter by industry or location..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredSessions && filteredSessions.length > 0 ? (
              filteredSessions.map((s) => (
                <div
                  key={s.session_id}
                  onClick={() => loadSessionDetails(s.session_id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                    selectedSessionId === s.session_id
                      ? 'bg-blue-600/15 border-blue-500/50 text-white shadow-md'
                      : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <div className="min-w-0 space-y-1">
                    <div className="text-xs font-bold truncate group-hover:text-blue-400 transition-colors">
                      {s.industry}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                      <span>{s.location}</span>
                      <span>•</span>
                      <span className="font-semibold text-slate-300">{s.total_leads} leads</span>
                      {s.dedup_filtered_count > 0 && (
                        <span className="text-[10px] text-indigo-400">({s.dedup_filtered_count} deduped)</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleDeleteSession(s.session_id, e)}
                      title="Delete Session"
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-xs text-slate-500">
                No past prospecting sessions found.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Lead Inspector Table */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-400" />
              Session Prospect Breakdown ({sessionLeads.length})
            </h3>
          </div>

          {loadingLeads ? (
            <div className="py-20 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400 mx-auto" />
              <p className="text-xs text-slate-400 mt-2">Loading session leads...</p>
            </div>
          ) : sessionLeads && sessionLeads.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/90 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Company</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Deliverability</th>
                    <th className="py-3 px-4">ICP Score</th>
                    <th className="py-3 px-4">Outreach Pitch</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {sessionLeads.map((lead, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-semibold text-white">
                        <div>{lead.company_name}</div>
                        {lead.website && (
                          <a
                            href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-blue-400 hover:underline flex items-center gap-1 truncate max-w-[140px]"
                          >
                            {lead.website.replace('https://', '').replace('http://', '')}
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-200">{lead.email || 'N/A'}</td>
                      <td className="py-3 px-4">
                        <DeliverabilityBadge status={lead.deliverability_status} score={lead.deliverability_score} />
                      </td>
                      <td className="py-3 px-4 font-bold text-blue-400">{lead.icp_fit_score}/10</td>
                      <td className="py-3 px-4 max-w-xs text-slate-300 truncate" title={lead.suggested_outreach_angle}>
                        {lead.suggested_outreach_angle}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 text-xs text-slate-500">
              Select a past prospecting session to view its qualified lead records.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
