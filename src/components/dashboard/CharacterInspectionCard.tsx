'use client';

import { ArrowLeft, Backpack, CheckCircle2, MessageSquare, Sparkles } from 'lucide-react';
import type { DashboardCharacter } from './types';

interface CharacterInspectionCardProps {
  character: DashboardCharacter;
  onBackToCombat: () => void;
}

function calculateModifier(score = 10): string {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export function CharacterInspectionCard({
  character,
  onBackToCombat,
}: CharacterInspectionCardProps) {
  const stats = character.stats || {
    str: 10,
    dex: 10,
    con: 10,
    int: 10,
    wis: 10,
    cha: 10,
  };

  const statEntries = [
    { label: 'Siła (STR)', val: stats.str ?? 10 },
    { label: 'Zręczność (DEX)', val: stats.dex ?? 10 },
    { label: 'Kondycja (CON)', val: stats.con ?? 10 },
    { label: 'Inteligencja (INT)', val: stats.int ?? 10 },
    { label: 'Mądrość (WIS)', val: stats.wis ?? 10 },
    { label: 'Charyzma (CHA)', val: stats.cha ?? 10 },
  ];

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-2xl space-y-6 animate-fadeIn">
      {/* Top action: Back button */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <button
          type="button"
          onClick={onBackToCombat}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 hover:text-white transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Powrót do Walki / Tracker Inicjatywy</span>
        </button>

        <span
          className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
            character.type === 'HERO'
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
          }`}
        >
          {character.type === 'HERO' ? 'Bohater Gracza' : 'NPC / Postać Niezależna'}
        </span>
      </div>

      {/* Header: Name and details */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold border shadow-lg ${
              character.type === 'HERO'
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-emerald-950/30'
                : 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-amber-950/30'
            }`}
          >
            {character.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-100">{character.name}</h2>
            <p className="text-xs sm:text-sm text-slate-400">
              {character.race || 'Nieokreślona rasa'} • {character.class || 'Klasa nieznana'}
              {character.level ? ` • Poziom ${character.level}` : ''}
            </p>
          </div>
        </div>

        {/* Combat Vitals Summary */}
        <div className="flex items-center gap-3">
          <div className="glass-card px-3.5 py-2 rounded-xl border border-slate-800 text-center min-w-[70px]">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">
              Punkty Życia
            </span>
            <span className="text-base font-bold font-mono text-emerald-400">
              {character.currentHp}/{character.maxHp}
            </span>
          </div>
          <div className="glass-card px-3.5 py-2 rounded-xl border border-slate-800 text-center min-w-[60px]">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Pancerz</span>
            <span className="text-base font-bold font-mono text-indigo-400">{character.ac} AC</span>
          </div>
          <div className="glass-card px-3.5 py-2 rounded-xl border border-slate-800 text-center min-w-[60px]">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Percepcja</span>
            <span className="text-base font-bold font-mono text-amber-400">
              {character.passivePerception} PP
            </span>
          </div>
        </div>
      </div>

      {/* Attributes Grid */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Atrybuty D&D 5e</span>
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {statEntries.map((st) => (
            <div
              key={st.label}
              className="glass-card p-2.5 rounded-xl border border-slate-800/80 text-center"
            >
              <span className="text-[10px] text-slate-400 font-medium block truncate">
                {st.label.split(' ')[0]}
              </span>
              <span className="text-base font-bold text-slate-100 font-mono">{st.val}</span>
              <span className="text-xs font-semibold text-indigo-400 font-mono block">
                {calculateModifier(st.val)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Roleplay & LARP Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* Personality & RP Hints */}
        <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Wskazówki dla Mistrza Gry (LARP)</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {character.traits && character.traits.length > 0
              ? character.traits.join('. ')
              : 'Brak zdefiniowanych cech osobowości. Odgrywaj zgodnie z tłem fabularnym kampanii.'}
          </p>
        </div>

        {/* Inventory / Equipment */}
        <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
            <Backpack className="w-3.5 h-3.5" />
            <span>Ekwipunek i Ważne Przedmioty</span>
          </div>
          {character.inventory && character.inventory.length > 0 ? (
            <ul className="text-xs text-slate-300 space-y-1">
              {character.inventory.map((item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-indigo-400 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400">Podstawowy zestaw podróżnika.</p>
          )}
        </div>
      </div>
    </div>
  );
}
