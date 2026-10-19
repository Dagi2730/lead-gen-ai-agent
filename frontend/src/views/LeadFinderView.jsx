import React, { useState } from 'react';
import {
  Search,
  Building2,
  Sparkles,
  Loader2,
  ExternalLink,
  Copy,
  Check,
  LayoutGrid,
  Table as TableIcon,
  Globe,
  SlidersHorizontal,
  Mail,
  Phone,
  RefreshCw,
  Send,
  Upload,
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet,
  Layers,
  ChevronDown,
  ChevronUp,
  Tag
} from 'lucide-react';
import DeliverabilityBadge from '../components/DeliverabilityBadge';
import EmailDispatchModal from '../components/EmailDispatchModal';

const ICP_PRESETS = [
  'B2B SaaS with 50-500 employees',
  'Series A to Series C funded scaleups',
  'High-ticket enterprise contract value ($25k+)',
  'Active hiring in sales & engineering',
  'Modern cloud stack (AWS, GCP, or Azure)'
];

export default function LeadFinderView({ apiBaseUrl, token, currentWorkspace }) {
  // Input State
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');
  const [maxResults, setMaxResults] = useState(10);
  const [seedUrls, setSeedUrls] = useState('');
  const [customIcpRules, setCustomIcpRules] = useState('');
  const [deduplicate, setDeduplicate] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Execution & Output State
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState([]);
  const [dedupCount, setDedupCount] = useState(0);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [error, setError] = useState('');
  const [hubspotStatus, setHubspotStatus] = useState({});
  const [regeneratingId, setRegeneratingId] = useState(null);

  // Email Dispatch Modal State
  const [selectedLeadForEmail, setSelectedLeadForEmail] = useState(null);

  // CSV Import State
  const [csvFile, setCsvFile] = useState(null);
  const [csvLoading, setCsvLoading] = useState(false);

  const handlePresetClick = (preset) => {
    if (!customIcpRules.includes(preset)) {
      setCustomIcpRules(prev => prev ? `${prev}\n• ${preset}` : `• ${preset}`);
    }
  };

  const handleGenerateLeads = async (e) => {
    e.preventDefault();
    if (!industry && !seedUrls) {
      setError('Please provide either a target industry or seed URLs.');
      return;
    }

    setError('');
    setLoading(true);
    setDedupCount(0);

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/generate-leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          industry: industry || 'Target Directory Entities',
          location: location || 'Global',
          max_results: parseInt(maxResults),
          seed_urls: seedUrls || null,
          custom_icp_rules: customIcpRules || null,
          deduplicate_against_history: deduplicate
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to generate leads');
      }

      setLeads(data.leads || []);
      setDedupCount(data.dedup_filtered_count || 0);
    } catch (err) {
      setError(err.message || 'An error occurred during prospecting.');
    } finally {
      setLoading(false);
    }
  };

  const handleCsvUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/import-csv`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to import CSV');
      }

      setLeads(data.leads || []);
    } catch (err) {
      setError(err.message || 'Failed to parse and enrich CSV file.');
    } finally {
      setCsvLoading(false);
    }
  };

  const handleRegenerateHook = async (lead, index) => {
    setRegeneratingId(index);
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/regenerate-hook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          company_name: lead.company_name,
          website: lead.website,
          description: lead.description,
          industry: industry || 'B2B Services',
          location: location || lead.location || 'Global'
        })
      });

      const data = await res.json();
      if (res.ok && data.new_hook) {
        setLeads(prev => {
          const updated = [...prev];
          updated[index] = { ...updated[index], suggested_outreach_angle: data.new_hook };
          return updated;
        });
      }
    } catch (err) {
      console.error('Failed to regenerate hook:', err);
    } finally {
      setRegeneratingId(null);
    }
  };

  const handlePushToHubSpot = async (lead, index) => {
    setHubspotStatus(prev => ({ ...prev, [index]: 'syncing' }));
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/push-to-hubspot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          company_name: lead.company_name,
          website: lead.website,
          email: lead.email,
          phone: lead.phone,
          location: lead.location || location || 'Global',
          icp_fit_score: lead.icp_fit_score
        })
      });

      if (res.ok) {
        setHubspotStatus(prev => ({ ...prev, [index]: 'synced' }));
      } else {
        setHubspotStatus(prev => ({ ...prev, [index]: 'error' }));
      }
    } catch (err) {
      setHubspotStatus(prev => ({ ...prev, [index]: 'error' }));
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-blue-400" />
            AI Lead Finder & Enrichment Engine
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Autonomous web crawling, custom ICP scoring rules, seed URL ingestion, and email validation.
          </p>
        </div>

        {/* CSV Bulk Import Button */}
        <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 hover:border-slate-600 transition-all cursor-pointer shadow-sm">
          {csvLoading ? <Loader2 className="w-4 h-4 animate-spin text-blue-400" /> : <Upload className="w-4 h-4 text-blue-400" />}
          <span>{csvLoading ? 'Enriching CSV...' : 'Bulk Import CSV'}</span>
          <input type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" disabled={csvLoading} />
        </label>
      </div>

      {/* Prospecting Parameters Form Card */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
        <form onSubmit={handleGenerateLeads} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Industry Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Target Industry / Vertical
              </label>
              <input
                type="text"
                placeholder="e.g. AI SaaS, FinTech, Cybersecurity"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Location Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Target Location / Geography
              </label>
              <input
                type="text"
                placeholder="e.g. San Francisco, London, Global"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Max Results Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Prospect Volume
              </label>
              <select
                value={maxResults}
                onChange={(e) => setMaxResults(Number(e.target.value))}
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
              >
                <option value={5}>5 Leads (Fast preview)</option>
                <option value={10}>10 Leads (Standard batch)</option>
                <option value={20}>20 Leads (Deep discovery)</option>
                <option value={30}>30 Leads (Enterprise scale)</option>
              </select>
            </div>
          </div>

          {/* Advanced Prospecting: Seed URLs, Dynamic ICP, Deduplication */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{showAdvanced ? 'Hide Custom ICP Rules & Seed URLs' : 'Add Custom ICP Rules & Seed URLs'}</span>
              {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showAdvanced && (
              <div className="mt-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800/90 space-y-4 animate-fadeIn">
                {/* Seed URLs Input */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Targeted Domain & Seed URLs (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="https://association-directory.com/members, https://niche-saas-list.io"
                    value={seedUrls}
                    onChange={(e) => setSeedUrls(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Scrapes specific directory URLs and company domains directly for high-precision extraction.
                  </p>
                </div>

                {/* Custom ICP Rules & System Prompt Injection */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                      Dynamic ICP Qualification Constraints & Prompt Instructions
                    </label>
                    <span className="text-[11px] text-blue-400 font-medium">Injected into LLM Agent</span>
                  </div>

                  {/* Preset quick chips */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {ICP_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handlePresetClick(preset)}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer"
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={3}
                    placeholder="e.g. Target companies with 50+ engineers using React and AWS. Penalize companies that do B2C only."
                    value={customIcpRules}
                    onChange={(e) => setCustomIcpRules(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500 font-mono resize-none"
                  />
                </div>

                {/* Deduplication Switch */}
                <div className="flex items-center gap-3 pt-1">
                  <input
                    type="checkbox"
                    id="dedupCheck"
                    checked={deduplicate}
                    onChange={(e) => setDeduplicate(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="dedupCheck" className="text-xs text-slate-300 font-medium cursor-pointer">
                    Filter out duplicate companies previously saved in this workspace's database records.
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons & Status */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
            {error && (
              <p className="text-xs font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg">
                {error}
              </p>
            )}

            <div className="ml-auto flex items-center gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Agent Prospecting & Enriching...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Launch AI Prospecting Run</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Results Header & Layout Switcher */}
      {leads && leads.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-3">
              <h3 className="text-base font-bold text-white">
                Qualified Prospects ({leads.length})
              </h3>
              {dedupCount > 0 && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {dedupCount} duplicates filtered
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Grid View</span>
              </button>

              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Table View</span>
              </button>
            </div>
          </div>

          {/* Grid View */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {leads.map((lead, idx) => (
                <div key={idx} className="glass-card p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all space-y-4">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-white truncate">{lead.company_name}</h4>
                        <DeliverabilityBadge status={lead.deliverability_status} score={lead.deliverability_score} />
                      </div>
                      {lead.website && (
                        <a
                          href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-400 hover:underline flex items-center gap-1 mt-0.5 truncate"
                        >
                          {lead.website.replace('https://', '').replace('http://', '').replace('www.', '')}
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-extrabold text-blue-400">
                        {lead.icp_fit_score}/10
                      </div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">ICP Match</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                    {lead.description || 'Verified enterprise operating in target vertical.'}
                  </p>

                  {/* Contact Info Pills */}
                  <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <strong className="text-slate-200">{lead.email || 'N/A'}</strong>
                    </span>
                    {lead.phone && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{lead.phone}</span>
                      </span>
                    )}
                  </div>

                  {/* Outreach Hook Box */}
                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <span>Tailored Outreach Angle</span>
                      <button
                        onClick={() => handleRegenerateHook(lead, idx)}
                        disabled={regeneratingId === idx}
                        className="text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <RefreshCw className={`w-3 h-3 ${regeneratingId === idx ? 'animate-spin' : ''}`} />
                        <span>Regenerate</span>
                      </button>
                    </div>
                    <p className="text-xs text-slate-300 font-mono leading-relaxed">
                      "{lead.suggested_outreach_angle}"
                    </p>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => handlePushToHubSpot(lead, idx)}
                      disabled={hubspotStatus[idx] === 'syncing' || hubspotStatus[idx] === 'synced'}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                    >
                      {hubspotStatus[idx] === 'synced' ? '✓ In HubSpot' : hubspotStatus[idx] === 'syncing' ? 'Syncing...' : 'Push HubSpot'}
                    </button>

                    <button
                      onClick={() => setSelectedLeadForEmail(lead)}
                      className="flex items-center gap-1.5 text-xs font-bold px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                    >
                      <Send className="w-3 h-3" />
                      <span>Dispatch Sequence</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Table View */
            <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/90 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Company</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Deliverability</th>
                    <th className="py-3 px-4">ICP Score</th>
                    <th className="py-3 px-4">Outreach Hook</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {leads.map((lead, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-semibold text-white">
                        <div>{lead.company_name}</div>
                        {lead.website && (
                          <span className="text-[10px] text-slate-400 truncate block max-w-[140px]">
                            {lead.website.replace('https://', '').replace('http://', '')}
                          </span>
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
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedLeadForEmail(lead)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] transition-colors cursor-pointer"
                        >
                          Sequence
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Direct Email Dispatch Modal */}
      <EmailDispatchModal
        isOpen={!!selectedLeadForEmail}
        onClose={() => setSelectedLeadForEmail(null)}
        lead={selectedLeadForEmail}
        apiBaseUrl={apiBaseUrl}
        token={token}
        onDispatchSuccess={() => {
          // Refresh or tag lead as contacted
        }}
      />
    </div>
  );
}
