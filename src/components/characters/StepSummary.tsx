'use client';

import { Backpack, CheckCircle2, ChevronLeft, Loader2, Sparkles, Wand2 } from 'lucide-react';
import { calculateSpellSlots } from '@/lib/dnd-rules';

interface StepSummaryProps {
  charName: string;
  level: number;
  type?: 'HERO' | 'NPC';
  selectedRace: string;
  selectedClass: string;
  traits?: string;
  inventory?: string[];
  knownSpells?: string[];
  calculatedHp: number;
  calculatedAc: number;
  calculatedPassivePerception: number;
  isSaving?: boolean;
  onPrev: () => void;
  onFinish: () => void;
}

export function StepSummary({
  charName,
  level,
  type = 'HERO',
  selectedRace,
  selectedClass,
  traits = '',
  inventory = [],
  knownSpells = [],
  calculatedHp,
  calculatedAc,
  calculatedPassivePerception,
  isSaving = false,
  onPrev,
  onFinish,
}: StepSummaryProps) {
  const spellSlots = calculateSpellSlots(selectedClass, level);
  const hasSpells = Object.keys(spellSlots).length > 0;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <h4 className="font-bold text-emerald-400 text-sm uppercase tracking-wider">
        Krok 5: Podsumowanie Wygenerowanej Karty
      </h4>

      <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-bold text-slate-100">{charName}</h3>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  type === 'HERO'
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                }`}
              >
                {type === 'HERO' ? 'Bohater Gracza' : 'NPC'}
              </span>
            </div>
            <p className="text-sm text-amber-400 font-medium">
              Poziom {level} • {selectedRace} • {selectedClass}
            </p>
          </div>
          <div className="bg-emerald-950/80 border border-emerald-600 px-3 py-1.5 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto">
            <CheckCircle2 className="w-4 h-4" />
            Karta Gotowa
          </div>
        </div>

        {/* Combat Vitals Grid */}
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

        {/* Spell Slots Preview (if spellcaster) */}
        {hasSpells && (
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider">
              <Wand2 className="w-3.5 h-3.5" />
              <span>Dostępne Komórki Czarów (Kalkulacja D&D 5e)</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(spellSlots).map(([slotLvl, slotData]) => (
                <div
                  key={slotLvl}
                  className="px-2.5 py-1 rounded-lg bg-indigo-950/80 border border-indigo-700/50 text-xs font-mono text-indigo-200"
                >
                  <span className="text-slate-400 mr-1.5">Krąg {slotLvl}:</span>
                  <span className="font-bold text-indigo-300">{slotData.max} sloty</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Known Spells Preview */}
        {knownSpells.length > 0 && (
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Wybrane Zaklęcia i Cantripy ({knownSpells.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {knownSpells.map((s) => (
                <span
                  key={s}
                  className="px-2 py-0.5 rounded-lg bg-indigo-950/80 border border-indigo-700/50 text-xs font-mono text-indigo-200"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Equipment Preview */}
        {inventory.length > 0 && (
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wider">
              <Backpack className="w-3.5 h-3.5" />
              <span>Wyposażenie Początkowe ({inventory.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {inventory.map((item) => (
                <span
                  key={item}
                  className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Traits Preview */}
        {traits && (
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs text-slate-300">
            <span className="text-amber-400 font-bold block mb-0.5">
              Wskazówki dla Mistrza Gry (LARP):
            </span>
            <p>{traits}</p>
          </div>
        )}
      </div>

      <div className="flex justify-between pt-4 border-t border-slate-800">
        <button
          type="button"
          disabled={isSaving}
          onClick={onPrev}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 text-sm font-semibold transition cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Wstecz</span>
        </button>
        <button
          type="button"
          disabled={isSaving}
          onClick={onFinish}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:opacity-50 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/20 transition transform active:scale-95 cursor-pointer"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Zapisywanie w Bazie...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Zapisz Kartę Postaci</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
