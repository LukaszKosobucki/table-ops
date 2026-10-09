'use client';

import { ChevronRight, Eye } from 'lucide-react';
import type { Character } from './types';

interface CharacterCardProps {
  character: Character;
  onClick?: () => void;
}

const CORE_STATS: Array<{ key: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'; label: string }> = [
  { key: 'str', label: 'STR' },
  { key: 'dex', label: 'DEX' },
  { key: 'con', label: 'CON' },
  { key: 'int', label: 'INT' },
  { key: 'wis', label: 'WIS' },
  { key: 'cha', label: 'CHA' },
];

export function CharacterCard({ character, onClick }: CharacterCardProps) {
  const getMod = (val = 10) => Math.floor((val - 10) / 2);
  const isNpc = character.type === 'NPC';
  const profBonus = Math.ceil((character.level || 1) / 4) + 1;
  const tempHp = character.stats?.tempHp ?? 0;

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      data-testid={`character-card-${character.id}`}
      className={`glass-card rounded-2xl p-5 border transition-all duration-200 space-y-4 text-left select-none ${
        onClick ? 'cursor-pointer hover:scale-[1.01]' : ''
      } ${
        isNpc
          ? 'bg-gradient-to-br from-slate-900/90 to-amber-950/20 border-amber-500/30 hover:border-amber-500/60 shadow-lg shadow-amber-950/20'
          : 'bg-gradient-to-br from-slate-900/90 to-indigo-950/20 border-slate-800 hover:border-indigo-500/60 shadow-lg shadow-indigo-950/20'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {character.avatarUrl ? (
            <img
              src={character.avatarUrl}
              alt={character.name}
              className={`w-12 h-12 rounded-xl object-cover shrink-0 border ${
                isNpc ? 'border-amber-500/40' : 'border-indigo-500/40'
              }`}
            />
          ) : (
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 border shadow-md ${
                isNpc
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                  : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              }`}
            >
              {character.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-base sm:text-lg text-slate-100 truncate">
                {character.name}
              </h3>
              {isNpc ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/15 border border-amber-500/40 text-amber-300 shrink-0">
                  NPC / Sojusznik
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 shrink-0">
                  Bohater Gracza
                </span>
              )}
            </div>
            <p className="text-xs text-amber-400 font-semibold truncate">
              Poziom {character.level} • {character.race} • {character.class}
            </p>
          </div>
        </div>

        {/* Passive Perception */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1.5 rounded-xl border border-slate-800 shrink-0">
          <Eye className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-[11px] font-semibold text-slate-300">
            PP:{' '}
            <span className="text-amber-400 font-mono font-bold">
              {character.passivePerception}
            </span>
          </span>
        </div>
      </div>

      {/* Core Sheet Badges */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-center">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Klasa Pancerza</div>
          <div className="text-base font-bold text-slate-100 font-mono">{character.ac} AC</div>
        </div>

        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-center">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Punkty Życia</div>
          <div className="text-base font-bold text-emerald-400 font-mono">
            {character.hp} / {character.maxHp} HP
          </div>
          {tempHp > 0 && (
            <div className="text-[10px] font-mono text-indigo-300">+{tempHp} temp</div>
          )}
        </div>

        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-center">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Biegłość (PB)</div>
          <div className="text-base font-bold text-indigo-400 font-mono">+{profBonus}</div>
        </div>
      </div>

      {/* Stats Bar (Strictly 6 ability scores, no awkward wrapping) */}
      <div className="grid grid-cols-6 gap-1 bg-slate-950/90 p-2 rounded-xl border border-slate-800 text-center font-mono">
        {CORE_STATS.map(({ key, label }) => {
          const val = character.stats?.[key] ?? 10;
          const mod = getMod(val);
          return (
            <div key={key} className="py-0.5">
              <span className="text-[9px] text-slate-400 uppercase block font-semibold">
                {label}
              </span>
              <span className="font-bold text-xs text-slate-100">{val}</span>
              <span
                className={`text-[10px] block font-bold ${mod >= 0 ? 'text-amber-400' : 'text-rose-400'}`}
              >
                {mod >= 0 ? `+${mod}` : mod}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer / Clickable Prompt */}
      {onClick && (
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 group-hover:text-indigo-300 transition">
          <span className="font-medium text-[11px]">Szczegóły, ekwipunek i czary</span>
          <div className="flex items-center gap-1 font-semibold text-[11px] text-indigo-400 group-hover:text-indigo-300">
            <span>Otwórz kartę</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      )}
    </div>
  );
}
