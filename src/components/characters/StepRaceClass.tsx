'use client';

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { RACES, CLASSES } from './types';

interface StepRaceClassProps {
  selectedRace: string;
  onSelectRace: (race: string) => void;
  selectedClass: string;
  onSelectClass: (cls: string) => void;
  onNext: () => void;
}

export function StepRaceClass({
  selectedRace,
  onSelectRace,
  selectedClass,
  onSelectClass,
  onNext,
}: StepRaceClassProps) {
  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <h4 className="font-bold text-amber-400 text-sm uppercase tracking-wider">
        Krok 1: Wybierz Rasę i Klasę Postaci
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Race selection */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-300 block">Wybór Rasy</label>
          <div className="space-y-2">
            {RACES.map((r) => (
              <div
                key={r.name}
                onClick={() => onSelectRace(r.name)}
                className={`p-3 rounded-xl border cursor-pointer transition ${
                  selectedRace === r.name
                    ? 'bg-indigo-950/60 border-indigo-500 text-slate-100'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="font-bold text-sm">{r.name}</div>
                <div className="text-xs text-amber-400">{r.bonus}</div>
                <div className="text-xs text-slate-400 mt-1">{r.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Class selection */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-300 block">Wybór Klasy</label>
          <div className="space-y-2">
            {CLASSES.map((c) => (
              <div
                key={c.name}
                onClick={() => onSelectClass(c.name)}
                className={`p-3 rounded-xl border cursor-pointer transition ${
                  selectedClass === c.name
                    ? 'bg-indigo-950/60 border-indigo-500 text-slate-100'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm">{c.name}</div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300">
                    d{c.hitDie} HP
                  </span>
                </div>
                <div className="text-xs text-indigo-300">Główny atrybut: {c.primary}</div>
                <div className="text-xs text-slate-400 mt-1">{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-800">
        <button
          onClick={onNext}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition"
        >
          <span>Dalej: Przypisanie Atrybutów</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
