'use client';

import { History, Sparkles, Swords, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { InitiativeTracker } from '@/components/initiative/InitiativeTracker';
import type { MonsterData } from '@/lib/monsters';
import { CharacterInspectionCard } from './CharacterInspectionCard';
import { LogInspectionCard } from './LogInspectionCard';
import { PartySidebar } from './PartySidebar';
import { TimelineSidebar } from './TimelineSidebar';
import type {
  CenterWorkspaceView,
  DashboardCharacter,
  DashboardLog,
  MobileDashboardTab,
} from './types';

interface GmDashboardProps {
  sessionId: string;
  sessionName: string;
  initialMonsters: MonsterData[];
}

const DEFAULT_PARTY: DashboardCharacter[] = [
  {
    id: 'char-default-1',
    name: 'Valerius z Ostrej Bieli',
    type: 'HERO',
    class: 'Paladyn',
    race: 'Człowiek',
    level: 3,
    currentHp: 28,
    maxHp: 28,
    ac: 18,
    passivePerception: 13,
    stats: { str: 16, dex: 10, con: 14, int: 8, wis: 12, cha: 16 },
    traits: ['Niezłomna wiara w sprawiedliwość', 'Nigdy nie cofa się przed złem'],
    inventory: ['Długi miecz +1', 'Tarcza herbowa', 'Płytowa zbroja'],
  },
  {
    id: 'char-default-2',
    name: 'Eldrin Srebrny Liść',
    type: 'HERO',
    class: 'Czarodziej',
    race: 'Elf Wysoki',
    level: 3,
    currentHp: 16,
    maxHp: 16,
    ac: 12,
    passivePerception: 14,
    stats: { str: 8, dex: 14, con: 12, int: 18, wis: 13, cha: 10 },
    traits: ['Ciekawski i analityczny', 'Szuka zaginionej biblioteki Netherilu'],
    inventory: ['Księga zaklęć', 'Różdżka magicznych pocisków', 'Szata maga'],
  },
  {
    id: 'npc-default-1',
    name: 'Gromkiel Brodaty',
    type: 'NPC',
    class: 'Kupiec / Rzemieślnik',
    race: 'Krasnolud',
    level: 2,
    currentHp: 19,
    maxHp: 19,
    ac: 14,
    passivePerception: 12,
    stats: { str: 14, dex: 10, con: 16, int: 11, wis: 12, cha: 9 },
    traits: ['Targuje się o każdą sztukę złota', 'Zna lokalne korytarze kopalniane'],
    inventory: ['Młot kowalski', 'Skórzany fartuch', 'Mieszek z klejnotami'],
  },
];

const DEFAULT_LOGS: DashboardLog[] = [
  {
    id: 'log-default-1',
    sessionId: 'default',
    logType: 'CUSTOM_NOTE',
    description: 'Sesja zainicjalizowana. Drużyna rozbiła obóz w pobliżu starych ruin Phandalin.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'log-default-2',
    sessionId: 'default',
    logType: 'REST_LONG',
    description:
      'Długi odpoczynek zakończony. Wszyscy bohaterowie odzyskali pełnię HP i sloty czarów.',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

export function GmDashboard({ sessionId, sessionName, initialMonsters }: GmDashboardProps) {
  const [characters, setCharacters] = useState<DashboardCharacter[]>(DEFAULT_PARTY);
  const [logs, setLogs] = useState<DashboardLog[]>(DEFAULT_LOGS);

  const [selectedCharacter, setSelectedCharacter] = useState<DashboardCharacter | null>(null);
  const [selectedLog, setSelectedLog] = useState<DashboardLog | null>(null);
  const [workspaceView, setWorkspaceView] = useState<CenterWorkspaceView>('combat');
  const [mobileTab, setMobileTab] = useState<MobileDashboardTab>('workspace');
  const [gmNotes, setGmNotes] = useState(
    'Notatki GM-a: Gobliny czają się na lewej flance. Zwróć uwagę na pułapkę pod mostem.'
  );

  const fetchFullState = useCallback(async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/full-state`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (Array.isArray(data.characters) && data.characters.length > 0) {
            setCharacters(data.characters);
          } else {
            // Use defaults if session has no characters created yet
            setCharacters(DEFAULT_PARTY);
          }

          if (Array.isArray(data.sessionLogs) && data.sessionLogs.length > 0) {
            setLogs(data.sessionLogs);
          } else {
            setLogs(DEFAULT_LOGS);
          }
        }
      }
    } catch (err) {
      console.warn('Could not load full session state from API, using defaults:', err);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchFullState();
  }, [fetchFullState]);

  const handleSelectCharacter = (character: DashboardCharacter) => {
    setSelectedCharacter(character);
    setSelectedLog(null);
    setWorkspaceView('character-inspect');
    setMobileTab('workspace');
  };

  const handleSelectLog = (log: DashboardLog) => {
    setSelectedLog(log);
    setSelectedCharacter(null);
    setWorkspaceView('log-inspect');
    setMobileTab('workspace');
  };

  const handleBackToCombat = () => {
    setSelectedCharacter(null);
    setSelectedLog(null);
    setWorkspaceView('combat');
  };

  return (
    <div className="space-y-6">
      {/* Session Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
              <span>{sessionName}</span>
              <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                Kokpit GM
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Trzykolumnowy pulpit taktyczny: Drużyna • Scena Walki • Oś Czasu & Notatki
            </p>
          </div>
        </div>

        {/* Mobile Tab Switcher (< lg screens) */}
        <div className="flex lg:hidden rounded-xl bg-slate-900/90 p-1 border border-slate-800 w-full sm:w-auto">
          <button
            type="button"
            data-testid="mobile-tab-party"
            onClick={() => setMobileTab('party')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mobileTab === 'party'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Drużyna ({characters.length})</span>
          </button>
          <button
            type="button"
            data-testid="mobile-tab-workspace"
            onClick={() => setMobileTab('workspace')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mobileTab === 'workspace'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>Scena Walki</span>
          </button>
          <button
            type="button"
            data-testid="mobile-tab-timeline"
            onClick={() => setMobileTab('timeline')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mobileTab === 'timeline'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Oś Czasu</span>
          </button>
        </div>
      </div>

      {/* 3-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Party & NPCs (Width: ~300px on desktop) */}
        <div
          data-testid="dashboard-party-column"
          className={`lg:col-span-3 xl:col-span-3 ${
            mobileTab === 'party' ? 'block' : 'hidden lg:block'
          }`}
        >
          <PartySidebar
            characters={characters}
            selectedCharacterId={selectedCharacter?.id ?? null}
            onSelectCharacter={handleSelectCharacter}
          />
        </div>

        {/* Center Column: Workspace / Scene (Flexible width) */}
        <div
          data-testid="dashboard-workspace-column"
          className={`lg:col-span-6 xl:col-span-6 space-y-4 ${
            mobileTab === 'workspace' ? 'block' : 'hidden lg:block'
          }`}
        >
          {workspaceView === 'character-inspect' && selectedCharacter ? (
            <CharacterInspectionCard
              character={selectedCharacter}
              onBackToCombat={handleBackToCombat}
            />
          ) : workspaceView === 'log-inspect' && selectedLog ? (
            <LogInspectionCard log={selectedLog} onBackToCombat={handleBackToCombat} />
          ) : (
            <InitiativeTracker monsters={initialMonsters} />
          )}
        </div>

        {/* Right Column: Timeline & Quick Rolls & Notes (Width: ~300px on desktop) */}
        <div
          data-testid="dashboard-timeline-column"
          className={`lg:col-span-3 xl:col-span-3 ${
            mobileTab === 'timeline' ? 'block' : 'hidden lg:block'
          }`}
        >
          <TimelineSidebar
            logs={logs}
            selectedLogId={selectedLog?.id ?? null}
            onSelectLog={handleSelectLog}
            gmNotes={gmNotes}
            onChangeGmNotes={setGmNotes}
          />
        </div>
      </div>
    </div>
  );
}
