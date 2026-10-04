'use client';

import React from 'react';
import { X, Copy, Swords } from 'lucide-react';
import { MonsterData } from '@/lib/monsters';

interface MonsterStatblockModalProps {
  monster: MonsterData | null;
  onClose: () => void;
  onClone: (monster: MonsterData) => void;
}

export function MonsterStatblockModal({
  monster,
  onClose,
  onClone,
}: MonsterStatblockModalProps) {
  if (!monster) return null;

  const calculateModifier = (score: number = 10) => {
    const mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 p-6 space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
              CR {monster.challengeRating} (XP {monster.xp})
            </span>
            <h3 className="text-2xl font-bold text-slate-100 mt-1">{monster.name}</h3>
            <p className="text-sm text-slate-400 capitalize">
              {monster.size} {monster.type}, {monster.alignment}
            </p>
          </div>
        </div>

        {/* Core combat values */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
            <span className="text-xs text-slate-500 font-semibold block uppercase">Klasa Pancerza</span>
            <span className="text-lg font-bold text-amber-400 font-mono">{monster.armorClass} AC</span>
          </div>
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
            <span className="text-xs text-slate-500 font-semibold block uppercase">Punkty Życia</span>
            <span className="text-lg font-bold text-red-400 font-mono">
              {monster.hitPoints} <span className="text-xs font-normal text-slate-500">({monster.hitDice})</span>
            </span>
          </div>
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
            <span className="text-xs text-slate-500 font-semibold block uppercase">Szybkość</span>
            <span className="text-lg font-bold text-indigo-400 font-mono">30 ft.</span>
          </div>
        </div>

        {/* Ability Scores Table */}
        {monster.stats && (
          <div className="grid grid-cols-6 gap-2 bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
            {[
              { name: 'STR', score: monster.stats.str },
              { name: 'DEX', score: monster.stats.dex },
              { name: 'CON', score: monster.stats.con },
              { name: 'INT', score: monster.stats.int },
              { name: 'WIS', score: monster.stats.wis },
              { name: 'CHA', score: monster.stats.cha },
            ].map((stat) => (
              <div key={stat.name}>
                <div className="text-xs text-slate-500 font-bold">{stat.name}</div>
                <div className="text-sm font-bold text-slate-200 font-mono">{stat.score}</div>
                <div className="text-xs text-amber-400 font-mono">{calculateModifier(stat.score)}</div>
              </div>
            ))}
          </div>
        )}

        {/* Actions list */}
        {monster.actions && monster.actions.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-1">
              <Swords className="w-4 h-4 text-amber-400" />
              Akcje w Walce (Actions)
            </h4>
            <div className="space-y-2">
              {monster.actions.map((act, i) => (
                <div key={i} className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                  <span className="font-bold text-amber-300 text-sm">{act.name}. </span>
                  <span className="text-slate-300 text-sm leading-relaxed">{act.desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-3 flex items-center justify-between border-t border-slate-800">
          <button
            onClick={() => onClone(monster)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-sm transition"
          >
            <Copy className="w-4 h-4" />
            <span>Klonuj i Edytuj jako Homebrew</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
}
