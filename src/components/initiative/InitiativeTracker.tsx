'use client';

import { AlertCircle, CheckCircle2, RotateCcw, Skull, Swords } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import type { MonsterData } from '@/lib/monsters';
import { AddCombatantsPanel } from './AddCombatantsPanel';
import { CombatantCard } from './CombatantCard';
import { CombatLogWidget } from './CombatLogWidget';
import { GmNotes } from './GmNotes';
import { TurnControls } from './TurnControls';
import type { Combatant, CombatLogEntry, CombatPhase } from './types';
import { useCombatEngine } from './useCombatEngine';

export interface InitiativeTrackerProps {
  monsters: MonsterData[];
  onOpenEncounterBuilder?: () => void;
  combatants?: Combatant[];
  onCombatantsChange?: React.Dispatch<React.SetStateAction<Combatant[]>>;
  sessionId?: string;
  initialCombatId?: string | null;
  initialRound?: number;
  initialTurnIndex?: number;
  initialPhase?: CombatPhase;
  onCombatEnd?: (updatedCharactersHp: { characterId: string; hp: number }[]) => void;
  combatLog?: CombatLogEntry[];
  onAddLog?: (entry: CombatLogEntry) => void;
  onClearLog?: () => void;
  showEmbeddedSidebar?: boolean;
  onPhaseChange?: (phase: CombatPhase) => void;
  isLoading?: boolean;
  onAddPartyToCombat?: () => void;
  partyCount?: number;
}

