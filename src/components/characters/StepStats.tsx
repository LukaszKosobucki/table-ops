'use client';

import { ChevronLeft, ChevronRight, Dices } from 'lucide-react';
import type { CharacterStats } from './types';

interface StepStatsProps {
  stats: CharacterStats;
  onStatsChange: (stats: CharacterStats) => void;
  onPrev: () => void;
  onNext: () => void;
}

export function StepStats({ stats, onStatsChange, onPrev, onNext }: StepStatsProps) {
  const getMod = (val: number) => Math.floor((val - 10) / 2);

  const handleRandomizeStats = () => {
    const roll4d6DropLowest = () => {
      const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
      rolls.sort((a, b) => a - b);
      return rolls[1] + rolls[2] + rolls[3];
    };

    onStatsChange({
      str: roll4d6DropLowest(),
      dex: roll4d6DropLowest(),
      con: roll4d6DropLowest(),
      int: roll4d6DropLowest(),
      wis: roll4d6DropLowest(),
      cha: roll4d6DropLowest(),
    });
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-amber-400 text-sm uppercase tracking-wider">
          Krok 2: Statystyki i Cechy Bazowe
        </h4>
        <button
          onClick={handleRandomizeStats}
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-semibold hover:bg-amber-500/30 transition"
        >
          <Dices className="w-4 h-4" />
          <span>Rzuć 4d6 (Drop Lowest)</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { key: 'str', label: 'Siła (STR)' },
          { key: 'dex', label: 'Zręczność (DEX)' },
          { key: 'con', label: 'Kondycja (CON)' },
          { key: 'int', label: 'Inteligencja (INT)' },
          { key: 'wis', label: 'Mądrość (WIS)' },
          { key: 'cha', label: 'Charyzma (CHA)' },
        ].map((item) => {
          const val = stats[item.key as keyof CharacterStats];
          const mod = getMod(val);
          return (
            <div
              key={item.key}
              className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center space-y-2"
            >
              <label className="text-xs font-bold text-slate-300 block">{item.label}</label>
              <input
                type="number"
                min={3}
                max={20}
                value={val}
                onChange={(e) =>
                  onStatsChange({ ...stats, [item.key]: parseInt(e.target.value, 10) || 10 })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 text-center font-mono font-bold text-lg text-slate-100 focus:outline-none focus:border-indigo-500"
              />
              <div className="text-xs font-mono font-bold text-amber-400">
                Modyfikator: {mod >= 0 ? `+${mod}` : mod}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={onPrev}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Wstecz</span>
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition"
        >
          <span>Dalej: Nazwa i Poziom</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
