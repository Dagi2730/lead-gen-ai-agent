import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  Sparkles,
  Copy,
  Check,
  Mail,
  SlidersHorizontal,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import DeliverabilityBadge from './DeliverabilityBadge';

const TONES = [
  'Professional & Consultative',
  'Aggressive & Direct',
  'Casual & Friendly',
  'Executive & Formal'
];

export default function EmailDispatchModal({ isOpen, onClose, lead, apiBaseUrl, token, onDispatchSuccess }) {
  if (!isOpen || !lead) return null;

  const [activeStep, setActiveStep] = useState(1);
  const [selectedTone, setSelectedTone] = useState('Professional & Consultative');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  // Generate sequence templates based on lead, step, and tone
  useEffect(() => {
    const company = lead.company_name || 'your company';
    const angle = lead.suggested_outreach_angle || `scaling outbound pipeline for ${company}`;

    let sub = '';
    let content = '';

    if (selectedTone === 'Aggressive & Direct') {
      if (activeStep === 1) {
        sub = `Quick question regarding ${company}'s sales pipeline`;
        content = `Hi ${company} Team,\n\nI reviewed your current market positioning and noticed an obvious bottleneck in your outbound conversion funnels.\n\n${angle}\n\nWe guarantee an immediate 35% reduction in CAC while doubling qualified B2B meetings within 30 days.\n\nAre you available for a brief 7-minute walk-through this Thursday at 10 AM?\n\nBest,\nLeadGen Growth Team`;
      } else if (activeStep === 2) {
        sub = `Re: Quick question regarding ${company}'s sales pipeline`;
        content = `Hi ${company} Team,\n\nFollowing up on my note from Tuesday. We recently unlocked a 3.4x inbound pipeline acceleration for a peer in your sector.\n\nHere is a 2-point teardown of how we can replicate this for ${company}.\n\nDo you have 5 minutes to connect tomorrow?\n\nBest,\nLeadGen Growth Team`;
      } else {
        sub = `Closing file for ${company}`;
        content = `Hi ${company} Team,\n\nI assume optimizing your B2B lead generation workflow isn't a priority for this quarter. I'll close your file for now.\n\nIf priorities shift, you can check our benchmark case studies at any time.\n\nBest,\nLeadGen Growth Team`;
      }
    } else if (selectedTone === 'Casual & Friendly') {
      if (activeStep === 1) {
        sub = `Idea for ${company}`;
        content = `Hey there,\n\nHope your week is going great! Came across ${company} recently and really loved what you are building.\n\n${angle}\n\nWe put together a lightweight framework to help teams like yours scale without extra headcount. Would love to share a few ideas if you're open to it?\n\nCheers,\nLeadGen Growth Team`;
      } else if (activeStep === 2) {
        sub = `Quick follow up / ${company}`;
        content = `Hey again,\n\nJust floating this to the top of your inbox! Thought this quick insight might be helpful for your team's upcoming growth sprints.\n\nLet me know if you'd like a quick 5-minute rundown.\n\nCheers,\nLeadGen Growth Team`;
      } else {
        sub = `Last check-in for ${company}`;
        content = `Hey,\n\nDon't want to clutter your inbox! If you ever want to brainstorm outbound strategies or chat B2B pipelines down the road, feel free to ping me.\n\nHave a great quarter ahead!\n\nCheers,\nLeadGen Growth Team`;
      }
    } else if (selectedTone === 'Executive & Formal') {
      if (activeStep === 1) {
        sub = `Strategic Growth Initiative for ${company}`;
        content = `Dear Executive Leadership at ${company},\n\nI am writing to share a strategic evaluation of ${company}'s enterprise acquisition workflows in your target market.\n\n${angle}\n\nOur institutional framework has assisted comparable enterprises in establishing predictable, high-yield revenue infrastructure with minimal overhead.\n\nI welcome the opportunity to discuss a tailored deployment for ${company} at your convenience.\n\nSincerely,\nLeadGen Enterprise Team`;
      } else if (activeStep === 2) {
        sub = `Follow-up: Strategic Growth Initiative for ${company}`;
        content = `Dear Executive Leadership,\n\nRevisiting our correspondence regarding strategic acquisition efficiencies for ${company}.\n\nWe have prepared an executive summary comparing current industry benchmarks with automated qualification pipelines.\n\nPlease let me know if an introductory briefing aligns with your executive agenda.\n\nSincerely,\nLeadGen Enterprise Team`;
      } else {
        sub = `Concluding Outreach: ${company}`;
        content = `Dear Executive Leadership,\n\nRecognizing the demands on your schedule, this will be my final correspondence. Should your enterprise explore scalable acquisition solutions in the future, we remain at your service.\n\nSincerely,\nLeadGen Enterprise Team`;
      }
    } else {
      // Professional & Consultative (Default)
      if (activeStep === 1) {
        sub = `Scaling outreach & qualified pipeline for ${company}`;
        content = `Hi ${company} Team,\n\nI was reviewing ${company}'s digital footprint and noticed an exciting growth trajectory.\n\n${angle}\n\nWe work with leading B2B organizations to automate high-intent prospect discovery, enrich verified decision-maker contacts, and boost meeting booking rates by 40%.\n\nWould you be open to a 10-minute introductory call next Tuesday or Wednesday to explore if this fits your current roadmap?\n\nWarm regards,\nLeadGen Growth Specialist`;
      } else if (activeStep === 2) {
        sub = `Re: Scaling outreach & qualified pipeline for ${company}`;
        content = `Hi ${company} Team,\n\nTouching base on my previous note. I wanted to share a quick case study of how a company in your vertical generated 45+ enterprise-qualified pipeline leads in their first month using our AI qualification engine.\n\nHappy to share the exact teardown if you find it relevant?\n\nWarm regards,\nLeadGen Growth Specialist`;
      } else {
        sub = `Permission to close your file, ${company}?`;
        content = `Hi ${company} Team,\n\nI haven't heard back, so I assume this isn't the right time to optimize your outbound pipeline—and that is completely fine!\n\nI'll pause our outreach for now. If you ever want to revisit your B2B lead generation strategy, feel free to reply directly to this email.\n\nWarm regards,\nLeadGen Growth Specialist`;
      }
    }

    setSubject(sub);
    setBody(content);
    setSendResult(null);
  }, [lead, activeStep, selectedTone]);

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDirectSend = async () => {
    setIsSending(true);
    setSendResult(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/email/dispatch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          lead_id: lead.id || null,
          recipient_email: lead.email,
          recipient_name: lead.company_name,
          subject,
          body,
          step_number: activeStep,
          tone: selectedTone
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to dispatch email');
      }

      setSendResult({
        success: data.success,
        simulated: data.simulated,
        message: data.message || 'Sequence successfully sent!'
      });

      if (onDispatchSuccess) {
        onDispatchSuccess(lead.id, activeStep);
      }
    } catch (err) {
      setSendResult({
        success: false,
        message: err.message || 'An error occurred sending the email.'
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#111827] border border-slate-700/80 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{lead.company_name}</h3>
                <DeliverabilityBadge status={lead.deliverability_status} score={lead.deliverability_score} />
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                <span>To: <strong className="text-slate-200">{lead.email || 'No email provided'}</strong></span>
                {lead.website && (
                  <>
                    <span>•</span>
                    <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline flex items-center gap-1">
                      {lead.website.replace('https://', '').replace('http://', '').replace('www.', '')}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Controls: Step Tabs & Tone Selection */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3">
          {/* 3-Step Sequence Tabs */}
          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            {[1, 2, 3].map((step) => (
              <button
                key={step}
                onClick={() => setActiveStep(step)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeStep === step
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {step === 1 ? '1. Initial Touch' : step === 2 ? '2. Value Follow-up' : '3. Breakup Call'}
              </button>
            ))}
          </div>

          {/* Tone Selector Dropdown */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedTone}
              onChange={(e) => setSelectedTone(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-medium cursor-pointer"
            >
              {TONES.map((tone) => (
                <option key={tone} value={tone}>
                  {tone}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Body Editor Area */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Send Status Notification */}
          {sendResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
                sendResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {sendResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{sendResult.message}</span>
              </div>
            </div>
          )}

          {/* Subject line input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Subject Line
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Email body textarea */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Email Content
            </label>
            <textarea
              rows={9}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl p-3.5 text-sm text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied to Clipboard' : 'Copy Email'}
          </button>

          <div className="flex items-center gap-3">
            <a
              href={`mailto:${lead.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}
              className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
            >
              Open in Mail App
            </a>

            <button
              onClick={handleDirectSend}
              disabled={isSending || !lead.email}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Dispatching...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Dispatch Direct via SMTP
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
