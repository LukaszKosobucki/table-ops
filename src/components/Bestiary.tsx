'use client';

import React, { useState, useCallback } from 'react';
import { Search, Filter, Shield, Heart, Copy, Sparkles, X, Swords } from 'lucide-react';
import { MonsterData } from '@/lib/monsters';

interface BestiaryProps {
  initialMonsters: MonsterData[];
}

export function Bestiary({ initialMonsters }: BestiaryProps) {
  const [monsters, setMonsters] = useState<MonsterData[]>(initialMonsters);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCr, setSelectedCr] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [activeMonster, setActiveMonster] = useState<MonsterData | null>(null);

  // Homebrew editing state
  const [homebrewModalOpen, setHomebrewModalOpen] = useState(false);
  const [editingMonster, setEditingMonster] = useState<Partial<MonsterData>>({});

  const filteredMonsters = monsters.filter((m) => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCr = selectedCr === 'ALL' || m.challengeRating.toString() === selectedCr;
    const matchesType = selectedType === 'ALL' || (m.type && m.type.toLowerCase().includes(selectedType.toLowerCase()));
    return matchesSearch && matchesCr && matchesType;
  });

  const handleCloneMonster = useCallback((m: MonsterData) => {
    setEditingMonster({
      index: `${m.index}-homebrew-${Date.now()}`,
      name: `${m.name} (Custom)`,
      size: m.size,
      type: m.type,
      alignment: m.alignment,
      armorClass: m.armorClass + 1,
      hitPoints: Math.round(m.hitPoints * 1.2),
      hitDice: m.hitDice,
      challengeRating: m.challengeRating,
      xp: m.xp,
      stats: m.stats ? { ...m.stats } : { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      actions: m.actions ? [...m.actions] : [],
      specialAbilities: m.specialAbilities ? [...m.specialAbilities] : [],
    });
    setHomebrewModalOpen(true);
  }, []);

  const handleSaveHomebrew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMonster.name) return;

    const newMonster: MonsterData = {
      index: editingMonster.index || `custom-${Date.now()}`,
      name: editingMonster.name,
      size: editingMonster.size || 'Medium',
      type: editingMonster.type || 'humanoid',
      alignment: editingMonster.alignment || 'neutral',
      armorClass: Number(editingMonster.armorClass) || 10,
      hitPoints: Number(editingMonster.hitPoints) || 10,
      hitDice: editingMonster.hitDice || '2d8',
      challengeRating: Number(editingMonster.challengeRating) || 1,
      xp: Number(editingMonster.xp) || 200,
      stats: editingMonster.stats || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      actions: editingMonster.actions || [],
      specialAbilities: editingMonster.specialAbilities || [],
    };

    setMonsters((prev) => [newMonster, ...prev]);
    setHomebrewModalOpen(false);
    setActiveMonster(newMonster);
  };

  const calculateModifier = (score: number = 10) => {
    const mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Kompendium Bestiariusza (D&D 5e SRD)
            </h2>
            <p className="text-xs text-slate-400">Przeglądaj statystyki potworów lub klonuj i twórz wersje Homebrew dla swojej kampanii.</p>
          </div>

          {/* Search box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Szukaj potwora..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/60">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-slate-400 font-medium">Filtruj po CR:</span>
            <select
              value={selectedCr}
              onChange={(e) => setSelectedCr(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
            >
              <option value="ALL">Wszystkie CR</option>
              <option value="0.25">CR 1/4</option>
              <option value="0.5">CR 1/2</option>
              <option value="1">CR 1</option>
              <option value="2">CR 2</option>
              <option value="3">CR 3</option>
              <option value="5">CR 5</option>
              <option value="10">CR 10</option>
              <option value="17">CR 17</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Typ:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
            >
              <option value="ALL">Wszystkie typy</option>
              <option value="humanoid">Humanoid</option>
              <option value="undead">Undead (Ożywieniec)</option>
              <option value="monstrosity">Monstrosity</option>
              <option value="dragon">Dragon (Smok)</option>
              <option value="fiend">Fiend</option>
              <option value="aberration">Aberration</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Monsters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredMonsters.map((m) => (
          <div
            key={m.index}
            className="glass-card rounded-2xl p-5 border border-slate-800/80 hover:border-indigo-500/50 transition-all cursor-pointer flex flex-col justify-between group"
            onClick={() => setActiveMonster(m)}
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="font-bold text-lg text-slate-100 group-hover:text-amber-400 transition">
                    {m.name}
                  </h3>
                  <p className="text-xs text-slate-400 capitalize">
                    {m.size} {m.type} • {m.alignment}
                  </p>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 whitespace-nowrap">
                  CR {m.challengeRating}
                </span>
              </div>

              {/* Stats badges */}
              <div className="grid grid-cols-2 gap-2 my-4">
                <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/60 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Klasa Pancerza</div>
                    <div className="text-sm font-bold text-slate-200 font-mono">{m.armorClass} AC</div>
                  </div>
                </div>

                <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/60 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-500 fill-red-500/20" />
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Punkty Życia</div>
                    <div className="text-sm font-bold text-slate-200 font-mono">{m.hitPoints} HP</div>
                  </div>
                </div>
              </div>

              {/* Primary Stats preview */}
              {m.stats && (
                <div className="grid grid-cols-6 gap-1 bg-slate-950/80 p-2 rounded-xl border border-slate-800 text-center font-mono text-xs">
                  <div>
                    <span className="text-[9px] text-slate-500 block">STR</span>
                    <span className="font-bold text-slate-200">{m.stats.str}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block">DEX</span>
                    <span className="font-bold text-slate-200">{m.stats.dex}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block">CON</span>
                    <span className="font-bold text-slate-200">{m.stats.con}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block">INT</span>
                    <span className="font-bold text-slate-200">{m.stats.int}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block">WIS</span>
                    <span className="font-bold text-slate-200">{m.stats.wis}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block">CHA</span>
                    <span className="font-bold text-slate-200">{m.stats.cha}</span>
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
                  handleCloneMonster(m);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                <Copy className="w-3 h-3 text-amber-400" />
                <span>Klonuj Homebrew</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {activeMonster && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 p-6 space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setActiveMonster(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-4">
              <div>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  CR {activeMonster.challengeRating} (XP {activeMonster.xp})
                </span>
                <h3 className="text-2xl font-bold text-slate-100 mt-1">{activeMonster.name}</h3>
                <p className="text-sm text-slate-400 capitalize">
                  {activeMonster.size} {activeMonster.type}, {activeMonster.alignment}
                </p>
              </div>
            </div>

            {/* Core combat values */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
                <span className="text-xs text-slate-500 font-semibold block uppercase">Klasa Pancerza</span>
                <span className="text-lg font-bold text-amber-400 font-mono">{activeMonster.armorClass} AC</span>
              </div>
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
                <span className="text-xs text-slate-500 font-semibold block uppercase">Punkty Życia</span>
                <span className="text-lg font-bold text-red-400 font-mono">
                  {activeMonster.hitPoints} <span className="text-xs font-normal text-slate-500">({activeMonster.hitDice})</span>
                </span>
              </div>
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
                <span className="text-xs text-slate-500 font-semibold block uppercase">Szybkość</span>
                <span className="text-lg font-bold text-indigo-400 font-mono">30 ft.</span>
              </div>
            </div>

            {/* Ability Scores Table */}
            {activeMonster.stats && (
              <div className="grid grid-cols-6 gap-2 bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
                {[
                  { name: 'STR', score: activeMonster.stats.str },
                  { name: 'DEX', score: activeMonster.stats.dex },
                  { name: 'CON', score: activeMonster.stats.con },
                  { name: 'INT', score: activeMonster.stats.int },
                  { name: 'WIS', score: activeMonster.stats.wis },
                  { name: 'CHA', score: activeMonster.stats.cha },
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
            {activeMonster.actions && activeMonster.actions.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-1">
                  <Swords className="w-4 h-4 text-amber-400" />
                  Akcje w Walce (Actions)
                </h4>
                <div className="space-y-2">
                  {activeMonster.actions.map((act, i) => (
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
                onClick={() => handleCloneMonster(activeMonster)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-sm transition"
              >
                <Copy className="w-4 h-4" />
                <span>Klonuj i Edytuj jako Homebrew</span>
              </button>

              <button
                onClick={() => setActiveMonster(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Homebrew Edit Modal */}
      {homebrewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveHomebrew}
            className="glass-panel w-full max-w-lg rounded-2xl border border-amber-500/30 p-6 space-y-4 shadow-2xl"
          >
            <h3 className="text-xl font-bold text-amber-400 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Tworzenie Nowego Potwora (Homebrew)
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Nazwa Potwora</label>
                <input
                  type="text"
                  required
                  value={editingMonster.name || ''}
                  onChange={(e) => setEditingMonster({ ...editingMonster, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Klasa Pancerza (AC)</label>
                  <input
                    type="number"
                    value={editingMonster.armorClass || 10}
                    onChange={(e) => setEditingMonster({ ...editingMonster, armorClass: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Max HP</label>
                  <input
                    type="number"
                    value={editingMonster.hitPoints || 10}
                    onChange={(e) => setEditingMonster({ ...editingMonster, hitPoints: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Challenge Rating (CR)</label>
                  <input
                    type="number"
                    step="0.125"
                    value={editingMonster.challengeRating || 1}
                    onChange={(e) => setEditingMonster({ ...editingMonster, challengeRating: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Typ (e.g. humanoid, dragon)</label>
                  <input
                    type="text"
                    value={editingMonster.type || 'humanoid'}
                    onChange={(e) => setEditingMonster({ ...editingMonster, type: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setHomebrewModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
              >
                Anuluj
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition"
              >
                Zapisz do Bestiariusza
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
