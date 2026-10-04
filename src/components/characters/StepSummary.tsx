'use client';

import React from 'react';
import { CheckCircle2, ChevronLeft, Sparkles } from 'lucide-react';

interface StepSummaryProps {
  charName: string;
  level: number;
  selectedRace: string;
  selectedClass: string;
  calculatedHp: number;
  calculatedAc: number;
  calculatedPassivePerception: number;
  onPrev: () => void;
  onFinish: () => void;
}

export function StepSummary({
  charName,
  level,
  selectedRace,
  selectedClass,
  calculatedHp,
  calculatedAc,
  calculatedPassivePerception,
  onPrev,
  onFinish,
}: StepSummaryProps) {
  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <h4 className="font-bold text-emerald-400 text-sm uppercase tracking-wider">
        Krok 4: Podsumowanie Wygenerowanej Karty
      </h4>

      <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-slate-100">{charName}</h3>
            <p className="text-sm text-amber-400 font-medium">
              Poziom {level} • {selectedRace} • {selectedClass}
            </p>
          </div>
          <div className="bg-emerald-950/80 border border-emerald-600 px-3 py-1.5 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            Karta Gotowa
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
            <span className="text-xs text-slate-500 font-semibold block uppercase">
              Przeliczone HP
            </span>
            <span className="text-xl font-bold text-red-400 font-mono">{calculatedHp} HP</span>
          </div>
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
            <span className="text-xs text-slate-500 font-semibold block uppercase">
              Klasa Pancerza (AC)
            </span>
            <span className="text-xl font-bold text-indigo-400 font-mono">{calculatedAc} AC</span>
          </div>
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
            <span className="text-xs text-slate-500 font-semibold block uppercase">
              Pasywna Percepcja
            </span>
            <span className="text-xl font-bold text-amber-400 font-mono">
              {calculatedPassivePerception}
            </span>
          </div>
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
          onClick={onFinish}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/20 transition transform active:scale-95"
        >
          <Sparkles className="w-5 h-5" />
          <span>Zapisz Kartę Postaci</span>
        </button>
      </div>
    </div>
  );
}
