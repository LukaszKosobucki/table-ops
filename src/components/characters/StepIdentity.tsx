'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface StepIdentityProps {
  charName: string;
  onCharNameChange: (name: string) => void;
  level: number;
  onLevelChange: (level: number) => void;
  onPrev: () => void;
  onNext: () => void;
}

export function StepIdentity({
  charName,
  onCharNameChange,
  level,
  onLevelChange,
  onPrev,
  onNext,
}: StepIdentityProps) {
  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <h4 className="font-bold text-amber-400 text-sm uppercase tracking-wider">
        Krok 3: Tożsamość i Poziom Postaci
      </h4>

      <div className="space-y-4 max-w-md">
        <div>
          <label className="text-xs font-semibold text-slate-300 mb-1 block">
            Imię i Tytuł Postaci
          </label>
          <input
            type="text"
            placeholder="np. Thorin Dębowa Tarcza"
            value={charName}
            onChange={(e) => onCharNameChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 mb-1 block">
            Poziom Postaci (1 - 20)
          </label>
          <input
            type="number"
            min={1}
            max={20}
            value={level}
            onChange={(e) => onLevelChange(parseInt(e.target.value, 10) || 1)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>
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
          disabled={!charName}
          onClick={onNext}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm transition"
        >
          <span>Podsumowanie Karty</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
