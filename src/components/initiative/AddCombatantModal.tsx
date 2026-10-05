'use client';

import { Plus, Skull, User, X } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { getAbilityModifier } from '@/lib/dnd-rules';
import type { MonsterData } from '@/lib/monsters';
import type { Combatant } from './types';

interface AddCombatantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCombatant: (combatant: Combatant) => void;
  monsters: MonsterData[];
}

export function AddCombatantModal({
  isOpen,
  onClose,
  onAddCombatant,
  monsters,
}: AddCombatantModalProps) {
  const [activeTab, setActiveTab] = useState<'custom' | 'monster'>('custom');

  // Custom Form State
  const [name, setName] = useState('');
  const [hp, setHp] = useState('15');
  const [ac, setAc] = useState('12');
  const [init, setInit] = useState('10');
  const [isMonster, setIsMonster] = useState(false);

  // Monster Select State
  const [selectedMonsterIndex, setSelectedMonsterIndex] = useState(monsters[0]?.index || '');
  const [monsterCount, setMonsterCount] = useState(1);

  if (!isOpen) return null;

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const hpNum = Math.max(1, parseInt(hp, 10) || 10);
    const acNum = Math.max(1, parseInt(ac, 10) || 10);
    const initNum = parseInt(init, 10) || 10;

    onAddCombatant({
      id: `custom-${Date.now()}`,
      name: name.trim(),
      initiative: initNum,
      currentHp: hpNum,
      maxHp: hpNum,
      ac: acNum,
      isMonster,
      conditions: [],
    });

    // Reset and close
    setName('');
    onClose();
  };

  const handleAddFromBestiary = (e: React.FormEvent) => {
    e.preventDefault();
    const monster = monsters.find((m) => m.index === selectedMonsterIndex);
    if (!monster) return;

    const dexScore = monster.stats?.dex || 10;
    const dexMod = getAbilityModifier(dexScore);

    const count = Math.max(1, monsterCount);
    for (let i = 0; i < count; i++) {
      const suffix = count > 1 ? ` ${String.fromCharCode(65 + i)}` : '';
      const rollInit = Math.floor(Math.random() * 20) + 1 + dexMod;

      onAddCombatant({
        id: `monster-${monster.index}-${Date.now()}-${i}`,
        name: `${monster.name}${suffix}`,
        initiative: rollInit,
        currentHp: monster.hitPoints,
        maxHp: monster.hitPoints,
        ac: monster.armorClass,
        isMonster: true,
        type: monster.type,
        conditions: [],
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="glass-panel w-full max-w-md rounded-2xl p-6 border border-border-default shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Plus className="w-4 h-4 text-brand-primary" />
            Dodaj Uczestnika Walki
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted hover:text-foreground hover:bg-surface-card-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-xl bg-surface-card p-1 border border-border-default my-4">
          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'custom'
                ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/25'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <User className="w-3.5 h-3.5" /> Własna Postać / NPC
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('monster')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'monster'
                ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/25'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <Skull className="w-3.5 h-3.5" /> Z Bestiariusza
          </button>
        </div>

        {activeTab === 'custom' ? (
          <form onSubmit={handleAddCustom} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">
                Nazwa postaci / wroga:
              </label>
              <input
                type="text"
                required
                placeholder="np. Solaire z Astory"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl bg-surface-card border border-border-default text-foreground placeholder:text-muted/40 focus:outline-none focus:border-brand-primary"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Punkty HP:</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={hp}
                  onChange={(e) => setHp(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-center rounded-xl bg-surface-card border border-border-default text-foreground focus:outline-none focus:border-brand-primary font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1">Pancerz (AC):</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={ac}
                  onChange={(e) => setAc(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-center rounded-xl bg-surface-card border border-border-default text-foreground focus:outline-none focus:border-brand-primary font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1">Inicjatywa:</label>
                <input
                  type="number"
                  required
                  value={init}
                  onChange={(e) => setInit(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-center rounded-xl bg-surface-card border border-border-default text-foreground focus:outline-none focus:border-brand-primary font-mono"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isMonsterCheck"
                checked={isMonster}
                onChange={(e) => setIsMonster(e.target.checked)}
                className="rounded border-border-default bg-surface-card text-brand-primary focus:ring-brand-primary"
              />
              <label
                htmlFor="isMonsterCheck"
                className="text-xs text-muted cursor-pointer select-none"
              >
                Oznacz jako wroga / potwora
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
              <button type="button" onClick={onClose} className="btn-secondary text-xs">
                Anuluj
              </button>
              <button type="submit" className="btn-primary text-xs font-semibold">
                Dodaj do walki
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleAddFromBestiary} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">
                Wybierz z Bestiariusza:
              </label>
              <select
                value={selectedMonsterIndex}
                onChange={(e) => setSelectedMonsterIndex(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl bg-surface-card border border-border-default text-foreground focus:outline-none focus:border-brand-primary"
              >
                {monsters.map((m) => (
                  <option key={m.index} value={m.index}>
                    {m.name} (CR {m.challengeRating}, {m.hitPoints} HP, AC {m.armorClass})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted mb-1">Ilość potworów:</label>
              <input
                type="number"
                min="1"
                max="10"
                value={monsterCount}
                onChange={(e) => setMonsterCount(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 text-sm text-center rounded-xl bg-surface-card border border-border-default text-foreground focus:outline-none focus:border-brand-primary font-mono"
              />
              <p className="text-[11px] text-muted mt-1">
                Dla wielu potworów automatycznie zostaną dodane sufiksy A, B, C... a inicjatywa
                zostanie wylosowana.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
              <button type="button" onClick={onClose} className="btn-secondary text-xs">
                Anuluj
              </button>
              <button type="submit" className="btn-primary text-xs font-semibold">
                Wstaw do inicjatywy
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
