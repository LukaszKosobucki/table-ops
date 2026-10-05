'use client';

import { DICE_TYPES } from './types';

interface DiceSelectorProps {
  onRollDice: (sides: number, diceName: string) => void;
  isRolling: boolean;
}

export function DiceSelector({ onRollDice, isRolling }: DiceSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {DICE_TYPES.map((dice) => (
        <button
          key={dice.name}
          onClick={() => onRollDice(dice.sides, dice.name)}
          disabled={isRolling}
          className="glass-card p-4 rounded-2xl border border-slate-800 hover:border-amber-500/50 transition-all text-left group hover:scale-[1.02] active:scale-95 disabled:opacity-50"
        >
          <div className="flex items-center justify-between mb-2">
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${dice.color} flex items-center justify-center font-black font-mono text-white text-lg shadow-lg`}
            >
              {dice.name}
            </div>
            <span className="text-xs font-mono font-bold text-slate-500 group-hover:text-amber-400 transition">
              d{dice.sides}
            </span>
          </div>
          <div className="font-bold text-sm text-slate-200 group-hover:text-amber-300 transition">
            Rzuć {dice.name}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">{dice.desc}</div>
        </button>
      ))}
    </div>
  );
}
