'use client';

import { History, Skull, Sparkles, Swords, Users } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { EncounterBuilder } from '@/components/encounters/EncounterBuilder';
import { InitiativeTracker } from '@/components/initiative/InitiativeTracker';
import type { Combatant } from '@/components/initiative/types';
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
  initialCharacters?: DashboardCharacter[];
  onCharactersLoaded?: (characters: DashboardCharacter[]) => void;
}

export const DEFAULT_PARTY: DashboardCharacter[] = [
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

export function GmDashboard({
  sessionId,
  sessionName,
  initialMonsters,
  initialCharacters,
  onCharactersLoaded,
}: GmDashboardProps) {
  const [characters, setCharacters] = useState<DashboardCharacter[]>(initialCharacters || []);
  const [isLoading, setIsLoading] = useState<boolean>(!initialCharacters && Boolean(sessionId));
  const [logs, setLogs] = useState<DashboardLog[]>(DEFAULT_LOGS);

  const [selectedCharacter, setSelectedCharacter] = useState<DashboardCharacter | null>(null);
  const [selectedLog, setSelectedLog] = useState<DashboardLog | null>(null);
  const [workspaceView, setWorkspaceView] = useState<CenterWorkspaceView>('combat');
  const [mobileTab, setMobileTab] = useState<MobileDashboardTab>('workspace');
  const [gmNotes, setGmNotes] = useState(
    'Notatki GM-a: Gobliny czają się na lewej flance. Zwróć uwagę na pułapkę pod mostem.'
  );

  const [combatants, setCombatants] = useState<Combatant[]>([
    {
      id: 'pc-1',
      name: 'Valerius (Paladyn)',
      initiative: 18,
      currentHp: 28,
      maxHp: 28,
      ac: 18,
      isMonster: false,
      conditions: [],
    },
    {
      id: 'pc-2',
      name: 'Eldrin (Czarodziej)',
      initiative: 14,
      currentHp: 16,
      maxHp: 16,
      ac: 12,
      isMonster: false,
      conditions: [],
    },
    {
      id: 'm-1',
      name: 'Goblin Łucznik A',
      initiative: 12,
      currentHp: 7,
      maxHp: 7,
      ac: 15,
      isMonster: true,
      type: 'Goblin',
      conditions: [],
    },
    {
      id: 'm-2',
      name: 'Goblin Wojownik B',
      initiative: 9,
      currentHp: 7,
      maxHp: 7,
      ac: 15,
      isMonster: true,
      type: 'Goblin',
      conditions: [],
    },
  ]);

  const handleLoadCombatants = (newCombatants: Combatant[]) => {
    setCombatants((prev) => {
      const combined = [...prev, ...newCombatants];
      return combined.sort((a, b) => b.initiative - a.initiative);
    });
    setWorkspaceView('combat');
  };

  const onCharactersLoadedRef = useRef(onCharactersLoaded);
  useEffect(() => {
    onCharactersLoadedRef.current = onCharactersLoaded;
  }, [onCharactersLoaded]);

  const lastFetchedSessionIdRef = useRef<string | null>(null);

  const fetchFullState = useCallback(async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/full-state`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (Array.isArray(data.characters)) {
            setCharacters(data.characters);
            onCharactersLoadedRef.current?.(data.characters);
          }

          if (Array.isArray(data.sessionLogs) && data.sessionLogs.length > 0) {
            setLogs(data.sessionLogs);
          }
        }
      }
    } catch (err) {
      console.warn('Could not load full session state from API:', err);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (initialCharacters) {
      setCharacters(initialCharacters);
      setIsLoading(false);
    }
  }, [initialCharacters]);

  useEffect(() => {
    if (lastFetchedSessionIdRef.current === sessionId) return;
    lastFetchedSessionIdRef.current = sessionId;
    fetchFullState();
  }, [sessionId, fetchFullState]);

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
            <span>Drużyna {isLoading ? '' : `(${characters.length})`}</span>
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
            isLoading={isLoading}
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
              onCharacterUpdate={(updated) => {
                setSelectedCharacter(updated);
                setCharacters((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
              }}
            />
          ) : workspaceView === 'log-inspect' && selectedLog ? (
            <LogInspectionCard log={selectedLog} onBackToCombat={handleBackToCombat} />
          ) : workspaceView === 'encounter-builder' ? (
            <EncounterBuilder
              sessionId={sessionId}
              monsters={initialMonsters}
              characters={characters}
              onBackToCombat={handleBackToCombat}
              onLoadCombatants={handleLoadCombatants}
            />
          ) : (
            <div className="space-y-4">
              {/* Workspace Sub-tabs: Scena Walki | Kreator Potyczek */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
                  <button
                    type="button"
                    data-testid="tab-combat"
                    onClick={() => setWorkspaceView('combat')}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-indigo-600 text-white shadow-md shadow-indigo-600/30 cursor-pointer"
                  >
                    <Swords className="w-3.5 h-3.5" />
                    <span>Scena Walki</span>
                  </button>
                  <button
                    type="button"
                    data-testid="tab-encounter-builder"
                    onClick={() => setWorkspaceView('encounter-builder')}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                  >
                    <Skull className="w-3.5 h-3.5 text-amber-500" />
                    <span>Kreator Potyczek</span>
                  </button>
                </div>
              </div>

              <InitiativeTracker
                monsters={initialMonsters}
                onOpenEncounterBuilder={() => setWorkspaceView('encounter-builder')}
                combatants={combatants}
                onCombatantsChange={setCombatants}
              />
            </div>
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
