'use client';

import { Sparkles } from 'lucide-react';
import type { RollLog } from './types';

interface ActiveRollDisplayProps {
  isRolling: boolean;
  activeRollResult: number | null;
  lastLog?: RollLog;
}

export function ActiveRollDisplay({
  isRolling,
  activeRollResult,
  lastLog,
}: ActiveRollDisplayProps) {
  return (
    <div className="glass-card rounded-2xl p-8 border border-indigo-500/30 text-center relative overflow-hidden bg-gradient-to-b from-indigo-950/40 via-slate-900 to-slate-950">
      <div className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
        Wynik Ostatniego Rzutu
      </div>

      <div
        className={`text-6xl sm:text-7xl font-mono font-black my-4 transition-all duration-200 ${
          isRolling
            ? 'scale-110 blur-[1px] text-amber-300'
            : activeRollResult === 20
              ? 'text-amber-400 drop-shadow-[0_0_25px_rgba(251,191,36,0.8)] animate-bounce'
              : 'text-slate-100'
        }`}
      >
        {activeRollResult !== null ? activeRollResult : '--'}
      </div>

      {lastLog?.isCrit && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 text-xs font-bold uppercase tracking-wider animate-pulse">
          <Sparkles className="w-4 h-4" /> NATURAL 20 CRITICAL HIT!
        </div>
      )}

      {lastLog?.isFumble && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950 border border-red-600 text-red-300 text-xs font-bold uppercase tracking-wider">
          NATURAL 1 CRITICAL FUMBLE!
        </div>
      )}
    </div>
  );
}
