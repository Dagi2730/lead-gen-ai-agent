import React, { useState, useEffect } from 'react';
import {
  Send,
  Sparkles,
  SlidersHorizontal,
  Mail,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  PenLine,
  Wand2,
  Loader2,
  ChevronDown,
  BookOpen,
  Save,
  Trash2,
  X,
  Plus
} from 'lucide-react';

const TONES = [
  { id: 'Professional & Consultative', label: 'Professional & Consultative', desc: 'Authoritative, ROI-focused, and consultative advisory.' },
  { id: 'Aggressive & Direct', label: 'Aggressive & Direct', desc: 'Short, punchy, problem-first with immediate call-to-action.' },
  { id: 'Casual & Friendly', label: 'Casual & Friendly', desc: 'Conversational peer-to-peer approach with minimal friction.' },
  { id: 'Executive & Formal', label: 'Executive & Formal', desc: 'High-level institutional framing tailored for C-suite buyers.' },
];

// ─── Templates Library ──────────────────────────────────────────────────────
function getBuiltInTemplate(step, tone) {
  if (tone === 'Aggressive & Direct') {
    if (step === 1) return { subject: "Quick question regarding {{Company}}'s sales pipeline", body: `Hi {{Company}} Team,\n\nI reviewed your current market positioning and noticed an obvious bottleneck in your outbound conversion funnels.\n\n{{Outreach_Hook}}\n\nWe guarantee an immediate 35% reduction in CAC while doubling qualified B2B meetings within 30 days.\n\nAre you available for a brief 7-minute walk-through this Thursday at 10 AM?\n\nBest,\nLeadGen Growth Team` };
    if (step === 2) return { subject: "Re: Quick question regarding {{Company}}'s sales pipeline", body: `Hi {{Company}} Team,\n\nFollowing up on my note from Tuesday. We recently unlocked a 3.4x inbound pipeline acceleration for a peer in your sector.\n\nHere is a 2-point teardown of how we can replicate this for {{Company}}.\n\nDo you have 5 minutes to connect tomorrow?\n\nBest,\nLeadGen Growth Team` };
    return { subject: 'Closing file for {{Company}}', body: `Hi {{Company}} Team,\n\nI assume optimizing your B2B lead generation workflow isn't a priority for this quarter. I'll close your file for now.\n\nIf priorities shift, you can check our benchmark case studies at any time.\n\nBest,\nLeadGen Growth Team` };
  }
  if (tone === 'Casual & Friendly') {
    if (step === 1) return { subject: 'Idea for {{Company}}', body: `Hey there,\n\nHope your week is going great! Came across {{Company}} recently and really loved what you are building.\n\n{{Outreach_Hook}}\n\nWe put together a lightweight framework to help teams like yours scale without extra headcount. Would love to share a few ideas if you're open to it?\n\nCheers,\nLeadGen Growth Team` };
    if (step === 2) return { subject: 'Quick follow up / {{Company}}', body: `Hey again,\n\nJust floating this to the top of your inbox! Thought this quick insight might be helpful for your team's upcoming growth sprints.\n\nLet me know if you'd like a quick 5-minute rundown.\n\nCheers,\nLeadGen Growth Team` };
    return { subject: 'Last check-in for {{Company}}', body: `Hey,\n\nDon't want to clutter your inbox! If you ever want to brainstorm outbound strategies or chat B2B pipelines down the road, feel free to ping me.\n\nHave a great quarter ahead!\n\nCheers,\nLeadGen Growth Team` };
  }
  if (tone === 'Executive & Formal') {
    if (step === 1) return { subject: 'Strategic Growth Initiative for {{Company}}', body: `Dear Executive Leadership at {{Company}},\n\nI am writing to share a strategic evaluation of {{Company}}'s enterprise acquisition workflows in your target market.\n\n{{Outreach_Hook}}\n\nOur institutional framework has assisted comparable enterprises in establishing predictable, high-yield revenue infrastructure with minimal overhead.\n\nI welcome the opportunity to discuss a tailored deployment for {{Company}} at your convenience.\n\nSincerely,\nLeadGen Enterprise Team` };
    if (step === 2) return { subject: 'Follow-up: Strategic Growth Initiative for {{Company}}', body: `Dear Executive Leadership,\n\nRevisiting our correspondence regarding strategic acquisition efficiencies for {{Company}}.\n\nWe have prepared an executive summary comparing current industry benchmarks with automated qualification pipelines.\n\nPlease let me know if an introductory briefing aligns with your executive agenda.\n\nSincerely,\nLeadGen Enterprise Team` };
    return { subject: 'Concluding Outreach: {{Company}}', body: `Dear Executive Leadership,\n\nRecognizing the demands on your schedule, this will be my final correspondence. Should your enterprise explore scalable acquisition solutions in the future, we remain at your service.\n\nSincerely,\nLeadGen Enterprise Team` };
  }
  // Professional & Consultative
  if (step === 1) return { subject: 'Scaling outreach & qualified pipeline for {{Company}}', body: `Hi {{Company}} Team,\n\nI was reviewing {{Company}}'s digital footprint and noticed an exciting growth trajectory.\n\n{{Outreach_Hook}}\n\nWe work with leading B2B organizations to automate high-intent prospect discovery, enrich verified decision-maker contacts, and boost meeting booking rates by 40%.\n\nWould you be open to a 10-minute introductory call next Tuesday or Wednesday to explore if this fits your current roadmap?\n\nWarm regards,\nLeadGen Growth Specialist` };
  if (step === 2) return { subject: 'Re: Scaling outreach & qualified pipeline for {{Company}}', body: `Hi {{Company}} Team,\n\nTouching base on my previous note. I wanted to share a quick case study of how a company in your vertical generated 45+ enterprise-qualified pipeline leads in their first month using our AI qualification engine.\n\nHappy to share the exact teardown if you find it relevant?\n\nWarm regards,\nLeadGen Growth Specialist` };
  return { subject: 'Permission to close your file, {{Company}}?', body: `Hi {{Company}} Team,\n\nI haven't heard back, so I assume this isn't the right time to optimize your outbound pipeline—and that is completely fine!\n\nI'll pause our outreach for now. If you ever want to revisit your B2B lead generation strategy, feel free to reply directly to this email.\n\nWarm regards,\nLeadGen Growth Specialist` };
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CampaignsView({ apiBaseUrl, token, currentWorkspace }) {
  const [mode, setMode] = useState('sequence'); // 'sequence' | 'custom'

  // Sequence mode state
  const [activeStep, setActiveStep] = useState(1);
  const [selectedTone, setSelectedTone] = useState('Professional & Consultative');
  const [copied, setCopied] = useState(false);

  // Custom email writer state
  const [customSubject, setCustomSubject] = useState('');
  const [customBody, setCustomBody] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [customTone, setCustomTone] = useState('Professional & Consultative');
  const [customStep, setCustomStep] = useState(1);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [customCopied, setCustomCopied] = useState(false);
  const [savedTemplates, setSavedTemplates] = useState(() => {
    try { return JSON.parse(localStorage.getItem('leadgen_custom_templates') || '[]'); }
    catch { return []; }
  });
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [showLibrary, setShowLibrary] = useState(false);

  // Test dispatch & logs (shared)
  const [testEmail, setTestEmail] = useState('');
  const [testSending, setTestSending] = useState(false);
  const [testStatus, setTestStatus] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  useEffect(() => { fetchLogs(); }, [currentWorkspace]);

  const fetchLogs = async () => {
    try {
      setLoadingLogs(true);
      const res = await fetch(`${apiBaseUrl}/api/v1/email/logs`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setLogs(await res.json());
    } catch (err) { console.error('Failed to fetch logs:', err); }
    finally { setLoadingLogs(false); }
  };

  // ─── Sequence mode helpers ─────────────────────────────────────────────────
  const seqTemplate = getBuiltInTemplate(activeStep, selectedTone);

  const handleCopySequence = () => {
    navigator.clipboard.writeText(`Subject: ${seqTemplate.subject}\n\n${seqTemplate.body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ─── Custom writer helpers ─────────────────────────────────────────────────
  const handleAIGenerate = async () => {
    if (!customInstructions.trim()) return;
    setAiGenerating(true);
    setTestStatus(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/email/generate-custom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          instructions: customInstructions,
          tone: customTone,
          step: customStep,
          sender_name: 'the Growth Team'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Generation failed');
      setCustomSubject(data.subject || '');
      setCustomBody(data.body || '');
    } catch (err) {
      setTestStatus({ success: false, message: err.message || 'AI generation failed. Try again.' });
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim() || (!customSubject && !customBody)) return;
    const updated = [
      { id: Date.now(), name: templateName.trim(), subject: customSubject, body: customBody, tone: customTone, createdAt: new Date().toISOString() },
      ...savedTemplates
    ];
    setSavedTemplates(updated);
    localStorage.setItem('leadgen_custom_templates', JSON.stringify(updated));
    setTemplateName('');
    setShowSaveModal(false);
  };

  const handleLoadTemplate = (tpl) => {
    setCustomSubject(tpl.subject);
    setCustomBody(tpl.body);
    setCustomTone(tpl.tone || 'Professional & Consultative');
    setShowLibrary(false);
  };

  const handleDeleteTemplate = (id, e) => {
    e.stopPropagation();
    const updated = savedTemplates.filter(t => t.id !== id);
    setSavedTemplates(updated);
    localStorage.setItem('leadgen_custom_templates', JSON.stringify(updated));
  };

  const handleCopyCustom = () => {
    navigator.clipboard.writeText(`Subject: ${customSubject}\n\n${customBody}`);
    setCustomCopied(true);
    setTimeout(() => setCustomCopied(false), 2000);
  };

  const handleTestSend = async (e, subjectOverride, bodyOverride) => {
    e?.preventDefault();
    if (!testEmail) return;
    const sub = subjectOverride ?? (mode === 'custom' ? customSubject : seqTemplate.subject.replace(/\{\{Company\}\}/g, 'Acme Corp'));
    const bod = bodyOverride ?? (mode === 'custom' ? customBody : seqTemplate.body.replace(/\{\{Company\}\}/g, 'Acme Corp').replace('{{Outreach_Hook}}', 'Noticed your recent growth trajectory in enterprise software.'));

    setTestSending(true);
    setTestStatus(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/email/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ recipient_email: testEmail, recipient_name: 'Test Executive', subject: sub, body: bod, step_number: mode === 'custom' ? customStep : activeStep, tone: mode === 'custom' ? customTone : selectedTone })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Dispatch failed');
      setTestStatus({ success: data.success, simulated: data.simulated, message: data.message || 'Dispatched!' });
      fetchLogs();
    } catch (err) {
      setTestStatus({ success: false, message: err.message });
    } finally {
      setTestSending(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">

      {/* ── Page Header + Mode Toggle ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Send className="w-6 h-6 text-blue-400" />
            Outreach & Campaign Composer
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-1">
            3-step sequences, direct SMTP dispatch, and custom AI-powered email writing.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center bg-slate-900/80 border border-slate-800 p-1 rounded-xl gap-1">
          <button
            onClick={() => setMode('sequence')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${mode === 'sequence' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Sequence Templates
          </button>
          <button
            onClick={() => setMode('custom')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${mode === 'custom' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <PenLine className="w-3.5 h-3.5" />
            Custom Email Writer
          </button>
        </div>
      </div>

      {/* ═══════════════════ SEQUENCE MODE ═══════════════════ */}
      {mode === 'sequence' && (
        <>
          {/* Tone Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TONES.map((tone) => (
              <button key={tone.id} onClick={() => setSelectedTone(tone.id)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${selectedTone === tone.id ? 'bg-blue-600/15 border-blue-500/50 shadow-lg shadow-blue-500/10' : 'glass-card border-slate-800/80 hover:border-slate-700'}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-bold ${selectedTone === tone.id ? 'text-blue-400' : 'text-slate-200'}`}>{tone.label}</span>
                  {selectedTone === tone.id && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{tone.desc}</p>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Template Editor */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5 lg:col-span-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
                  {[1, 2, 3].map((step) => (
                    <button key={step} onClick={() => setActiveStep(step)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeStep === step ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
                    >
                      {step === 1 ? 'Step 1: Initial Hook' : step === 2 ? 'Step 2: Value Proof' : 'Step 3: Breakup Call'}
                    </button>
                  ))}
                </div>
                <button onClick={handleCopySequence}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Template'}</span>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Subject Line</span>
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-sm font-semibold text-white">{seqTemplate.subject}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Body (Variables: <code className="text-blue-400">{'{{Company}}'}</code>, <code className="text-indigo-400">{'{{Outreach_Hook}}'}</code>)
                  </span>
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed">{seqTemplate.body}</div>
                </div>
              </div>
            </div>

            {/* Test Dispatch */}
            {renderTestDispatch(testEmail, setTestEmail, testSending, testStatus, handleTestSend)}
          </div>
        </>
      )}

      {/* ═══════════════════ CUSTOM EMAIL WRITER ═══════════════════ */}
      {mode === 'custom' && (
        <div className="space-y-6">
          {/* AI Instruction Panel */}
          <div className="glass-panel p-6 rounded-2xl border border-indigo-500/20 bg-indigo-950/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                  <Wand2 className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">AI Email Generator</h3>
                  <p className="text-[11px] text-slate-400">Describe your email and let the AI draft it for you</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowLibrary(!showLibrary)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Saved Templates ({savedTemplates.length})</span>
                </button>
              </div>
            </div>

            {/* Saved Templates Library Dropdown */}
            {showLibrary && (
              <div className="rounded-xl border border-slate-700/80 bg-slate-950/80 overflow-hidden">
                {savedTemplates.length === 0 ? (
                  <p className="text-xs text-slate-500 p-4 text-center">No saved templates yet. Write and save one below.</p>
                ) : (
                  <div className="divide-y divide-slate-800 max-h-52 overflow-y-auto">
                    {savedTemplates.map((tpl) => (
                      <div key={tpl.id} onClick={() => handleLoadTemplate(tpl)}
                        className="flex items-center justify-between px-4 py-3 hover:bg-slate-800/60 cursor-pointer group transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">{tpl.name}</p>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">{tpl.subject}</p>
                        </div>
                        <button onClick={(e) => handleDeleteTemplate(tpl.id, e)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors shrink-0 ml-3"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tone + Step Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Email Tone</label>
                <select value={customTone} onChange={(e) => setCustomTone(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {TONES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Email Step</label>
                <select value={customStep} onChange={(e) => setCustomStep(Number(e.target.value))}
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value={1}>Step 1 — Initial Outreach</option>
                  <option value={2}>Step 2 — Value Follow-up</option>
                  <option value={3}>Step 3 — Breakup Call</option>
                </select>
              </div>
            </div>

            {/* Instructions Textarea */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Instructions for AI <span className="text-indigo-400 normal-case font-semibold">— be as specific as you like</span>
              </label>
              <textarea
                rows={3}
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder={`e.g. "Write a short, punchy email to a B2B SaaS startup founder about reducing their CAC by 40%. Mention that we helped 3 similar companies scale ARR from $500k to $2M. Ask for a 15-minute call."`}
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl p-3.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 resize-none placeholder-slate-600 leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] text-slate-500">
                Optional: add company name, website, or outreach hook below after generating.
              </p>
              <button
                onClick={handleAIGenerate}
                disabled={aiGenerating || !customInstructions.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 disabled:opacity-50 transition-all cursor-pointer shrink-0"
              >
                {aiGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                <span>{aiGenerating ? 'Generating...' : 'Generate with AI'}</span>
              </button>
            </div>
          </div>

          {/* Custom Email Editor + Dispatch Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Editor */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 lg:col-span-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <PenLine className="w-4 h-4 text-indigo-400" />
                  Email Editor
                </h3>
                <div className="flex items-center gap-2">
                  <button onClick={handleCopyCustom}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                  >
                    {customCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{customCopied ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={() => setShowSaveModal(true)}
                    disabled={!customSubject && !customBody}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition-colors cursor-pointer disabled:opacity-40"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Template</span>
                  </button>
                </div>
              </div>

              {/* Status Banner */}
              {testStatus && (
                <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${testStatus.success ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'}`}>
                  {testStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                  <span>{testStatus.message}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Subject Line</label>
                  <input
                    type="text"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    placeholder="Your compelling subject line..."
                    className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Email Body</label>
                  <textarea
                    rows={14}
                    value={customBody}
                    onChange={(e) => setCustomBody(e.target.value)}
                    placeholder="Start writing your email here, or use the AI Generator above to draft it automatically..."
                    className="w-full bg-slate-900/90 border border-slate-700 rounded-xl p-3.5 text-sm text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-indigo-500 resize-none placeholder-slate-600"
                  />
                </div>
              </div>
            </div>

            {/* Test Dispatch Sidebar */}
            {renderTestDispatch(testEmail, setTestEmail, testSending, testStatus, handleTestSend)}
          </div>
        </div>
      )}

      {/* ── Dispatch Logs ── */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              Outbound Dispatch Logs
            </h3>
            <p className="text-xs text-slate-400">All sequences dispatched from this workspace</p>
          </div>
          <button onClick={fetchLogs} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer">
            <RefreshCw className="w-3 h-3" />
            <span>Refresh</span>
          </button>
        </div>

        {logs && logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Step</th>
                  <th className="py-3 px-4">Tone</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-100">{log.recipient_email}</td>
                    <td className="py-3 px-4 text-slate-300 max-w-xs truncate">{log.subject}</td>
                    <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold">Step {log.step_number}</span></td>
                    <td className="py-3 px-4 text-slate-400 truncate max-w-[120px]">{log.tone}</td>
                    <td className="py-3 px-4">
                      {log.status === 'sent' ? <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Sent</span>
                        : log.status === 'simulated' ? <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">Simulated</span>
                        : <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">Failed</span>}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500 text-[11px]">{new Date(log.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-slate-500">No outbound emails dispatched yet in this workspace.</div>
        )}
      </div>

      {/* ── Save Template Modal ── */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#111827] border border-slate-700/80 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Save as Template</h3>
              <button onClick={() => setShowSaveModal(false)} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Template Name</label>
              <input
                type="text"
                autoFocus
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveTemplate(); }}
                placeholder="e.g. SaaS Founder Intro — Aggressive"
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <button onClick={() => setShowSaveModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700 cursor-pointer">Cancel</button>
              <button onClick={handleSaveTemplate} disabled={!templateName.trim()} className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20 disabled:opacity-50 cursor-pointer">
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Shared Test Dispatch Panel ───────────────────────────────────────────────
function renderTestDispatch(testEmail, setTestEmail, testSending, testStatus, handleTestSend) {
  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5 lg:col-span-1">
      <div className="space-y-1.5">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Mail className="w-4 h-4 text-blue-400" />
          Live SMTP Dispatch Test
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Send the current email content to a recipient to verify deliverability and SMTP connectivity.
        </p>
      </div>

      {testStatus && (
        <div className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${testStatus.success ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'}`}>
          {testStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
          <span>{testStatus.message}</span>
        </div>
      )}

      <form onSubmit={handleTestSend} className="space-y-3 pt-2">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Recipient Email Address</label>
          <input
            type="email"
            required
            placeholder="your-email@company.com"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
          />
        </div>
        <button type="submit" disabled={testSending}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all cursor-pointer"
        >
          {testSending ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /><span>Dispatching...</span></> : <><Send className="w-3.5 h-3.5" /><span>Send Test Email via SMTP</span></>}
        </button>
      </form>
    </div>
  );
}
