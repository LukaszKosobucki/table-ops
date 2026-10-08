'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Combatant, CombatPhase } from '@/components/initiative/types';
import type { DashboardCharacter, DashboardLog } from './types';

export const DEFAULT_LOGS: DashboardLog[] = [
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

export const INITIAL_COMBATANTS: Combatant[] = [];

export interface UseSessionFullStateOptions {
  sessionId: string;
  initialCharacters?: DashboardCharacter[];
  onCharactersLoaded?: (characters: DashboardCharacter[]) => void;
}

export function useSessionFullState({
  sessionId,
  initialCharacters,
  onCharactersLoaded,
}: UseSessionFullStateOptions) {
  const [characters, setCharacters] = useState<DashboardCharacter[]>(initialCharacters || []);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(sessionId));
  const [logs, setLogs] = useState<DashboardLog[]>([]);

  const [activeCombatId, setActiveCombatId] = useState<string | null>(null);
  const [activeCombatRound, setActiveCombatRound] = useState<number>(1);
  const [activeCombatTurnIndex, setActiveCombatTurnIndex] = useState<number>(0);
  const [activeCombatPhase, setActiveCombatPhase] = useState<CombatPhase>('PREPARING');
  const [combatants, setCombatants] = useState<Combatant[]>(INITIAL_COMBATANTS);

  const onCharactersLoadedRef = useRef(onCharactersLoaded);
  useEffect(() => {
    onCharactersLoadedRef.current = onCharactersLoaded;
  }, [onCharactersLoaded]);

  const lastFetchedSessionIdRef = useRef<string | null>(null);

  const fetchFullState = useCallback(async () => {
    setIsLoading(true);
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

          if (
            data.activeCombat &&
            Array.isArray(data.activeCombat.combatants) &&
            data.activeCombat.combatants.length > 0
          ) {
            setActiveCombatId(data.activeCombat.id);
            setActiveCombatRound(data.activeCombat.currentRound);
            setActiveCombatTurnIndex(data.activeCombat.currentTurnIndex);
            setActiveCombatPhase(data.activeCombat.status as CombatPhase);
            const mapped: Combatant[] = data.activeCombat.combatants.map(
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
                character?: { name: string; avatarUrl?: string | null } | null;
                monster?: { name: string } | null;
                statuses?: { id: string; statusName: string; durationTurns: number }[];
              }) => ({
                id: c.id,
                characterId: c.characterId,
                monsterId: c.monsterId,
                apiMonsterId: c.apiMonsterId,
                name: c.nameOverride || c.character?.name || c.monster?.name || 'Uczestnik',
                avatarUrl: c.character?.avatarUrl || null,
                initiative: c.initiative,
                currentHp: c.currentHp,
                maxHp: c.maxHp,
                ac: c.ac,
                isMonster: !c.characterId,
                conditions: c.statuses?.map((s) => s.statusName) || [],
                statuses: c.statuses?.map((s) => ({
                  id: s.id,
                  statusName: s.statusName,
                  durationTurns: s.durationTurns,
                })),
                order: c.order,
              })
            );
            setCombatants(mapped);
          } else {
            setActiveCombatPhase((prev) => {
              if (prev === 'ACTIVE' || prev === 'FINISHED') {
                return prev;
              }
              setActiveCombatId(null);
              setActiveCombatRound(1);
              setActiveCombatTurnIndex(0);
              setCombatants((prevCombatants) => (prevCombatants.length > 0 ? prevCombatants : []));
              return 'PREPARING';
            });
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
    if (initialCharacters && initialCharacters.length > 0) {
      setCharacters(initialCharacters);
    }
  }, [initialCharacters]);

  useEffect(() => {
    if (lastFetchedSessionIdRef.current === sessionId) return;
    lastFetchedSessionIdRef.current = sessionId;
    fetchFullState();
  }, [sessionId, fetchFullState]);

  return {
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
    refetchFullState: fetchFullState,
  };
}
