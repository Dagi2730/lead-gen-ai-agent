import React from 'react';
import { ShieldCheck, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export default function DeliverabilityBadge({ status = "Valid", score = 90 }) {
  const normalized = (status || "Valid").toLowerCase();

  if (normalized === 'verified') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" title={`Corporate DNS & MX Verified (${Math.round(score)}% confidence)`}>
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        Verified
      </span>
    );
  }

  if (normalized === 'valid') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20" title={`Valid Email Address (${Math.round(score)}% confidence)`}>
        <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
        Valid
      </span>
    );
  }

  if (normalized === 'risky') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20" title={`Unresolved DNS or Catch-all domain (${Math.round(score)}% score)`}>
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
        Risky
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20" title="Invalid syntax or disposable temporary mailbox">
      <XCircle className="w-3.5 h-3.5 text-rose-400" />
      Invalid
    </span>
  );
}
