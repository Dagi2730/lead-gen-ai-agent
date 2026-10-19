import React, { useState, useEffect } from 'react';
import {
  Settings,
  Mail,
  Shield,
  Key,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Server,
  Sparkles,
  Save,
  Send
} from 'lucide-react';

export default function SettingsView({ apiBaseUrl, token, user }) {
  // SMTP Settings State
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [useTls, setUseTls] = useState(true);
  const [useSsl, setUseSsl] = useState(false);
  const [fromName, setFromName] = useState('LeadGen AI Growth Team');
  const [fromEmail, setFromEmail] = useState('');

  // Status & Testing State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [testStatus, setTestStatus] = useState(null);

  // CRM Token State
  const [hubspotKey, setHubspotKey] = useState('');

  useEffect(() => {
    fetchSmtpSettings();
  }, []);

  const fetchSmtpSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiBaseUrl}/api/v1/email/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSmtpHost(data.host || 'smtp.gmail.com');
        setSmtpPort(data.port || 587);
        setSmtpUser(data.username || '');
        setUseTls(data.use_tls ?? true);
        setUseSsl(data.use_ssl ?? false);
        setFromName(data.from_name || 'LeadGen AI Growth Team');
        setFromEmail(data.from_email || '');
      }
    } catch (err) {
      console.error('Failed to load SMTP settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSmtp = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveStatus(null);

    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/email/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          host: smtpHost,
          port: parseInt(smtpPort),
          username: smtpUser,
          password: smtpPass,
          use_tls: useTls,
          use_ssl: useSsl,
          from_name: fromName,
          from_email: fromEmail || smtpUser,
          is_active: true
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to save SMTP settings');

      setSaveStatus({ success: true, message: 'SMTP settings updated successfully!' });
    } catch (err) {
      setSaveStatus({ success: false, message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestStatus(null);

    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/email/test-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          host: smtpHost,
          port: parseInt(smtpPort),
          username: smtpUser,
          password: smtpPass,
          use_tls: useTls,
          use_ssl: useSsl
        })
      });

      const data = await res.json();
      setTestStatus({
        success: data.success,
        message: data.message || (data.success ? 'Handshake successful!' : 'Connection failed')
      });
    } catch (err) {
      setTestStatus({ success: false, message: err.message || 'Error connecting to SMTP server.' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-blue-400" />
          Settings & Integrations
        </h2>
        <p className="text-xs text-slate-400 font-medium mt-1">
          Configure direct outbound SMTP mail servers, CRM integration tokens, and workspace preferences.
        </p>
      </div>

      {/* SMTP Configuration Card */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-400" />
              Outbound SMTP & Email Dispatcher
            </h3>
            <p className="text-xs text-slate-400">
              Used to send 3-step cold email sequences directly from the platform.
            </p>
          </div>

          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-blue-400 border border-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>{testing ? 'Testing Handshake...' : 'Test Connection'}</span>
          </button>
        </div>

        {/* Test or Save Status Banner */}
        {testStatus && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
              testStatus.success
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {testStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            <span>{testStatus.message}</span>
          </div>
        )}

        {saveStatus && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
              saveStatus.success
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {saveStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            <span>{saveStatus.message}</span>
          </div>
        )}

        <form onSubmit={handleSaveSmtp} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                SMTP Host Server
              </label>
              <input
                type="text"
                required
                placeholder="smtp.gmail.com or smtp.sendgrid.net"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                SMTP Port
              </label>
              <input
                type="number"
                required
                placeholder="587"
                value={smtpPort}
                onChange={(e) => setSmtpPort(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Username / Email Login
              </label>
              <input
                type="text"
                placeholder="outreach@yourcompany.com"
                value={smtpUser}
                onChange={(e) => setSmtpUser(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                App Password / API Secret
              </label>
              <input
                type="password"
                placeholder="••••••••••••••••"
                value={smtpPass}
                onChange={(e) => setSmtpPass(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Sender Display Name
              </label>
              <input
                type="text"
                placeholder="Jane Doe (Growth Lead)"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                From Email Address
              </label>
              <input
                type="email"
                placeholder="jane@yourcompany.com"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 text-xs text-slate-300 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={useTls}
                onChange={(e) => setUseTls(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span>Enable STARTTLS (Port 587)</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-300 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={useSsl}
                onChange={(e) => setUseSsl(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span>Enable Direct SSL (Port 465)</span>
            </label>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? 'Saving...' : 'Save SMTP Settings'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* CRM & API Keys Card */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-indigo-400" />
            CRM Integrations (HubSpot / Salesforce / Zoho)
          </h3>
          <p className="text-xs text-slate-400">
            Push enriched prospects directly into your connected CRM pipelines.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              HubSpot Private App Access Token
            </label>
            <input
              type="password"
              placeholder="pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={hubspotKey}
              onChange={(e) => setHubspotKey(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Used for 1-click contact synchronization. If left blank, simulated sandbox push will be performed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
