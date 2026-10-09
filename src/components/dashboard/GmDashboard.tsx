'use client';

import { Dices, FileText, History, Skull, Sparkles, Swords, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { DraggableDiceTray } from '@/components/dice/DraggableDiceTray';
import { EncounterBuilder } from '@/components/encounters/EncounterBuilder';
import { InitiativeTracker } from '@/components/initiative/InitiativeTracker';
import type { Combatant, CombatLogEntry } from '@/components/initiative/types';
import { initCombatantTurnResources } from '@/lib/combat-actions';
import type { DiceGroup, RollResult } from '@/lib/dice/types';
import { getXpForLevel } from '@/lib/dnd-rules';
import type { MonsterData } from '@/lib/monsters';
import { BottomDock } from './BottomDock';
import { CharacterInspectionCard } from './CharacterInspectionCard';
import { DraggableNotesWindow } from './DraggableNotesWindow';
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
  suppressDockAndWindows?: boolean;
  isNotesOpen?: boolean;
  isNotesMinimized?: boolean;
  onToggleNotes?: () => void;
  googleDocUrl?: string | null;
  onUpdateGoogleDocUrl?: (url: string | null) => Promise<void> | void;
  isDiceOpen?: boolean;
  isDiceMinimized?: boolean;
  onToggleDice?: () => void;
  onRequestDiceRoll?: (
    dice: DiceGroup[],
    modifier: number,
    context?: {
      characterId?: string;
      combatantId?: string;
      characterName?: string;
      actionName?: string;
    }
  ) => void;
  onRegisterRollHandler?: (handler: (result: RollResult) => void) => void;
  onGoogleDocUrlChange?: (url: string | null) => void;
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
  suppressDockAndWindows = false,
  isNotesOpen: propsIsNotesOpen,
  isNotesMinimized: propsIsNotesMinimized,
  onToggleNotes: propsOnToggleNotes,
  googleDocUrl: propsGoogleDocUrl,
  onUpdateGoogleDocUrl: propsOnUpdateGoogleDocUrl,
  isDiceOpen: propsIsDiceOpen,
  isDiceMinimized: propsIsDiceMinimized,
  onToggleDice: propsOnToggleDice,
  onRequestDiceRoll: propsOnRequestDiceRoll,
  onRegisterRollHandler,
  onGoogleDocUrlChange,
}: GmDashboardProps) {
  const {
    characters,
    setCharacters,
    isLoading,
    logs,
    setLogs,
    googleDocUrl: stateGoogleDocUrl,
    updateGoogleDocUrl: stateUpdateGoogleDocUrl,
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

  // Sync loaded googleDocUrl with parent MainDashboard
  useEffect(() => {
    if (stateGoogleDocUrl !== undefined && stateGoogleDocUrl !== null) {
      onGoogleDocUrlChange?.(stateGoogleDocUrl);
    }
  }, [stateGoogleDocUrl, onGoogleDocUrlChange]);

  const effectiveGoogleDocUrl =
    propsGoogleDocUrl !== undefined ? propsGoogleDocUrl : stateGoogleDocUrl;
  const effectiveUpdateGoogleDocUrl = propsOnUpdateGoogleDocUrl ?? stateUpdateGoogleDocUrl;

  // External Notes Window State (Chunk 9.2) - Local state for standalone mode
  const [localIsNotesOpen, setLocalIsNotesOpen] = useState(false);
  const [localIsNotesMinimized, setLocalIsNotesMinimized] = useState(false);

  const effectiveIsNotesOpen = propsIsNotesOpen !== undefined ? propsIsNotesOpen : localIsNotesOpen;
  const effectiveIsNotesMinimized =
    propsIsNotesMinimized !== undefined ? propsIsNotesMinimized : localIsNotesMinimized;

  const handleToggleNotesWindow = useCallback(() => {
    if (localIsNotesMinimized) {
      setLocalIsNotesMinimized(false);
      setLocalIsNotesOpen(true);
    } else {
      setLocalIsNotesOpen((prev) => !prev);
    }
  }, [localIsNotesMinimized]);

  const effectiveToggleNotes = propsOnToggleNotes ?? handleToggleNotesWindow;

  const handleRestoreNotes = useCallback(() => {
    setLocalIsNotesMinimized(false);
    setLocalIsNotesOpen(true);
  }, []);

  // Dice Roller State & Shortcuts (Chunk 10.2 & 10.4) - Local state for standalone mode
  const [localIsDiceOpen, setLocalIsDiceOpen] = useState(false);
  const [localIsDiceMinimized, setLocalIsDiceMinimized] = useState(false);
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

  const effectiveIsDiceOpen = propsIsDiceOpen !== undefined ? propsIsDiceOpen : localIsDiceOpen;
  const effectiveIsDiceMinimized =
    propsIsDiceMinimized !== undefined ? propsIsDiceMinimized : localIsDiceMinimized;

  const handleToggleDice = useCallback(() => {
    if (localIsDiceMinimized) {
      setLocalIsDiceMinimized(false);
      setLocalIsDiceOpen(true);
    } else {
      setLocalIsDiceOpen((prev) => !prev);
    }
  }, [localIsDiceMinimized]);

  const effectiveToggleDice = propsOnToggleDice ?? handleToggleDice;

  const handleRestoreDice = useCallback(() => {
    setLocalIsDiceMinimized(false);
    setLocalIsDiceOpen(true);
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
      setLocalIsDiceMinimized(false);
      setLocalIsDiceOpen(true);
    },
    []
  );

  const effectiveRequestDiceRoll = propsOnRequestDiceRoll ?? handleRequestDiceRoll;

  const handleDiceRoll = useCallback(
    (result: RollResult) => {
      const localLog: DashboardLog = {
        id: `dice-log-${result.id}`,
        sessionId: sessionId || 'local',
        logType: 'DICE_ROLL',
        description: `🎲 Rzut (${result.actorName}): ${result.formula} = ${result.total}${
          result.isSecret ? ' (Tylko dla GM)' : ''
        }`,
        metadata: {
          ...result,
        },
        createdAt: result.timestamp || new Date().toISOString(),
      };

      setLogs((prev) => [localLog, ...prev]);

      if (sessionId) {
        fetch(`/api/sessions/${sessionId}/logs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            logType: 'DICE_ROLL',
            description: localLog.description,
            metadata: {
              ...result,
            },
          }),
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data?.log) {
              setLogs((prev) => [data.log, ...prev.filter((l) => l.id !== localLog.id)]);
            }
          })
          .catch(() => {});
      }
    },
    [sessionId, setLogs]
  );

  // Expose roll handler to parent if integrated into shell
  useEffect(() => {
    onRegisterRollHandler?.(handleDiceRoll);
  }, [onRegisterRollHandler, handleDiceRoll]);

  // Global Hotkey 'D' to toggle dice roller in standalone mode (unless typing in input)
  useEffect(() => {
    if (suppressDockAndWindows) return;

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
        effectiveToggleDice();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [suppressDockAndWindows, effectiveToggleDice]);

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
    if (activeCombatPhase === 'FINISHED') {
      setActiveCombatPhase('PREPARING');
    }
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
      avatarUrl: h.avatarUrl || null,
      initiative: 0,
      currentHp: h.currentHp,
      maxHp: h.maxHp,
      ac: h.ac,
      isMonster: false,
      type: h.class || undefined,
      conditions: [],
      statuses: [],
      turnResources: initCombatantTurnResources({
        className: h.class || undefined,
        level: h.level,
      }),
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
  }, [
    characters,
    combatants,
    activeCombatId,
    activeCombatPhase,
    setCombatants,
    setActiveCombatPhase,
  ]);

  const handleAddCharacterToCombat = useCallback(
    (char: DashboardCharacter) => {
      if (activeCombatPhase === 'FINISHED') {
        setActiveCombatPhase('PREPARING');
      }
      const alreadyInCombat = combatants.some((c) => c.characterId === char.id || c.id === char.id);
      if (alreadyInCombat) return;

      const newCombatant: Combatant = {
        id: char.id,
        characterId: char.id,
        name: char.name,
        avatarUrl: char.avatarUrl || null,
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
    [activeCombatPhase, combatants, handleAddCombatant, setActiveCombatPhase]
  );

  const combatantsCountForType = useCallback(
    (type: string) => combatants.filter((c) => c.type === type).length,
    [combatants]
  );

  const handleCombatEnd = useCallback(
    (heroUpdates: { characterId: string; hp: number }[]) => {
      // Clear combatants state immediately when combat ends
      setCombatants([]);
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
    [setCharacters, setCombatants]
  );

  const handleDistributePartyXp = useCallback(
    async (totalXp: number) => {
      const heroes = characters.filter((c) => c.type === 'HERO');
      if (heroes.length === 0 || totalXp <= 0) return;

      const xpPerHero = Math.floor(totalXp / heroes.length);
      if (xpPerHero <= 0) return;

      const updatedList = characters.map((c) => {
        if (c.type === 'HERO') {
          const currentXp = c.stats?.xp ?? getXpForLevel(c.level || 1);
          const nextStats = { ...(c.stats || {}), xp: currentXp + xpPerHero };
          return { ...c, stats: nextStats };
        }
        return c;
      });

      setCharacters(updatedList);
      if (selectedCharacter && selectedCharacter.type === 'HERO') {
        const found = updatedList.find((c) => c.id === selectedCharacter.id);
        if (found) setSelectedCharacter(found);
      }

      // Persist to backend for each hero
      for (const hero of heroes) {
        if (hero.id && !hero.id.startsWith('char-default')) {
          const heroCurrentXp = hero.stats?.xp ?? getXpForLevel(hero.level || 1);
          fetch(`/api/characters/${hero.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              stats: { ...(hero.stats || {}), xp: heroCurrentXp + xpPerHero },
            }),
          }).catch(() => {});
        }
      }

      // Log event on timeline
      if (sessionId) {
        fetch(`/api/sessions/${sessionId}/logs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            logType: 'CUSTOM_NOTE',
            description: `🎁 Nagroda EXP: Drużyna otrzymała łącznie ${totalXp} XP (+${xpPerHero} XP na każdego z ${heroes.length} bohaterów).`,
          }),
        }).catch(() => {});
      }
    },
    [characters, selectedCharacter, sessionId, setCharacters]
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

  const handleSpellCast = useCallback(
    (spellName: string, level: number, characterName: string) => {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

      const inCombat =
        activeCombatPhase === 'ACTIVE' ||
        (selectedCharacter ? isCharacterInCombat(selectedCharacter.id) : false);

      if (inCombat) {
        const combatEntry: CombatLogEntry = {
          id: `c-log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: timeStr,
          actorName: characterName,
          actorAvatar: selectedCharacter?.avatarUrl || undefined,
          text:
            level === 0
              ? `${characterName} rzuca cantrip: ${spellName}`
              : `${characterName} rzuca zaklęcie (${level}. krąg): ${spellName}`,
          type: 'spell',
          spellLevel: level,
        };
        handleAddLog(combatEntry);
      }

      const sessionLogEntry: DashboardLog = {
        id: `log-spell-${Date.now()}`,
        sessionId,
        logType: 'SPELL_CAST',
        description:
          level === 0
            ? `${characterName} rzuca sztuczkę (cantrip): ${spellName}`
            : `${characterName} rzuca zaklęcie (${level}. krąg): ${spellName}`,
        createdAt: new Date().toISOString(),
        metadata: {
          spellName,
          spellLevel: level,
          characterName,
          inCombat,
        },
      };
      setLogs((prev) => [sessionLogEntry, ...prev]);
    },
    [activeCombatPhase, selectedCharacter, isCharacterInCombat, handleAddLog, sessionId, setLogs]
  );

  const handleAddCombatCustomAction = useCallback(
    (actionText: string) => {
      if (!actionText.trim()) return;
      const activeCombatant = combatants[activeCombatTurnIndex];
      const effectiveActor = activeCombatant?.name || 'Mistrz Gry';
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

      const logEntry: CombatLogEntry = {
        id: `c-log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: timeStr,
        actorName: effectiveActor,
        actorAvatar: activeCombatant?.avatarUrl || undefined,
        actorIsMonster: activeCombatant?.isMonster,
        text: `${effectiveActor} wykonuje akcję: ${actionText.trim()}`,
        type: 'action',
      };
      handleAddLog(logEntry);

      if (sessionId) {
        fetch(`/api/sessions/${sessionId}/logs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            logType: 'COMBAT_ACTION',
            description: `${effectiveActor} wykonuje akcję: ${actionText.trim()}`,
            metadata: { actorName: effectiveActor, combatId: activeCombatId },
          }),
        }).catch(() => {});

        setLogs((prev) => [
          {
            id: `log-act-${Date.now()}`,
            sessionId,
            logType: 'COMBAT_ACTION',
            description: `${effectiveActor} wykonuje akcję: ${actionText.trim()}`,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
      }
    },
    [combatants, activeCombatTurnIndex, handleAddLog, sessionId, activeCombatId, setLogs]
  );

  return (
    <div className="space-y-6 pb-14">
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

        {/* Right side controls: External Notes Button + Mobile Tab Switcher */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            data-testid="header-dice-btn"
            onClick={effectiveToggleDice}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-sm ${
              effectiveIsDiceOpen && !effectiveIsDiceMinimized
                ? 'bg-amber-500/25 border-amber-500/60 text-amber-200 ring-1 ring-amber-500/40'
                : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700 text-slate-200 hover:text-amber-400'
            }`}
            title="Otwórz podręczny rzutnik kości (Skrót: D)"
          >
            <Dices className="w-3.5 h-3.5 text-amber-400" />
            <span>Rzutnik kości</span>
          </button>

          <button
            type="button"
            data-testid="external-notes-btn"
            onClick={effectiveToggleNotes}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-sm ${
              effectiveIsNotesOpen && !effectiveIsNotesMinimized
                ? 'bg-indigo-600/25 border-indigo-500/60 text-indigo-200 ring-1 ring-indigo-500/40'
                : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700 text-slate-200 hover:text-white'
            }`}
            title="Otwórz podręczne okno zewnętrznych notatek GM-a (Google Docs / Drive)"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>Zewnętrzne notatki</span>
            {effectiveGoogleDocUrl && (
              <span
                data-testid="external-notes-active-dot"
                className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/60"
              />
            )}
          </button>

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
            onDistributePartyXp={handleDistributePartyXp}
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
              onCastSpell={handleSpellCast}
              onRequestDiceRoll={effectiveRequestDiceRoll}
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
                onRequestDiceRoll={effectiveRequestDiceRoll}
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
            activeCombatantName={combatants[activeCombatTurnIndex]?.name}
            onAddCustomAction={handleAddCombatCustomAction}
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
            isLoading={isLoading}
            googleDocUrl={effectiveGoogleDocUrl}
            onOpenNotesWindow={effectiveToggleNotes}
          />
        </div>
      </div>

      {/* Standalone mode fallback for dock and floating windows (e.g. isolated GmDashboard tests) */}
      {!suppressDockAndWindows && (
        <>
          <DraggableNotesWindow
            isOpen={localIsNotesOpen}
            isMinimized={localIsNotesMinimized}
            onClose={() => setLocalIsNotesOpen(false)}
            onMinimize={() => setLocalIsNotesMinimized(true)}
            googleDocUrl={stateGoogleDocUrl}
            onSaveUrl={effectiveUpdateGoogleDocUrl}
          />

          <DraggableDiceTray
            isOpen={localIsDiceOpen}
            isMinimized={localIsDiceMinimized}
            onClose={() => setLocalIsDiceOpen(false)}
            onMinimize={() => setLocalIsDiceMinimized(true)}
            actorName={diceTrayConfig.actorName || 'Mistrz Gry'}
            initialDice={diceTrayConfig.dice}
            initialModifier={diceTrayConfig.modifier}
            rollContext={diceTrayConfig.context}
            onRoll={handleDiceRoll}
          />

          <BottomDock
            isNotesOpen={localIsNotesOpen}
            isNotesMinimized={localIsNotesMinimized}
            onRestoreNotes={handleRestoreNotes}
            onToggleNotes={handleToggleNotesWindow}
            hasNotesUrl={Boolean(stateGoogleDocUrl)}
            isDiceOpen={localIsDiceOpen}
            isDiceMinimized={localIsDiceMinimized}
            onRestoreDice={handleRestoreDice}
            onToggleDice={handleToggleDice}
          />
        </>
      )}
    </div>
  );
}
