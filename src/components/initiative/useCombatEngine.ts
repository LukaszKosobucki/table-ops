'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Combatant, CombatLogEntry, CombatPhase, CombatStatusItem } from './types';

export const DEFAULT_COMBATANTS: Combatant[] = [];

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
  onCombatEnd?: (updatedCharactersHp: { characterId: string; hp: number }[]) => void;
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
    (text: string, type: CombatLogEntry['type'] = 'system') => {
      const entry: CombatLogEntry = {
        id: `c-log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: getFormattedTime(),
        text,
        type,
      };
      if (onAddLog) {
        onAddLog(entry);
      }
      setInternalCombatLog((prev) => [entry, ...prev]);
    },
    [onAddLog]
  );

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
    const sorted = [...combatants].sort((a, b) => b.initiative - a.initiative);
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

    let nextTurnIdx = currentTurnIndex + 1;
    let nextRound = round;

    if (nextTurnIdx >= combatants.length) {
      nextTurnIdx = 0;
      nextRound += 1;
      setRound(nextRound);
    }
    setCurrentTurnIndex(nextTurnIdx);

    const activeCombatant = combatants[nextTurnIdx];
    if (activeCombatant) {
      addLogEntry(`Runda ${nextRound}: Rozpoczęto turę ${activeCombatant.name}.`, 'turn');

      // Decrement timed statuses for the combatant whose turn is starting
      if (activeCombatant.statuses && activeCombatant.statuses.length > 0) {
        const remainingStatuses: CombatStatusItem[] = [];
        const expiredStatusNames: string[] = [];

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

        setCombatants((prev) =>
          prev.map((c) => {
            if (c.id !== activeCombatant.id || !c.statuses) return c;
            const updatedConditions = c.conditions.filter(
              (cond) => !expiredStatusNames.includes(cond)
            );

            return {
              ...c,
              statuses: remainingStatuses,
              conditions: updatedConditions,
            };
          })
        );
      }
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
    addLogEntry(`Starcie zakończone po ${round} rundach.`, 'system');

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

    setCombatants(latestCombatants);

    // Collect hero HP to synchronize
    const heroUpdates = latestCombatants
      .filter((c) => !c.isMonster)
      .map((c) => ({
        characterId: c.characterId ?? c.id,
        hp: c.currentHp,
      }));

    if (heroUpdates.length > 0) {
      onCombatEnd?.(heroUpdates);
    }

    if (combatId) {
      try {
        await fetch(`/api/combat/${combatId}/end`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ heroUpdates }),
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

    // 1. Emit single log entry outside state updater (pure React pattern)
    if (delta < 0) {
      addLogEntry(
        `${target.name} odnosi ${Math.abs(delta)} pkt obrażeń (${nextHp}/${target.maxHp} HP).`,
        'damage'
      );
    } else if (delta > 0) {
      addLogEntry(
        `${target.name} odzyskuje ${delta} pkt życia (${nextHp}/${target.maxHp} HP).`,
        'heal'
      );
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
    addLogEntry(
      `Do walki dołącza: ${newCombatant.name} (Inicjatywa: ${newCombatant.initiative}).`,
      'system'
    );
    setCombatants((prev) => {
      const updated = [...prev, newCombatant];
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

  const activeCombatant = combatants[currentTurnIndex];
  const nextCombatantIndex = combatants.length > 0 ? (currentTurnIndex + 1) % combatants.length : 0;
  const nextCombatant = combatants.length > 1 ? combatants[nextCombatantIndex] : undefined;

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
  };
}