export function InitiativeTracker({
  monsters,
  onOpenEncounterBuilder,
  combatants: externalCombatants,
  onCombatantsChange,
  sessionId,
  initialCombatId = null,
  initialRound = 1,
  initialTurnIndex = 0,
  initialPhase = 'ACTIVE',
  onCombatEnd,
  combatLog: externalCombatLog,
  onAddLog,
  onClearLog,
  showEmbeddedSidebar = true,
  onPhaseChange,
  isLoading = false,
  onAddPartyToCombat,
  partyCount,
}: InitiativeTrackerProps) {
  const [gmNotes, setGmNotes] = useState(
    'Sesja #4: Zasadzka w ruinach zamku. Gobliny mają przewagę wysokości.'
  );

  const {
    combatants,
    combatPhase,
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
  } = useCombatEngine({
    sessionId,
    initialCombatId,
    initialRound,
    initialTurnIndex,
    initialPhase,
    externalCombatants,
    onCombatantsChange,
    onCombatEnd,
    externalCombatLog,
    onAddLog,
    onClearLog,
    onPhaseChange,
  });

  return (
    <div className="space-y-6">
      {/* Round & Phase Controls */}
      <TurnControls
        round={round}
        combatPhase={combatPhase}
        activeCombatantName={activeCombatant?.name}
        nextCombatantName={nextCombatant?.name}
        canStartCombat={combatants.length > 0}
        onNextTurn={handleNextTurn}
        onRollAllMonsterInitiative={handleRollAllMonsterInitiative}
        onStartCombat={handleStartCombat}
        onEndCombat={handleEndCombat}
        onResetCombat={handleResetCombat}
      />

      {/* Finished Summary Banner */}
      {combatPhase === 'FINISHED' && (
        <div className="glass-card rounded-2xl p-5 border border-emerald-500/30 bg-emerald-950/20 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Starcie Zakończone!</h4>
              <p className="text-xs text-slate-300">
                Walka trwała {round} {round === 1 ? 'rundę' : round < 5 ? 'rundy' : 'rund'}. Stan
                zdrowia bohaterów został zsynchronizowany.
              </p>
            </div>
          </div>
          <button
            type="button"
            data-testid="reset-combat-summary-btn"
            onClick={handleResetCombat}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Nowe Starcie</span>
          </button>
        </div>
      )}

      {showEmbeddedSidebar ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Combatant List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold text-slate-200">
                  Kolejność Inicjatywy ({isLoading ? '...' : combatants.length})
                </h3>
                <p className="text-xs text-slate-400 font-normal">
                  {combatPhase === 'PREPARING'
                    ? 'Faza przygotowania: Edytuj wartości inicjatywy lub wylosuj rzuty potworów'
                    : 'Aktywna walka: Kolejność zamrożona według inicjatywy (D20)'}
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

            {isLoading ? (
              <div data-testid="initiative-tracker-skeleton" className="space-y-3 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div
                    key={`init-skel-emb-${i}`}
                    className="glass-card rounded-2xl p-4 border border-slate-800 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800/80" />
                      <div className="space-y-2">
                        <div className="h-4 bg-slate-800 rounded w-32" />
                        <div className="h-3 bg-slate-800/60 rounded w-20" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-16 bg-slate-800/80 rounded-xl" />
                      <div className="h-8 w-16 bg-slate-800/80 rounded-xl" />
                    </div>
                  </div>
                ))}
              </div>
            ) : combatants.length === 0 ? (
              <div className="glass-card rounded-2xl p-8 text-center text-slate-400 space-y-3">
                <AlertCircle className="w-10 h-10 text-slate-600 mx-auto" />
                <p>Brak postaci w walce. Dodaj gracza lub potwora w panelu bocznym.</p>
                {partyCount && partyCount > 0 && onAddPartyToCombat && (
                  <div>
                    <button
                      type="button"
                      data-testid="tracker-add-party-btn"
                      onClick={onAddPartyToCombat}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs inline-flex items-center gap-1.5 transition cursor-pointer shadow-lg shadow-indigo-600/30"
                    >
                      <Swords className="w-3.5 h-3.5" />
                      <span>Załaduj Drużynę do Walki ({partyCount})</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {combatants.map((c, idx) => (
                  <CombatantCard
                    key={c.id}
                    combatant={c}
                    phase={combatPhase}
                    isActiveTurn={combatPhase === 'ACTIVE' && idx === currentTurnIndex}
                    onHpChange={(delta) => handleHpChange(c.id, delta)}
                    onToggleCondition={(condition) => handleToggleCondition(c.id, condition)}
                    onAddStatus={(statusName, durationTurns) =>
                      handleAddStatus(c.id, statusName, durationTurns)
                    }
                    onRemoveStatus={(statusId) => handleRemoveStatus(c.id, statusId)}
                    onInitiativeChange={(newInit) => handleInitiativeChange(c.id, newInit)}
                    onRemove={() => handleRemoveCombatant(c.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar: Add Combatants, Combat Log & Session Notes */}
          <div className="space-y-6">
            <AddCombatantsPanel
              monsters={monsters}
              onAddCombatant={handleAddCombatant}
              existingCombatantCountForType={(type) =>
                combatants.filter((c) => c.type === type).length
              }
            />
            <CombatLogWidget entries={activeCombatLog} onClear={handleClearCombatLog} />
            <GmNotes notes={gmNotes} onChangeNotes={setGmNotes} />
          </div>
        </div>
      ) : (
        /* Full width for 3-column cockpit center workspace */
        <div className="space-y-4 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold text-slate-200">
                Kolejność Inicjatywy ({isLoading ? '...' : combatants.length})
              </h3>
              <p className="text-xs text-slate-400 font-normal">
                {combatPhase === 'PREPARING'
                  ? 'Faza przygotowania: Edytuj wartości inicjatywy lub wylosuj rzuty potworów'
                  : 'Aktywna walka: Kolejność zamrożona według inicjatywy (D20)'}
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

          {isLoading ? (
            <div data-testid="initiative-tracker-skeleton" className="space-y-3 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div
                  key={`init-skel-center-${i}`}
                  className="glass-card rounded-2xl p-4 border border-slate-800 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800/80" />
                    <div className="space-y-2">
                      <div className="h-4 bg-slate-800 rounded w-32" />
                      <div className="h-3 bg-slate-800/60 rounded w-20" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-16 bg-slate-800/80 rounded-xl" />
                    <div className="h-8 w-16 bg-slate-800/80 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : combatants.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center text-slate-400 space-y-3">
              <AlertCircle className="w-10 h-10 text-slate-600 mx-auto" />
              <p>Brak postaci w walce. Dodaj gracza lub potwora w panelu bocznym.</p>
              {partyCount && partyCount > 0 && onAddPartyToCombat && (
                <div>
                  <button
                    type="button"
                    data-testid="tracker-add-party-btn"
                    onClick={onAddPartyToCombat}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs inline-flex items-center gap-1.5 transition cursor-pointer shadow-lg shadow-indigo-600/30"
                  >
                    <Swords className="w-3.5 h-3.5" />
                    <span>Załaduj Drużynę do Walki ({partyCount})</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {combatants.map((c, idx) => (
                <CombatantCard
                  key={c.id}
                  combatant={c}
                  phase={combatPhase}
                  isActiveTurn={combatPhase === 'ACTIVE' && idx === currentTurnIndex}
                  onHpChange={(delta) => handleHpChange(c.id, delta)}
                  onToggleCondition={(condition) => handleToggleCondition(c.id, condition)}
                  onAddStatus={(statusName, durationTurns) =>
                    handleAddStatus(c.id, statusName, durationTurns)
                  }
                  onRemoveStatus={(statusId) => handleRemoveStatus(c.id, statusId)}
                  onInitiativeChange={(newInit) => handleInitiativeChange(c.id, newInit)}
                  onRemove={() => handleRemoveCombatant(c.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
