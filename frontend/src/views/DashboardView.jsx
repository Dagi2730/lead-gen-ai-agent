import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Target,
  Send,
  ShieldCheck,
  Building2,
  Users,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Mail
} from 'lucide-react';
import DeliverabilityBadge from '../components/DeliverabilityBadge';

export default function DashboardView({ apiBaseUrl, token, currentWorkspace }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total_leads: 0,
    avg_icp_score: 8.5,
    total_sessions: 0,
    emails_dispatched: 0,
    verified_leads: 0,
    contacted_leads: 0,
    recent_activity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [currentWorkspace]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiBaseUrl}/api/v1/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to load dashboard statistics:", err);
    } finally {
      setLoading(false);
    }
  };

  const deliverabilityRate = stats.total_leads > 0 
    ? Math.round((stats.verified_leads / stats.total_leads) * 100) 
    : 96;

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/30 border border-blue-500/20 p-6 md:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Enterprise Lead Generation Suite</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              {currentWorkspace ? currentWorkspace.name : 'Your Workspace'} Overview
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Autonomous AI web prospecting, custom ICP qualification, seed URL crawling, and direct multi-touch cold outreach.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/leads')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
            >
              <Target className="w-4 h-4" />
              <span>Find New Leads</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Total Leads */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Enriched Leads</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {stats.total_leads.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Across {stats.total_sessions} prospecting sessions
            </p>
          </div>
        </div>

        {/* Average ICP Score */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Average ICP Match</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-extrabold text-white tracking-tight flex items-baseline gap-1">
              <span>{stats.avg_icp_score}</span>
              <span className="text-sm font-semibold text-slate-400">/ 10</span>
            </div>
            <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              High conversion qualification
            </p>
          </div>
        </div>

        {/* Deliverability Health */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Deliverability Health</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-extrabold text-white tracking-tight flex items-baseline gap-1">
              <span>{deliverabilityRate}%</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Verified corporate domain checks
            </p>
          </div>
        </div>

        {/* Emails Dispatched */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Direct Sequences Sent</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {stats.emails_dispatched}
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Via direct SMTP & test dispatchers
            </p>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Quick Prospector & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Quick Prospector Callout */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5 lg:col-span-1">
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              Quick Prospector
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Launch targeted discovery with customized ICP constraints or seed URLs.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => navigate('/leads')}
              className="w-full text-left p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 group-hover:text-blue-400 transition-colors">
                  Autonomous Web Prospecting
                </span>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-200 transition-transform group-hover:translate-x-0.5" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Real-time business search & LLM extraction
              </p>
            </button>

            <button
              onClick={() => navigate('/leads')}
              className="w-full text-left p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">
                  Seed URL & Directory Scrape
                </span>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-200 transition-transform group-hover:translate-x-0.5" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Scrape targeted websites & association directories
              </p>
            </button>

            <button
              onClick={() => navigate('/campaigns')}
              className="w-full text-left p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 group-hover:text-purple-400 transition-colors">
                  Multi-Touch Outreach Sequencer
                </span>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-200 transition-transform group-hover:translate-x-0.5" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Direct SMTP dispatch with tailored tones
              </p>
            </button>
          </div>
        </div>

        {/* Right Column: Recent Leads Feed */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                Recent Enriched Leads
              </h3>
              <p className="text-xs text-slate-400">Latest business entities qualified by the AI agent</p>
            </div>
            <button
              onClick={() => navigate('/leads')}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {stats.recent_activity && stats.recent_activity.length > 0 ? (
            <div className="divide-y divide-slate-800/80">
              {stats.recent_activity.map((lead) => (
                <div key={lead.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-100 truncate">{lead.company_name}</span>
                      <DeliverabilityBadge status={lead.deliverability_status} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                      <span>{lead.email || 'No email'}</span>
                      {lead.website && (
                        <>
                          <span>•</span>
                          <span className="text-slate-400 truncate">{lead.website.replace('https://', '').replace('http://', '')}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-bold text-blue-400">
                        {lead.icp_fit_score}/10
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">ICP Score</div>
                    </div>

                    <button
                      onClick={() => navigate('/campaigns')}
                      className="p-2 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 transition-colors cursor-pointer"
                      title="Outreach Sequence"
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 space-y-3 bg-slate-900/40 rounded-xl border border-dashed border-slate-800">
              <Building2 className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">No leads discovered yet in this workspace.</p>
              <button
                onClick={() => navigate('/leads')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Start First Prospecting Run
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
