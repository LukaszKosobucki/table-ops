'use client';

import {
  ArrowLeft,
  Backpack,
  CheckCircle2,
  Dices,
  Heart,
  MessageSquare,
  Shield,
  Sparkles,
  Swords,
  Wand2,
} from 'lucide-react';
import { useState } from 'react';
import {
  applyDamage,
  applyHealing,
  applyTempHp,
  type CharacterSpellSlots,
  calculateSpellSlots,
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
