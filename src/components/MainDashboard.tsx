'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
import type { MonsterData } from '@/lib/monsters';
import { Footer } from './layout/Footer';
import { Navbar } from './layout/Navbar';
import type { SessionItem } from './sessions/types';

// Vercel React Best Practices: bundle-dynamic-imports
const SessionSelection = dynamic(
  () => import('./sessions/SessionSelection').then((mod) => mod.SessionSelection),
  {
    loading: () => <TabLoadingSkeleton title="Wybór Sesji" />,
  }
);

const GmDashboard = dynamic(
  () => import('./dashboard/GmDashboard').then((mod) => mod.GmDashboard),
  {
    loading: () => <TabLoadingSkeleton title="Główny Panel Sesji (Kokpit GM)" />,
  }
);

const Bestiary = dynamic(() => import('./bestiary/Bestiary').then((mod) => mod.Bestiary), {
  loading: () => <TabLoadingSkeleton title="Bestiariusz D&D 5e" />,
});

const CharacterWizard = dynamic(
  () => import('./characters/CharacterWizard').then((mod) => mod.CharacterWizard),
  {
    loading: () => <TabLoadingSkeleton title="Kreator Postaci" />,
  }
);

const DiceRoller = dynamic(() => import('./dice/DiceRoller').then((mod) => mod.DiceRoller), {
  loading: () => <TabLoadingSkeleton title="Symulator Kości" />,
});

function TabLoadingSkeleton({ title }: { title: string }) {
  return (
    <div className="glass-panel rounded-2xl p-8 text-center animate-pulse space-y-3 border border-slate-800">
      <div className="h-6 w-48 bg-slate-800 rounded mx-auto" />
      <div className="h-4 w-72 bg-slate-900 rounded mx-auto" />
      <p className="text-xs text-slate-400 font-mono pt-4">Ładowanie modułu: {title}...</p>
    </div>
  );
}

const ACTIVE_SESSION_STORAGE_KEY = 'tableops_active_session_id';

function syncUrlParams(session: SessionItem | null, tab: string) {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    if (session) {
      url.searchParams.set('session', session.id);
      url.searchParams.set('tab', tab);
    } else {
      url.searchParams.delete('session');
      url.searchParams.set('tab', 'sessions');
    }
    window.history.replaceState(null, '', url.toString());
  } catch {
    // Safe fallback if URL cannot be parsed
  }
}

interface MainDashboardProps {
  initialMonsters: MonsterData[];
}

