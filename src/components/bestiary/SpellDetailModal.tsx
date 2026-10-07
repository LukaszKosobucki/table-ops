'use client';

import { Clock, Compass, Hourglass, Shield, Sparkles, UserPlus, Wand2, X } from 'lucide-react';
import type { CompendiumSpell } from '@/lib/compendium';
import { getSchoolColor } from './SpellCard';

interface SpellDetailModalProps {
  spell: CompendiumSpell | null;
  onClose: () => void;
  onAssign?: (spell: CompendiumSpell) => void;
}

export function SpellDetailModal({ spell, onClose, onAssign }: SpellDetailModalProps) {
  if (!spell) return null;

  const schoolBadge = getSchoolColor(spell.school);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="spell-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
    >
      <div className="glass-panel w-full max-w-lg rounded-2xl border border-slate-800 shadow-2xl p-6 space-y-5 bg-slate-950/95 text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h2 id="spell-modal-title" className="text-base font-bold text-slate-100">
                {spell.name}
              </h2>
              <div className="flex items-center gap-2 pt-0.5">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border font-mono ${schoolBadge}`}
                >
                  {spell.level === 0 ? 'Sztuczka (Cantrip)' : `Poziom ${spell.level}`}
                </span>
                <span className="text-xs text-slate-400 capitalize">{spell.school}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick parameters grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>Czas rzucania</span>
            </span>
            <span className="text-slate-200 font-semibold text-[11px] block">
              {spell.castingTime}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <Compass className="w-3 h-3 text-slate-500" />
              <span>Zasięg</span>
            </span>
            <span className="text-slate-200 font-semibold text-[11px] block">{spell.range}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <Hourglass className="w-3 h-3 text-slate-500" />
              <span>Czas trwania</span>
            </span>
            <span className="text-slate-200 font-semibold text-[11px] block truncate">
              {spell.duration}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <Shield className="w-3 h-3 text-slate-500" />
              <span>Komponenty</span>
            </span>
            <span className="text-slate-200 font-semibold text-[11px] block">
              {spell.components.join(', ')}
            </span>
          </div>
        </div>

        {/* Material components (if any) */}
        {spell.material && (
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
            <span className="text-slate-400 font-semibold">Komponenty materialne: </span>
            <span>{spell.material}</span>
          </div>
        )}

        {/* Description */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
            Opis Zaklęcia
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-slate-900/40 p-3 rounded-xl border border-slate-800/80">
            {spell.description}
          </p>
        </div>

        {/* Higher levels (if any) */}
        {spell.higherLevels && (
          <div className="space-y-1.5 p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-xs">
            <span className="font-bold text-indigo-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Rzucenie na wyższych kręgach</span>
            </span>
            <p className="text-slate-300 leading-relaxed text-[11px]">{spell.higherLevels}</p>
          </div>
        )}

        {/* Classes list */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] text-slate-400 font-mono block">Dostępne dla klas:</span>
          <div className="flex flex-wrap gap-1.5">
            {spell.classes.map((cls) => (
              <span
                key={cls}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-indigo-300 font-mono"
              >
                {cls}
              </span>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-slate-100 text-xs font-medium transition cursor-pointer"
          >
            Zamknij
          </button>

          {onAssign && (
            <button
              type="button"
              onClick={() => onAssign(spell)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Dodaj do Postaci</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
