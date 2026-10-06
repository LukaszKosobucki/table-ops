'use client';

import { AlertCircle, Skull } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import type { MonsterData } from '@/lib/monsters';
import { AddCombatantsPanel } from './AddCombatantsPanel';
import { CombatantCard } from './CombatantCard';
import { GmNotes } from './GmNotes';
import { TurnControls } from './TurnControls';
import type { Combatant } from './types';

interface InitiativeTrackerProps {
  monsters: MonsterData[];
  onOpenEncounterBuilder?: () => void;
  combatants?: Combatant[];
  onCombatantsChange?: React.Dispatch<React.SetStateAction<Combatant[]>>;
}

export function InitiativeTracker({
  monsters,
  onOpenEncounterBuilder,
  combatants: externalCombatants,
  onCombatantsChange,
}: InitiativeTrackerProps) {
  const [internalCombatants, setInternalCombatants] = useState<Combatant[]>([
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

  const combatants = externalCombatants ?? internalCombatants;
  const setCombatants = onCombatantsChange ?? setInternalCombatants;

  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [round, setRound] = useState(1);
  const [gmNotes, setGmNotes] = useState(
    'Sesja #4: Zasadzka w ruinach zamku. Gobliny mają przewagę wysokości.'
  );

  const handleNextTurn = () => {
    if (combatants.length === 0) return;
    if (currentTurnIndex + 1 >= combatants.length) {
      setCurrentTurnIndex(0);
      setRound((r) => r + 1);
    } else {
      setCurrentTurnIndex((i) => i + 1);
    }
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
  };

  const handleHpChange = (id: string, delta: number) => {
    setCombatants((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const nextHp = Math.max(0, Math.min(c.maxHp, c.currentHp + delta));
          return { ...c, currentHp: nextHp };
        }
        return c;
      })
    );
  };

  const handleToggleCondition = (id: string, condition: string) => {
    setCombatants((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const exists = c.conditions.includes(condition);
          const nextConditions = exists
            ? c.conditions.filter((item) => item !== condition)
            : [...c.conditions, condition];
          return { ...c, conditions: nextConditions };
        }
        return c;
      })
    );
  };

  const handleRemoveCombatant = (id: string) => {
    setCombatants((prev) => prev.filter((c) => c.id !== id));
  };

  const handleAddCombatant = (newCombatant: Combatant) => {
    setCombatants((prev) => [...prev, newCombatant].sort((a, b) => b.initiative - a.initiative));
  };

  return (
    <div className="space-y-6">
      {/* Round Banner */}
      <TurnControls
        round={round}
        onNextTurn={handleNextTurn}
        onRollAllMonsterInitiative={handleRollAllMonsterInitiative}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Combatant List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold text-slate-200">
                Kolejność Inicjatywy ({combatants.length})
              </h3>
              <p className="text-xs text-slate-400 font-normal">
                Posortowane według inicjatywy (D20)
              </p>
            </div>
            {onOpenEncounterBuilder && (
              <button
                type="button"
                data-testid="open-encounter-builder-btn"
                onClick={onOpenEncounterBuilder}
                className="px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 text-indigo-400 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
              >
                <Skull className="w-3.5 h-3.5" />
                <span>Zestawy Potyczek</span>
              </button>
            )}
          </div>

          {combatants.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center text-slate-400">
              <AlertCircle className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p>Brak postaci w walce. Dodaj gracza lub potwora poniżej.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {combatants.map((c, idx) => (
                <CombatantCard
                  key={c.id}
                  combatant={c}
                  isActiveTurn={idx === currentTurnIndex}
                  onHpChange={(delta) => handleHpChange(c.id, delta)}
                  onToggleCondition={(condition) => handleToggleCondition(c.id, condition)}
                  onRemove={() => handleRemoveCombatant(c.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar: Add Combatants & Session Notes */}
        <div className="space-y-6">
          <AddCombatantsPanel
            monsters={monsters}
            onAddCombatant={handleAddCombatant}
            existingCombatantCountForType={(type) =>
              combatants.filter((c) => c.type === type).length
            }
          />
          <GmNotes notes={gmNotes} onChangeNotes={setGmNotes} />
        </div>
      </div>
    </div>
  );
}