export function MainDashboard({ initialMonsters }: MainDashboardProps) {
  const [activeTab, setActiveTab] = useState('sessions');
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [activeSession, setActiveSession] = useState<SessionItem | null>(null);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);

  // Fetch sessions on mount and resolve active session
  const fetchSessions = useCallback(async () => {
    try {
      setIsLoadingSessions(true);
      const res = await fetch('/api/sessions');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.sessions)) {
          setSessions(data.sessions);

          // Check URL query parameters first, then localStorage
          const params =
            typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
          const urlSessionId = params?.get('session');
          const urlTab = params?.get('tab');

          let resolvedSession: SessionItem | null = null;
          if (urlSessionId) {
            resolvedSession = data.sessions.find((s: SessionItem) => s.id === urlSessionId) || null;
          }

          if (!resolvedSession) {
            const savedId =
              typeof window !== 'undefined'
                ? localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY)
                : null;
            if (savedId) {
              resolvedSession = data.sessions.find((s: SessionItem) => s.id === savedId) || null;
            }
          }

          if (resolvedSession) {
            setActiveSession(resolvedSession);
            const targetTab = urlTab && urlTab !== 'sessions' ? urlTab : 'dashboard';
            setActiveTab(targetTab);
            syncUrlParams(resolvedSession, targetTab);
          } else {
            // Strictly enforce: no session -> no access to other tabs
            setActiveSession(null);
            setActiveTab('sessions');
            syncUrlParams(null, 'sessions');
          }
        }
      }
    } catch (err) {
      console.error('Failed to load sessions from API:', err);
      // Offline fallback: check localStorage
      const savedId =
        typeof window !== 'undefined' ? localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY) : null;
      if (!savedId) {
        setActiveSession(null);
        setActiveTab('sessions');
        syncUrlParams(null, 'sessions');
      }
    } finally {
      setIsLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      const sessionParam = params.get('session');
      const tabParam = params.get('tab');

      if (!sessionParam) {
        setActiveSession(null);
        setActiveTab('sessions');
        return;
      }

      const found = sessions.find((s) => s.id === sessionParam);
      if (found) {
        setActiveSession(found);
        setActiveTab(tabParam || 'dashboard');
      } else {
        setActiveSession(null);
        setActiveTab('sessions');
        syncUrlParams(null, 'sessions');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [sessions]);

  // Routing guard for tab switching
  const handleTabChange = (targetTab: string) => {
    // If no active session, all other parts of the application are strictly blocked
    if (!activeSession) {
      setActiveTab('sessions');
      syncUrlParams(null, 'sessions');
      return;
    }

    setActiveTab(targetTab);
    syncUrlParams(activeSession, targetTab);
  };

  const handleSelectSession = (session: SessionItem) => {
    setActiveSession(session);
    if (typeof window !== 'undefined') {
      localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, session.id);
    }
    setActiveTab('dashboard');
    syncUrlParams(session, 'dashboard');
  };

  const handleCreateSession = async (name: string) => {
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create session');
      }

      const data = await res.json();
      if (data.success && data.session) {
        const newSession = data.session;
        setSessions((prev) => [newSession, ...prev]);
        handleSelectSession(newSession);
        return true;
      }
    } catch (err) {
      // Offline fallback: create in local state
      console.warn('Backend unavailable, creating session in local state:', err);
      const localSession: SessionItem = {
        id: `local-${Date.now()}`,
        name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _count: { characters: 0, sessionLogs: 0 },
      };
      setSessions((prev) => [localSession, ...prev]);
      handleSelectSession(localSession);
      return true;
    }
  };

  const handleUpdateSession = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/sessions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.session) {
          setSessions((prev) =>
            prev.map((s) => (s.id === id ? { ...s, name: data.session.name } : s))
          );
          if (activeSession?.id === id) {
            setActiveSession((prev) => (prev ? { ...prev, name: data.session.name } : null));
          }
          return true;
        }
      }
    } catch (err) {
      console.error('Failed to update session:', err);
      setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)));
      if (activeSession?.id === id) {
        setActiveSession((prev) => (prev ? { ...prev, name } : null));
      }
      return true;
    }
  };

  const handleDeleteSession = async (id: string) => {
    try {
      await fetch(`/api/sessions/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete session on backend:', err);
    }

    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSession?.id === id) {
      setActiveSession(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
      }
      setActiveTab('sessions');
      syncUrlParams(null, 'sessions');
    }
    return true;
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        sessions={sessions}
        activeSession={activeSession}
        onSelectSession={handleSelectSession}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Routing & Access Guard:
            Without an active session, ONLY the SessionSelection module is rendered.
            All other features (Combat Dashboard, Bestiary, Character Creator, Dice)
            remain strictly inaccessible until a session is activated. */}
        {!activeSession || activeTab === 'sessions' ? (
          <SessionSelection
            sessions={sessions}
            isLoading={isLoadingSessions}
            onSelectSession={handleSelectSession}
            onCreateSession={handleCreateSession}
            onUpdateSession={handleUpdateSession}
            onDeleteSession={handleDeleteSession}
          />
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <GmDashboard
                sessionId={activeSession.id}
                sessionName={activeSession.name}
                initialMonsters={initialMonsters}
              />
            )}
            {activeTab === 'bestiary' && <Bestiary initialMonsters={initialMonsters} />}
            {activeTab === 'characters' && <CharacterWizard />}
            {activeTab === 'dice' && <DiceRoller />}
          </>
        )}
      </main>

      {/* Footer Status Bar */}
      <Footer />
    </div>
  );
}
