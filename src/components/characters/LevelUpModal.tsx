'use client';

import {
  CheckCircle2,
  Dices,
  Heart,
  Loader2,
  Minus,
  Plus,
  Sparkles,
  TrendingUp,
  Wand2,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { CompendiumSpell } from '@/lib/compendium';
import {
  applyLevelUp,
  formatModifier,
  getAbilityModifier,
  getCanonicalClassName,
  getClassHitDie,
  getClassHitDieAverage,
  getMaxSpellLevel,
  getRecommendedLevelUpSpellsCount,
  getSpellcasterType,
  getXpForLevel,
  isAsiLevel,
  isSpellcasterClass,
} from '@/lib/dnd-rules';
import type { DashboardCharacter } from '../dashboard/types';

interface LevelUpModalProps {
  character: DashboardCharacter;
  isOpen: boolean;
  onClose: () => void;
  onApplyLevelUp: (updatedCharacter: DashboardCharacter) => Promise<void> | void;
  sessionId?: string;
}

export function LevelUpModal({
  character,
  isOpen,
  onClose,
  onApplyLevelUp,
  sessionId,
}: LevelUpModalProps) {
  const currentLvl = character.level || 1;
  const targetLevel = Math.min(20, currentLvl + 1);
  const canonicalClass = getCanonicalClassName(character.class || '');
  const hitDie = getClassHitDie(character.class || '');
  const hitDieAvg = getClassHitDieAverage(character.class || '');
  const isCaster = isSpellcasterClass(character.class || '');
  const maxSpellLvl = getMaxSpellLevel(character.class || '', targetLevel);
  const hasAsi = isAsiLevel(character.class || '', targetLevel);

  // Spellcasting progression info
  const casterType = getSpellcasterType(character.class || '');
  const recommendedSpellsCount = getRecommendedLevelUpSpellsCount(
    character.class || '',
    targetLevel
  );
  const isPreparedCaster = casterType === 'prepared';
  const isKnownOrSpellbook = casterType === 'spellbook' || casterType === 'known';

  // HP Gain states
  const [hpMethod, setHpMethod] = useState<'average' | 'roll'>('average');
  const [rolledDieValue, setRolledDieValue] = useState<number | null>(null);

  // ASI states (2 points total)
  const [asiAllocations, setAsiAllocations] = useState<{
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  }>({
    str: 0,
    dex: 0,
    con: 0,
    int: 0,
    wis: 0,
    cha: 0,
  });

  // Spell selection states
  const [compendiumSpells, setCompendiumSpells] = useState<CompendiumSpell[]>([]);
  const [selectedNewSpells, setSelectedNewSpells] = useState<string[]>([]);
  const [customSpellInput, setCustomSpellInput] = useState('');
  const [unlimitedSpellsMode, setUnlimitedSpellsMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch spells if caster
  useEffect(() => {
    if (!isOpen || !isCaster) return;
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
  }, [isOpen, isCaster]);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setHpMethod('average');
      setRolledDieValue(null);
      setAsiAllocations({ str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 });
      setSelectedNewSpells([]);
      setCustomSpellInput('');
      setUnlimitedSpellsMode(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentStats = character.stats || {
    str: 10,
    dex: 10,
    con: 10,
    int: 10,
    wis: 10,
    cha: 10,
  };

  const totalAsiAllocated = Object.values(asiAllocations).reduce((sum, val) => sum + val, 0);
  const remainingAsiPoints = 2 - totalAsiAllocated;

  // CON modifier with potential ASI
  const effectiveCon = (currentStats.con ?? 10) + asiAllocations.con;
  const conMod = getAbilityModifier(effectiveCon);

  // Computed HP gain
  const baseDieVal = hpMethod === 'roll' && rolledDieValue !== null ? rolledDieValue : hitDieAvg;
  const computedHpGain = Math.max(1, baseDieVal + conMod);
  const newMaxHp = (character.maxHp || 10) + computedHpGain;

  // Dice rolling simulation
  const handleRollHitDie = () => {
    const roll = Math.floor(Math.random() * hitDie) + 1;
    setRolledDieValue(roll);
  };

  // ASI handlers
  const handleAddAsi = (stat: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha') => {
    if (remainingAsiPoints <= 0) return;
    const currentVal = (currentStats[stat] ?? 10) + asiAllocations[stat];
    if (currentVal >= 20) return;

    setAsiAllocations((prev) => ({
      ...prev,
      [stat]: prev[stat] + 1,
    }));
  };

  const handleRemoveAsi = (stat: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha') => {
    if (asiAllocations[stat] <= 0) return;
    setAsiAllocations((prev) => ({
      ...prev,
      [stat]: prev[stat] - 1,
    }));
  };

  // Spell limit calculation
  const maxAllowedSpells =
    unlimitedSpellsMode || isPreparedCaster ? Infinity : recommendedSpellsCount;
  const isAtSpellLimit =
    !isPreparedCaster && !unlimitedSpellsMode && selectedNewSpells.length >= maxAllowedSpells;

  // Spell handlers
  const handleToggleSpell = (spellName: string) => {
    if (selectedNewSpells.includes(spellName)) {
      setSelectedNewSpells((prev) => prev.filter((s) => s !== spellName));
    } else {
      if (isAtSpellLimit) return;
      setSelectedNewSpells((prev) => [...prev, spellName]);
    }
  };

  const handleAddCustomSpell = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customSpellInput.trim();
    if (!trimmed) return;
    if (isAtSpellLimit) return;
    if (!selectedNewSpells.includes(trimmed)) {
      setSelectedNewSpells((prev) => [...prev, trimmed]);
    }
    setCustomSpellInput('');
  };

  // Available leveled spells from compendium
  const knownSpells = character.spells?.known || [];
  const availableClassSpells = compendiumSpells.filter(
    (s) =>
      s.classes.some((c) => c.toLowerCase() === canonicalClass.toLowerCase()) &&
      s.level <= maxSpellLvl &&
      !knownSpells.includes(s.name)
  );

  // Apply level up
  const handleConfirmLevelUp = async () => {
    setIsSubmitting(true);
    try {
      const updated = applyLevelUp(character, {
        hpGainMethod: hpMethod,
        rolledHpValue: rolledDieValue ?? undefined,
        abilityScoreImprovements: hasAsi ? asiAllocations : undefined,
        newSpells: selectedNewSpells,
      });

      // Ensure stats.xp is at least target level requirement
      const requiredXp = getXpForLevel(targetLevel);
      const currentXp = character.stats?.xp ?? 0;
      if (currentXp < requiredXp) {
        updated.stats = {
          ...(updated.stats || {}),
          xp: requiredXp,
        };
      }

      await onApplyLevelUp(updated);

      // Create log entry on Timeline if session exists
      if (sessionId && character.id && !character.id.startsWith('char-default')) {
        const asiDetails = hasAsi
          ? Object.entries(asiAllocations)
              .filter(([_, val]) => val > 0)
              .map(([k, val]) => `${k.toUpperCase()} +${val}`)
              .join(', ')
          : '';

        const logDesc = `⚔️ Awans Postaci: ${character.name} awansował(a) na Poziom ${targetLevel}! (+${computedHpGain} Max HP${asiDetails ? `, ${asiDetails}` : ''})`;

        fetch(`/api/sessions/${sessionId}/logs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            logType: 'CUSTOM_NOTE',
            description: logDesc,
          }),
        }).catch(() => {});
      }

      onClose();
    } catch {
      // Keep modal open on error
    } finally {
      setIsSubmitting(false);
    }
  };

  const statLabels: Array<{ key: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'; label: string }> = [
    { key: 'str', label: 'Siła (STR)' },
    { key: 'dex', label: 'Zręczność (DEX)' },
    { key: 'con', label: 'Kondycja (CON)' },
    { key: 'int', label: 'Inteligencja (INT)' },
    { key: 'wis', label: 'Mądrość (WIS)' },
    { key: 'cha', label: 'Charyzma (CHA)' },
  ];

  return (
    <div
      data-testid="level-up-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
    >
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl shadow-amber-500/10 overflow-hidden">
        {/* MODAL HEADER */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-100">{character.name}</h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Awans na Poziom {targetLevel}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {character.race} • {character.class} • Kość życia: k{hitDie}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-xs text-slate-300">
          {/* STEP 1: HP INCREASE */}
          <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 font-bold text-rose-400 uppercase tracking-wider text-xs">
                <Heart className="w-4 h-4" />
                <span>1. Zwiększenie Punktów Zdrowia (HP)</span>
              </div>
              <span
                data-testid="level-up-new-hp-preview"
                className="font-mono text-emerald-400 font-bold text-xs"
              >
                {character.maxHp} HP ➔ {newMaxHp} HP (+{computedHpGain} HP)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Option A: Official Average */}
              <button
                type="button"
                data-testid="level-up-hp-avg-btn"
                onClick={() => setHpMethod('average')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  hpMethod === 'average'
                    ? 'bg-rose-500/10 border-rose-500/40 text-rose-200'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span>Średnia D&D 5e</span>
                  <span className="font-mono text-emerald-400">
                    +{Math.max(1, hitDieAvg + conMod)} HP
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 pt-1">
                  Kość: {hitDieAvg} + modyfikator CON ({formatModifier(effectiveCon)}). Bezpieczny,
                  stabilny wybór.
                </p>
              </button>

              {/* Option B: Dice Roll */}
              <button
                type="button"
                data-testid="level-up-hp-roll-mode-btn"
                onClick={() => setHpMethod('roll')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  hpMethod === 'roll'
                    ? 'bg-rose-500/10 border-rose-500/40 text-rose-200'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span>Rzut kością k{hitDie}</span>
                  {rolledDieValue !== null ? (
                    <span className="font-mono text-emerald-400">
                      +{Math.max(1, rolledDieValue + conMod)} HP
                    </span>
                  ) : (
                    <span className="font-mono text-slate-500">1k{hitDie} + CON</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 pt-1">
                  Losowy wynik od 1 do {hitDie} + modyfikator CON.
                </p>
              </button>
            </div>

            {/* Dice roll action when in roll mode */}
            {hpMethod === 'roll' && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="text-xs">
                  {rolledDieValue !== null ? (
                    <span>
                      Wylosowano: <strong className="text-amber-400">{rolledDieValue}</strong> na
                      kości k{hitDie} + {conMod} CON ={' '}
                      <strong className="text-emerald-400">+{computedHpGain} HP</strong>
                    </span>
                  ) : (
                    <span className="text-slate-400">Rzuć kością, aby poznać wynik.</span>
                  )}
                </div>
                <button
                  type="button"
                  data-testid="level-up-roll-dice-btn"
                  onClick={handleRollHitDie}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition"
                >
                  <Dices className="w-3.5 h-3.5" />
                  <span>Rzuć 1k{hitDie}</span>
                </button>
              </div>
            )}
          </div>

          {/* STEP 2: ASI (ABILITY SCORE IMPROVEMENT) - ONLY ON ASI LEVELS */}
          {hasAsi && (
            <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2 font-bold text-amber-400 uppercase tracking-wider text-xs">
                  <TrendingUp className="w-4 h-4" />
                  <span>2. Zwiększenie Wartości Cech (ASI)</span>
                </div>
                <span
                  className={`font-bold font-mono px-2 py-0.5 rounded text-[11px] ${
                    remainingAsiPoints === 0
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  Pozostało punktów: {remainingAsiPoints}
                </span>
              </div>

              <p className="text-[11px] text-slate-400">
                Przydziel 2 punkty cech (+2 do jednej cechy lub 2x +1 do dwóch różnych). Maksymalna
                wartość cechy to 20.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                {statLabels.map(({ key, label }) => {
                  const baseVal = currentStats[key] ?? 10;
                  const bonus = asiAllocations[key];
                  const totalVal = baseVal + bonus;
                  const mod = getAbilityModifier(totalVal);

                  return (
                    <div
                      key={key}
                      className={`p-2.5 rounded-xl border transition ${
                        bonus > 0
                          ? 'bg-amber-500/10 border-amber-500/40'
                          : 'bg-slate-950/60 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                        <span className="truncate">{label.split(' ')[0]}</span>
                        <span className="font-mono text-indigo-400">
                          {mod >= 0 ? `+${mod}` : mod}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="font-mono text-base font-bold text-slate-100">
                          {totalVal}
                          {bonus > 0 && (
                            <span className="text-xs text-amber-400 ml-1">(+{bonus})</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            data-testid={`asi-minus-${key}`}
                            disabled={bonus <= 0}
                            onClick={() => handleRemoveAsi(key)}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 transition cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            data-testid={`asi-plus-${key}`}
                            disabled={remainingAsiPoints <= 0 || totalVal >= 20}
                            onClick={() => handleAddAsi(key)}
                            className="p-1 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white transition cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: SPELLS (IF CASTER) */}
          {isCaster && (
            <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2 font-bold text-indigo-400 uppercase tracking-wider text-xs">
                  <Wand2 className="w-4 h-4" />
                  <span>3. Nowe Zaklęcia i Komórki Czarów</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-indigo-300">
                    Kręgi: 1–{maxSpellLvl}
                  </span>
                  {isKnownOrSpellbook && !unlimitedSpellsMode && (
                    <span
                      data-testid="level-up-spell-counter"
                      className={`font-bold font-mono px-2 py-0.5 rounded text-[11px] border ${
                        selectedNewSpells.length === recommendedSpellsCount
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      Wybrano: {selectedNewSpells.length} / {recommendedSpellsCount}
                    </span>
                  )}
                  {isPreparedCaster && (
                    <span
                      data-testid="level-up-prepared-caster-badge"
                      className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 font-bold px-2 py-0.5 rounded text-[11px]"
                    >
                      Klasa przygotowująca
                    </span>
                  )}
                  {unlimitedSpellsMode && (
                    <span
                      data-testid="level-up-unlimited-badge"
                      className="bg-purple-500/10 text-purple-300 border border-purple-500/30 font-bold px-2 py-0.5 rounded text-[11px]"
                    >
                      Tryb swobodny GM ({selectedNewSpells.length})
                    </span>
                  )}
                </div>
              </div>

              {/* Description & Rules explanation */}
              <div className="text-[11px] text-slate-400 leading-relaxed space-y-1">
                {casterType === 'spellbook' && (
                  <p>
                    <strong className="text-slate-300">Księga Czarów:</strong> Zgodnie z zasadami
                    D&D 5e Czarodziej dopisuje do księgi dokładnie{' '}
                    <strong className="text-amber-400">2 darmowe zaklęcia</strong> przy każdym
                    awansie.
                  </p>
                )}
                {casterType === 'known' && (
                  <p>
                    <strong className="text-slate-300">Znane Zaklęcia:</strong> Zgodnie z zasadami
                    D&D 5e postać uczy się{' '}
                    <strong className="text-amber-400">
                      {recommendedSpellsCount}{' '}
                      {recommendedSpellsCount === 1 ? 'nowego zaklęcia' : 'nowych zaklęć'}
                    </strong>{' '}
                    na tym poziomie.
                  </p>
                )}
                {casterType === 'prepared' && (
                  <p>
                    <strong className="text-slate-300">Czary Przygotowywane:</strong> Kleryk, Druid
                    i Paladyn znają wszystkie czary ze swojej listy klasowej. Możesz zaznaczyć
                    poniżej zaklęcia, aby zapisać je w karcie jako przygotowane.
                  </p>
                )}
              </div>

              {/* GM Flexibility toggle for known / spellbook casters */}
              {isKnownOrSpellbook && (
                <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-950/40 px-3 py-1.5 rounded-lg border border-slate-800/80">
                  <span className="text-[11px]">
                    {isAtSpellLimit
                      ? `Osiągnięto limit ${recommendedSpellsCount} ${recommendedSpellsCount === 1 ? 'zaklęcia' : 'zaklęć'} dla tego poziomu.`
                      : `Zasada D&D 5e: limit ${recommendedSpellsCount} ${recommendedSpellsCount === 1 ? 'zaklęcia' : 'zaklęć'}.`}
                  </span>
                  <button
                    type="button"
                    data-testid="toggle-unlimited-spells-btn"
                    onClick={() => setUnlimitedSpellsMode((prev) => !prev)}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                  >
                    {unlimitedSpellsMode
                      ? 'Włącz ścisły limit D&D 5e'
                      : 'Zezwól na więcej (Homebrew/Zwój)'}
                  </button>
                </div>
              )}

              {/* Available Leveled Spells */}
              {availableClassSpells.length > 0 && (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {availableClassSpells.map((s) => {
                      const isSelected = selectedNewSpells.includes(s.name);
                      const isBlocked = !isSelected && isAtSpellLimit;

                      return (
                        <button
                          key={s.index}
                          type="button"
                          disabled={isBlocked}
                          onClick={() => handleToggleSpell(s.name)}
                          title={
                            isBlocked
                              ? `Osiągnięto limit ${recommendedSpellsCount} zaklęć`
                              : undefined
                          }
                          className={`p-2 rounded-xl text-left text-xs font-medium border transition flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-200'
                              : isBlocked
                                ? 'bg-slate-950/30 border-slate-900 text-slate-600 opacity-50 cursor-not-allowed'
                                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <span className="truncate">{s.name}</span>
                          <span className="text-[9px] font-mono px-1 rounded bg-slate-800 text-amber-400 ml-1">
                            {s.level === 0 ? 'Cantrip' : `Krąg ${s.level}`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Custom spell input form */}
              <form onSubmit={handleAddCustomSpell} className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  data-testid="level-up-custom-spell-input"
                  placeholder={
                    isAtSpellLimit
                      ? `Osiągnięto limit ${recommendedSpellsCount} zaklęć (odblokuj powyżej)`
                      : 'Dodaj inne zaklęcie (np. Homebrew)...'
                  }
                  disabled={isAtSpellLimit}
                  value={customSpellInput}
                  onChange={(e) => setCustomSpellInput(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                />
                <button
                  type="submit"
                  data-testid="level-up-add-spell-btn"
                  disabled={!customSpellInput.trim() || isAtSpellLimit}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition disabled:opacity-40 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Selected spell tags */}
              {selectedNewSpells.length > 0 ? (
                <div className="space-y-1 pt-1">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Wybrane zaklęcia do nauki ({selectedNewSpells.length}):
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedNewSpells.map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 rounded-lg bg-indigo-950/80 border border-indigo-500/40 text-indigo-200 text-xs flex items-center gap-1"
                      >
                        <span>{s}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleSpell(s)}
                          className="hover:text-rose-400 text-slate-400 p-0.5 cursor-pointer"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 italic pt-1">
                  Nie wybrano żadnego nowego zaklęcia (postać awansuje bez dodawania nowych czarów).
                </p>
              )}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
          >
            Anuluj
          </button>

          <button
            type="button"
            data-testid="level-up-confirm-btn"
            disabled={isSubmitting || (hasAsi && remainingAsiPoints > 0)}
            onClick={handleConfirmLevelUp}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Zapisuję...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Zatwierdź Awans na Poziom {targetLevel}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
