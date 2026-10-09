'use client';

import { AlertCircle, AlertTriangle, Skull, Square, Swords, X } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import type { DiceGroup } from '@/lib/dice/types';
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
  onCombatEnd?: (
    updatedCharactersHp: { characterId: string; hp: number }[],
    summaryText?: string,
    metadata?: Record<string, unknown>
  ) => void;
  combatLog?: CombatLogEntry[];
  onAddLog?: (entry: CombatLogEntry) => void;
  onClearLog?: () => void;
  showEmbeddedSidebar?: boolean;
  onPhaseChange?: (phase: CombatPhase) => void;
  isLoading?: boolean;
  onAddPartyToCombat?: () => void;
  partyCount?: number;
  onRequestDiceRoll?: (
    dice: DiceGroup[],
    modifier: number,
    context?: {
      characterId?: string;
      combatantId?: string;
      actionName?: string;
      characterName?: string;
    }
  ) => void;
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
  onRequestDiceRoll,
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
    handleAddCustomAction,
    handleCombatantFlee,
    handleRollDeathSave,
    handleUpdateDeathSaves,
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

  const [showEndCombatWarning, setShowEndCombatWarning] = useState(false);

  const aliveMonsters = combatants.filter(
    (c) => c.isMonster && c.currentHp > 0 && !c.isFled && !c.conditions?.includes('Martwy')
  );

  const handleRequestEndCombat = () => {
    if (aliveMonsters.length > 0) {
      setShowEndCombatWarning(true);
    } else {
      handleEndCombat();
    }
  };

  const handleConfirmEndCombat = () => {
    setShowEndCombatWarning(false);
    handleEndCombat();
  };

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
        onEndCombat={handleRequestEndCombat}
        onResetCombat={handleResetCombat}
        isLoading={isLoading}
      />

      {/* Confirmation Modal when ending combat with alive monsters */}
      {showEndCombatWarning && (
        <div
          data-testid="end-combat-warning-modal"
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div className="glass-card bg-slate-900/95 border border-amber-500/40 rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-2xl shadow-amber-950/40">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    Ostrzeżenie: Żywi przeciwnicy w starciu!
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    W walce wciąż znajdują się aktywni przeciwnicy ({aliveMonsters.length})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEndCombatWarning(false)}
                className="text-slate-500 hover:text-slate-300 transition p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <p className="text-xs font-semibold text-amber-300">
                Następujący przeciwnicy mają jeszcze punkty życia:
              </p>
              <div className="flex flex-wrap gap-2 pt-1 max-h-36 overflow-y-auto">
                {aliveMonsters.map((m) => (
                  <span
                    key={m.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-950/50 border border-red-800/60 text-red-200 text-xs font-mono"
                  >
                    <Skull className="w-3.5 h-3.5 text-red-400" />
                    <span>{m.name}</span>
                    <span className="text-red-400 font-bold">
                      ({m.currentHp}/{m.maxHp} HP)
                    </span>
                  </span>
                ))}
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Przedwczesne zakończenie walki usunie żywych przeciwników z kolejki, a punkty
              doświadczenia (PD) nie zostaną za nich przyznane. Czy na pewno chcesz zakończyć
              starcie?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                data-testid="cancel-end-combat-btn"
                onClick={() => setShowEndCombatWarning(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition cursor-pointer"
              >
                Wróć do walki
              </button>
              <button
                type="button"
                data-testid="confirm-end-combat-btn"
                onClick={handleConfirmEndCombat}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-red-600/30"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Zakończ walkę mimo to</span>
              </button>
            </div>
          </div>
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
                  {isLoading
                    ? 'Ładowanie stanu potyczki...'
                    : combatPhase === 'PREPARING'
                      ? 'Faza przygotowania: Edytuj wartości inicjatywy lub wylosuj rzuty potworów'
                      : combatPhase === 'FINISHED'
                        ? 'Starcie zakończone: Wyniki i stan zdrowia bohaterów zostały zsynchronizowane.'
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
                    onFlee={() => handleCombatantFlee(c.id)}
                    onRollDeathSave={() => handleRollDeathSave(c.id)}
                    onUpdateDeathSaves={(saves) => handleUpdateDeathSaves(c.id, saves)}
                    onRequestDiceRoll={onRequestDiceRoll}
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
            <CombatLogWidget
              entries={activeCombatLog}
              onClear={handleClearCombatLog}
              activeCombatantName={activeCombatant?.name}
              onAddCustomAction={handleAddCustomAction}
            />
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
                {isLoading
                  ? 'Ładowanie stanu potyczki...'
                  : combatPhase === 'PREPARING'
                    ? 'Faza przygotowania: Edytuj wartości inicjatywy lub wylosuj rzuty potworów'
                    : combatPhase === 'FINISHED'
                      ? 'Starcie zakończone: Wyniki i stan zdrowia bohaterów zostały zsynchronizowane.'
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
                  onFlee={() => handleCombatantFlee(c.id)}
                  onRollDeathSave={() => handleRollDeathSave(c.id)}
                  onUpdateDeathSaves={(saves) => handleUpdateDeathSaves(c.id, saves)}
                  onRequestDiceRoll={onRequestDiceRoll}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
