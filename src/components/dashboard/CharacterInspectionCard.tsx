'use client';

import {
  ArrowLeft,
  Backpack,
  CheckCircle2,
  Dices,
  Heart,
  MessageSquare,
  Plus,
  Shield,
  Sparkles,
  Swords,
  Trash2,
  Wand2,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { LevelUpModal } from '@/components/characters/LevelUpModal';
import type { CompendiumSpell } from '@/lib/compendium';
import {
  applyDamage,
  applyHealing,
  applyTempHp,
  type CharacterSpellSlots,
  calculateSpellSlots,
  getCanonicalClassName,
  getMaxSpellLevel,
  getNextLevelXpThreshold,
  getXpForLevel,
} from '@/lib/dnd-rules';
import type { DashboardCharacter } from './types';

interface CharacterInspectionCardProps {
  character: DashboardCharacter;
  onBackToCombat: () => void;
  onCharacterUpdate?: (updated: DashboardCharacter) => void;
  onAddToCombat?: (character: DashboardCharacter) => void;
  isInCombat?: boolean;
}

function calculateModifier(score = 10): { num: number; str: string } {
  const num = Math.floor((score - 10) / 2);
  const str = num >= 0 ? `+${num}` : `${num}`;
  return { num, str };
}

export function CharacterInspectionCard({
  character,
  onBackToCombat,
  onCharacterUpdate,
  onAddToCombat,
  isInCombat = false,
}: CharacterInspectionCardProps) {
  // Local HP state for instant response
  const [currentHp, setCurrentHp] = useState(character.currentHp);
  const [maxHp] = useState(character.maxHp);
  const [tempHp, setTempHp] = useState(character.stats?.tempHp || 0);
  const [customHpInput, setCustomHpInput] = useState('');

  // Local spell slots state
  const initialSlots: CharacterSpellSlots =
    character.spells?.slots ||
    calculateSpellSlots(character.class ?? undefined, character.level || 1);
  const [spellSlots, setSpellSlots] = useState<CharacterSpellSlots>(initialSlots);

  // Dice roll banner state
  const [lastRoll, setLastRoll] = useState<{
    label: string;
    d20: number;
    modifier: number;
    total: number;
    isSavingThrow?: boolean;
  } | null>(null);

  // Item management state
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');

  // Spell management state
  const [isAddingSpell, setIsAddingSpell] = useState(false);
  const [compendiumSpells, setCompendiumSpells] = useState<CompendiumSpell[]>([]);
  const [selectedSpellToAdd, setSelectedSpellToAdd] = useState('');
  const [customSpellInput, setCustomSpellInput] = useState('');

  // EXP and Level Up state
  const [isLevelUpModalOpen, setIsLevelUpModalOpen] = useState(false);
  const [isAddingXp, setIsAddingXp] = useState(false);
  const [xpToAddInput, setXpToAddInput] = useState('');

  const currentXp = character.stats?.xp ?? getXpForLevel(character.level || 1);
  const xpProgress = getNextLevelXpThreshold(currentXp);
  const isLevelUpAvailable = currentXp >= xpProgress.nextLevelXp && (character.level || 1) < 20;

  const handleAddXp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const amount = parseInt(xpToAddInput, 10);
    if (Number.isNaN(amount) || amount <= 0) return;
    const nextXp = currentXp + amount;
    const nextStats = { ...(character.stats || {}), xp: nextXp };
    const updatedChar: DashboardCharacter = {
      ...character,
      stats: nextStats,
    };
    onCharacterUpdate?.(updatedChar);
    setXpToAddInput('');
    setIsAddingXp(false);

    if (character.id && !character.id.startsWith('char-default')) {
      try {
        await fetch(`/api/characters/${character.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stats: nextStats }),
        });
      } catch {
        // Optimistic UI state already updated
      }
    }
  };

  const handleApplyLevelUp = async (updatedChar: DashboardCharacter) => {
    onCharacterUpdate?.(updatedChar);
    if (updatedChar.id && !updatedChar.id.startsWith('char-default')) {
      try {
        await fetch(`/api/characters/${updatedChar.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            level: updatedChar.level,
            maxHp: updatedChar.maxHp,
            currentHp: updatedChar.currentHp,
            ac: updatedChar.ac,
            passivePerception: updatedChar.passivePerception,
            stats: updatedChar.stats,
            spells: updatedChar.spells,
          }),
        });
      } catch {
        // Optimistic UI state already updated
      }
    }
  };

  // Fetch compendium spells if add modal is toggled
  useEffect(() => {
    if (!isAddingSpell || compendiumSpells.length > 0) return;
    let mounted = true;
    fetch('/api/compendium/spells')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!mounted || !data) return;
        const list = Array.isArray(data) ? data : data.spells;
        if (Array.isArray(list)) setCompendiumSpells(list);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [isAddingSpell, compendiumSpells.length]);

  const canonicalClass = getCanonicalClassName(character.class ?? undefined);
  const maxSpellLvl = getMaxSpellLevel(character.class ?? undefined, character.level || 1);

  // Available spells filtered by class and max level
  const classFilteredSpells = compendiumSpells.filter((s) => {
    const matchesClass = s.classes.some((c) => c.toLowerCase() === canonicalClass.toLowerCase());
    const matchesLevel = s.level <= maxSpellLvl;
    const notAlreadyKnown = !(character.spells?.known || []).includes(s.name);
    return matchesClass && matchesLevel && notAlreadyKnown;
  });

  const handleAddItem = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newItemName.trim();
    if (!trimmed) return;

    const currentInv = character.inventory || [];
    const nextInv = [...currentInv, trimmed];

    const updatedChar: DashboardCharacter = {
      ...character,
      inventory: nextInv,
    };
    onCharacterUpdate?.(updatedChar);
    setNewItemName('');
    setIsAddingItem(false);

    if (character.id && !character.id.startsWith('char-default')) {
      try {
        await fetch(`/api/characters/${character.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inventory: nextInv }),
        });
      } catch {
        // Optimistic UI state already updated
      }
    }
  };

  const handleRemoveItem = async (itemToRemove: string) => {
    const currentInv = character.inventory || [];
    const nextInv = currentInv.filter((item) => item !== itemToRemove);

    const updatedChar: DashboardCharacter = {
      ...character,
      inventory: nextInv,
    };
    onCharacterUpdate?.(updatedChar);

    if (character.id && !character.id.startsWith('char-default')) {
      try {
        await fetch(`/api/characters/${character.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inventory: nextInv }),
        });
      } catch {
        // Optimistic UI state already updated
      }
    }
  };

  const handleAddSpell = async (spellName?: string) => {
    const nameToAdd = (spellName || selectedSpellToAdd || customSpellInput).trim();
    if (!nameToAdd) return;

    const currentSpells = character.spells || {};
    const currentKnown = currentSpells.known || [];
    if (currentKnown.includes(nameToAdd)) {
      setIsAddingSpell(false);
      return;
    }
    const nextKnown = [...currentKnown, nameToAdd];
    const nextSpells = {
      ...currentSpells,
      known: nextKnown,
    };

    const updatedChar: DashboardCharacter = {
      ...character,
      spells: nextSpells,
    };
    onCharacterUpdate?.(updatedChar);
    setSelectedSpellToAdd('');
    setCustomSpellInput('');
    setIsAddingSpell(false);

    if (character.id && !character.id.startsWith('char-default')) {
      try {
        await fetch(`/api/characters/${character.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ spells: nextSpells }),
        });
      } catch {
        // Optimistic UI state already updated
      }
    }
  };

  const handleRemoveSpell = async (spellToRemove: string) => {
    const currentSpells = character.spells || {};
    const currentKnown = currentSpells.known || [];
    const nextKnown = currentKnown.filter((s) => s !== spellToRemove);
    const nextSpells = {
      ...currentSpells,
      known: nextKnown,
    };

    const updatedChar: DashboardCharacter = {
      ...character,
      spells: nextSpells,
    };
    onCharacterUpdate?.(updatedChar);

    if (character.id && !character.id.startsWith('char-default')) {
      try {
        await fetch(`/api/characters/${character.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ spells: nextSpells }),
        });
      } catch {
        // Optimistic UI state already updated
      }
    }
  };

  const stats = character.stats || {
    str: 10,
    dex: 10,
    con: 10,
    int: 10,
    wis: 10,
    cha: 10,
  };

  const statEntries = [
    { key: 'str', label: 'Siła (STR)', val: stats.str ?? 10 },
    { key: 'dex', label: 'Zręczność (DEX)', val: stats.dex ?? 10 },
    { key: 'con', label: 'Kondycja (CON)', val: stats.con ?? 10 },
    { key: 'int', label: 'Inteligencja (INT)', val: stats.int ?? 10 },
    { key: 'wis', label: 'Mądrość (WIS)', val: stats.wis ?? 10 },
    { key: 'cha', label: 'Charyzma (CHA)', val: stats.cha ?? 10 },
  ];

  // HP mutation handler
  const handleHpChange = async (action: 'damage' | 'heal' | 'set_temp', amount: number) => {
    if (amount <= 0 && action !== 'set_temp') return;

    let nextCurrent = currentHp;
    let nextTemp = tempHp;

    if (action === 'damage') {
      const res = applyDamage(currentHp, maxHp, tempHp, amount);
      nextCurrent = res.currentHp;
      nextTemp = res.tempHp;
    } else if (action === 'heal') {
      const res = applyHealing(currentHp, maxHp, tempHp, amount);
      nextCurrent = res.currentHp;
      nextTemp = res.tempHp;
    } else if (action === 'set_temp') {
      const res = applyTempHp(currentHp, maxHp, tempHp, amount);
      nextCurrent = res.currentHp;
      nextTemp = res.tempHp;
    }

    setCurrentHp(nextCurrent);
    setTempHp(nextTemp);
    setCustomHpInput('');

    const updatedChar: DashboardCharacter = {
      ...character,
      currentHp: nextCurrent,
      stats: {
        ...stats,
        tempHp: nextTemp,
      },
    };
    onCharacterUpdate?.(updatedChar);

    // Call backend API if character has real id
    if (character.id && !character.id.startsWith('char-default')) {
      try {
        await fetch(`/api/characters/${character.id}/hp`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, amount }),
        });
      } catch {
        // Optimistic UI state already updated
      }
    }
  };

  // Spell slot toggle handler
  const handleToggleSpellSlot = async (slotLevel: number, slotIndex: number) => {
    const slot = spellSlots[slotLevel];
    if (!slot) return;

    // If slotIndex is less than used count, we recover it; otherwise we use it
    const isCurrentlyUsed = slotIndex < slot.used;
    const action = isCurrentlyUsed ? 'recover' : 'use';
    const newUsed = isCurrentlyUsed
      ? Math.max(0, slot.used - 1)
      : Math.min(slot.max, slot.used + 1);

    const updatedSlots: CharacterSpellSlots = {
      ...spellSlots,
      [slotLevel]: {
        ...slot,
        used: newUsed,
      },
    };

    setSpellSlots(updatedSlots);

    const updatedChar: DashboardCharacter = {
      ...character,
      spells: {
        ...character.spells,
        slots: updatedSlots,
      },
    };
    onCharacterUpdate?.(updatedChar);

    if (character.id && !character.id.startsWith('char-default')) {
      try {
        await fetch(`/api/characters/${character.id}/slots`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slotLevel, action }),
        });
      } catch {
        // Optimistic update
      }
    }
  };

  // Attribute roll handler
  const handleRollAttribute = (label: string, score: number, isSavingThrow = false) => {
    const { num: modifier } = calculateModifier(score);
    const d20 = Math.floor(Math.random() * 20) + 1;
    const total = d20 + modifier;
    setLastRoll({
      label,
      d20,
      modifier,
      total,
      isSavingThrow,
    });
  };

  // Health bar percentage
  const hpPercent = Math.max(0, Math.min(100, Math.round((currentHp / maxHp) * 100)));
  const hasSpellSlots = Object.keys(spellSlots).length > 0;

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

        <div className="flex items-center gap-2">
          {isInCombat ? (
            <span
              data-testid="inspect-in-combat-badge"
              className="px-2.5 py-1 rounded-full text-xs font-bold border bg-indigo-500/20 text-indigo-300 border-indigo-500/40 flex items-center gap-1.5"
            >
              <Swords className="w-3 h-3 text-indigo-400" />
              <span>W Walce</span>
            </span>
          ) : onAddToCombat ? (
            <button
              type="button"
              data-testid="inspect-add-to-combat-btn"
              onClick={() => onAddToCombat(character)}
              className="px-3 py-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition cursor-pointer"
            >
              <Swords className="w-3 h-3" />
              <span>Dodaj do Walki</span>
            </button>
          ) : null}

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

        {/* Combat Vitals Summary Badges */}
        <div className="flex items-center gap-3">
          <div className="glass-card px-3.5 py-2 rounded-xl border border-slate-800 text-center min-w-[75px]">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Życie (HP)</span>
            <span className="text-base font-bold font-mono text-emerald-400">
              {currentHp}/{maxHp}
            </span>
            {tempHp > 0 && (
              <span className="text-[10px] font-mono text-indigo-300 block">+{tempHp} temp</span>
            )}
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

      {/* EXP & Level Progression Card */}
      <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Doświadczenie & Poziom {character.level || 1}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Add EXP Button */}
            <button
              type="button"
              data-testid="open-add-xp-btn"
              onClick={() => setIsAddingXp(!isAddingXp)}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
            >
              + EXP
            </button>

            {/* Milestone Level Up Button */}
            <button
              type="button"
              data-testid="milestone-level-up-btn"
              onClick={() => setIsLevelUpModalOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
            >
              Awansuj (Milestone)
            </button>

            {/* Ready to Level Up Badge Button */}
            {isLevelUpAvailable && (
              <button
                type="button"
                data-testid="ready-level-up-btn"
                onClick={() => setIsLevelUpModalOpen(true)}
                className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition cursor-pointer animate-pulse"
              >
                ✨ Dostępny Awans ({xpProgress.nextLevel})!
              </button>
            )}
          </div>
        </div>

        {/* Inline Add XP Form */}
        {isAddingXp && (
          <form onSubmit={handleAddXp} className="flex items-center gap-2 animate-fadeIn pt-1">
            <input
              type="number"
              min={1}
              data-testid="add-xp-input"
              placeholder="Wpisz ilość EXP (np. 300)..."
              value={xpToAddInput}
              onChange={(e) => setXpToAddInput(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              data-testid="confirm-add-xp-btn"
              disabled={!xpToAddInput.trim()}
              className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 text-xs font-bold cursor-pointer transition"
            >
              Dodaj EXP
            </button>
          </form>
        )}

        {/* Visual EXP Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span data-testid="xp-progress-text">
              {currentXp.toLocaleString()} / {xpProgress.nextLevelXp.toLocaleString()} XP
            </span>
            <span>
              {(character.level || 1) >= 20
                ? 'Maksymalny Poziom'
                : `Do Poziomu ${xpProgress.nextLevel}: ${xpProgress.remainingXp.toLocaleString()} XP`}
            </span>
          </div>

          <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800/80">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-indigo-500 transition-all duration-300"
              style={{ width: `${xpProgress.progressPercent}%` }}
              title={`Postęp: ${xpProgress.progressPercent}%`}
            />
          </div>
        </div>
      </div>

      {/* Interactive Health Management Card */}
      <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-400" />
            <span>Zarządzanie Punktami Życia</span>
          </div>
          <span className="font-mono text-slate-400">
            {currentHp} / {maxHp} HP {tempHp > 0 ? `(+${tempHp} Temp)` : ''} ({hpPercent}%)
          </span>
        </div>

        {/* Visual Animated HP Bar */}
        <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800 flex">
          <div
            className={`h-full transition-all duration-300 ${
              hpPercent > 50 ? 'bg-emerald-500' : hpPercent > 20 ? 'bg-amber-500' : 'bg-red-500'
            }`}
            style={{ width: `${hpPercent}%` }}
          />
          {tempHp > 0 && (
            <div
              className="h-full bg-indigo-500 transition-all duration-300"
              style={{ width: `${Math.min(100 - hpPercent, (tempHp / maxHp) * 100)}%` }}
              title={`Temp HP: ${tempHp}`}
            />
          )}
        </div>

        {/* Quick HP Buttons & Custom Action */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Damage buttons */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-red-400 uppercase mr-1">Rany:</span>
            <button
              type="button"
              onClick={() => handleHpChange('damage', 1)}
              className="px-2 py-1 rounded bg-red-950/60 hover:bg-red-900 border border-red-800/80 text-red-300 font-mono text-xs font-bold transition cursor-pointer"
            >
              -1
            </button>
            <button
              type="button"
              onClick={() => handleHpChange('damage', 5)}
              className="px-2 py-1 rounded bg-red-950/60 hover:bg-red-900 border border-red-800/80 text-red-300 font-mono text-xs font-bold transition cursor-pointer"
            >
              -5
            </button>
            <button
              type="button"
              onClick={() => handleHpChange('damage', 10)}
              className="px-2 py-1 rounded bg-red-950/60 hover:bg-red-900 border border-red-800/80 text-red-300 font-mono text-xs font-bold transition cursor-pointer"
            >
              -10
            </button>
          </div>

          {/* Healing buttons */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-emerald-400 uppercase mr-1">Leczenie:</span>
            <button
              type="button"
              onClick={() => handleHpChange('heal', 1)}
              className="px-2 py-1 rounded bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800/80 text-emerald-300 font-mono text-xs font-bold transition cursor-pointer"
            >
              +1
            </button>
            <button
              type="button"
              onClick={() => handleHpChange('heal', 5)}
              className="px-2 py-1 rounded bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800/80 text-emerald-300 font-mono text-xs font-bold transition cursor-pointer"
            >
              +5
            </button>
            <button
              type="button"
              onClick={() => handleHpChange('heal', 10)}
              className="px-2 py-1 rounded bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800/80 text-emerald-300 font-mono text-xs font-bold transition cursor-pointer"
            >
              +10
            </button>
          </div>

          {/* Custom HP input */}
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={1}
              placeholder="Ilość"
              value={customHpInput}
              onChange={(e) => setCustomHpInput(e.target.value)}
              className="w-16 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-center font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={() => {
                const val = parseInt(customHpInput, 10);
                if (val > 0) handleHpChange('damage', val);
              }}
              className="px-2 py-1 rounded bg-red-900/60 hover:bg-red-800 text-[10px] font-bold text-red-200 transition cursor-pointer"
            >
              Zadaj
            </button>
            <button
              type="button"
              onClick={() => {
                const val = parseInt(customHpInput, 10);
                if (val > 0) handleHpChange('heal', val);
              }}
              className="px-2 py-1 rounded bg-emerald-900/60 hover:bg-emerald-800 text-[10px] font-bold text-emerald-200 transition cursor-pointer"
            >
              Ulecz
            </button>
            <button
              type="button"
              onClick={() => {
                const val = parseInt(customHpInput, 10);
                if (!Number.isNaN(val)) handleHpChange('set_temp', val);
              }}
              className="px-2 py-1 rounded bg-indigo-900/60 hover:bg-indigo-800 text-[10px] font-bold text-indigo-200 transition cursor-pointer"
            >
              Temp HP
            </button>
          </div>
        </div>
      </div>

      {/* Spell Slots Management Section (if spellcaster) */}
      {hasSpellSlots && (
        <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider">
              <Wand2 className="w-4 h-4 text-indigo-400" />
              <span>Komórki Czarów (Kliknij kropkę, aby zużyć / odzyskać)</span>
            </div>
            <span className="text-[10px] text-slate-400">● Dostępny • ○ Zużyty</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(spellSlots).map(([lvlStr, slotData]) => {
              const slotLevel = parseInt(lvlStr, 10);
              const availableCount = slotData.max - slotData.used;
              return (
                <div
                  key={lvlStr}
                  className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">Krąg {slotLevel}</span>
                    <span className="text-[10px] text-indigo-300 font-mono">
                      {availableCount}/{slotData.max} wolne
                    </span>
                  </div>

                  {/* Dots representing each spell slot */}
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: slotData.max }, (_, i) => ({
                      slotDotKey: `${character.id}-lvl${slotLevel}-dot${i + 1}`,
                      index: i,
                    })).map((slotDot) => {
                      const isUsed = slotDot.index < slotData.used;
                      return (
                        <button
                          key={slotDot.slotDotKey}
                          type="button"
                          onClick={() => handleToggleSpellSlot(slotLevel, slotDot.index)}
                          title={
                            isUsed
                              ? 'Zużyty (kliknij, aby odzyskać)'
                              : 'Dostępny (kliknij, aby zużyć)'
                          }
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition transform active:scale-90 cursor-pointer border ${
                            isUsed
                              ? 'bg-slate-900 border-slate-700 text-slate-600 hover:text-slate-400'
                              : 'bg-indigo-600 border-indigo-400 text-white shadow-sm shadow-indigo-500/50 hover:bg-indigo-500'
                          }`}
                        >
                          {isUsed ? '○' : '●'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Known Spells Section */}
      {((character.spells?.known && character.spells.known.length > 0) || hasSpellSlots) && (
        <div
          data-testid="known-spells-section"
          className="glass-card p-4 rounded-xl border border-slate-800 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Znane Zaklęcia i Księga Czarów</span>
            </div>
            <div className="flex items-center gap-2">
              {character.spells?.known && character.spells.known.length > 0 && (
                <span className="text-[10px] text-slate-400 font-mono">
                  {character.spells.known.length}{' '}
                  {character.spells.known.length === 1 ? 'zaklęcie' : 'zaklęć'}
                </span>
              )}
              <button
                type="button"
                data-testid="open-add-spell-btn"
                onClick={() => setIsAddingSpell(!isAddingSpell)}
                className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>{isAddingSpell ? 'Zamknij' : 'Dodaj czar'}</span>
              </button>
            </div>
          </div>

          {/* Inline Add Spell Form */}
          {isAddingSpell && (
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-300">
                  Dostępne dla {canonicalClass} (do kręgu {maxSpellLvl}):
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {classFilteredSpells.length} dostępnych
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <select
                  data-testid="select-spell-to-add"
                  value={selectedSpellToAdd}
                  onChange={(e) => {
                    setSelectedSpellToAdd(e.target.value);
                    if (e.target.value) setCustomSpellInput('');
                  }}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Wybierz z listy zaklęć klasy --</option>
                  {classFilteredSpells.map((s) => (
                    <option key={s.index} value={s.name}>
                      {s.level === 0 ? '✨ [Cantrip] ' : `⚡ [Krąg ${s.level}] `}
                      {s.name} ({s.school})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  data-testid="confirm-add-selected-spell-btn"
                  disabled={!selectedSpellToAdd}
                  onClick={() => handleAddSpell(selectedSpellToAdd)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold cursor-pointer transition shadow-sm"
                >
                  Wybierz
                </button>
              </div>

              {/* Or custom input */}
              <div className="pt-1.5 border-t border-slate-800/60 flex items-center gap-2">
                <input
                  type="text"
                  data-testid="custom-spell-input"
                  placeholder="Lub wpisz własną nazwę (Homebrew)..."
                  value={customSpellInput}
                  onChange={(e) => {
                    setCustomSpellInput(e.target.value);
                    if (e.target.value) setSelectedSpellToAdd('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSpell(customSpellInput);
                    }
                  }}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  data-testid="confirm-add-custom-spell-btn"
                  disabled={!customSpellInput.trim()}
                  onClick={() => handleAddSpell(customSpellInput)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-semibold cursor-pointer transition"
                >
                  Dodaj
                </button>
              </div>
            </div>
          )}

          {character.spells?.known && character.spells.known.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {character.spells.known.map((spellName) => (
                <span
                  key={spellName}
                  data-testid={`known-spell-${spellName}`}
                  className="group/spell px-2.5 py-1 rounded-xl bg-indigo-950/60 border border-indigo-500/30 text-indigo-200 text-xs font-medium flex items-center gap-1.5 shadow-sm"
                >
                  <Wand2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>{spellName}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSpell(spellName)}
                    data-testid={`remove-spell-${spellName}`}
                    title={`Usuń zaklęcie ${spellName}`}
                    className="p-0.5 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">
              Brak przypisanych zaklęć w księdze. Kliknij „Dodaj czar” lub skorzystaj z Kompendium.
            </p>
          )}
        </div>
      )}

      {/* Dice Roll Result Banner */}
      {lastRoll && (
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/15 to-indigo-500/15 border border-amber-500/30 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center font-bold font-mono text-base">
              {lastRoll.total}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-100">
                {lastRoll.isSavingThrow ? 'Rzut Obronny:' : 'Rzut na Atrybut:'} {lastRoll.label}
              </p>
              <p className="text-[11px] text-slate-400 font-mono">
                d20 ({lastRoll.d20}){' '}
                {lastRoll.modifier >= 0
                  ? `+ ${lastRoll.modifier}`
                  : `- ${Math.abs(lastRoll.modifier)}`}{' '}
                = {lastRoll.total}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setLastRoll(null)}
            className="text-[11px] text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            Zamknij
          </button>
        </div>
      )}

      {/* Attributes Grid with Interactive Rolls */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Atrybuty D&D 5e (Kliknij, aby rzucić d20)</span>
          </h3>
          <span className="text-[10px] text-slate-400">Rzut na cechę lub rzut obronny</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {statEntries.map((st) => {
            const { str: modStr } = calculateModifier(st.val);
            return (
              <div
                key={st.key}
                className="glass-card p-2.5 rounded-xl border border-slate-800/80 text-center space-y-1.5 group hover:border-indigo-500/50 transition"
              >
                <span className="text-[10px] text-slate-400 font-medium block truncate">
                  {st.label.split(' ')[0]}
                </span>
                <span className="text-base font-bold text-slate-100 font-mono block">{st.val}</span>
                <span className="text-xs font-semibold text-indigo-400 font-mono block">
                  {modStr}
                </span>

                {/* Roll Action Buttons */}
                <div className="pt-1 flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => handleRollAttribute(st.label, st.val, false)}
                    className="w-full flex items-center justify-center gap-1 px-1.5 py-1 rounded bg-slate-900 hover:bg-indigo-600/30 text-[10px] font-semibold text-slate-300 hover:text-indigo-200 transition cursor-pointer"
                    title={`Rzuć d20 ${modStr} na ${st.label}`}
                  >
                    <Dices className="w-3 h-3 text-indigo-400" />
                    <span>Test</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRollAttribute(st.label, st.val, true)}
                    className="w-full flex items-center justify-center gap-1 px-1.5 py-0.5 rounded bg-slate-900/50 hover:bg-amber-600/30 text-[9px] font-semibold text-slate-400 hover:text-amber-200 transition cursor-pointer"
                    title={`Rzut Obronny ${modStr} na ${st.label}`}
                  >
                    <Shield className="w-2.5 h-2.5 text-amber-400" />
                    <span>Obrona</span>
                  </button>
                </div>
              </div>
            );
          })}
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
        <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
              <Backpack className="w-3.5 h-3.5" />
              <span>Ekwipunek i Ważne Przedmioty</span>
            </div>
            <button
              type="button"
              data-testid="open-add-item-btn"
              onClick={() => setIsAddingItem(!isAddingItem)}
              className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>{isAddingItem ? 'Anuluj' : 'Dodaj'}</span>
            </button>
          </div>

          {/* Inline Add Item Form */}
          {isAddingItem && (
            <form onSubmit={handleAddItem} className="flex items-center gap-2 animate-fadeIn">
              <input
                type="text"
                data-testid="new-item-input"
                placeholder="Wpisz nazwę przedmiotu..."
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                data-testid="confirm-add-item-btn"
                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer transition shadow-sm"
              >
                Dodaj
              </button>
            </form>
          )}

          {character.inventory && character.inventory.length > 0 ? (
            <ul className="text-xs text-slate-300 space-y-1">
              {character.inventory.map((item) => (
                <li
                  key={item}
                  className="flex items-center justify-between group/item p-1 rounded-lg hover:bg-slate-900/60 transition"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="truncate">{item}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item)}
                    data-testid={`remove-item-${item}`}
                    title={`Usuń ${item}`}
                    className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer opacity-80 group-hover/item:opacity-100"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400">Podstawowy zestaw podróżnika.</p>
          )}
        </div>
      </div>

      {/* Level Up Modal */}
      {isLevelUpModalOpen && (
        <LevelUpModal
          character={character}
          isOpen={isLevelUpModalOpen}
          onClose={() => setIsLevelUpModalOpen(false)}
          onApplyLevelUp={handleApplyLevelUp}
          sessionId={character.sessionId || undefined}
        />
      )}
    </div>
  );
}
