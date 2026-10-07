'use client';

import { CheckCircle2, ChevronRight, Play, RotateCcw, Square, Swords } from 'lucide-react';
import type { CombatPhase } from './types';

interface TurnControlsProps {
  round: number;
  combatPhase?: CombatPhase;
  activeCombatantName?: string;
  nextCombatantName?: string;
  canStartCombat?: boolean;
  onNextTurn: () => void;
  onRollAllMonsterInitiative: () => void;
  onStartCombat?: () => void;
  onEndCombat?: () => void;
  onResetCombat?: () => void;
}

export function TurnControls({
  round,
  combatPhase = 'ACTIVE',
  activeCombatantName,
  nextCombatantName,
  canStartCombat = true,
  onNextTurn,
  onRollAllMonsterInitiative,
  onStartCombat,
  onEndCombat,
  onResetCombat,
}: TurnControlsProps) {
  return (
    <div className="glass-panel rounded-2xl p-5 border border-indigo-500/20 bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-indigo-950/40 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-xl">
      <div className="flex items-center gap-4">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
            combatPhase === 'ACTIVE'
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 animate-pulse'
              : combatPhase === 'PREPARING'
                ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400'
                : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
          }`}
        >
          {combatPhase === 'ACTIVE' ? (
            <Swords className="w-6 h-6" />
          ) : combatPhase === 'PREPARING' ? (
            <Play className="w-6 h-6" />
          ) : (
            <CheckCircle2 className="w-6 h-6" />
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${
                combatPhase === 'ACTIVE'
                  ? 'text-amber-400'
                  : combatPhase === 'PREPARING'
                    ? 'text-indigo-400'
                    : 'text-emerald-400'
              }`}
            >
              {combatPhase === 'ACTIVE'
                ? 'Aktywna Potyczka'
                : combatPhase === 'PREPARING'
                  ? 'Faza Przygotowania'
                  : 'Starcie Zakończone'}
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
              Runda {round}
            </span>
          </div>

          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Initiative Tracker GM</span>
          </h2>

          {/* Turn status indicator */}
          {combatPhase === 'ACTIVE' && activeCombatantName && (
            <p className="text-xs text-slate-300 mt-0.5">
              Teraz tura:{' '}
              <strong className="text-amber-400 font-semibold">{activeCombatantName}</strong>
              {nextCombatantName && (
                <span className="text-slate-400"> (Następny: {nextCombatantName})</span>
              )}
            </p>
          )}

          {combatPhase === 'PREPARING' && (
            <p className="text-xs text-slate-400 mt-0.5">
              Ustal inicjatywę graczy i potworów przed rozpoczęciem starcia.
            </p>
          )}

          {combatPhase === 'FINISHED' && (
            <p className="text-xs text-emerald-400/90 mt-0.5">
              Walka zakończona. Zdrowie bohaterów zostało zsynchronizowane z ich kartami.
            </p>
          )}
        </div>
      </div>

      {/* Control Buttons based on Combat Phase */}
      <div className="flex flex-wrap items-center gap-2.5 justify-end">
        {combatPhase === 'PREPARING' ? (
          <>
            <button
              type="button"
              onClick={onRollAllMonsterInitiative}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>Losuj Inicjatywę Potworów</span>
            </button>

            {onStartCombat && (
              <button
                type="button"
                data-testid="start-combat-btn"
                onClick={onStartCombat}
                disabled={!canStartCombat}
                title={
                  !canStartCombat
                    ? 'Dodaj co najmniej jednego uczestnika przed rozpoczęciem walki'
                    : 'Rozpocznij walkę'
                }
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-white font-bold text-xs shadow-lg transition transform ${
                  !canStartCombat
                    ? 'bg-slate-800/80 text-slate-500 border border-slate-700/60 opacity-60 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 shadow-indigo-500/30 active:scale-95 cursor-pointer'
                }`}
              >
                <Swords className="w-4 h-4" />
                <span>Rozpocznij Walkę</span>
              </button>
            )}
          </>
        ) : combatPhase === 'ACTIVE' ? (
          <>
            <button
              type="button"
              onClick={onRollAllMonsterInitiative}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>Losuj Inicjatywę Potworów</span>
            </button>

            <button
              type="button"
              data-testid="next-turn-btn"
              onClick={onNextTurn}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition transform active:scale-95 cursor-pointer"
            >
              <span>Następna Tura</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            {onEndCombat && (
              <button
                type="button"
                data-testid="end-combat-btn"
                onClick={onEndCombat}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-950/60 hover:bg-red-900/60 border border-red-800 text-red-300 text-xs font-semibold transition cursor-pointer"
                title="Zakończ walkę i zapisz stan postaci"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Zakończ Walkę</span>
              </button>
            )}
          </>
        ) : (
          /* FINISHED phase */
          onResetCombat && (
            <button
              type="button"
              data-testid="reset-combat-btn"
              onClick={onResetCombat}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Nowe Starcie</span>
            </button>
          )
        )}
      </div>
    </div>
  );
}
