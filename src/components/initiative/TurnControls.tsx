'use client';

import React from 'react';
import { Swords, RotateCcw, ChevronRight } from 'lucide-react';

interface TurnControlsProps {
  round: number;
  onNextTurn: () => void;
  onRollAllMonsterInitiative: () => void;
}

export function TurnControls({
  round,
  onNextTurn,
  onRollAllMonsterInitiative,
}: TurnControlsProps) {
  return (
    <div className="glass-panel rounded-2xl p-5 border border-indigo-500/20 bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-indigo-950/40 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
          <Swords className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Aktywna Potyczka</span>
            <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">Runda {round}</span>
          </div>
          <h2 className="text-xl font-bold text-white">Initiative Tracker GM</h2>
        </div>
      </div>

      {/* Quick controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={onRollAllMonsterInitiative}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-medium transition cursor-pointer"
        >
          <RotateCcw className="w-4 h-4 text-amber-400" />
          <span>Losuj Inicjatywę Potworów</span>
        </button>

        <button
          onClick={onNextTurn}
          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition transform active:scale-95 cursor-pointer"
        >
          <span>Następna Tura</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
