'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  addExtraAction,
  consumeNextAttack,
  initCombatantTurnResources,
  resetTurnResourcesForNewTurn,
  toggleAttackSegment,
  toggleTurnAction,
} from '@/lib/combat-actions';
import type {
  Combatant,
  CombatLogEntry,
  CombatPhase,
  CombatStatusItem,
  DeathSaveState,
  TurnActionType,
} from './types';

export const DEFAULT_COMBATANTS: Combatant[] = [];

function isCombatantInactive(c?: Combatant | null): boolean {
  if (!c) return true;
  if (c.isMonster) {
    return c.currentHp <= 0 || !!c.isFled;
  }
  return c.deathSaves?.isDead === true || c.conditions?.includes('Martwy');
}

function getFormattedTime(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

export interface UseCombatEngineOptions {
  sessionId?: string;
  initialCombatId?: string | null;
  initialRound?: number;
  initialTurnIndex?: number;
  initialPhase?: CombatPhase;
  externalCombatants?: Combatant[];
  onCombatantsChange?: React.Dispatch<React.SetStateAction<Combatant[]>>;
  onCombatEnd?: (
    updatedCharactersHp: { characterId: string; hp: number }[],
    summaryText?: string,
    metadata?: Record<string, unknown>
  ) => void;
  externalCombatLog?: CombatLogEntry[];
  onAddLog?: (entry: CombatLogEntry) => void;
  onClearLog?: () => void;
  onPhaseChange?: (phase: CombatPhase) => void;
}

export function useCombatEngine({
  sessionId,
  initialCombatId = null,
  initialRound = 1,
  initialTurnIndex = 0,
  initialPhase = 'ACTIVE',
  externalCombatants,
  onCombatantsChange,
  onCombatEnd,
  externalCombatLog,
  onAddLog,
  onClearLog,
  onPhaseChange,
}: UseCombatEngineOptions) {
  const isControlled = Boolean(externalCombatants && onCombatantsChange);
  const [internalCombatants, setInternalCombatants] = useState<Combatant[]>(
    externalCombatants ?? DEFAULT_COMBATANTS
  );

  const combatants = isControlled && externalCombatants ? externalCombatants : internalCombatants;
  const setCombatants = onCombatantsChange ?? setInternalCombatants;

  // Track latest combatants array in ref for synchronous access across rapid user events
  const combatantsRef = useRef(combatants);
  useEffect(() => {
    combatantsRef.current = combatants;
  }, [combatants]);

  // Debounce tracking map: combatantId -> { timeoutId, targetHp }
  const pendingHpDebounceMap = useRef<
    Map<string, { timeoutId: ReturnType<typeof setTimeout>; targetHp: number }>
  >(new Map());

  // Clean up any pending debounce timeouts on unmount
  useEffect(() => {
    const map = pendingHpDebounceMap.current;
    return () => {
      for (const { timeoutId } of map.values()) {
        clearTimeout(timeoutId);
      }
      map.clear();
    };
  }, []);

  const [combatPhase, setCombatPhase] = useState<CombatPhase>(initialPhase);
  const [combatId, setCombatId] = useState<string | null>(initialCombatId);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(initialTurnIndex);
  const [round, setRound] = useState(initialRound);

  useEffect(() => {
    setCombatId(initialCombatId);
  }, [initialCombatId]);

  useEffect(() => {
    setCombatPhase(initialPhase);
  }, [initialPhase]);

  useEffect(() => {
    setRound(initialRound);
  }, [initialRound]);

  useEffect(() => {
    setCurrentTurnIndex(initialTurnIndex);
  }, [initialTurnIndex]);

  const usedSpellsByCharacterRef = useRef<Record<string, Record<number, number>>>({});

  const [internalCombatLog, setInternalCombatLog] = useState<CombatLogEntry[]>([
    {
      id: 'log-init-1',
      timestamp: getFormattedTime(),
      text: 'Starcie przygotowane. Uczestnicy w gotowości.',
      type: 'system',
    },
  ]);

  const activeCombatLog = externalCombatLog ?? internalCombatLog;

  const addLogEntry = useCallback(
    (text: string, type: CombatLogEntry['type'] = 'system', meta?: Partial<CombatLogEntry>) => {
      // Track leveled spell usage by character in combat
      if (
        type === 'spell' &&
        meta?.actorName &&
        meta?.spellLevel !== undefined &&
        meta.spellLevel > 0
      ) {
        const actor = meta.actorName;
        const lvl = meta.spellLevel;
        if (!usedSpellsByCharacterRef.current[actor]) {
          usedSpellsByCharacterRef.current[actor] = {};
        }
        usedSpellsByCharacterRef.current[actor][lvl] =
          (usedSpellsByCharacterRef.current[actor][lvl] || 0) + 1;
      }

      const entry: CombatLogEntry = {
        id: `c-log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: getFormattedTime(),
        text,
        type,
        ...meta,
      };
      if (onAddLog) {
        onAddLog(entry);
      }
      setInternalCombatLog((prev) => [entry, ...prev]);
    },
    [onAddLog]
  );

  const handleTrackSpellCast = useCallback((characterName: string, slotLevel: number) => {
    if (slotLevel <= 0) return;
    if (!usedSpellsByCharacterRef.current[characterName]) {
      usedSpellsByCharacterRef.current[characterName] = {};
    }
    usedSpellsByCharacterRef.current[characterName][slotLevel] =
      (usedSpellsByCharacterRef.current[characterName][slotLevel] || 0) + 1;
  }, []);

  const handleClearCombatLog = useCallback(() => {
    if (onClearLog) {
      onClearLog();
    } else {
      setInternalCombatLog([]);
    }
  }, [onClearLog]);

  const handleStartCombat = async () => {
    if (combatants.length === 0) return;

    // Freeze and sort combatants by initiative descending
    const sorted = [...combatants]
      .sort((a, b) => b.initiative - a.initiative)
      .map((c, idx) => {
        const baseRes =
          c.turnResources ??
          initCombatantTurnResources({ actions: c.rawActions, className: c.type });
        return {
          ...c,
          turnResources: idx === 0 ? resetTurnResourcesForNewTurn(baseRes, true) : baseRes,
        };
      });
    setCombatants(sorted);
    setCurrentTurnIndex(0);
    setRound(1);
    setCombatPhase('ACTIVE');
    onPhaseChange?.('ACTIVE');

    addLogEntry(`Rozpoczęto starcie! Liczba uczestników: ${sorted.length}.`, 'system');

    if (sessionId) {
      try {
        const payload = {
          sessionId,
          combatants: sorted.map((c, idx) => ({
            characterId: c.characterId ?? (!c.isMonster ? c.id : null),
            apiMonsterId: c.apiMonsterId ?? null,
            monsterId: c.monsterId ?? null,
            nameOverride: c.name,
            initiative: c.initiative,
            currentHp: c.currentHp,
            maxHp: c.maxHp,
            ac: c.ac,
            order: idx,
          })),
        };

        const res = await fetch('/api/combat/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.combat) {
            setCombatId(data.combat.id);
            if (Array.isArray(data.combat.combatants) && data.combat.combatants.length > 0) {
              const mapped: Combatant[] = data.combat.combatants.map(
                (c: {
                  id: string;
                  characterId?: string | null;
                  monsterId?: string | null;
                  apiMonsterId?: string | null;
                  nameOverride?: string | null;
                  initiative: number;
                  currentHp: number;
                  maxHp: number;
                  ac: number;
                  order?: number;
                  character?: { name: string } | null;
                  monster?: { name: string } | null;
                  statuses?: { id: string; statusName: string; durationTurns: number }[];
                }) => ({
                  id: c.id,
                  characterId: c.characterId,
                  monsterId: c.monsterId,
                  apiMonsterId: c.apiMonsterId,
                  name: c.nameOverride || c.character?.name || c.monster?.name || 'Uczestnik',
                  initiative: c.initiative,
                  currentHp: c.currentHp,
                  maxHp: c.maxHp,
                  ac: c.ac,
                  isMonster: !c.characterId,
                  conditions: c.statuses?.map((s) => s.statusName) || [],
                  statuses:
                    c.statuses?.map((s) => ({
                      id: s.id,
                      statusName: s.statusName,
                      durationTurns: s.durationTurns,
                    })) || [],
                  order: c.order,
                })
              );
              setCombatants(mapped);
            }
          }
        }
      } catch (err) {
        console.warn('Could not start combat via API, proceeding locally:', err);
      }
    }
  };

  const handleNextTurn = useCallback(async () => {
    if (combatants.length === 0) return;

    let targetIdx = -1;
    let nextTurnIdx = currentTurnIndex;
    let nextRound = round;

    // Search for next active combatant (skipping dead monsters, fled monsters, and dead heroes)
    for (let step = 0; step < combatants.length; step++) {
      nextTurnIdx++;
      if (nextTurnIdx >= combatants.length) {
        nextTurnIdx = 0;
        nextRound += 1;
      }
      if (!isCombatantInactive(combatants[nextTurnIdx])) {
        targetIdx = nextTurnIdx;
        break;
      }
    }

    if (targetIdx === -1) {
      targetIdx = (currentTurnIndex + 1) % combatants.length;
      if (currentTurnIndex + 1 >= combatants.length) {
        nextRound = round + 1;
      }
    }

    setRound(nextRound);
    setCurrentTurnIndex(targetIdx);

    const activeCombatant = combatants[targetIdx];
    if (activeCombatant) {
      addLogEntry(`Runda ${nextRound}: Rozpoczęto turę ${activeCombatant.name}.`, 'turn', {
        actorName: activeCombatant.name,
        actorAvatar: activeCombatant.avatarUrl ?? undefined,
        actorIsMonster: activeCombatant.isMonster,
      });

      // Decrement timed statuses for the combatant whose turn is starting
      const remainingStatuses: CombatStatusItem[] = [];
      const expiredStatusNames: string[] = [];

      if (activeCombatant.statuses && activeCombatant.statuses.length > 0) {
        for (const st of activeCombatant.statuses) {
          const nextDur = st.durationTurns - 1;
          if (nextDur <= 0) {
            expiredStatusNames.push(st.statusName);
          } else {
            remainingStatuses.push({ ...st, durationTurns: nextDur });
          }
        }

        for (const name of expiredStatusNames) {
          addLogEntry(`Efekt "${name}" na ${activeCombatant.name} wygasł.`, 'status');
        }
      }

      setCombatants((prev) =>
        prev.map((c, idx) => {
          const isOwnTurnStarting = idx === targetIdx;
          const currentRes =
            c.turnResources ??
            initCombatantTurnResources({ actions: c.rawActions, className: c.type });
          const updatedRes = resetTurnResourcesForNewTurn(currentRes, isOwnTurnStarting);

          if (
            isOwnTurnStarting &&
            activeCombatant.statuses &&
            activeCombatant.statuses.length > 0
          ) {
            const updatedConditions = c.conditions.filter(
              (cond) => !expiredStatusNames.includes(cond)
            );

            return {
              ...c,
              turnResources: updatedRes,
              statuses: remainingStatuses,
              conditions: updatedConditions,
            };
          }

          return {
            ...c,
            turnResources: updatedRes,
          };
        })
      );
    }

    if (combatId) {
      try {
        await fetch(`/api/combat/${combatId}/next-turn`, { method: 'POST' });
      } catch (err) {
        console.warn('Could not sync turn advancement with API:', err);
      }
    }
  }, [combatants, currentTurnIndex, round, combatId, setCombatants, addLogEntry]);

  const handleEndCombat = async () => {
    setCombatPhase('FINISHED');
    onPhaseChange?.('FINISHED');

    // Cancel all pending debounce timers so they don't fire after combat ends
    for (const { timeoutId } of pendingHpDebounceMap.current.values()) {
      clearTimeout(timeoutId);
    }

    // Compute authoritative latest combatants including any uncommitted debounced HP
    const latestCombatants = combatantsRef.current.map((c) => {
      const pending = pendingHpDebounceMap.current.get(c.id);
      return pending ? { ...c, currentHp: pending.targetHp } : c;
    });
    pendingHpDebounceMap.current.clear();
    // Clear all combatants (both enemies and heroes) from the combat queue upon combat conclusion
    setCombatants([]);

    // Collect hero HP to synchronize
    const heroUpdates = latestCombatants
      .filter((c) => !c.isMonster)
      .map((c) => ({
        characterId: c.characterId ?? c.id,
        hp: c.currentHp,
      }));

    // Collect stats for combat conclusion
    const defeatedMonsters = latestCombatants.filter(
      (c) => c.isMonster && !c.isFled && c.currentHp <= 0
    );
    const fledMonsters = latestCombatants.filter((c) => c.isMonster && c.isFled);
    const deadHeroes = latestCombatants.filter(
      (c) => !c.isMonster && (c.deathSaves?.isDead || c.conditions?.includes('Martwy'))
    );
    const unconsciousHeroes = latestCombatants.filter(
      (c) =>
        !c.isMonster &&
        c.currentHp <= 0 &&
        !c.deathSaves?.isDead &&
        !c.conditions?.includes('Martwy')
    );

    // Calculate XP: 100% for defeated, 50% for fled
    const totalDefeatedXp = defeatedMonsters.reduce((acc, c) => acc + (c.xp ?? 100), 0);
    const totalFledXp = fledMonsters.reduce((acc, c) => acc + Math.floor((c.xp ?? 100) * 0.5), 0);
    const totalXp = totalDefeatedXp + totalFledXp;

    // Narrative summary lines
    const summaryLines: string[] = [
      `Starcie zakończone po ${round} ${round === 1 ? 'rundzie' : round < 5 ? 'rundach' : 'rundach'}.`,
    ];

    if (defeatedMonsters.length > 0 || fledMonsters.length > 0) {
      const parts: string[] = [];
      if (defeatedMonsters.length > 0) {
        parts.push(`Pokonano: ${defeatedMonsters.map((c) => c.name).join(', ')}`);
      }
      if (fledMonsters.length > 0) {
        parts.push(`Uciekli: ${fledMonsters.map((c) => c.name).join(', ')} (50% PD)`);
      }
      summaryLines.push(`⚔️ Wynik: ${parts.join(' | ')}. Przyznano ${totalXp} PD.`);
    }

    if (deadHeroes.length > 0) {
      summaryLines.push(`💀 Polegli bohaterowie: ${deadHeroes.map((c) => c.name).join(', ')}.`);
    }

    if (unconsciousHeroes.length > 0) {
      const uncNames = unconsciousHeroes.map((c) => {
        const state = c.deathSaves?.isStabilized ? 'ustabilizowany' : '0 HP';
        return `${c.name} (${state})`;
      });
      summaryLines.push(`🤕 Powaleni / Nieprzytomni bohaterowie: ${uncNames.join(', ')}.`);
    }

    const spellsUsed = usedSpellsByCharacterRef.current;
    const spellSlotEntries = Object.entries(spellsUsed);
    if (spellSlotEntries.length > 0) {
      const spellsText = spellSlotEntries
        .map(([charName, slots]) => {
          const slotsText = Object.entries(slots)
            .map(([lvl, count]) => `${count}x K.${lvl}`)
            .join(', ');
          return `${charName} (${slotsText})`;
        })
        .join('; ');
      summaryLines.push(`✨ Zużyte komórki czarów: ${spellsText}.`);
    }

    const fullSummaryText = summaryLines.join('\n');
    addLogEntry(fullSummaryText, 'system');

    const summaryMetadata = {
      rounds: round,
      totalXp,
      defeatedEnemies: defeatedMonsters.map((c) => ({ name: c.name, xp: c.xp ?? 100 })),
      fledEnemies: fledMonsters.map((c) => ({
        name: c.name,
        xp: Math.floor((c.xp ?? 100) * 0.5),
      })),
      deadHeroes: deadHeroes.map((c) => c.name),
      unconsciousHeroes: unconsciousHeroes.map((c) => ({
        name: c.name,
        isStabilized: !!c.deathSaves?.isStabilized,
      })),
      spellSlotsUsed: spellsUsed,
    };

    onCombatEnd?.(heroUpdates, fullSummaryText, summaryMetadata);

    if (combatId) {
      try {
        await fetch(`/api/combat/${combatId}/end`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            heroUpdates,
            summaryText: fullSummaryText,
            metadata: summaryMetadata,
          }),
        });
      } catch (err) {
        console.warn('Could not end combat via API:', err);
      }
    }
  };

  const handleResetCombat = () => {
    setCombatPhase('PREPARING');
    onPhaseChange?.('PREPARING');
    setRound(1);
    setCurrentTurnIndex(0);
    setCombatId(null);
    usedSpellsByCharacterRef.current = {};
    // Ensure combat queue is cleared for next preparation
    setCombatants([]);
    addLogEntry('Rozpoczęto nową fazę przygotowania starcia.', 'system');
  };

  const handleRollAllMonsterInitiative = () => {
    setCombatants((prev) => {
      const updated = prev.map((c) => {
        if (c.isMonster) {
          const roll = Math.floor(Math.random() * 20) + 1;
          return { ...c, initiative: roll };
        }
        return c;
      });
      return updated.sort((a, b) => b.initiative - a.initiative);
    });
    addLogEntry('Przelosowano inicjatywę potworów.', 'system');
  };

  const handleHpChange = (id: string, delta: number) => {
    const target = combatantsRef.current.find((c) => c.id === id);
    if (!target) return;

    // Check if there is an in-flight uncommitted HP from recent rapid clicks
    const currentEffectiveHp = pendingHpDebounceMap.current.get(id)?.targetHp ?? target.currentHp;

    const nextHp = Math.max(0, Math.min(target.maxHp, currentEffectiveHp + delta));

    const activeCombatant = combatantsRef.current[currentTurnIndex];
    const actorName = activeCombatant?.name;
    const actorAvatar = activeCombatant?.avatarUrl ?? undefined;
    const actorIsMonster = activeCombatant?.isMonster;

    // 1. Emit single log entry outside state updater (pure React pattern)
    if (delta < 0) {
      const isAttackingOther = activeCombatant && activeCombatant.id !== target.id;
      const text = isAttackingOther
        ? `${activeCombatant.name} ➔ ${target.name}: ${Math.abs(delta)} pkt obrażeń (${nextHp}/${target.maxHp} HP).`
        : `${target.name} odnosi ${Math.abs(delta)} pkt obrażeń (${nextHp}/${target.maxHp} HP).`;

      addLogEntry(text, 'damage', {
        actorName,
        actorAvatar,
        actorIsMonster,
        targetName: target.name,
        targetIsMonster: target.isMonster,
      });
    } else if (delta > 0) {
      const isHealingOther = activeCombatant && activeCombatant.id !== target.id;
      const text = isHealingOther
        ? `${activeCombatant.name} leczy ${target.name} o ${delta} pkt życia (${nextHp}/${target.maxHp} HP).`
        : `${target.name} odzyskuje ${delta} pkt życia (${nextHp}/${target.maxHp} HP).`;

      addLogEntry(text, 'heal', {
        actorName,
        actorAvatar,
        actorIsMonster,
        targetName: target.name,
        targetIsMonster: target.isMonster,
      });
    }

    // 2. Pure state update for instantaneous optimistic UI feedback
    setCombatants((prev) => prev.map((c) => (c.id === id ? { ...c, currentHp: nextHp } : c)));

    // 3. Debounce database persistence (500ms) with authoritative absolute currentHp
    if (combatId && id) {
      const existing = pendingHpDebounceMap.current.get(id);
      if (existing) {
        clearTimeout(existing.timeoutId);
      }

      const timeoutId = setTimeout(async () => {
        pendingHpDebounceMap.current.delete(id);
        try {
          await fetch(`/api/combat/${combatId}/combatants/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentHp: nextHp }),
          });
        } catch (err) {
          console.warn('Could not sync combatant HP to backend:', err);
        }
      }, 500);

      pendingHpDebounceMap.current.set(id, { timeoutId, targetHp: nextHp });
    }
  };

  const handleAddStatus = (combatantId: string, statusName: string, durationTurns: number) => {
    const target = combatantsRef.current.find((c) => c.id === combatantId);
    if (target) {
      addLogEntry(
        `Nałożono status "${statusName}" (${durationTurns} ${durationTurns === 1 ? 'tura' : 'tury'}) na ${target.name}.`,
        'status'
      );
    }

    const statusId = `status-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newStatusItem: CombatStatusItem = {
      id: statusId,
      statusName,
      durationTurns,
    };

    setCombatants((prev) =>
      prev.map((c) => {
        if (c.id === combatantId) {
          const currentStatuses = c.statuses || [];
          const nextConditions = c.conditions.includes(statusName)
            ? c.conditions
            : [...c.conditions, statusName];
          return {
            ...c,
            statuses: [...currentStatuses, newStatusItem],
            conditions: nextConditions,
          };
        }
        return c;
      })
    );

    if (combatId) {
      fetch(`/api/combat/${combatId}/combatants/${combatantId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusName, durationTurns }),
      }).catch(() => {});
    }
  };

  const handleRemoveStatus = (combatantId: string, statusId: string) => {
    const target = combatantsRef.current.find((c) => c.id === combatantId);
    const removed = target?.statuses?.find((s) => s.id === statusId);
    if (target && removed) {
      addLogEntry(`Zdjęto status "${removed.statusName}" z ${target.name}.`, 'status');
    }

    setCombatants((prev) =>
      prev.map((c) => {
        if (c.id === combatantId) {
          const nextStatuses = (c.statuses || []).filter((s) => s.id !== statusId);
          const nextConditions = removed
            ? c.conditions.filter((cond) => cond !== removed.statusName)
            : c.conditions;
          return {
            ...c,
            statuses: nextStatuses,
            conditions: nextConditions,
          };
        }
        return c;
      })
    );

    if (combatId) {
      fetch(`/api/combat/${combatId}/combatants/${combatantId}/status/${statusId}`, {
        method: 'DELETE',
      }).catch(() => {});
    }
  };

  const handleToggleCondition = (combatantId: string, condition: string) => {
    const target = combatantsRef.current.find((c) => c.id === combatantId);
    if (!target) return;

    const exists = target.conditions.includes(condition);
    if (exists) {
      addLogEntry(`Zdjęto stan "${condition}" z ${target.name}.`, 'status');
      setCombatants((prev) =>
        prev.map((c) =>
          c.id === combatantId
            ? {
                ...c,
                conditions: c.conditions.filter((item) => item !== condition),
                statuses: (c.statuses || []).filter((s) => s.statusName !== condition),
              }
            : c
        )
      );
    } else {
      addLogEntry(`Nałożono stan "${condition}" na ${target.name}.`, 'status');
      const newStatus: CombatStatusItem = {
        id: `status-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        statusName: condition,
        durationTurns: 2,
      };
      setCombatants((prev) =>
        prev.map((c) =>
          c.id === combatantId
            ? {
                ...c,
                conditions: [...c.conditions, condition],
                statuses: [...(c.statuses || []), newStatus],
              }
            : c
        )
      );
    }
  };

  const handleInitiativeChange = (combatantId: string, initiative: number) => {
    setCombatants((prev) => prev.map((c) => (c.id === combatantId ? { ...c, initiative } : c)));
  };

  const handleRemoveCombatant = (id: string) => {
    const toRemove = combatants.find((c) => c.id === id);
    if (toRemove) {
      addLogEntry(`${toRemove.name} został usunięty z walki.`, 'system');
    }
    setCombatants((prev) => prev.filter((c) => c.id !== id));
  };

  const handleAddCombatant = async (newCombatant: Combatant) => {
    if (combatPhase === 'FINISHED') {
      setCombatPhase('PREPARING');
      onPhaseChange?.('PREPARING');
      setRound(1);
      setCurrentTurnIndex(0);
      setCombatId(null);
    }

    addLogEntry(
      `Do walki dołącza: ${newCombatant.name} (Inicjatywa: ${newCombatant.initiative}).`,
      'system'
    );
    const combatantWithResources: Combatant = {
      ...newCombatant,
      turnResources:
        newCombatant.turnResources ??
        initCombatantTurnResources({
          actions: newCombatant.rawActions,
          className: newCombatant.type,
        }),
    };

    setCombatants((prev) => {
      const updated = [...prev, combatantWithResources];
      return combatPhase === 'ACTIVE'
        ? updated // in active combat, append reinforcements at the end
        : updated.sort((a, b) => b.initiative - a.initiative);
    });

    if (combatId) {
      try {
        const res = await fetch(`/api/combat/${combatId}/combatants`, {
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
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.combatant?.id) {
            setCombatants((prev) =>
              prev.map((c) => (c.id === newCombatant.id ? { ...c, id: data.combatant.id } : c))
            );
          }
        }
      } catch (err) {
        console.warn('Could not persist new combatant via API:', err);
      }
    }
  };

  const handleAddCustomAction = useCallback(
    (actionText: string, actorNameOverride?: string) => {
      if (!actionText.trim()) return;
      const active = combatantsRef.current[currentTurnIndex];
      const actorName = actorNameOverride || active?.name || 'Mistrz Gry';
      const actorIsMonster = actorNameOverride
        ? combatantsRef.current.find((c) => c.name === actorNameOverride)?.isMonster
        : active?.isMonster;
      const actorAvatar = actorNameOverride
        ? (combatantsRef.current.find((c) => c.name === actorNameOverride)?.avatarUrl ?? undefined)
        : (active?.avatarUrl ?? undefined);

      addLogEntry(`${actorName} wykonuje akcję: ${actionText.trim()}`, 'action', {
        actorName,
        actorIsMonster,
        actorAvatar,
      });
    },
    [currentTurnIndex, addLogEntry]
  );

  const handleCombatantFlee = useCallback(
    (id: string) => {
      const target = combatantsRef.current.find((c) => c.id === id);
      if (!target?.isMonster || target.isFled) return;

      addLogEntry(`${target.name} ucieka w popłochu z pola walki!`, 'flee', {
        actorName: target.name,
        actorAvatar: target.avatarUrl ?? undefined,
        actorIsMonster: true,
      });

      setCombatants((prev) => prev.map((c) => (c.id === id ? { ...c, isFled: true } : c)));

      // If it is currently this combatant's turn, advance turn immediately
      if (combatantsRef.current[currentTurnIndex]?.id === id) {
        handleNextTurn();
      }
    },
    [currentTurnIndex, handleNextTurn, addLogEntry, setCombatants]
  );

  const handleRollDeathSave = useCallback(
    (id: string) => {
      const target = combatantsRef.current.find((c) => c.id === id);
      if (!target || target.isMonster || target.currentHp > 0) return;

      const curSaves = target.deathSaves || { successes: 0, failures: 0 };
      if (curSaves.isDead || curSaves.isStabilized) return;

      const d20 = Math.floor(Math.random() * 20) + 1;

      if (d20 === 20) {
        addLogEntry(
          `🎲 ${target.name} wyrzuca Naturalne 20 w rzucie na śmierć! Odzyskuje 1 HP i wstaje!`,
          'heal',
          {
            actorName: target.name,
            actorAvatar: target.avatarUrl ?? undefined,
            actorIsMonster: false,
          }
        );

        setCombatants((prev) =>
          prev.map((c) =>
            c.id === id
              ? {
                  ...c,
                  currentHp: 1,
                  deathSaves: undefined,
                  conditions: c.conditions.filter(
                    (cond) => cond !== 'Powalony' && cond !== 'Martwy'
                  ),
                }
              : c
          )
        );

        if (combatId) {
          fetch(`/api/combat/${combatId}/combatants/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentHp: 1 }),
          }).catch(() => {});
        }
        return;
      }

      let newSuccesses = curSaves.successes;
      let newFailures = curSaves.failures;

      if (d20 === 1) {
        newFailures = Math.min(3, newFailures + 2);
      } else if (d20 >= 10) {
        newSuccesses = Math.min(3, newSuccesses + 1);
      } else {
        newFailures = Math.min(3, newFailures + 1);
      }

      const isDead = newFailures >= 3;
      const isStabilized = !isDead && newSuccesses >= 3;

      let logText = '';
      if (d20 === 1) {
        logText = isDead
          ? `🎲 ${target.name} wyrzuca 1 (PECH)! Otrzymuje 2 porażki (łącznie 3). Bohater PONOSI ŚMIERĆ.`
          : `🎲 ${target.name} wyrzuca 1 (PECH)! Otrzymuje 2 porażki (${newSuccesses}/3 S, ${newFailures}/3 P).`;
      } else if (d20 >= 10) {
        logText = isStabilized
          ? `🎲 ${target.name} wyrzuca ${d20} (Sukces)! Osiąga 3 sukcesy i zostaje USTABILIZOWANY.`
          : `🎲 ${target.name} wyrzuca ${d20} (Sukces)! (${newSuccesses}/3 S, ${newFailures}/3 P).`;
      } else {
        logText = isDead
          ? `🎲 ${target.name} wyrzuca ${d20} (Porażka). Osiąga 3 porażki i PONOSI ŚMIERĆ.`
          : `🎲 ${target.name} wyrzuca ${d20} (Porażka)! (${newSuccesses}/3 S, ${newFailures}/3 P).`;
      }

      addLogEntry(logText, 'death_save', {
        actorName: target.name,
        actorAvatar: target.avatarUrl ?? undefined,
        actorIsMonster: false,
      });

      const nextConditions = isDead
        ? [...target.conditions.filter((cond) => cond !== 'Ustabilizowany'), 'Martwy']
        : isStabilized
          ? [...target.conditions.filter((cond) => cond !== 'Martwy'), 'Ustabilizowany']
          : target.conditions;

      setCombatants((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                conditions: nextConditions,
                deathSaves: {
                  successes: newSuccesses,
                  failures: newFailures,
                  isStabilized,
                  isDead,
                },
              }
            : c
        )
      );
    },
    [combatId, addLogEntry, setCombatants]
  );

  const handleUpdateDeathSaves = useCallback(
    (id: string, saves: DeathSaveState) => {
      setCombatants((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c;
          const isDead = saves.failures >= 3 || !!saves.isDead;
          const isStabilized = !isDead && (saves.successes >= 3 || !!saves.isStabilized);
          const nextConditions = isDead
            ? [...c.conditions.filter((cond) => cond !== 'Ustabilizowany'), 'Martwy']
            : isStabilized
              ? [...c.conditions.filter((cond) => cond !== 'Martwy'), 'Ustabilizowany']
              : c.conditions;
          return {
            ...c,
            conditions: nextConditions,
            deathSaves: {
              ...saves,
              isDead,
              isStabilized,
            },
          };
        })
      );
    },
    [setCombatants]
  );

  const handleToggleTurnAction = useCallback(
    (combatantId: string, actionType: TurnActionType, extraIndex?: number) => {
      setCombatants((prev) =>
        prev.map((c) => {
          if (c.id !== combatantId) return c;
          const currentRes =
            c.turnResources ??
            initCombatantTurnResources({ actions: c.rawActions, className: c.type });
          return {
            ...c,
            turnResources: toggleTurnAction(currentRes, actionType, extraIndex),
          };
        })
      );
    },
    [setCombatants]
  );

  const handleAddExtraAction = useCallback(
    (combatantId: string) => {
      setCombatants((prev) =>
        prev.map((c) => {
          if (c.id !== combatantId) return c;
          const currentRes =
            c.turnResources ??
            initCombatantTurnResources({ actions: c.rawActions, className: c.type });
          return {
            ...c,
            turnResources: addExtraAction(currentRes),
          };
        })
      );
    },
    [setCombatants]
  );

  const handleToggleAttackSegment = useCallback(
    (combatantId: string, attackId: string) => {
      setCombatants((prev) =>
        prev.map((c) => {
          if (c.id !== combatantId) return c;
          const currentRes =
            c.turnResources ??
            initCombatantTurnResources({ actions: c.rawActions, className: c.type });
          return {
            ...c,
            turnResources: toggleAttackSegment(currentRes, attackId),
          };
        })
      );
    },
    [setCombatants]
  );

  const handleConsumeAttack = useCallback(
    (combatantId: string) => {
      setCombatants((prev) =>
        prev.map((c) => {
          if (c.id !== combatantId) return c;
          const currentRes =
            c.turnResources ??
            initCombatantTurnResources({ actions: c.rawActions, className: c.type });
          return {
            ...c,
            turnResources: consumeNextAttack(currentRes),
          };
        })
      );
    },
    [setCombatants]
  );

  const activeCombatant = combatants[currentTurnIndex];
  let nextCombatant: Combatant | undefined;
  if (combatants.length > 1) {
    let peekIdx = currentTurnIndex;
    for (let step = 0; step < combatants.length - 1; step++) {
      peekIdx = (peekIdx + 1) % combatants.length;
      if (!isCombatantInactive(combatants[peekIdx])) {
        nextCombatant = combatants[peekIdx];
        break;
      }
    }
    if (!nextCombatant) {
      nextCombatant = combatants[(currentTurnIndex + 1) % combatants.length];
    }
  }

  return {
    combatants,
    combatPhase,
    combatId,
    currentTurnIndex,
    round,
    activeCombatant,
    nextCombatant,
    activeCombatLog,
    handleStartCombat,
    handleNextTurn,
    handleEndCombat,
    handleResetCombat,
    handleRollAllMonsterInitiative,
    handleHpChange,
    handleAddStatus,
    handleRemoveStatus,
    handleToggleCondition,
    handleInitiativeChange,
    handleRemoveCombatant,
    handleAddCombatant,
    handleClearCombatLog,
    handleAddLogEntry: addLogEntry,
    handleAddCustomAction,
    handleCombatantFlee,
    handleRollDeathSave,
    handleUpdateDeathSaves,
    handleTrackSpellCast,
    handleToggleTurnAction,
    handleAddExtraAction,
    handleToggleAttackSegment,
    handleConsumeAttack,
  };
}
