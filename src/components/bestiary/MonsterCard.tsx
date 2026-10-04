'use client';

import React from 'react';
import { Shield, Heart, Copy } from 'lucide-react';
import { MonsterData } from '@/lib/monsters';

interface MonsterCardProps {
  monster: MonsterData;
  onSelect: () => void;
  onClone: () => void;
}

export function MonsterCard({ monster, onSelect, onClone }: MonsterCardProps) {
  return (
    <div
      onClick={onSelect}
      className="glass-card rounded-2xl p-5 border border-slate-800/80 hover:border-indigo-500/50 transition-all cursor-pointer flex flex-col justify-between group"
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h3 className="font-bold text-lg text-slate-100 group-hover:text-amber-400 transition">
              {monster.name}
            </h3>
            <p className="text-xs text-slate-400 capitalize">
              {monster.size} {monster.type} • {monster.alignment}
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 whitespace-nowrap">
            CR {monster.challengeRating}
          </span>
        </div>

        {/* Stats badges */}
        <div className="grid grid-cols-2 gap-2 my-4">
          <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/60 flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-400" />
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Klasa Pancerza</div>
              <div className="text-sm font-bold text-slate-200 font-mono">{monster.armorClass} AC</div>
            </div>
          </div>

          <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/60 flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-500 fill-red-500/20" />
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Punkty Życia</div>
              <div className="text-sm font-bold text-slate-200 font-mono">{monster.hitPoints} HP</div>
            </div>
          </div>
        </div>

        {/* Primary Stats preview */}
        {monster.stats && (
          <div className="grid grid-cols-6 gap-1 bg-slate-950/80 p-2 rounded-xl border border-slate-800 text-center font-mono text-xs">
            <div>
              <span className="text-[9px] text-slate-500 block">STR</span>
              <span className="font-bold text-slate-200">{monster.stats.str}</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-500 block">DEX</span>
              <span className="font-bold text-slate-200">{monster.stats.dex}</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-500 block">CON</span>
              <span className="font-bold text-slate-200">{monster.stats.con}</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-500 block">INT</span>
              <span className="font-bold text-slate-200">{monster.stats.int}</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-500 block">WIS</span>
              <span className="font-bold text-slate-200">{monster.stats.wis}</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-500 block">CHA</span>
              <span className="font-bold text-slate-200">{monster.stats.cha}</span>
            </div>
          </div>
        )}
      </div>

      {/* Actions footer */}
      <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
        <span className="text-indigo-400 group-hover:underline font-semibold flex items-center gap-1">
          Szczegóły karty →
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClone();
          }}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
        >
          <Copy className="w-3 h-3 text-amber-400" />
          <span>Klonuj Homebrew</span>
        </button>
      </div>
    </div>
  );
}
