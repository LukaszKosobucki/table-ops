'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DiceGroup, RollResult } from '@/lib/dice/types';
import { getClientGuestId } from '@/lib/guest';
import type { MonsterData } from '@/lib/monsters';
import { useAuth } from './auth/useAuth';
import type { Character } from './characters/types';
import type { DashboardCharacter } from './dashboard/types';
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

const BottomDock = dynamic(() => import('./dashboard/BottomDock').then((mod) => mod.BottomDock), {
  ssr: false,
});

const DraggableNotesWindow = dynamic(
  () => import('./dashboard/DraggableNotesWindow').then((mod) => mod.DraggableNotesWindow),
  { ssr: false }
);

const DraggableDiceTray = dynamic(
  () => import('./dice/DraggableDiceTray').then((mod) => mod.DraggableDiceTray),
  { ssr: false }
);

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
    if (window.location.pathname !== '/') return;
    const url = new URL(window.location.href);
    const targetSession = session?.id ?? null;
    const targetTab = session ? tab : 'sessions';

    const currentSession = url.searchParams.get('session');
    const currentTab = url.searchParams.get('tab');

    // Skip replaceState if URL is already in the target state
    const isSessionSame = currentSession === targetSession;
    const isTabSame = currentTab === targetTab || (!currentTab && targetTab === 'sessions');
    if (isSessionSame && isTabSame) {
      return;
    }

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
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('sessions');
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [activeSession, setActiveSession] = useState<SessionItem | null>(null);
  const activeSessionRef = useRef<SessionItem | null>(null);
  const [sessionCharacters, setSessionCharacters] = useState<DashboardCharacter[] | null>(null);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);

  // Floating Shell State (Bottom Dock, Notes Window, Dice Tray across all tabs)
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isNotesMinimized, setIsNotesMinimized] = useState(false);
  const [isDiceOpen, setIsDiceOpen] = useState(false);
  const [isDiceMinimized, setIsDiceMinimized] = useState(false);
  const [googleDocUrl, setGoogleDocUrl] = useState<string | null>(null);
  const [diceTrayConfig, setDiceTrayConfig] = useState<{
    dice?: DiceGroup[];
    modifier?: number;
    actorName?: string;
    context?: {
      characterId?: string;
      combatantId?: string;
      characterName?: string;
      actionName?: string;
      timestamp?: number;
    };
  }>({});

  const gmDiceRollHandlerRef = useRef<((result: RollResult) => void) | null>(null);

  const setAndTrackActiveSession = useCallback((session: SessionItem | null) => {
    activeSessionRef.current = session;
    setActiveSession(session);
    setGoogleDocUrl(session?.googleDocUrl ?? null);
  }, []);

  // Sync googleDocUrl when activeSession changes
  useEffect(() => {
    if (activeSession?.googleDocUrl !== undefined) {
      setGoogleDocUrl(activeSession.googleDocUrl);
    }
  }, [activeSession?.googleDocUrl]);

  const handleToggleNotesWindow = useCallback(() => {
    if (isNotesMinimized) {
      setIsNotesMinimized(false);
      setIsNotesOpen(true);
    } else {
      setIsNotesOpen((prev) => !prev);
    }
  }, [isNotesMinimized]);

  const handleRestoreNotes = useCallback(() => {
    setIsNotesMinimized(false);
    setIsNotesOpen(true);
  }, []);

  const handleUpdateGoogleDocUrl = useCallback(
    async (newUrl: string | null) => {
      setGoogleDocUrl(newUrl);
      if (!activeSession) return;
      try {
        const guestId = getClientGuestId();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (guestId) headers['x-guest-id'] = guestId;

        const res = await fetch(`/api/sessions/${activeSession.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ googleDocUrl: newUrl }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.session) {
            const savedUrl = json.session.googleDocUrl ?? null;
            setGoogleDocUrl(savedUrl);
            setSessions((prev) =>
              prev.map((s) => (s.id === activeSession.id ? { ...s, googleDocUrl: savedUrl } : s))
            );
            setActiveSession((prev) => (prev ? { ...prev, googleDocUrl: savedUrl } : prev));
          }
        }
      } catch (err) {
        console.warn('Failed to save googleDocUrl to backend:', err);
      }
    },
    [activeSession]
  );

  const handleToggleDice = useCallback(() => {
    if (isDiceMinimized) {
      setIsDiceMinimized(false);
      setIsDiceOpen(true);
    } else {
      setIsDiceOpen((prev) => !prev);
    }
  }, [isDiceMinimized]);

  const handleRestoreDice = useCallback(() => {
    setIsDiceMinimized(false);
    setIsDiceOpen(true);
  }, []);

  const handleRequestDiceRoll = useCallback(
    (
      dice: DiceGroup[],
      modifier: number,
      context?: {
        characterId?: string;
        combatantId?: string;
        characterName?: string;
        actionName?: string;
      }
    ) => {
      setDiceTrayConfig({
        dice,
        modifier,
        actorName: context?.characterName || 'Mistrz Gry',
        context: {
          ...context,
          timestamp: Date.now(),
        },
      });
      setIsDiceMinimized(false);
      setIsDiceOpen(true);
    },
    []
  );

  const handleDiceRoll = useCallback(
    (result: RollResult) => {
      if (gmDiceRollHandlerRef.current) {
        gmDiceRollHandlerRef.current(result);
      } else if (activeSession) {
        fetch(`/api/sessions/${activeSession.id}/logs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            logType: 'DICE_ROLL',
            description: `🎲 Rzut (${result.actorName}): ${result.formula} = ${result.total}${
              result.isSecret ? ' (Tylko dla GM)' : ''
            }`,
            metadata: {
              ...result,
            },
          }),
        }).catch(() => {});
      }
    },
    [activeSession]
  );

  const handleRegisterRollHandler = useCallback((handler: (result: RollResult) => void) => {
    gmDiceRollHandlerRef.current = handler;
  }, []);

  // Global Hotkey 'D' to toggle dice roller anywhere across tabs
  useEffect(() => {
    if (!activeSession) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLInputElement | null;
      const activeTag = (activeEl?.tagName || '').toUpperCase();
      const isTextInput =
        (activeTag === 'INPUT' && activeEl?.type !== 'checkbox' && activeEl?.type !== 'radio') ||
        activeTag === 'TEXTAREA' ||
        activeTag === 'SELECT';

      if (
        (e.key === 'd' || e.key === 'D') &&
        !isTextInput &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey
      ) {
        e.preventDefault();
        handleToggleDice();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [activeSession, handleToggleDice]);

  // Fetch sessions on mount and resolve active session
  const fetchSessions = useCallback(async () => {
    try {
      setIsLoadingSessions(true);
      const guestId = getClientGuestId();
      const headers: Record<string, string> = {};
      if (guestId) headers['x-guest-id'] = guestId;

      const res = await fetch('/api/sessions', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.sessions)) {
          const currentActive = activeSessionRef.current;
          let sessionsList: SessionItem[] = data.sessions;
          if (currentActive && !sessionsList.some((s: SessionItem) => s.id === currentActive.id)) {
            sessionsList = [currentActive, ...sessionsList];
          }
          setSessions(sessionsList);

          // Check URL query parameters first, then localStorage
          const params =
            typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
          const urlSessionId = params?.get('session');
          const urlTab = params?.get('tab');

          let resolvedSession: SessionItem | null = null;
          if (urlSessionId) {
            resolvedSession = sessionsList.find((s: SessionItem) => s.id === urlSessionId) || null;
          }

          if (!resolvedSession) {
            const savedId =
              typeof window !== 'undefined'
                ? localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY)
                : null;
            if (savedId) {
              resolvedSession = sessionsList.find((s: SessionItem) => s.id === savedId) || null;
            }
          }

          if (resolvedSession) {
            setAndTrackActiveSession(resolvedSession);
            const targetTab = urlTab && urlTab !== 'sessions' ? urlTab : 'dashboard';
            setActiveTab(targetTab);
            syncUrlParams(resolvedSession, targetTab);
          } else if (activeSessionRef.current) {
            // Keep the active session that was set while fetch was in flight
          } else {
            // Strictly enforce: no session -> no access to other tabs
            setAndTrackActiveSession(null);
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
      if (!savedId && !activeSessionRef.current) {
        setAndTrackActiveSession(null);
        setActiveTab('sessions');
        syncUrlParams(null, 'sessions');
      }
    } finally {
      setIsLoadingSessions(false);
    }
  }, [setAndTrackActiveSession]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    if (user?.id !== undefined) {
      fetchSessions();
    }
  }, [user?.id, fetchSessions]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    setAndTrackActiveSession(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
    }
    syncUrlParams(null, 'sessions');
    fetchSessions();
  }, [signOut, fetchSessions, setAndTrackActiveSession]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      const sessionParam = params.get('session');
      const tabParam = params.get('tab');

      if (!sessionParam) {
        setAndTrackActiveSession(null);
        setActiveTab('sessions');
        return;
      }

      const found = sessions.find((s) => s.id === sessionParam);
      if (found) {
        setAndTrackActiveSession(found);
        setActiveTab(tabParam || 'dashboard');
      } else {
        setAndTrackActiveSession(null);
        setActiveTab('sessions');
        syncUrlParams(null, 'sessions');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [sessions, setAndTrackActiveSession]);

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
    setAndTrackActiveSession(session);
    setSessionCharacters(null);
    if (typeof window !== 'undefined') {
      localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, session.id);
    }
    setActiveTab('dashboard');
    syncUrlParams(session, 'dashboard');
  };

  const handleCreateSession = async (name: string) => {
    try {
      const guestId = getClientGuestId();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (guestId) headers['x-guest-id'] = guestId;

      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers,
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
            setAndTrackActiveSession({ ...activeSession, name: data.session.name });
          }
          return true;
        }
      }
    } catch (err) {
      console.error('Failed to update session:', err);
      setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)));
      if (activeSession?.id === id) {
        setAndTrackActiveSession({ ...activeSession, name });
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
      setAndTrackActiveSession(null);
      setSessionCharacters(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
      }
      setActiveTab('sessions');
      syncUrlParams(null, 'sessions');
    }
    return true;
  };

  const wizardInitialCharacters = useMemo(() => {
    if (!sessionCharacters) return undefined;
    return sessionCharacters.map((c) => ({
      id: c.id,
      sessionId: c.sessionId || activeSession?.id,
      name: c.name,
      type: (c.type || 'HERO') as 'HERO' | 'NPC',
      race: c.race || 'Nieznana rasa',
      class: c.class || 'Klasa nieznana',
      level: c.level || 1,
      hp: c.currentHp,
      maxHp: c.maxHp,
      currentHp: c.currentHp,
      ac: c.ac,
      passivePerception: c.passivePerception,
      stats: {
        str: c.stats?.str ?? 10,
        dex: c.stats?.dex ?? 10,
        con: c.stats?.con ?? 10,
        int: c.stats?.int ?? 10,
        wis: c.stats?.wis ?? 10,
        cha: c.stats?.cha ?? 8,
        tempHp: c.stats?.tempHp ?? 0,
      },
      traits: c.traits || [],
      inventory: (c.inventory || []).map((item) => (typeof item === 'string' ? item : item.name)),
      spells: c.spells || null,
    }));
  }, [sessionCharacters, activeSession?.id]);

  const handleCharacterCreated = useCallback((newChar: Character) => {
    const dashChar: DashboardCharacter = {
      id: newChar.id,
      sessionId: newChar.sessionId,
      name: newChar.name,
      type: (newChar.type || 'HERO') as 'HERO' | 'NPC',
      class: newChar.class,
      race: newChar.race,
      level: newChar.level,
      currentHp: newChar.currentHp ?? newChar.hp,
      maxHp: newChar.maxHp,
      ac: newChar.ac,
      passivePerception: newChar.passivePerception,
      stats: newChar.stats,
      traits: newChar.traits,
      inventory: newChar.inventory,
      spells: newChar.spells,
    };
    setSessionCharacters((prev) => [dashChar, ...(prev || [])]);
  }, []);

  const handleGmCharactersLoaded = useCallback((chars: DashboardCharacter[]) => {
    setSessionCharacters((prev) => {
      if (!prev) return chars;
      const charIds = new Set(chars.map((c) => c.id));
      const preserved = prev.filter((p) => !charIds.has(p.id));
      const merged = [...chars, ...preserved];
      if (prev.length === merged.length) {
        const isSame = prev.every(
          (p, i) =>
            p.id === merged[i]?.id &&
            p.currentHp === merged[i]?.currentHp &&
            p.maxHp === merged[i]?.maxHp
        );
        if (isSame) return prev;
      }
      return merged;
    });
  }, []);

  const handleWizardCharactersLoaded = useCallback((chars: Character[]) => {
    setSessionCharacters((prev) => {
      const mapped: DashboardCharacter[] = chars.map((c) => ({
        id: c.id,
        sessionId: c.sessionId,
        name: c.name,
        type: (c.type || 'HERO') as 'HERO' | 'NPC',
        class: c.class,
        race: c.race,
        level: c.level,
        currentHp: c.currentHp ?? c.hp,
        maxHp: c.maxHp,
        ac: c.ac,
        passivePerception: c.passivePerception,
        stats: c.stats,
        traits: c.traits,
        inventory: c.inventory,
        spells: c.spells,
      }));
      if (!prev) return mapped;
      const mappedIds = new Set(mapped.map((m) => m.id));
      const preserved = prev.filter((p) => !mappedIds.has(p.id));
      const merged = [...mapped, ...preserved];
      if (prev.length === merged.length) {
        const isSame = prev.every(
          (p, i) =>
            p.id === merged[i]?.id &&
            p.currentHp === merged[i]?.currentHp &&
            p.maxHp === merged[i]?.maxHp
        );
        if (isSame) return prev;
      }
      return merged;
    });
  }, []);

  // Fetch session characters if null and active session is set
  useEffect(() => {
    if (!activeSession || sessionCharacters !== null) return;
    let mounted = true;

    fetch(`/api/sessions/${activeSession.id}/characters`)
      .then((res) => (res.ok ? res.json() : []))
      .then((chars) => {
        if (!mounted || !Array.isArray(chars)) return;
        const mapped: DashboardCharacter[] = chars.map((c) => ({
          id: c.id,
          sessionId: c.sessionId,
          name: c.name,
          type: (c.type || 'HERO') as 'HERO' | 'NPC',
          race: c.race,
          class: c.class,
          level: c.level,
          currentHp: c.currentHp ?? c.hp ?? c.maxHp,
          maxHp: c.maxHp,
          ac: c.ac,
          passivePerception: c.passivePerception,
          stats: c.stats,
          traits: c.traits,
          inventory: c.inventory,
          spells: c.spells,
        }));
        setSessionCharacters(mapped);
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, [activeSession, sessionCharacters]);

  const handleCompendiumCharacterUpdate = useCallback((updated: DashboardCharacter) => {
    setSessionCharacters((prev) => {
      if (!prev) return [updated];
      return prev.map((c) => (c.id === updated.id ? updated : c));
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        sessions={sessions}
        activeSession={activeSession}
        onSelectSession={handleSelectSession}
        user={user}
        onSignOut={handleSignOut}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 lg:p-8 pb-16">
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
            <div className={activeTab === 'dashboard' ? 'block' : 'hidden'}>
              <GmDashboard
                key={activeSession.id}
                sessionId={activeSession.id}
                sessionName={activeSession.name}
                initialMonsters={initialMonsters}
                initialCharacters={sessionCharacters || undefined}
                onCharactersLoaded={handleGmCharactersLoaded}
                suppressDockAndWindows={true}
                isNotesOpen={isNotesOpen}
                isNotesMinimized={isNotesMinimized}
                onToggleNotes={handleToggleNotesWindow}
                googleDocUrl={googleDocUrl}
                onUpdateGoogleDocUrl={handleUpdateGoogleDocUrl}
                onGoogleDocUrlChange={setGoogleDocUrl}
                isDiceOpen={isDiceOpen}
                isDiceMinimized={isDiceMinimized}
                onToggleDice={handleToggleDice}
                onRequestDiceRoll={handleRequestDiceRoll}
                onRegisterRollHandler={handleRegisterRollHandler}
              />
            </div>
            {activeTab === 'bestiary' && (
              <Bestiary
                initialMonsters={initialMonsters}
                characters={sessionCharacters || undefined}
                onCharacterUpdate={handleCompendiumCharacterUpdate}
              />
            )}
            {activeTab === 'characters' && (
              <CharacterWizard
                sessionId={activeSession.id}
                initialCharacters={wizardInitialCharacters}
                onCharacterCreated={handleCharacterCreated}
                onCharactersLoaded={handleWizardCharactersLoaded}
              />
            )}
            {activeTab === 'dice' && <DiceRoller />}
          </>
        )}
      </main>

      {/* Persistent Cross-Tab Shell Windows & Bottom Dock (Chunk 9.2 & Phase 10) */}
      {activeSession && activeTab !== 'sessions' && (
        <>
          <DraggableNotesWindow
            isOpen={isNotesOpen}
            isMinimized={isNotesMinimized}
            onClose={() => setIsNotesOpen(false)}
            onMinimize={() => setIsNotesMinimized(true)}
            googleDocUrl={googleDocUrl}
            onSaveUrl={handleUpdateGoogleDocUrl}
          />

          <DraggableDiceTray
            isOpen={isDiceOpen}
            isMinimized={isDiceMinimized}
            onClose={() => setIsDiceOpen(false)}
            onMinimize={() => setIsDiceMinimized(true)}
            actorName={diceTrayConfig.actorName || 'Mistrz Gry'}
            initialDice={diceTrayConfig.dice}
            initialModifier={diceTrayConfig.modifier}
            rollContext={diceTrayConfig.context}
            onRoll={handleDiceRoll}
          />

          <BottomDock
            isNotesOpen={isNotesOpen}
            isNotesMinimized={isNotesMinimized}
            onRestoreNotes={handleRestoreNotes}
            onToggleNotes={handleToggleNotesWindow}
            hasNotesUrl={Boolean(googleDocUrl)}
            isDiceOpen={isDiceOpen}
            isDiceMinimized={isDiceMinimized}
            onRestoreDice={handleRestoreDice}
            onToggleDice={handleToggleDice}
          />
        </>
      )}

      {/* Footer Status Bar */}
      <Footer />
    </div>
  );
}
