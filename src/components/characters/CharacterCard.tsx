'use client';

import { Eye } from 'lucide-react';
import type { Character } from './types';

interface CharacterCardProps {
  character: Character;
}

export function CharacterCard({ character }: CharacterCardProps) {
  const getMod = (val: number) => Math.floor((val - 10) / 2);

  return (
    <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold text-lg text-slate-100">{character.name}</h3>
          <p className="text-xs text-amber-400 font-semibold">
            Poziom {character.level} • {character.race} • {character.class}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
          <Eye className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-slate-300">
            Pasywna Percepcja:{' '}
            <span className="text-amber-400 font-mono">{character.passivePerception}</span>
          </span>
        </div>
      </div>

      {/* Core Sheet Badges */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
          <div className="text-[10px] text-slate-500 uppercase font-semibold">Klasa Pancerza</div>
          <div className="text-base font-bold text-slate-200 font-mono">{character.ac} AC</div>
        </div>

        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
          <div className="text-[10px] text-slate-500 uppercase font-semibold">Punkty Życia</div>
          <div className="text-base font-bold text-red-400 font-mono">
            {character.hp} / {character.maxHp} HP
          </div>
        </div>

        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
          <div className="text-[10px] text-slate-500 uppercase font-semibold">
            Modyfikator Biegłości
          </div>
          <div className="text-base font-bold text-indigo-400 font-mono">
            +{Math.ceil(character.level / 4) + 1}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-6 gap-1 bg-slate-950/80 p-2 rounded-xl border border-slate-800 text-center font-mono text-xs">
        {Object.entries(character.stats).map(([k, v]) => {
          const m = getMod(v);
          return (
            <div key={k}>
              <span className="text-[9px] text-slate-500 uppercase block">{k}</span>
              <span className="font-bold text-slate-200">{v}</span>
              <span className="text-[10px] text-amber-400 block">{m >= 0 ? `+${m}` : m}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
