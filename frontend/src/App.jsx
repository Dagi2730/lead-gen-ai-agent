import React, { useState } from 'react';
import { 
  Search, Building2, ExternalLink, Sparkles, Loader2, Target, 
  SlidersHorizontal, CheckSquare, Square, Download, Copy, Check, 
  LayoutGrid, Table as TableIcon, ArrowUpDown, X, ChevronRight, MapPin, 
  Trash2, Mail, Phone, TrendingUp, Award, Layers, MessageSquareText, ClipboardList, History, Clock, Globe
} from 'lucide-react';

function App() {
  // Search & Filter State
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');
  const [maxResults, setMaxResults] = useState(25);
  const [minScore, setMinScore] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('score');
  
  // Single Company Lookup State
  const [singleCompanyQuery, setSingleCompanyQuery] = useState('');

  // Global Tone Selector State
  const [emailTone, setEmailTone] = useState('Professional & Consultative');

  // UI State
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('cards');
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [activeModalLead, setActiveModalLead] = useState(null);
  const [modalTone, setModalTone] = useState('Professional & Consultative');
  const [copiedId, setCopiedId] = useState(null);
  const [globalCopied, setGlobalCopied] = useState(false);
  const [error, setError] = useState('');

  // History Drawer State
  const [showHistory, setShowHistory] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Leads Data State
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

  // Expanded, longer, and deeply human-like cold email templates
  const generateSequenceForTone = (lead, tone) => {
    if (tone === 'Aggressive & Direct') {
      return {
        step1: `Subject: Quick question regarding ${lead.company_name}'s pipeline\n\nHi team,\n\nI was analyzing ${lead.website} earlier today and noticed a clear leak in your conversion funnel. Specifically, your inbound visitor journey lacks the friction reduction needed to maximize conversion rates.\n\n${lead.suggested_outreach_angle}\n\nWe typically help companies in ${lead.location || 'your market'} plug these revenue leaks within 14 days. Are you open to reviewing a 3-minute video breakdown of what I found? Let me know if Thursday at 2:00 PM works for a quick brief chat.`,
        step2: `Subject: Re: Quick question regarding ${lead.company_name}'s pipeline\n\nHi again,\n\nFollowing up on my previous note. Every week ${lead.company_name} operates with this current setup, you are leaving high-intent prospects on the table.\n\nI ran a quick audit against top competitors in ${lead.location || 'your market'} and put together 3 actionable fixes you can implement immediately. \n\nAre you available this week for a 5-minute screen share to review them?`,
        step3: `Subject: Closing the loop on ${lead.company_name}\n\nHi,\n\nI haven't heard back, so I'll assume optimizing inbound lead conversion isn't a current priority for ${lead.company_name}.\n\nThat's totally fine. I'll stop reaching out—wishing you and the team massive growth through Q3!`
      };
    } else if (tone === 'Casual & Friendly') {
      return {
        step1: `Subject: Stumbled across ${lead.company_name} 🚀\n\nHey there,\n\nI was doing some research on top teams in the ${industry || 'industry'} space and came across ${lead.website}. Really love what you guys are building over there!\n\nWhile clicking around, I noticed one little detail that caught my eye: ${lead.suggested_outreach_angle}\n\nI actually put together a quick, casual 2-minute Loom video breaking down an idea that could help boost engagement. Would you be open to me shooting that link over? No pressure at all!`,
        step2: `Subject: Re: Stumbled across ${lead.company_name} 🚀\n\nHey again!\n\nJust bubbling this up in case it got buried under a mountain of emails. I know how hectic inboxes get!\n\nCurious if you had a chance to look at ${lead.website}'s current conversion flow? I'd love to chat about a super simple tweak that worked wonders for another team in ${lead.location || 'the area'}.\n\nLet me know if you're up for a quick coffee chat sometime next week!`,
        step3: `Subject: Catch you later / ${lead.company_name}\n\nHey,\n\nFigured your inbox is totally swamped right now, so I'll leave it here! \n\nIf optimizing client acquisition ever bubbles back up to the top of your list down the road, you know where to find me. Have an awesome week ahead!`
      };
    } else if (tone === 'Executive & Formal') {
      return {
        step1: `Subject: Strategic optimization advisory for ${lead.company_name}\n\nDear Leadership Team at ${lead.company_name},\n\nI hope this email finds you well. In reviewing recent market dynamics across ${lead.location || 'the region'}, I observed notable opportunities for scaling digital infrastructure at ${lead.website}.\n\n${lead.suggested_outreach_angle}\n\nOur advisory practice specializes in assisting established enterprises with high-yield strategic alignment. Would you be amenable to a brief, 15-minute introductory dialogue next Tuesday or Wednesday to discuss potential synergies?`,
        step2: `Subject: Re: Strategic optimization advisory for ${lead.company_name}\n\nDear team,\n\nWriting to follow up on my previous correspondence regarding operational efficiencies at ${lead.company_name}.\n\nWe have recently concluded a comprehensive benchmark study relevant to your sector. I would welcome the opportunity to share our executive summary findings with your leadership group.\n\nPlease let me know if an executive briefing next week would align with your calendar priorities.`,
        step3: `Subject: Final outreach: Advisory services for ${lead.company_name}\n\nDear team,\n\nAs I have not received a response, I will conclude my outreach at this time. Should strategic growth initiatives become a focal point for ${lead.company_name} in future quarters, my professional inbox remains available.\n\nRespectfully yours.`
      };
    } else {
      // Default: Professional & Consultative
      return {
        step1: `Subject: Ideas for scaling ${lead.company_name}\n\nHi team,\n\nI was reviewing ${lead.website} recently and noticed a great opportunity to enhance your digital conversion framework in ${location || 'your region'}.\n\n${lead.suggested_outreach_angle}\n\nWe specialize in partnering with growth-focused teams to refine their client acquisition funnel. Would you be open to a brief 10-minute consultative chat this week to explore if there's a mutually beneficial fit?`,
        step2: `Subject: Re: Ideas for scaling ${lead.company_name}\n\nHi again,\n\nJust following up on my previous note. Most leaders we speak with in ${industry || 'this sector'} are actively looking for ways to streamline prospect onboarding without increasing overhead.\n\nHere is a brief case study of how we approached a similar challenge: [Link]\n\nWould this perspective be of value to your team right now?`,
        step3: `Subject: Closing the loop / ${lead.company_name}\n\nHi,\n\nI'm assuming priorities have shifted and this isn't top of mind right now. Should optimizing lead acquisition become a focus for ${lead.company_name} in the future, my inbox is always open.\n\nBest regards.`
      };
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/history');
      if (response.ok) {
        const data = await response.json();
        setHistoryList(data);
      }
    } catch (err) {
      console.error("Failed to load history", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleLoadSession = async (sessionId, sessionIndustry, sessionLocation) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/v1/history/${sessionId}`);
      if (!response.ok) throw new Error("Failed to load session leads");
      
      const data = await response.json();
      setIndustry(sessionIndustry);
      setLocation(sessionLocation);

      const formattedLeads = (data.leads || []).map((lead, idx) => {
        const tempLead = {
          id: idx + 1,
          company_name: lead.company_name,
          website: lead.website,
          email: lead.email || 'N/A',
          phone: lead.phone || 'N/A',
          location: sessionLocation,
          icp_fit_score: lead.icp_fit_score,
          ai_insight: lead.qualification_reasoning,
          outreach_angle: lead.suggested_outreach_angle,
          full_analysis: lead.qualification_reasoning,
        };
        return {
          ...tempLead,
          email_sequence: generateSequenceForTone(tempLead, emailTone)
        };
      });

      setLeads(formattedLeads);
      setShowHistory(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Feature 1: Single Company Lookup Handler
  const handleSingleCompanySearch = async (e) => {
    e.preventDefault();
    if (!singleCompanyQuery.trim()) return;
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/generate-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industry: singleCompanyQuery,
          location: location || "Global / Online",
          max_results: 1,
        }),
      });

      if (!response.ok) throw new Error(`Server returned status ${response.status}`);

      const data = await response.json();
      if (data.leads && data.leads.length > 0) {
        const lead = data.leads[0];
        const tempLead = {
          id: Date.now(),
          company_name: lead.company_name,
          website: lead.website,
          email: lead.email || 'N/A',
          phone: lead.phone || 'N/A',
          location: location || "Target Location",
          icp_fit_score: lead.icp_fit_score,
          ai_insight: lead.qualification_reasoning,
          outreach_angle: lead.suggested_outreach_angle,
          full_analysis: lead.qualification_reasoning,
        };
        const newLeadObj = {
          ...tempLead,
          email_sequence: generateSequenceForTone(tempLead, emailTone)
        };
        setLeads(prev => [newLeadObj, ...prev]);
        setSingleCompanyQuery('');
      }
    } catch (err) {
      setError(err.message || 'Failed to lookup single company.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLeads = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setLeads([]);
    setSelectedLeads([]);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/generate-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industry,
          location,
          max_results: parseInt(maxResults, 10) || 10,
        }),
      });

      if (!response.ok) throw new Error(`Server returned status ${response.status}`);

      const data = await response.json();
      const formattedLeads = (data.leads || []).map((lead, idx) => {
        const tempLead = {
          id: idx + 1,
          company_name: lead.company_name,
          website: lead.website,
          email: lead.email || 'N/A',
          phone: lead.phone || 'N/A',
          location: location,
          icp_fit_score: lead.icp_fit_score,
          ai_insight: lead.qualification_reasoning,
          outreach_angle: lead.suggested_outreach_angle,
          full_analysis: lead.qualification_reasoning,
        };
        return {
          ...tempLead,
          email_sequence: generateSequenceForTone(tempLead, emailTone)
        };
      });

      setLeads(formattedLeads);
    } catch (err) {
      setError(err.message || 'Failed to connect to backend server.');
    } finally {
      setLoading(false);
    }
  };

  const handleToneChange = (newTone) => {
    setEmailTone(newTone);
    if (leads.length > 0) {
      setLeads(leads.map(l => ({
        ...l,
        email_sequence: generateSequenceForTone(l, newTone)
      })));
    }
  };

  // Feature 2: Modal-Specific Tone Change Handler
  const handleModalToneChange = (newTone) => {
    setModalTone(newTone);
    if (activeModalLead) {
      const updatedSequence = generateSequenceForTone(activeModalLead, newTone);
      setActiveModalLead(prev => ({
        ...prev,
        email_sequence: updatedSequence
      }));
    }
  };

  const handleDeleteLead = (id, e) => {
    if (e) e.stopPropagation();
    setLeads(leads.filter(l => l.id !== id));
    setSelectedLeads(selectedLeads.filter(selectedId => selectedId !== id));
    if (activeModalLead && activeModalLead.id === id) setActiveModalLead(null);
  };

  const handleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(l => l.id));
    }
  };

  const toggleSelectLead = (id) => {
    setSelectedLeads(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAllSelected = () => {
    const selectedLeadObjects = leads.filter(l => selectedLeads.includes(l.id));
    if (selectedLeadObjects.length === 0) return;

    let markdownOutput = `# Selected B2B Prospecting Leads (${selectedLeadObjects.length})\nGenerated with LeadGen AI\n\n---\n\n`;
    selectedLeadObjects.forEach((lead, index) => {
      markdownOutput += `### ${index + 1}. ${lead.company_name}\n`;
      markdownOutput += `- **Website:** ${lead.website}\n- **Email:** ${lead.email}\n- **Phone:** ${lead.phone}\n`;
      markdownOutput += `- **Location:** ${lead.location}\n- **ICP Score:** ${lead.icp_fit_score}/10\n- **AI Insight:** ${lead.ai_insight}\n\n`;
    });

    navigator.clipboard.writeText(markdownOutput);
    setGlobalCopied(true);
    setTimeout(() => setGlobalCopied(false), 2500);
  };

  const handleExportCSV = () => {
    if (leads.length === 0) return;

    const headers = ["Company Name", "Website", "Email", "Phone", "Location", "ICP Score", "AI Insight", "Outreach Hook"];
    const csvRows = [
      headers.join(","),
      ...leads.map(lead => [
        `"${lead.company_name}"`,
        `"${lead.website}"`,
        `"${lead.email}"`,
        `"${lead.phone}"`,
        `"${lead.location}"`,
        lead.icp_fit_score,
        `"${lead.ai_insight.replace(/"/g, '""')}"`,
        `"${lead.outreach_angle.replace(/"/g, '""')}"`
      ].join(","))
    ];

    const blob = new Blob([csvRows.join("\n")], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `b2b_leads_${industry.replace(/\s+/g, '_') || 'export'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLeads = leads
    .filter(lead => lead.icp_fit_score >= minScore)
    .sort((a, b) => {
      if (sortBy === 'score') return b.icp_fit_score - a.icp_fit_score;
      if (sortBy === 'name') return a.company_name.localeCompare(b.company_name);
      return 0;
    });

  const totalScanned = leads.length;
  const avgScore = totalScanned > 0 ? (leads.reduce((acc, l) => acc + l.icp_fit_score, 0) / totalScanned).toFixed(1) : 0;
  const highOpportunities = leads.filter(l => l.icp_fit_score >= 8.0).length;
  const conversionRate = totalScanned > 0 ? Math.round((highOpportunities / totalScanned) * 100) : 0;

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
          <button 
            onClick={() => { setShowHistory(true); fetchHistory(); }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition-colors cursor-pointer"
          >
            <History className="w-4 h-4 text-[#4F7DF3]" /> Search History
          </button>
          <span className="text-xs font-semibold text-slate-600 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
            Selected: <span className="text-[#4F7DF3] font-bold">{selectedLeads.length}</span>
          </span>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 pt-10 space-y-8">
        
        {/* Search Section */}
        <section className="bg-[#FFFFFF] border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="max-w-xl space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-[#1F2937]">
                Autonomous Prospecting & Website Analysis
              </h1>
              <p className="text-sm text-slate-500">
                Enter target criteria and quantity to discover live B2B leads enriched with customizable AI email sequences.
              </p>
            </div>

            {/* Feature 1: Single Company Lookup Bar */}
            <form onSubmit={handleSingleCompanySearch} className="flex items-center gap-2 bg-[#F5F7FA] p-1.5 rounded-xl border border-slate-200">
              <div className="relative flex-1">
                <Globe className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={singleCompanyQuery}
                  onChange={(e) => setSingleCompanyQuery(e.target.value)}
                  placeholder="Lookup specific company..."
                  className="bg-transparent text-xs pl-9 pr-3 py-2 focus:outline-none w-44 md:w-52 text-[#1F2937]"
                />
              </div>
              <button type="submit" disabled={loading} className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer">
                Lookup
              </button>
            </form>
          </div>

          <form onSubmit={handleGenerateLeads} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Target Industry</label>
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

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Location</label>
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

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Number of Leads</label>
                <div className="relative">
                  <Target className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={maxResults}
                    onChange={(e) => setMaxResults(e.target.value)}
                    className="w-full bg-[#F5F7FA] border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-[#1F2937] focus:outline-none focus:border-[#4F7DF3] focus:bg-white transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            {/* AI Tone Selector */}
            <div className="bg-[#F5F7FA] p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <MessageSquareText className="w-4 h-4 text-[#4F7DF3]" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Default AI Email Tone:</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {['Professional & Consultative', 'Aggressive & Direct', 'Casual & Friendly', 'Executive & Formal'].map((tone) => (
                  <button
                    key={tone}
                    type="button"
                    onClick={() => handleToneChange(tone)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${emailTone === tone ? 'bg-[#4F7DF3] text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 cursor-pointer'}`}
                  >
                    {tone}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between pt-2 gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#4F7DF3] bg-[#F5F7FA] px-3.5 py-2 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" /> {showFilters ? "Hide Filters" : "Advanced Filters"}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto bg-[#4F7DF3] hover:bg-[#3b68e0] text-white font-medium text-sm py-3 px-6 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Scraping {maxResults} Leads...</> : <><Search className="w-4 h-4" /> Search {maxResults || 0} Leads</>}
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

        {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-sm"><strong>Error:</strong> {error}</div>}

        {/* Analytics Header */}
        {leads.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fadeIn">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Leads Scanned</span>
                <h3 className="text-2xl font-extrabold text-[#1F2937]">{totalScanned}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#4F7DF3] flex items-center justify-center"><Layers className="w-5 h-5" /></div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average ICP Score</span>
                <h3 className="text-2xl font-extrabold text-[#22C55E]">{avgScore} / 10</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#22C55E] flex items-center justify-center"><Award className="w-5 h-5" /></div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">High Opportunity Rate</span>
                <h3 className="text-2xl font-extrabold text-[#1F2937]">{conversionRate}%</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center"><TrendingUp className="w-5 h-5" /></div>
            </div>
          </div>
        )}

        {/* Results Section */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-[#1F2937] flex items-center gap-2">
              <Target className="w-5 h-5 text-[#4F7DF3]" /> Qualified Leads 
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">{filteredLeads.length}</span>
            </h2>
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 bg-[#FFFFFF] border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-600 shadow-xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <span>Sort by:</span>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-transparent font-semibold text-[#1F2937] focus:outline-none cursor-pointer">
                  <option value="score">Highest Score</option>
                  <option value="name">Company Name</option>
                </select>
              </div>

              <div className="flex items-center bg-[#FFFFFF] border border-slate-200 rounded-xl p-1 shadow-xs">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${viewMode === 'cards' ? 'bg-[#F5F7FA] text-[#4F7DF3] font-bold shadow-xs' : 'text-slate-500'}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${viewMode === 'table' ? 'bg-[#F5F7FA] text-[#4F7DF3] font-bold shadow-xs' : 'text-slate-500'}`}
                >
                  <TableIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between bg-[#FFFFFF] border border-slate-200 rounded-xl px-4 py-3 shadow-xs">
            <button onClick={handleSelectAll} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-[#4F7DF3] cursor-pointer">
              {selectedLeads.length === filteredLeads.length && filteredLeads.length > 0 ? <CheckSquare className="w-4 h-4 text-[#4F7DF3]" /> : <Square className="w-4 h-4 text-slate-400" />}
              Select All ({selectedLeads.length} selected)
            </button>
            <div className="flex items-center gap-2">
              <button disabled={selectedLeads.length === 0} onClick={handleCopyAllSelected} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4F7DF3] bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 disabled:opacity-40 transition-colors cursor-pointer">
                {globalCopied ? <Check className="w-3.5 h-3.5 text-[#22C55E]" /> : <ClipboardList className="w-3.5 h-3.5" />}
                {globalCopied ? "Copied All!" : "Copy Selected Sequences"}
              </button>
              <button disabled={leads.length === 0} onClick={handleExportCSV} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-[#F5F7FA] hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 transition-colors cursor-pointer">
                <Download className="w-3.5 h-3.5" /> Export to CSV
              </button>
            </div>
          </div>

          {filteredLeads.length === 0 && !loading ? (
            <div className="bg-[#FFFFFF] border border-slate-200 rounded-2xl p-16 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400"><Search className="w-6 h-6" /></div>
              <p className="text-slate-600 font-medium">No leads generated yet.</p>
            </div>
          ) : loading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center space-y-4 shadow-xs">
              <Loader2 className="w-8 h-8 animate-spin text-[#4F7DF3] mx-auto" />
              <p className="text-sm font-semibold text-slate-700">Loading database or running agent...</p>
            </div>
          ) : viewMode === 'cards' ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredLeads.map((lead) => {
                const isSelected = selectedLeads.includes(lead.id);
                return (
                  <div key={lead.id} className={`bg-[#FFFFFF] border rounded-2xl p-6 shadow-xs transition-all space-y-4 ${isSelected ? 'border-[#4F7DF3] ring-1 ring-[#4F7DF3]/25' : 'border-slate-200'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <button onClick={() => toggleSelectLead(lead.id)} className="mt-1 text-slate-400 hover:text-[#4F7DF3] cursor-pointer">
                          {isSelected ? <CheckSquare className="w-4 h-4 text-[#4F7DF3]" /> : <Square className="w-4 h-4" />}
                        </button>
                        <div>
                          <h3 className="text-base font-bold text-[#1F2937]">{lead.company_name} <span className="text-xs text-slate-400 font-medium">({lead.location})</span></h3>
                          <div className="flex items-center gap-4 mt-1 flex-wrap">
                            <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-xs text-[#4F7DF3] hover:underline inline-flex items-center gap-1 font-medium">{lead.website} <ExternalLink className="w-3 h-3" /></a>
                            <span className="text-xs text-slate-500 inline-flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400" /> {lead.email}</span>
                            <span className="text-xs text-slate-500 inline-flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" /> {lead.phone}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1 bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20 text-xs px-3 py-1 rounded-full font-bold">
                          ICP Score: {lead.icp_fit_score}/10
                        </span>
                        <button onClick={(e) => handleDeleteLead(lead.id, e)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer" title="Delete Lead">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
                        <button onClick={() => copyToClipboard(lead.outreach_angle, lead.id)} className="inline-flex items-center gap-1 text-xs font-semibold bg-white text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs cursor-pointer">
                          {copiedId === lead.id ? <Check className="w-3.5 h-3.5 text-[#22C55E]" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                          {copiedId === lead.id ? "Copied" : "Copy Hook"}
                        </button>
                        <button onClick={() => { setActiveModalLead(lead); setModalTone(emailTone); }} className="inline-flex items-center gap-1 text-xs font-semibold bg-[#4F7DF3] text-white px-3.5 py-1.5 rounded-lg shadow-xs cursor-pointer">
                          <Mail className="w-3.5 h-3.5" /> Sequencer & Details <ChevronRight className="w-3.5 h-3.5" />
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
                      <button onClick={handleSelectAll} className="cursor-pointer">
                        {selectedLeads.length === filteredLeads.length ? <CheckSquare className="w-4 h-4 text-[#4F7DF3]" /> : <Square className="w-4 h-4 text-slate-400" />}
                      </button>
                    </th>
                    <th className="p-4">Company Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Phone</th>
                    <th className="p-4">Location</th>
                    <th className="p-4">ICP Score</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLeads.map((lead) => {
                    const isSelected = selectedLeads.includes(lead.id);
                    return (
                      <tr key={lead.id} className={`hover:bg-[#F5F7FA]/60 ${isSelected ? 'bg-[#4F7DF3]/[0.02]' : ''}`}>
                        <td className="p-4">
                          <button onClick={() => toggleSelectLead(lead.id)} className="cursor-pointer">
                            {isSelected ? <CheckSquare className="w-4 h-4 text-[#4F7DF3]" /> : <Square className="w-4 h-4 text-slate-400" />}
                          </button>
                        </td>
                        <td className="p-4 font-bold text-[#1F2937]">{lead.company_name}</td>
                        <td className="p-4 text-slate-600">{lead.email}</td>
                        <td className="p-4 text-slate-600">{lead.phone}</td>
                        <td className="p-4 text-slate-600">{lead.location}</td>
                        <td className="p-4">
                          <span className="font-semibold text-[#22C55E] bg-[#22C55E]/10 px-2.5 py-1 rounded-full">
                            {lead.icp_fit_score}/10
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button onClick={() => { setActiveModalLead(lead); setModalTone(emailTone); }} className="text-[#4F7DF3] font-semibold hover:underline cursor-pointer">View</button>
                          <button onClick={(e) => handleDeleteLead(lead.id, e)} className="text-rose-600 hover:text-rose-800 font-semibold cursor-pointer">Delete</button>
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

      {/* Modal with Feature 2: Per-Lead Tone Selector */}
      {activeModalLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-slate-200 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 md:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-slate-100 pb-4 gap-4">
              <div>
                <span className="text-xs font-bold text-[#4F7DF3] uppercase tracking-wider">3-Step Cold Email Sequencer</span>
                <h2 className="text-xl font-bold text-[#1F2937] mt-0.5">{activeModalLead.company_name}</h2>
                <div className="flex items-center gap-4 mt-1 flex-wrap">
                  <a href={activeModalLead.website} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 hover:text-[#4F7DF3] inline-flex items-center gap-1">
                    {activeModalLead.website} <ExternalLink className="w-3 h-3" />
                  </a>
                  <span className="text-xs text-slate-600">Email: <strong>{activeModalLead.email}</strong></span>
                  <span className="text-xs text-slate-600">Phone: <strong>{activeModalLead.phone}</strong></span>
                </div>
              </div>

              {/* Feature 2: Dropdown tone switcher inside modal */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Tone:</span>
                <select 
                  value={modalTone} 
                  onChange={(e) => handleModalToneChange(e.target.value)}
                  className="bg-slate-100 border border-slate-200 text-xs font-semibold text-[#1F2937] rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
                >
                  <option value="Professional & Consultative">Professional & Consultative</option>
                  <option value="Aggressive & Direct">Aggressive & Direct</option>
                  <option value="Casual & Friendly">Casual & Friendly</option>
                  <option value="Executive & Formal">Executive & Formal</option>
                </select>
                <button onClick={() => setActiveModalLead(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer ml-2">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-6 text-sm">
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Analysis & Reasoning</h4>
                <p className="text-slate-700 bg-[#F5F7FA] p-4 rounded-xl border border-slate-200 leading-relaxed text-xs">
                  {activeModalLead.full_analysis}
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-[#4F7DF3] uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="w-4 h-4" /> Tailored 3-Step Outreach Sequence ({modalTone})
                </h4>

                <div className="bg-[#F5F7FA] p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Step 1: Initial Cold Outreach</span>
                    <button onClick={() => copyToClipboard(activeModalLead.email_sequence.step1, 'step1')} className="text-xs text-[#4F7DF3] font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer">
                      {copiedId === 'step1' ? <Check className="w-3 h-3 text-[#22C55E]" /> : <Copy className="w-3 h-3" />}
                      {copiedId === 'step1' ? "Copied" : "Copy Email"}
                    </button>
                  </div>
                  <textarea defaultValue={activeModalLead.email_sequence.step1} className="w-full bg-white border border-slate-200 rounded-lg p-3 text-xs text-[#1F2937] focus:outline-none focus:border-[#4F7DF3] h-36 leading-relaxed resize-none font-mono" />
                </div>

                <div className="bg-[#F5F7FA] p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Step 2: Value-Add Follow-Up (Day 3)</span>
                    <button onClick={() => copyToClipboard(activeModalLead.email_sequence.step2, 'step2')} className="text-xs text-[#4F7DF3] font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer">
                      {copiedId === 'step2' ? <Check className="w-3 h-3 text-[#22C55E]" /> : <Copy className="w-3 h-3" />}
                      {copiedId === 'step2' ? "Copied" : "Copy Email"}
                    </button>
                  </div>
                  <textarea defaultValue={activeModalLead.email_sequence.step2} className="w-full bg-white border border-slate-200 rounded-lg p-3 text-xs text-[#1F2937] focus:outline-none focus:border-[#4F7DF3] h-36 leading-relaxed resize-none font-mono" />
                </div>

                <div className="bg-[#F5F7FA] p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Step 3: Breaking the Ice / Breakup Email (Day 7)</span>
                    <button onClick={() => copyToClipboard(activeModalLead.email_sequence.step3, 'step3')} className="text-xs text-[#4F7DF3] font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer">
                      {copiedId === 'step3' ? <Check className="w-3 h-3 text-[#22C55E]" /> : <Copy className="w-3 h-3" />}
                      {copiedId === 'step3' ? "Copied" : "Copy Email"}
                    </button>
                  </div>
                  <textarea defaultValue={activeModalLead.email_sequence.step3} className="w-full bg-white border border-slate-200 rounded-lg p-3 text-xs text-[#1F2937] focus:outline-none focus:border-[#4F7DF3] h-36 leading-relaxed resize-none font-mono" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button onClick={(e) => { handleDeleteLead(activeModalLead.id, e); setActiveModalLead(null); }} className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-800 bg-rose-50 px-4 py-2 rounded-xl border border-rose-200 transition-colors cursor-pointer">
                <Trash2 className="w-3.5 h-3.5" /> Delete Lead
              </button>
              <button onClick={() => setActiveModalLead(null)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SEARCH HISTORY SIDEBAR DRAWER */}
      {showHistory && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 flex flex-col justify-between animate-slideLeft">
            <div className="space-y-6 overflow-y-auto flex-1">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="font-bold text-lg text-[#1F2937] flex items-center gap-2">
                  <History className="w-5 h-5 text-[#4F7DF3]" /> Past Search History
                </h3>
                <button onClick={() => setShowHistory(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {loadingHistory ? (
                <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#4F7DF3] mx-auto" /></div>
              ) : historyList.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-12">No saved search sessions found in database.</p>
              ) : (
                <div className="space-y-3">
                  {historyList.map((item) => (
                    <div 
                      key={item.session_id}
                      onClick={() => handleLoadSession(item.session_id, item.industry, item.location)}
                      className="p-4 rounded-xl border border-slate-200 hover:border-[#4F7DF3] hover:bg-blue-50/20 transition-all cursor-pointer space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-[#1F2937]">{item.industry}</span>
                        <span className="text-xs font-semibold bg-emerald-50 text-[#22C55E] px-2 py-0.5 rounded-full">{item.total_leads} Leads</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {item.location}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-400">
              Click any past search session to instantly reload leads from the database.
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;