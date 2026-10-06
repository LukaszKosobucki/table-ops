'use client';

import { ChevronLeft, ChevronRight, Shield, User } from 'lucide-react';

interface StepIdentityProps {
  charName: string;
  onCharNameChange: (name: string) => void;
  level: number;
  onLevelChange: (level: number) => void;
  type?: 'HERO' | 'NPC';
  onTypeChange?: (type: 'HERO' | 'NPC') => void;
  traits?: string;
  onTraitsChange?: (traits: string) => void;
  onPrev: () => void;
  onNext: () => void;
}

export function StepIdentity({
  charName,
  onCharNameChange,
  level,
  onLevelChange,
  type = 'HERO',
  onTypeChange,
  traits = '',
  onTraitsChange,
  onPrev,
  onNext,
}: StepIdentityProps) {
  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <h4 className="font-bold text-amber-400 text-sm uppercase tracking-wider">
        Krok 3: Tożsamość i Poziom Postaci
      </h4>

      <div className="space-y-4 max-w-lg">
        {/* Character Type (HERO vs NPC) */}
        <div>
          <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Rola Postaci</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onTypeChange?.('HERO')}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                type === 'HERO'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Bohater Gracza (HERO)</span>
            </button>
            <button
              type="button"
              onClick={() => onTypeChange?.('NPC')}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                type === 'NPC'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Postać Niezależna (NPC)</span>
            </button>
          </div>
        </div>

        {/* Character Name */}
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

        {/* Level */}
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

        {/* LARP / Personality Hints */}
        <div>
          <label className="text-xs font-semibold text-slate-300 mb-1 block">
            Wskazówki dla Mistrza Gry / Cechy Charakteru (LARP)
          </label>
          <textarea
            rows={2}
            placeholder="np. Porywczy krasnoludzki weteran, zawsze dotrzymuje słowa, nie ufa magii."
            value={traits}
            onChange={(e) => onTraitsChange?.(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 resize-none"
          />
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={onPrev}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Wstecz</span>
        </button>
        <button
          type="button"
          disabled={!charName.trim()}
          onClick={onNext}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm transition cursor-pointer"
        >
          <span>Podsumowanie Karty</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
