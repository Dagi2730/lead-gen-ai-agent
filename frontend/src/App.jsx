import React, { useState } from 'react';
import { Search, Building2, ExternalLink, Sparkles, Loader2, Target } from 'lucide-react';

function App() {
  const [industry, setIndustry] = useState('SaaS startups');
  const [location, setLocation] = useState('Austin, TX');
  const [maxResults, setMaxResults] = useState(3);
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState([]);
  const [error, setError] = useState('');

  const handleGenerateLeads = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setLeads([]);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/generate-leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          industry,
          location,
          max_results: parseInt(maxResults, 10),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      setLeads(data.leads || []);
    } catch (err) {
      setError(err.message || 'Failed to connect to backend server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm tracking-wide uppercase">
              <Sparkles className="w-4 h-4" /> B2B Growth Engine
            </div>
            <h1 className="text-3xl font-extrabold text-white mt-1">
              Autonomous Lead Gen & Enrichment Agent
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded-full border border-slate-700 self-start">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Backend API Active
          </div>
        </header>

        {/* Input Form Card */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-6 shadow-xl backdrop-blur-sm">
          <form onSubmit={handleGenerateLeads} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                Target Industry
              </label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. SaaS startups, Dental Clinics"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Austin, TX"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                Max Leads
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={maxResults}
                onChange={(e) => setMaxResults(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Scraping & Enriching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" /> Generate Leads
                </>
              )}
            </button>
          </form>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-rose-950/50 border border-rose-800 text-rose-300 p-4 rounded-xl text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Results Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-400" /> Discovered Leads ({leads.length})
            </h2>
          </div>

          {leads.length === 0 && !loading && !error && (
            <div className="border border-dashed border-slate-800 rounded-xl p-12 text-center text-slate-500">
              Enter target criteria above and click <strong>Generate Leads</strong> to fetch live market prospects.
            </div>
          )}

          {loading && (
            <div className="grid grid-cols-1 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-slate-800/30 border border-slate-800 rounded-xl p-6 animate-pulse space-y-3">
                  <div className="h-5 bg-slate-700/50 rounded w-1/4"></div>
                  <div className="h-4 bg-slate-700/30 rounded w-1/3"></div>
                  <div className="h-12 bg-slate-700/20 rounded w-full"></div>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {leads.map((lead, index) => (
              <div
                key={index}
                className="bg-slate-800/80 border border-slate-700 hover:border-indigo-500/50 transition-all rounded-xl p-6 shadow-md space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/50 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-indigo-400" />
                      {lead.company_name}
                    </h3>
                    <a
                      href={lead.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-400 hover:underline flex items-center gap-1 mt-1"
                    >
                      {lead.website} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="bg-indigo-950/80 text-indigo-300 border border-indigo-700/50 text-xs px-3 py-1.5 rounded-full font-semibold self-start sm:self-auto">
                    ICP Fit Score: <span className="text-indigo-200 font-bold">{lead.icp_fit_score}/10</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-slate-900/60 p-4 rounded-lg border border-slate-800">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      Qualification Reasoning
                    </span>
                    <p className="text-slate-300">{lead.qualification_reasoning}</p>
                  </div>

                  <div className="bg-indigo-950/30 p-4 rounded-lg border border-indigo-900/50">
                    <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider block mb-1">
                      Suggested Outreach Angle
                    </span>
                    <p className="text-indigo-200">{lead.suggested_outreach_angle}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}

export default App;