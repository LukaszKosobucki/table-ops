'use client';

import { History, Skull, Sparkles, Swords, Users } from 'lucide-react';
import { useCallback, useState } from 'react';
import { EncounterBuilder } from '@/components/encounters/EncounterBuilder';
import { InitiativeTracker } from '@/components/initiative/InitiativeTracker';
import type { Combatant, CombatLogEntry } from '@/components/initiative/types';
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
import { useSessionFullState } from './useSessionFullState';

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

export function GmDashboard({
  sessionId,
  sessionName,
  initialMonsters,
  initialCharacters,
  onCharactersLoaded,
}: GmDashboardProps) {
  const {
    characters,
    setCharacters,
    isLoading,
    logs,
    setLogs,
    activeCombatId,
    activeCombatRound,
    activeCombatTurnIndex,
    activeCombatPhase,
    setActiveCombatPhase,
    combatants,
    setCombatants,
  } = useSessionFullState({
    sessionId,
    initialCharacters,
    onCharactersLoaded,
  });

  const [selectedCharacter, setSelectedCharacter] = useState<DashboardCharacter | null>(null);
  const [selectedLog, setSelectedLog] = useState<DashboardLog | null>(null);
  const [workspaceView, setWorkspaceView] = useState<CenterWorkspaceView>('combat');
  const [mobileTab, setMobileTab] = useState<MobileDashboardTab>('workspace');
  const [gmNotes, setGmNotes] = useState(
    'Notatki GM-a: Gobliny czają się na lewej flance. Zwróć uwagę na pułapkę pod mostem.'
  );

  const handleLoadCombatants = (newCombatants: Combatant[]) => {
    setCombatants((prev) => {
      const combined = [...prev, ...newCombatants];
      return combined.sort((a, b) => b.initiative - a.initiative);
    });
    setWorkspaceView('combat');
  };

  const [combatLog, setCombatLog] = useState<CombatLogEntry[]>([
    {
      id: 'log-init-1',
      timestamp: '12:00:00',
      text: 'Starcie przygotowane. Uczestnicy w gotowości.',
      type: 'system',
    },
  ]);

  const handleAddLog = useCallback((entry: CombatLogEntry) => {
    setCombatLog((prev) => [entry, ...prev]);
  }, []);

  const handleClearLog = useCallback(() => {
    setCombatLog([]);
  }, []);

  const handleAddCombatant = useCallback(
    (newCombatant: Combatant) => {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      const logEntry: CombatLogEntry = {
        id: `c-log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: timeStr,
        text: `Do walki dołącza: ${newCombatant.name} (Inicjatywa: ${newCombatant.initiative}).`,
        type: 'system',
      };
      setCombatLog((prev) => [logEntry, ...prev]);
      setCombatants((prev) => {
        const updated = [...prev, newCombatant];
        return activeCombatPhase === 'ACTIVE'
          ? updated
          : updated.sort((a, b) => b.initiative - a.initiative);
      });

      if (activeCombatId) {
        fetch(`/api/combat/${activeCombatId}/combatants`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            characterId:
              newCombatant.characterId ?? (!newCombatant.isMonster ? newCombatant.id : null),
            apiMonsterId: newCombatant.apiMonsterId ?? null,
            monsterId: newCombatant.monsterId ?? null,
            nameOverride: newCombatant.name,
            initiative: newCombatant.initiative,
            currentHp: newCombatant.currentHp,
            maxHp: newCombatant.maxHp,
            ac: newCombatant.ac,
          }),
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data?.combatant?.id) {
              setCombatants((prev) =>
                prev.map((c) => (c.id === newCombatant.id ? { ...c, id: data.combatant.id } : c))
              );
            }
          })
          .catch(() => {});
      }
    },
    [activeCombatId, activeCombatPhase, setCombatants]
  );

  const isCharacterInCombat = useCallback(
    (charId: string) => combatants.some((c) => c.characterId === charId || c.id === charId),
    [combatants]
  );

  const handleAddPartyToCombat = useCallback(() => {
    const heroes = characters.filter((c) => c.type === 'HERO');
    if (heroes.length === 0) return;

    const heroesToAdd = heroes.filter(
      (h) => !combatants.some((c) => c.characterId === h.id || c.id === h.id)
    );
    if (heroesToAdd.length === 0) return;

    const newCombatants: Combatant[] = heroesToAdd.map((h) => ({
      id: h.id,
      characterId: h.id,
      name: h.name,
      initiative: 0,
      currentHp: h.currentHp,
      maxHp: h.maxHp,
      ac: h.ac,
      isMonster: false,
      conditions: [],
      statuses: [],
    }));

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(
      2,
      '0'
    )}:${String(now.getSeconds()).padStart(2, '0')}`;
    const logEntry: CombatLogEntry = {
      id: `c-log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: timeStr,
      text: `Do walki dołącza drużyna: ${heroesToAdd.map((h) => h.name).join(', ')}.`,
      type: 'system',
    };
    setCombatLog((prev) => [logEntry, ...prev]);

    setCombatants((prev) => {
      const combined = [...prev, ...newCombatants];
      return activeCombatPhase === 'ACTIVE'
        ? combined
        : combined.sort((a, b) => b.initiative - a.initiative);
    });

    if (activeCombatId) {
      for (const combatant of newCombatants) {
        fetch(`/api/combat/${activeCombatId}/combatants`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            characterId: combatant.characterId,
            nameOverride: combatant.name,
            initiative: combatant.initiative,
            currentHp: combatant.currentHp,
            maxHp: combatant.maxHp,
            ac: combatant.ac,
          }),
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data?.combatant?.id) {
              setCombatants((prev) =>
                prev.map((c) => (c.id === combatant.id ? { ...c, id: data.combatant.id } : c))
              );
            }
          })
          .catch(() => {});
      }
    }
  }, [characters, combatants, activeCombatId, activeCombatPhase, setCombatants]);

  const handleAddCharacterToCombat = useCallback(
    (char: DashboardCharacter) => {
      const alreadyInCombat = combatants.some((c) => c.characterId === char.id || c.id === char.id);
      if (alreadyInCombat) return;

      const newCombatant: Combatant = {
        id: char.id,
        characterId: char.id,
        name: char.name,
        initiative: 0,
        currentHp: char.currentHp,
        maxHp: char.maxHp,
        ac: char.ac,
        isMonster: false,
        conditions: [],
        statuses: [],
      };
      handleAddCombatant(newCombatant);
    },
    [combatants, handleAddCombatant]
  );

  const combatantsCountForType = useCallback(
    (type: string) => combatants.filter((c) => c.type === type).length,
    [combatants]
  );

  const handleCombatEnd = useCallback(
    (heroUpdates: { characterId: string; hp: number }[]) => {
      if (heroUpdates.length === 0) return;
      setCharacters((prev) =>
        prev.map((char) => {
          const update = heroUpdates.find((u) => u.characterId === char.id);
          if (update) {
            return { ...char, currentHp: update.hp };
          }
          return char;
        })
      );
      setSelectedCharacter((prev) => {
        if (!prev) return null;
        const update = heroUpdates.find((u) => u.characterId === prev.id);
        return update ? { ...prev, currentHp: update.hp } : prev;
      });
    },
    [setCharacters]
  );

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
            onAddPartyToCombat={handleAddPartyToCombat}
            onAddCharacterToCombat={handleAddCharacterToCombat}
            isCharacterInCombat={isCharacterInCombat}
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
              onAddToCombat={handleAddCharacterToCombat}
              isInCombat={isCharacterInCombat(selectedCharacter.id)}
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
                sessionId={sessionId}
                initialCombatId={activeCombatId}
                initialRound={activeCombatRound}
                initialTurnIndex={activeCombatTurnIndex}
                initialPhase={activeCombatPhase}
                monsters={initialMonsters}
                onOpenEncounterBuilder={() => setWorkspaceView('encounter-builder')}
                combatants={combatants}
                onCombatantsChange={setCombatants}
                onCombatEnd={handleCombatEnd}
                showEmbeddedSidebar={false}
                combatLog={combatLog}
                onAddLog={handleAddLog}
                onClearLog={handleClearLog}
                onPhaseChange={setActiveCombatPhase}
                isLoading={isLoading}
                onAddPartyToCombat={handleAddPartyToCombat}
                partyCount={characters.filter((c) => c.type === 'HERO').length}
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
            activeWorkspace={workspaceView}
            monsters={initialMonsters}
            onAddCombatant={handleAddCombatant}
            combatantsCountForType={combatantsCountForType}
            combatLogEntries={combatLog}
            onClearCombatLog={handleClearLog}
            sessionId={sessionId}
            heroes={characters.filter((c) => c.type === 'HERO')}
            onRestComplete={(updatedChars, newLog) => {
              setCharacters((prev) =>
                prev.map((c) => {
                  const match = updatedChars.find((u) => u.id === c.id);
                  return match ? { ...c, ...match } : c;
                })
              );
              setSelectedCharacter((prev) => {
                if (!prev) return null;
                const match = updatedChars.find((u) => u.id === prev.id);
                return match ? { ...prev, ...match } : prev;
              });
              setLogs((prev) => [newLog, ...prev]);
            }}
            onAddSessionLog={(newLog) => {
              setLogs((prev) => [newLog, ...prev]);
            }}
          />
        </div>
      </div>
    </div>
  );
}
