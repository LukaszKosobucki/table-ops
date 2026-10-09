'use client';

import { Plus, Skull } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { initCombatantTurnResources } from '@/lib/combat-actions';
import type { MonsterData } from '@/lib/monsters';
import { extractMonsterDefenses } from '@/lib/skills-and-traits';
import type { Combatant } from './types';

interface AddCombatantsPanelProps {
  monsters: MonsterData[];
  onAddCombatant: (c: Combatant) => void;
  existingCombatantCountForType: (type: string) => number;
}

export function AddCombatantsPanel({
  monsters,
  onAddCombatant,
  existingCombatantCountForType,
}: AddCombatantsPanelProps) {
  const [selectedMonsterIndex, setSelectedMonsterIndex] = useState('');
  const [customName, setCustomName] = useState('');
  const [customHp, setCustomHp] = useState('10');
  const [customAc, setCustomAc] = useState('12');
  const [customInit, setCustomInit] = useState('10');
  const [isMonsterAdd, setIsMonsterAdd] = useState(false);

  const handleAddFromBestiary = () => {
    if (!selectedMonsterIndex) return;
    const targetMonster = monsters.find((m) => m.index === selectedMonsterIndex);
    if (!targetMonster) return;

    const dexMod = Math.floor(((targetMonster.stats?.dex ?? 10) - 10) / 2);
    const initRoll = Math.floor(Math.random() * 20) + 1 + dexMod;
    const defenses = extractMonsterDefenses(targetMonster);

    const newCombatant: Combatant = {
      id: `m-${Date.now()}`,
      name: `${targetMonster.name} #${existingCombatantCountForType(targetMonster.name) + 1}`,
      initiative: initRoll,
      currentHp: targetMonster.hitPoints,
      maxHp: targetMonster.hitPoints,
      ac: targetMonster.armorClass,
      isMonster: true,
      type: targetMonster.name,
      xp:
        targetMonster.xp ||
        (targetMonster.challengeRating ? Math.round(targetMonster.challengeRating * 200) : 100),
      conditions: [],
      rawActions: targetMonster.actions,
      turnResources: initCombatantTurnResources({ actions: targetMonster.actions }),
      defenses,
      resistances: defenses.resistances,
      damageImmunities: defenses.damageImmunities,
      conditionImmunities: defenses.conditionImmunities,
      senses: defenses.senses,
    };

    onAddCombatant(newCombatant);
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName) return;

    const newCombatant: Combatant = {
      id: `${isMonsterAdd ? 'm' : 'pc'}-${Date.now()}`,
      name: customName,
      initiative: parseInt(customInit, 10) || 10,
      currentHp: parseInt(customHp, 10) || 10,
      maxHp: parseInt(customHp, 10) || 10,
      ac: parseInt(customAc, 10) || 10,
      isMonster: isMonsterAdd,
      xp: isMonsterAdd ? 100 : undefined,
      conditions: [],
    };

    onAddCombatant(newCombatant);
    setCustomName('');
  };

  return (
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
            type="button"
            onClick={handleAddFromBestiary}
            disabled={!selectedMonsterIndex}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-slate-950 font-bold text-sm transition whitespace-nowrap cursor-pointer"
          >
            + Dodaj
          </button>
        </div>
      </div>

      {/* Quick Custom Combatant Form */}
      <form
        onSubmit={handleAddCustom}
        className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4"
      >
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
                onFocus={(e) => e.target.select()}
                onChange={(e) => setCustomInit(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Max HP</label>
              <input
                type="number"
                value={customHp}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setCustomHp(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Klasa Pancerza</label>
              <input
                type="number"
                value={customAc}
                onFocus={(e) => e.target.select()}
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
              data-testid="add-custom-combatant-submit-btn"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition cursor-pointer"
            >
              Dodaj
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
