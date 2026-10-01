'use client';

import React, { useState } from 'react';
import { Shield, Heart, Plus, Swords, Play, RotateCcw, AlertCircle, ChevronRight, User, Skull, Trash2, CheckCircle2, FileText } from 'lucide-react';
import { MonsterData } from '@/lib/monsters';

export interface Combatant {
  id: string;
  name: string;
  initiative: number;
  currentHp: number;
  maxHp: number;
  ac: number;
  isMonster: boolean;
  type?: string;
  conditions: string[];
}

interface InitiativeTrackerProps {
  monsters: MonsterData[];
}

const AVAILABLE_CONDITIONS = [
  'Poisoned',
  'Prone',
  'Stunned',
  'Blinded',
  'Paralyzed',
  'Charmed',
  'Frightened',
  'Grappled',
  'Invisible',
  'Restrained',
];

export function InitiativeTracker({ monsters }: InitiativeTrackerProps) {
  const [combatants, setCombatants] = useState<Combatant[]>([
    {
      id: 'pc-1',
      name: 'Valerius (Paladyn)',
      initiative: 18,
      currentHp: 28,
      maxHp: 28,
      ac: 18,
      isMonster: false,
      conditions: [],
    },
    {
      id: 'pc-2',
      name: 'Eldrin (Czarodziej)',
      initiative: 14,
      currentHp: 16,
      maxHp: 16,
      ac: 12,
      isMonster: false,
      conditions: [],
    },
    {
      id: 'm-1',
      name: 'Goblin Łucznik A',
      initiative: 12,
      currentHp: 7,
      maxHp: 7,
      ac: 15,
      isMonster: true,
      type: 'Goblin',
      conditions: [],
    },
    {
      id: 'm-2',
      name: 'Goblin Wojownik B',
      initiative: 9,
      currentHp: 7,
      maxHp: 7,
      ac: 15,
      isMonster: true,
      type: 'Goblin',
      conditions: [],
    },
  ]);

  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [round, setRound] = useState(1);
  const [selectedMonsterIndex, setSelectedMonsterIndex] = useState('');
  const [customName, setCustomName] = useState('');
  const [customHp, setCustomHp] = useState('10');
  const [customAc, setCustomAc] = useState('12');
  const [customInit, setCustomInit] = useState('10');
  const [isMonsterAdd, setIsMonsterAdd] = useState(false);
  const [gmNotes, setGmNotes] = useState('Sesja #4: Zasadzka w ruinach zamku. Gobliny mają przewagę wysokości.');

  const handleNextTurn = () => {
    if (combatants.length === 0) return;
    if (currentTurnIndex + 1 >= combatants.length) {
      setCurrentTurnIndex(0);
      setRound((r) => r + 1);
    } else {
      setCurrentTurnIndex((i) => i + 1);
    }
  };

  const handleRollAllMonsterInitiative = () => {
    setCombatants((prev) => {
      const updated = prev.map((c) => {
        if (c.isMonster) {
          const roll = Math.floor(Math.random() * 20) + 1;
          return { ...c, initiative: roll };
        }
        return c;
      });
      return updated.sort((a, b) => b.initiative - a.initiative);
    });
  };

  const handleHpChange = (id: string, delta: number) => {
    setCombatants((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const nextHp = Math.max(0, Math.min(c.maxHp, c.currentHp + delta));
          return { ...c, currentHp: nextHp };
        }
        return c;
      })
    );
  };

  const handleToggleCondition = (id: string, condition: string) => {
    setCombatants((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const exists = c.conditions.includes(condition);
          const nextConditions = exists
            ? c.conditions.filter((item) => item !== condition)
            : [...c.conditions, condition];
          return { ...c, conditions: nextConditions };
        }
        return c;
      })
    );
  };

  const handleRemoveCombatant = (id: string) => {
    setCombatants((prev) => prev.filter((c) => c.id !== id));
  };

  const handleAddFromBestiary = () => {
    if (!selectedMonsterIndex) return;
    const targetMonster = monsters.find((m) => m.index === selectedMonsterIndex);
    if (!targetMonster) return;

    const dexMod = Math.floor(((targetMonster.stats?.dex ?? 10) - 10) / 2);
    const initRoll = Math.floor(Math.random() * 20) + 1 + dexMod;

    const newCombatant: Combatant = {
      id: `m-${Date.now()}`,
      name: `${targetMonster.name} #${combatants.filter((c) => c.type === targetMonster.name).length + 1}`,
      initiative: initRoll,
      currentHp: targetMonster.hitPoints,
      maxHp: targetMonster.hitPoints,
      ac: targetMonster.armorClass,
      isMonster: true,
      type: targetMonster.name,
      conditions: [],
    };

    setCombatants((prev) => [...prev, newCombatant].sort((a, b) => b.initiative - a.initiative));
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName) return;

    const newCombatant: Combatant = {
      id: `${isMonsterAdd ? 'm' : 'pc'}-${Date.now()}`,
      name: customName,
      initiative: parseInt(customInit) || 10,
      currentHp: parseInt(customHp) || 10,
      maxHp: parseInt(customHp) || 10,
      ac: parseInt(customAc) || 10,
      isMonster: isMonsterAdd,
      conditions: [],
    };

    setCombatants((prev) => [...prev, newCombatant].sort((a, b) => b.initiative - a.initiative));
    setCustomName('');
  };

  return (
    <div className="space-y-6">
      {/* Round Banner */}
      <div className="glass-panel rounded-2xl p-5 border border-indigo-500/20 bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-indigo-950/40 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Swords className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Aktywna Potyczka</span>
              <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">Runda {round}</span>
            </div>
            <h2 className="text-xl font-bold text-white">Initiative Tracker GM</h2>
          </div>
        </div>

        {/* Quick controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleRollAllMonsterInitiative}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-medium transition"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>Losuj Inicjatywę Potworów</span>
          </button>

          <button
            onClick={handleNextTurn}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition transform active:scale-95"
          >
            <span>Następna Tura</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Combatant List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-slate-200 flex items-center justify-between">
            <span>Kolejność Inicjatywy ({combatants.length})</span>
            <span className="text-xs text-slate-400 font-normal">Posortowane według inicjatywy (D20)</span>
          </h3>

          {combatants.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center text-slate-400">
              <AlertCircle className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p>Brak postaci w walce. Dodaj gracza lub potwora poniżej.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {combatants.map((c, idx) => {
                const isActiveTurn = idx === currentTurnIndex;
                const isDead = c.currentHp <= 0;
                const hpPercent = Math.round((c.currentHp / c.maxHp) * 100);

                return (
                  <div
                    key={c.id}
                    className={`relative rounded-2xl p-4 transition-all duration-300 ${
                      isActiveTurn
                        ? 'bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-900 border-2 border-indigo-500 shadow-xl shadow-indigo-500/10'
                        : isDead
                        ? 'bg-slate-950/60 border border-red-900/40 opacity-60'
                        : 'glass-card hover:bg-slate-800/50'
                    }`}
                  >
                    {isActiveTurn && (
                      <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-3 h-8 bg-amber-500 rounded-r-md shadow-lg shadow-amber-500/50" />
                    )}

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      {/* Left: Initiative & Name */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center font-bold text-amber-400 text-lg font-mono">
                          {c.initiative}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            {c.isMonster ? (
                              <Skull className="w-4 h-4 text-red-400" />
                            ) : (
                              <User className="w-4 h-4 text-indigo-400" />
                            )}
                            <span className={`font-bold ${isDead ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                              {c.name}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                              AC {c.ac}
                            </span>
                          </div>

                          {/* Conditions badges */}
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            {c.conditions.map((cond) => (
                              <span
                                key={cond}
                                onClick={() => handleToggleCondition(c.id, cond)}
                                className="text-[10px] px-2 py-0.5 rounded-full bg-red-950/80 border border-red-700/60 text-red-300 font-medium cursor-pointer hover:bg-red-900"
                              >
                                {cond} ✕
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right: HP controls */}
                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between">
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-1.5 text-sm font-semibold">
                            <Heart className={`w-4 h-4 ${isDead ? 'text-slate-600' : 'text-red-500 fill-red-500'}`} />
                            <span className="text-slate-100">{c.currentHp}</span>
                            <span className="text-slate-500">/ {c.maxHp} HP</span>
                          </div>
                          <div className="w-24 h-1.5 bg-slate-950 rounded-full overflow-hidden mt-1 border border-slate-800">
                            <div
                              className={`h-full transition-all duration-300 ${
                                hpPercent > 50
                                  ? 'bg-emerald-500'
                                  : hpPercent > 20
                                  ? 'bg-amber-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${hpPercent}%` }}
                            />
                          </div>
                        </div>

                        {/* Quick HP Delta Buttons */}
                        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                          <button
                            onClick={() => handleHpChange(c.id, -5)}
                            className="px-2 py-1 text-xs font-mono rounded bg-slate-900 hover:bg-red-950 text-red-400 border border-slate-800 transition"
                            title="-5 HP"
                          >
                            -5
                          </button>
                          <button
                            onClick={() => handleHpChange(c.id, -1)}
                            className="px-2 py-1 text-xs font-mono rounded bg-slate-900 hover:bg-red-950 text-red-400 border border-slate-800 transition"
                            title="-1 HP"
                          >
                            -1
                          </button>
                          <button
                            onClick={() => handleHpChange(c.id, 1)}
                            className="px-2 py-1 text-xs font-mono rounded bg-slate-900 hover:bg-emerald-950 text-emerald-400 border border-slate-800 transition"
                            title="+1 HP"
                          >
                            +1
                          </button>
                          <button
                            onClick={() => handleHpChange(c.id, 5)}
                            className="px-2 py-1 text-xs font-mono rounded bg-slate-900 hover:bg-emerald-950 text-emerald-400 border border-slate-800 transition"
                            title="+5 HP"
                          >
                            +5
                          </button>
                        </div>

                        <button
                          onClick={() => handleRemoveCombatant(c.id)}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
                          title="Usuń z walki"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Quick Add Condition Menu */}
                    <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                      <span className="text-slate-500 font-medium text-[11px] whitespace-nowrap">+ Stan:</span>
                      {AVAILABLE_CONDITIONS.map((cond) => {
                        const isSelected = c.conditions.includes(cond);
                        return (
                          <button
                            key={cond}
                            onClick={() => handleToggleCondition(c.id, cond)}
                            className={`px-2 py-0.5 rounded text-[11px] transition whitespace-nowrap ${
                              isSelected
                                ? 'bg-red-900/60 text-red-300 border border-red-700'
                                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                            }`}
                          >
                            {cond}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar: Add Combatants & Session Notes */}
        <div className="space-y-6">
          {/* Quick Add from Bestiary */}
          <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
            <h4 className="font-bold text-slate-100 flex items-center gap-2">
              <Skull className="w-5 h-5 text-amber-500" />
              Dodaj z Bestiariusza (D&D 5e API)
            </h4>
            <div className="flex items-center gap-2">
              <select
                value={selectedMonsterIndex}
                onChange={(e) => setSelectedMonsterIndex(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="">-- Wybierz Potwora --</option>
                {monsters.map((m) => (
                  <option key={m.index} value={m.index}>
                    {m.name} (CR {m.challengeRating}, HP {m.hitPoints}, AC {m.armorClass})
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddFromBestiary}
                disabled={!selectedMonsterIndex}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-slate-950 font-bold text-sm transition whitespace-nowrap"
              >
                + Dodaj
              </button>
            </div>
          </div>

          {/* Quick Custom Combatant Form */}
          <form onSubmit={handleAddCustom} className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
            <h4 className="font-bold text-slate-100 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-400" />
              Dodaj Własną Postać / Przeciwnika
            </h4>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Nazwa Postaci</label>
                <input
                  type="text"
                  placeholder="np. Garrok Barbarzyńca"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Inicjatywa</label>
                  <input
                    type="number"
                    value={customInit}
                    onChange={(e) => setCustomInit(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Max HP</label>
                  <input
                    type="number"
                    value={customHp}
                    onChange={(e) => setCustomHp(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Klasa Pancerza</label>
                  <input
                    type="number"
                    value={customAc}
                    onChange={(e) => setCustomAc(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isMonsterAdd}
                    onChange={(e) => setIsMonsterAdd(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-800 text-indigo-600 focus:ring-0"
                  />
                  <span>Oznacz jako przeciwnik</span>
                </label>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition"
                >
                  Dodaj
                </button>
              </div>
            </div>
          </form>

          {/* GM Session Notes */}
          <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
            <h4 className="font-bold text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              Notatki Prowadzącego
            </h4>
            <textarea
              rows={4}
              value={gmNotes}
              onChange={(e) => setGmNotes(e.target.value)}
              placeholder="Zapisuj ważne wydarzenia, skarby i efekty sesji..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
