import React, { useState } from 'react';
import { 
  Search, Building2, ExternalLink, Sparkles, Loader2, Target, 
  SlidersHorizontal, CheckSquare, Square, Download, Copy, Check, 
  LayoutGrid, Table as TableIcon, ArrowUpDown, X, ChevronRight, MapPin
} from 'lucide-react';

function App() {
  // Search & Filter State
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');
  const [maxResults, setMaxResults] = useState(3);
  const [minScore, setMinScore] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('score');

  // UI State
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('cards');
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [activeModalLead, setActiveModalLead] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [error, setError] = useState('');

  // Clean state with empty leads array
  const [leads, setLeads] = useState([]);

  // Example Search Chips
  const exampleSearches = [
    { industry: "Marketing Agencies", location: "Austin, TX" },
    { industry: "SaaS Startups", location: "San Francisco, CA" },
    { industry: "Dental Clinics", location: "Chicago, IL" }
  ];

  const handleSearchTrigger = (ind, loc) => {
    setIndustry(ind);
    setLocation(loc);
  };

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
      // Map backend response fields to match the UI expectations cleanly
      const formattedLeads = (data.leads || []).map((lead, idx) => ({
        id: idx + 1,
        company_name: lead.company_name,
        website: lead.website,
        location: location,
        icp_fit_score: lead.icp_fit_score,
        detected_issues: ["Needs review", "Check online presence"],
        ai_insight: lead.qualification_reasoning,
        outreach_angle: lead.suggested_outreach_angle,
        full_analysis: lead.qualification_reasoning,
        extracted_insights: [industry, location, "Active Prospect"]
      }));

      setLeads(formattedLeads);
    } catch (err) {
      setError(err.message || 'Failed to connect to backend server.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(l => l.id));
    }
  };

  const toggleSelectLead = (id) => {
    if (selectedLeads.includes(id)) {
      setSelectedLeads(selectedLeads.filter(item => item !== id));
    } else {
      setSelectedLeads([...selectedLeads, id]);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredLeads = leads
    .filter(lead => lead.icp_fit_score >= minScore)
    .sort((a, b) => {
      if (sortBy === 'score') return b.icp_fit_score - a.icp_fit_score;
      if (sortBy === 'name') return a.company_name.localeCompare(b.company_name);
      return 0;
    });

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#1F2937] font-sans selection:bg-[#4F7DF3] selection:text-white pb-24">
      
      {/* Top Navbar */}
      <nav className="bg-[#FFFFFF] border-b border-slate-200 sticky top-0 z-30 px-6 py-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#4F7DF3] flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-bold text-lg tracking-tight text-[#1F2937]">LeadGen AI</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-600 px-3 py-1.5">
            Saved Leads <span className="ml-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-xs font-semibold text-slate-700">{selectedLeads.length}</span>
          </span>
          <div className="w-8 h-8 rounded-full bg-[#4F7DF3]/10 text-[#4F7DF3] font-bold text-xs flex items-center justify-center border border-[#4F7DF3]/20">
            DA
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 pt-10 space-y-8">
        
        {/* Search Section */}
        <section className="bg-[#FFFFFF] border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-xs space-y-6">
          <div className="max-w-2xl space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#1F2937]">
              Autonomous Prospecting & Website Analysis
            </h1>
            <p className="text-sm text-slate-500">
              Enter target criteria to discover, score, and enrich live B2B leads with customized outreach hooks.
            </p>
          </div>

          <form onSubmit={handleGenerateLeads} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Industry Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Target Industry
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="e.g. Marketing Agencies"
                    className="w-full bg-[#F5F7FA] border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-[#1F2937] focus:outline-none focus:border-[#4F7DF3] focus:bg-white transition-all"
                    required
                  />
                </div>
              </div>

              {/* Location Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Austin, TX"
                    className="w-full bg-[#F5F7FA] border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-[#1F2937] focus:outline-none focus:border-[#4F7DF3] focus:bg-white transition-all"
                    required
                  />
                </div>
              </div>

              {/* Max Leads Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Max Leads
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={maxResults}
                  onChange={(e) => setMaxResults(e.target.value)}
                  className="w-full bg-[#F5F7FA] border border-slate-200 rounded-xl px-4 py-3 text-sm text-[#1F2937] focus:outline-none focus:border-[#4F7DF3] focus:bg-white transition-all"
                  required
                />
              </div>

            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between pt-2 gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#4F7DF3] bg-[#F5F7FA] px-3.5 py-2 rounded-xl border border-slate-200 transition-colors"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  {showFilters ? "Hide Filters" : "Advanced Filters"}
                </button>

                <div className="hidden lg:flex items-center gap-2">
                  <span className="text-xs text-slate-400">Try:</span>
                  {exampleSearches.map((ex, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSearchTrigger(ex.industry, ex.location)}
                      className="text-xs bg-[#F5F7FA] hover:bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors"
                    >
                      {ex.industry} in {ex.location}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto bg-[#4F7DF3] hover:bg-[#3b68e0] text-white font-medium text-sm py-3 px-6 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Scraping & Enriching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" /> Search Leads
                  </>
                )}
              </button>
            </div>

            {showFilters && (
              <div className="p-4 bg-[#F5F7FA] rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeIn">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Minimum ICP Score ({minScore}/10)</label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.5"
                    value={minScore}
                    onChange={(e) => setMinScore(parseFloat(e.target.value))}
                    className="w-full accent-[#4F7DF3] cursor-pointer"
                  />
                </div>
              </div>
            )}
          </form>
        </section>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Results Section */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-[#1F2937] flex items-center gap-2">
              <Target className="w-5 h-5 text-[#4F7DF3]" /> Qualified Leads 
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">
                {filteredLeads.length}
              </span>
            </h2>

            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 bg-[#FFFFFF] border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-600 shadow-xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <span>Sort by:</span>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent font-semibold text-[#1F2937] focus:outline-none cursor-pointer"
                >
                  <option value="score">Highest Score</option>
                  <option value="name">Company Name</option>
                </select>
              </div>

              <div className="flex items-center bg-[#FFFFFF] border border-slate-200 rounded-xl p-1 shadow-xs">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-1.5 rounded-lg text-xs transition-colors ${viewMode === 'cards' ? 'bg-[#F5F7FA] text-[#4F7DF3] font-bold shadow-xs' : 'text-slate-500'}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg text-xs transition-colors ${viewMode === 'table' ? 'bg-[#F5F7FA] text-[#4F7DF3] font-bold shadow-xs' : 'text-slate-500'}`}
                >
                  <TableIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between bg-[#FFFFFF] border border-slate-200 rounded-xl px-4 py-3 shadow-xs">
            <button 
              onClick={handleSelectAll}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-[#4F7DF3]"
            >
              {selectedLeads.length === filteredLeads.length && filteredLeads.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-[#4F7DF3]" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              Select All ({selectedLeads.length} selected)
            </button>
            <button 
              disabled={selectedLeads.length === 0}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-[#F5F7FA] hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Export to CSV
            </button>
          </div>

          {filteredLeads.length === 0 && !loading ? (
            <div className="bg-[#FFFFFF] border border-slate-200 rounded-2xl p-16 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Search className="w-6 h-6" />
              </div>
              <p className="text-slate-600 font-medium">No leads generated yet.</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Enter your target industry and location above and click <strong>Search Leads</strong> to trigger your live AI backend agent.
              </p>
            </div>
          ) : loading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center space-y-4 shadow-xs">
              <Loader2 className="w-8 h-8 animate-spin text-[#4F7DF3] mx-auto" />
              <p className="text-sm font-semibold text-slate-700">Agent is searching websites and calculating ICP scores...</p>
            </div>
          ) : viewMode === 'cards' ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredLeads.map((lead) => {
                const isSelected = selectedLeads.includes(lead.id);
                return (
                  <div
                    key={lead.id}
                    className={`bg-[#FFFFFF] border rounded-2xl p-6 shadow-xs transition-all space-y-4 ${isSelected ? 'border-[#4F7DF3] ring-1 ring-[#4F7DF3]/20 bg-[#4F7DF3]/[0.01]' : 'border-slate-200'}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <button onClick={() => toggleSelectLead(lead.id)} className="mt-1 text-slate-400 hover:text-[#4F7DF3]">
                          {isSelected ? <CheckSquare className="w-4 h-4 text-[#4F7DF3]" /> : <Square className="w-4 h-4" />}
                        </button>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-[#1F2937]">{lead.company_name}</h3>
                            <span className="text-xs text-slate-400 font-medium">({lead.location})</span>
                          </div>
                          <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-xs text-[#4F7DF3] hover:underline inline-flex items-center gap-1 mt-0.5 font-medium">
                            {lead.website} <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20 text-xs px-3 py-1 rounded-full font-bold">
                        ICP Score: {lead.icp_fit_score}/10
                      </span>
                    </div>

                    <div className="bg-[#F5F7FA] p-3.5 rounded-xl border border-slate-200/60 space-y-1">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">AI Analysis & Insight</span>
                      <p className="text-xs text-slate-700 leading-relaxed">{lead.ai_insight}</p>
                    </div>

                    <div className="bg-blue-50/50 p-4 rounded-xl border border-[#4F7DF3]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        <span className="text-[11px] font-bold text-[#4F7DF3] uppercase tracking-wider block">Personalized Outreach Hook</span>
                        <p className="text-xs text-[#1F2937] italic">"{lead.outreach_angle}"</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => copyToClipboard(lead.outreach_angle, lead.id)} className="inline-flex items-center gap-1 text-xs font-semibold bg-white text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs">
                          {copiedId === lead.id ? <Check className="w-3.5 h-3.5 text-[#22C55E]" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                          {copiedId === lead.id ? "Copied" : "Copy Hook"}
                        </button>
                        <button onClick={() => setActiveModalLead(lead)} className="inline-flex items-center gap-1 text-xs font-semibold bg-[#4F7DF3] text-white px-3.5 py-1.5 rounded-lg shadow-xs">
                          Full Details <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-[#FFFFFF] border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F5F7FA] border-b border-slate-200 text-slate-500 uppercase font-semibold">
                    <th className="p-4 w-10">
                      <button onClick={handleSelectAll}>
                        {selectedLeads.length === filteredLeads.length ? <CheckSquare className="w-4 h-4 text-[#4F7DF3]" /> : <Square className="w-4 h-4 text-slate-400" />}
                      </button>
                    </th>
                    <th className="p-4">Company Name</th>
                    <th className="p-4">Location</th>
                    <th className="p-4">ICP Score</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLeads.map((lead) => {
                    const isSelected = selectedLeads.includes(lead.id);
                    return (
                      <tr key={lead.id} className={`hover:bg-[#F5F7FA]/60 ${isSelected ? 'bg-[#4F7DF3]/[0.02]' : ''}`}>
                        <td className="p-4">
                          <button onClick={() => toggleSelectLead(lead.id)}>
                            {isSelected ? <CheckSquare className="w-4 h-4 text-[#4F7DF3]" /> : <Square className="w-4 h-4 text-slate-400" />}
                          </button>
                        </td>
                        <td className="p-4 font-bold text-[#1F2937]">{lead.company_name}</td>
                        <td className="p-4 text-slate-600">{lead.location}</td>
                        <td className="p-4">
                          <span className="font-semibold text-[#22C55E] bg-[#22C55E]/10 px-2.5 py-1 rounded-full">
                            {lead.icp_fit_score}/10
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button onClick={() => setActiveModalLead(lead)} className="text-[#4F7DF3] font-semibold hover:underline">
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </main>

      {/* Lead Detail Modal */}
      {activeModalLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 md:p-8 space-y-6">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold text-[#4F7DF3] uppercase tracking-wider">Lead Enrichment Report</span>
                <h2 className="text-xl font-bold text-[#1F2937] mt-0.5">{activeModalLead.company_name}</h2>
                <a href={activeModalLead.website} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 hover:text-[#4F7DF3] inline-flex items-center gap-1 mt-1">
                  {activeModalLead.website} <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <button onClick={() => setActiveModalLead(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5 text-sm">
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Analysis & Reasoning</h4>
                <p className="text-slate-700 bg-[#F5F7FA] p-4 rounded-xl border border-slate-200 leading-relaxed">
                  {activeModalLead.full_analysis}
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Editable Outreach Message</label>
                <textarea
                  defaultValue={activeModalLead.outreach_angle}
                  className="w-full bg-[#F5F7FA] border border-slate-200 rounded-xl p-4 text-xs text-[#1F2937] focus:outline-none focus:border-[#4F7DF3] focus:bg-white h-28 leading-relaxed resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button onClick={() => setActiveModalLead(null)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">
                Close
              </button>
              <button onClick={() => { copyToClipboard(activeModalLead.outreach_angle, activeModalLead.id); setActiveModalLead(null); }} className="inline-flex items-center gap-1.5 bg-[#4F7DF3] hover:bg-[#3b68e0] text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-xs">
                <Copy className="w-3.5 h-3.5" /> Copy & Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;