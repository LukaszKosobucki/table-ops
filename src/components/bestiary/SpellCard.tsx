'use client';

import { Clock, Compass, Sparkles, UserPlus, Wand2 } from 'lucide-react';
import type { CompendiumSpell } from '@/lib/compendium';

interface SpellCardProps {
  spell: CompendiumSpell;
  onSelect: () => void;
  onAssign?: () => void;
}

export function getSchoolColor(school: string): string {
  switch (school.toLowerCase()) {
    case 'evocation':
      return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    case 'abjuration':
      return 'text-sky-400 bg-sky-500/10 border-sky-500/30';
    case 'necromancy':
      return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
    case 'transmutation':
      return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    case 'enchantment':
      return 'text-pink-400 bg-pink-500/10 border-pink-500/30';
    case 'illusion':
      return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30';
    case 'conjuration':
      return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    case 'divination':
      return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
    default:
      return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
  }
}

export function SpellCard({ spell, onSelect, onAssign }: SpellCardProps) {
  const schoolBadge = getSchoolColor(spell.school);

  return (
    <div
      data-testid={`spell-card-${spell.index}`}
      className="glass-card rounded-2xl p-4 border border-slate-800/80 hover:border-slate-700/80 transition flex flex-col justify-between gap-3 shadow-lg group hover:shadow-indigo-500/5 bg-slate-900/40"
    >
      <div className="space-y-2">
        {/* Header: Name, Level, School */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Wand2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                {spell.name}
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                {spell.level === 0 ? 'Sztuczka (Cantrip)' : `Krąg ${spell.level}`} •{' '}
                <span className="capitalize">{spell.school}</span>
              </p>
            </div>
          </div>

          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border font-mono ${schoolBadge}`}
          >
            {spell.level === 0 ? '0' : `Lvl ${spell.level}`}
          </span>
        </div>

        {/* Tags: Concentration, Ritual, Classes */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {spell.concentration && (
            <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300">
              Koncentracja
            </span>
          )}
          {spell.ritual && (
            <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
              Rytuał
            </span>
          )}
          {spell.classes.slice(0, 3).map((cls) => (
            <span
              key={cls}
              className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-slate-800 text-slate-400"
            >
              {cls}
            </span>
          ))}
          {spell.classes.length > 3 && (
            <span className="text-[9px] text-slate-500">+{spell.classes.length - 3}</span>
          )}
        </div>

        {/* Quick Parameters */}
        <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-400 pt-1 font-mono">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-500 shrink-0" />
            <span className="truncate">{spell.castingTime}</span>
          </div>
          <div className="flex items-center gap-1">
            <Compass className="w-3 h-3 text-slate-500 shrink-0" />
            <span className="truncate">{spell.range}</span>
          </div>
        </div>

        {/* Description snippet */}
        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed pt-1">
          {spell.description}
        </p>
      </div>

      {/* Card Actions */}
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800/60 text-xs">
        <button
          type="button"
          onClick={onSelect}
          className="flex-1 py-1.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-center font-medium transition cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Szczegóły</span>
        </button>

        {onAssign && (
          <button
            type="button"
            data-testid={`assign-spell-btn-${spell.index}`}
            onClick={onAssign}
            className="py-1.5 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 font-medium transition cursor-pointer flex items-center gap-1"
            title="Dodaj to zaklęcie do wybranego bohatera"
          >
            <UserPlus className="w-3 h-3" />
            <span>+ Dodaj</span>
          </button>
        )}
      </div>
    </div>
  );
}
