import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Auth from './Auth';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import DashboardView from './views/DashboardView';
import LeadFinderView from './views/LeadFinderView';
import CampaignsView from './views/CampaignsView';
import HistoryView from './views/HistoryView';
import WorkspacesView from './views/WorkspacesView';
import SettingsView from './views/SettingsView';
import NexusView from './views/NexusView';
import { Loader2 } from 'lucide-react';

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://127.0.0.1:8000'
  : 'https://lead-gen-ai-agent-1.onrender.com';

// Wrapper component to get current route metadata for Navbar
function AppLayout({ user, workspaces, currentWorkspace, onSwitchWorkspace, onLogout, onWorkspaceCreated, token }) {
  const location = useLocation();

  const getPageInfo = (path) => {
    switch (path) {
      case '/leads':
        return { title: 'AI Lead Finder', subtitle: 'Targeted Discovery, Dynamic ICP Scoring & Seed Scraping' };
      case '/campaigns':
        return { title: 'Outreach & Campaigns', subtitle: '3-Step Multi-Touch Sequencer & Direct SMTP Dispatch' };
      case '/history':
        return { title: 'Session Archives & CRM', subtitle: 'Historical Lead Repositories & One-Click CRM Export' };
      case '/team':
        return { title: 'Team Workspaces', subtitle: 'Multi-User Organization, Role Hierarchies & Collaborations' };
      case '/settings':
        return { title: 'Settings & Integrations', subtitle: 'Outbound Mail Server, CRM API Keys & Configuration' };
      case '/nexus':
        return { title: 'Nexus Control Center', subtitle: 'Platform Administration — Restricted Access' };
      case '/dashboard':
      default:
        return { title: 'Dashboard', subtitle: 'Real-time Prospecting Analytics & Intelligence' };
    }
  };

  const pageInfo = getPageInfo(location.pathname);

  return (
    <div className="flex h-screen bg-[#0B0F19] text-slate-100 font-sans overflow-hidden">
      {/* Persistent SaaS Sidebar */}
      <Sidebar
        user={user}
        workspaces={workspaces}
        currentWorkspace={currentWorkspace}
        onSwitchWorkspace={onSwitchWorkspace}
        onLogout={onLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar
          title={pageInfo.title}
          subtitle={pageInfo.subtitle}
          currentWorkspace={currentWorkspace}
        />

        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route
              path="/dashboard"
              element={
                <DashboardView
                  apiBaseUrl={API_BASE_URL}
                  token={token}
                  currentWorkspace={currentWorkspace}
                />
              }
            />
            <Route
              path="/leads"
              element={
                <LeadFinderView
                  apiBaseUrl={API_BASE_URL}
                  token={token}
                  currentWorkspace={currentWorkspace}
                />
              }
            />
            <Route
              path="/campaigns"
              element={
                <CampaignsView
                  apiBaseUrl={API_BASE_URL}
                  token={token}
                  currentWorkspace={currentWorkspace}
                />
              }
            />
            <Route
              path="/history"
              element={
                <HistoryView
                  apiBaseUrl={API_BASE_URL}
                  token={token}
                  currentWorkspace={currentWorkspace}
                />
              }
            />
            <Route
              path="/team"
              element={
                <WorkspacesView
                  apiBaseUrl={API_BASE_URL}
                  token={token}
                  currentWorkspace={currentWorkspace}
                  onWorkspaceCreated={onWorkspaceCreated}
                />
              }
            />
            <Route
              path="/settings"
              element={
                <SettingsView
                  apiBaseUrl={API_BASE_URL}
                  token={token}
                  user={user}
                />
              }
            />
            {/* Admin-only Nexus route — hidden path, role-gated */}
            <Route
              path="/nexus"
              element={
                user?.role === 'admin'
                  ? <NexusView apiBaseUrl={API_BASE_URL} token={token} user={user} />
                  : <Navigate to="/dashboard" replace />
              }
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      loadUserData();
    } else {
      setLoading(false);
    }
  }, [token]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      // 1. Fetch current user (tries /api/v1/me first, falls back to /users/me for older backend versions)
      let userRes = await fetch(`${API_BASE_URL}/api/v1/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (userRes.status === 404) {
        userRes = await fetch(`${API_BASE_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      if (!userRes.ok) {
        throw new Error('Session expired');
      }

      const userData = await userRes.json();
      if (!userData.role) userData.role = 'user';
      setUser(userData);

      // 2. Fetch workspaces
      const wsRes = await fetch(`${API_BASE_URL}/api/v1/workspaces`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (wsRes.ok) {
        const wsData = await wsRes.json();
        setWorkspaces(wsData);
        const active = wsData.find(w => w.id === userData.current_workspace_id) || wsData[0] || null;
        setCurrentWorkspace(active);
      }
    } catch (err) {
      console.error('Auth check error:', err);
      localStorage.removeItem('token');
      setToken('');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchWorkspace = async (workspaceId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/workspaces/switch/${workspaceId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const found = workspaces.find(w => w.id === workspaceId);
        if (found) {
          setCurrentWorkspace(found);
        }
        loadUserData();
      }
    } catch (err) {
      console.error('Failed to switch workspace:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    setWorkspaces([]);
    setCurrentWorkspace(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Initializing LeadGen AI...</p>
      </div>
    );
  }

  if (!token || !user) {
    return <Auth onLoginSuccess={(newToken) => setToken(newToken)} apiBaseUrl={API_BASE_URL} />;
  }

  // HashRouter is now at the top level so useLocation() inside AppLayout works properly
  return (
    <HashRouter>
      <AppLayout
        user={user}
        workspaces={workspaces}
        currentWorkspace={currentWorkspace}
        onSwitchWorkspace={handleSwitchWorkspace}
        onLogout={handleLogout}
        onWorkspaceCreated={loadUserData}
        token={token}
      />
    </HashRouter>
  );
}