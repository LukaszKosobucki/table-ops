'use client';

import {
  Award,
  Backpack,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Info,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { SpellDetailModal } from '@/components/bestiary/SpellDetailModal';
import type { CompendiumItem, CompendiumSpell } from '@/lib/compendium';
import {
  getCanonicalClassName,
  getDefaultClassEquipment,
  getMaxSpellLevel,
  getRecommendedCantripsCount,
  isSpellcasterClass,
} from '@/lib/dnd-rules';
import { DND_SKILLS, type SkillKey, type SkillProficiencyLevel } from '@/lib/skills-and-traits';

interface StepEquipmentSpellsProps {
  selectedClass: string;
  level: number;
  inventory: string[];
  onInventoryChange: (inv: string[]) => void;
  knownSpells: string[];
  onKnownSpellsChange: (spells: string[]) => void;
  skills?: Record<string, SkillProficiencyLevel>;
  onSkillsChange?: (skills: Record<string, SkillProficiencyLevel>) => void;
  onPrev: () => void;
  onNext: () => void;
}

export function StepEquipmentSpells({
  selectedClass,
  level,
  inventory,
  onInventoryChange,
  knownSpells,
  onKnownSpellsChange,
  skills = {},
  onSkillsChange,
  onPrev,
  onNext,
}: StepEquipmentSpellsProps) {
  const canonicalClass = getCanonicalClassName(selectedClass);
  const isCaster = isSpellcasterClass(selectedClass);
  const maxSpellLvl = getMaxSpellLevel(selectedClass, level);
  const recommendedCantrips = getRecommendedCantripsCount(selectedClass, level);

  // Compendium spells state
  const [compendiumSpells, setCompendiumSpells] = useState<CompendiumSpell[]>([]);
  const [isLoadingSpells, setIsLoadingSpells] = useState(false);

  // Compendium equipment modal state
  const [isCompendiumModalOpen, setIsCompendiumModalOpen] = useState(false);
  const [compendiumItems, setCompendiumItems] = useState<CompendiumItem[]>([]);
  const [compendiumSearch, setCompendiumSearch] = useState('');
  const [isLoadingCompendium, setIsLoadingCompendium] = useState(false);

  // New item input state
  const [newItemInput, setNewItemInput] = useState('');
  // Custom spell input state
  const [customSpellInput, setCustomSpellInput] = useState('');
  const [inspectingSpell, setInspectingSpell] = useState<CompendiumSpell | null>(null);

  // Auto-fetch spells on mount
  useEffect(() => {
    let mounted = true;
    setIsLoadingSpells(true);
    fetch('/api/compendium/spells?limit=500')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!mounted || !data) return;
        const list = Array.isArray(data) ? data : data.spells || data.data;
        if (Array.isArray(list)) setCompendiumSpells(list);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setIsLoadingSpells(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Fetch compendium items on modal open
  useEffect(() => {
    if (isCompendiumModalOpen && compendiumItems.length === 0) {
      setIsLoadingCompendium(true);
      fetch('/api/compendium/items?limit=600')
        .then((res) => (res.ok ? res.json() : { items: [] }))
        .then((data) => {
          setCompendiumItems(data.items || data.data || []);
        })
        .catch(() => {})
        .finally(() => setIsLoadingCompendium(false));
    }
  }, [isCompendiumModalOpen, compendiumItems.length]);

  // Filter spells for class
  const classSpells = compendiumSpells.filter((s) =>
    s.classes.some((c) => c.toLowerCase() === canonicalClass.toLowerCase())
  );
  const availableCantrips = classSpells.filter((s) => s.level === 0);
  const availableLeveledSpells = classSpells.filter((s) => s.level > 0 && s.level <= maxSpellLvl);

  // Filter compendium items
  const filteredCompendiumItems = compendiumItems.filter((i) => {
    if (!compendiumSearch.trim()) return true;
    const q = compendiumSearch.toLowerCase().trim();
    return i.name.toLowerCase().includes(q) || (i.type?.toLowerCase().includes(q) ?? false);
  });

  // Equipment handlers
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newItemInput.trim();
    if (!trimmed) return;
    onInventoryChange([...inventory, trimmed]);
    setNewItemInput('');
  };

  const handleAddFromCompendium = (itemName: string) => {
    onInventoryChange([...inventory, itemName]);
    setIsCompendiumModalOpen(false);
  };

  const handleRemoveItem = (indexToRemove: number) => {
    onInventoryChange(inventory.filter((_, idx) => idx !== indexToRemove));
  };

  const handleResetEquipment = () => {
    onInventoryChange(getDefaultClassEquipment(selectedClass));
  };

  // Spell handlers
  const handleToggleSpell = (spellName: string) => {
    if (knownSpells.includes(spellName)) {
      onKnownSpellsChange(knownSpells.filter((s) => s !== spellName));
    } else {
      onKnownSpellsChange([...knownSpells, spellName]);
    }
  };

  const handleAddCustomSpell = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customSpellInput.trim();
    if (!trimmed) return;
    if (!knownSpells.includes(trimmed)) {
      onKnownSpellsChange([...knownSpells, trimmed]);
    }
    setCustomSpellInput('');
  };

  // Skill proficiency toggle: none -> proficient -> expertise -> none
  const handleToggleSkill = (key: SkillKey) => {
    if (!onSkillsChange) return;
    const current = skills[key] || 'none';
    const next: SkillProficiencyLevel =
      current === 'none' ? 'proficient' : current === 'proficient' ? 'expertise' : 'none';
    onSkillsChange({
      ...skills,
      [key]: next,
    });
  };

  const proficientSkillsCount = Object.values(skills).filter((lvl) => lvl !== 'none').length;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h4 className="font-bold text-indigo-400 text-sm uppercase tracking-wider">
          Krok 4: Ekwipunek Początkowy i Zaklęcia
        </h4>
        <p className="text-xs text-slate-400 pt-0.5">
          Dopasuj rynsztunek startowy, biegłości w umiejętnościach oraz początkowe zaklęcia dla
          klasy <span className="text-amber-400 font-semibold">{selectedClass}</span>.
        </p>
      </div>

      {/* SKILLS PROFICIENCY SECTION */}
      {onSkillsChange && (
        <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              <h5 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Biegłości w Umiejętnościach (Skills) ({proficientSkillsCount}/18)
              </h5>
            </div>
            <span className="text-[11px] text-slate-400">
              Kliknij, aby przełączyć: <span className="text-slate-400">Brak</span> ➔{' '}
              <span className="text-emerald-400 font-semibold">Biegłość</span> ➔{' '}
              <span className="text-purple-400 font-semibold">Ekspertyza</span>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {DND_SKILLS.map((skill) => {
              const level = skills[skill.key] || 'none';
              const isProf = level === 'proficient';
              const isExp = level === 'expertise';

              return (
                <button
                  key={skill.key}
                  type="button"
                  onClick={() => handleToggleSkill(skill.key)}
                  className={`p-2 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between min-h-[56px] ${
                    isExp
                      ? 'bg-purple-950/60 border-purple-500/70 text-purple-200 shadow-sm'
                      : isProf
                        ? 'bg-emerald-950/50 border-emerald-500/60 text-emerald-200 shadow-sm'
                        : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-mono text-slate-500">
                      {skill.abilityLabel}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1 rounded ${
                        isExp
                          ? 'bg-purple-500/30 text-purple-300'
                          : isProf
                            ? 'bg-emerald-500/30 text-emerald-300'
                            : 'text-slate-500'
                      }`}
                    >
                      {isExp ? 'EXP' : isProf ? 'PROF' : '—'}
                    </span>
                  </div>
                  <span className="text-xs font-bold truncate block">{skill.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* LEFT COLUMN: EQUIPMENT */}
        <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <Backpack className="w-4 h-4 text-amber-400" />
              <h5 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Ekwipunek Początkowy ({inventory.length})
              </h5>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                data-testid="wizard-open-compendium-btn"
                onClick={() => setIsCompendiumModalOpen(true)}
                className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
              >
                <Search className="w-3 h-3" />
                <span>Z Kompendium</span>
              </button>
              <button
                type="button"
                onClick={handleResetEquipment}
                title="Przywróć domyślny pakiet klasy"
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-amber-300 transition cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Domyślne</span>
              </button>
            </div>
          </div>

          {/* Add custom item form */}
          <form onSubmit={handleAddItem} className="flex items-center gap-2">
            <input
              type="text"
              data-testid="wizard-new-item-input"
              placeholder="Dodaj przedmiot do plecaka..."
              value={newItemInput}
              onChange={(e) => setNewItemInput(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              data-testid="wizard-add-item-btn"
              disabled={!newItemInput.trim()}
              className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition disabled:opacity-40 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Items list */}
          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {inventory.map((item, idx) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: inventory items can have duplicate names
                key={`${item}-${idx}`}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-300 group hover:border-slate-700 transition"
              >
                <div className="flex items-center gap-2 truncate">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
                  <span className="truncate">{item}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(idx)}
                  data-testid={`wizard-remove-item-${idx}`}
                  title="Usuń przedmiot"
                  className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}

            {inventory.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-4 italic">
                Pusty plecak. Kliknij „Domyślne”, aby dodać rynsztunek startowy klasy, lub „Z
                Kompendium”.
              </p>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: SPELLS & CANTRIPS */}
        <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h5 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Księga Czarów i Cantripy ({knownSpells.length})
              </h5>
            </div>
            {isCaster && recommendedCantrips > 0 && (
              <span className="text-[10px] text-indigo-300 font-mono">
                Zalecane cantripy: {recommendedCantrips}
              </span>
            )}
          </div>

          {!isCaster ? (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center space-y-1">
              <p className="text-xs text-slate-400">
                Klasa <span className="text-amber-400 font-bold">{selectedClass}</span> standardowo
                nie używa komórek czarów na tym poziomie.
              </p>
              <p className="text-[11px] text-slate-500">
                Możesz przejść dalej lub dodać zaklęcie poniżej, jeśli postać posiada zdolność
                rasową lub archetyp magiczny.
              </p>
            </div>
          ) : isLoadingSpells ? (
            <p className="text-xs text-slate-500 text-center py-6">
              Ładowanie zaklęć z kompendium...
            </p>
          ) : (
            <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
              {/* Cantrips */}
              {availableCantrips.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Sztuczki (Cantripy / Poziom 0)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {availableCantrips.map((sp) => {
                      const isSelected = knownSpells.includes(sp.name);
                      return (
                        <div
                          key={sp.index}
                          className="group/cantrip relative flex items-center gap-1"
                        >
                          <button
                            type="button"
                            onClick={() => handleToggleSpell(sp.name)}
                            className={`flex-1 min-w-0 p-2 rounded-xl text-left text-xs transition cursor-pointer border flex items-center justify-between ${
                              isSelected
                                ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-200 shadow-sm'
                                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                            }`}
                          >
                            <span className="truncate">{sp.name}</span>
                            {isSelected && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            )}
                          </button>
                          <button
                            type="button"
                            data-testid={`wizard-spell-info-${sp.name}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setInspectingSpell(sp);
                            }}
                            title={`Szczegóły zaklęcia ${sp.name}`}
                            className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-500/20 text-indigo-400 hover:text-white transition cursor-pointer shrink-0"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>

                          {/* Hover Popover Tooltip */}
                          <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 rounded-xl bg-slate-950/95 border border-indigo-500/50 shadow-2xl backdrop-blur-md opacity-0 group-hover/cantrip:opacity-100 transition-all duration-150 z-40 space-y-2 text-left hidden sm:block">
                            <div className="flex items-center justify-between gap-1 pb-1.5 border-b border-slate-800">
                              <span className="font-bold text-slate-100 truncate">{sp.name}</span>
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 shrink-0">
                                Sztuczka
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-1 text-[10px] text-slate-300 font-mono">
                              <div className="bg-slate-900/80 p-1 rounded border border-slate-800">
                                <span className="text-slate-500 block text-[9px]">Czas</span>
                                <span className="truncate block font-semibold">
                                  {sp.castingTime}
                                </span>
                              </div>
                              <div className="bg-slate-900/80 p-1 rounded border border-slate-800">
                                <span className="text-slate-500 block text-[9px]">Zasięg</span>
                                <span className="truncate block font-semibold">{sp.range}</span>
                              </div>
                              <div className="bg-slate-900/80 p-1 rounded border border-slate-800">
                                <span className="text-slate-500 block text-[9px]">Trwanie</span>
                                <span className="truncate block font-semibold">{sp.duration}</span>
                              </div>
                            </div>
                            <p className="text-[11px] text-slate-300 line-clamp-3 leading-relaxed">
                              {sp.description}
                            </p>
                            <div className="text-[9px] text-indigo-400 font-medium flex items-center justify-between pt-1 border-t border-slate-800/80">
                              <span className="capitalize">{sp.school}</span>
                              <span>Kliknij (i), aby otworzyć pełne zasady →</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Leveled Spells */}
              {availableLeveledSpells.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Zaklęcia poziomu 1–{maxSpellLvl}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {availableLeveledSpells.map((sp) => {
                      const isSelected = knownSpells.includes(sp.name);
                      return (
                        <div
                          key={sp.index}
                          className="group/leveled relative flex items-center gap-1"
                        >
                          <button
                            type="button"
                            onClick={() => handleToggleSpell(sp.name)}
                            className={`flex-1 min-w-0 p-2 rounded-xl text-left text-xs transition cursor-pointer border flex items-center justify-between ${
                              isSelected
                                ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-200 shadow-sm'
                                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                            }`}
                          >
                            <div className="truncate min-w-0 pr-1">
                              <span className="truncate block">{sp.name}</span>
                              <span className="text-[10px] text-indigo-400/80 block">
                                Poz. {sp.level}
                              </span>
                            </div>
                            {isSelected && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            )}
                          </button>
                          <button
                            type="button"
                            data-testid={`wizard-spell-info-${sp.name}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setInspectingSpell(sp);
                            }}
                            title={`Szczegóły zaklęcia ${sp.name}`}
                            className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-500/20 text-indigo-400 hover:text-white transition cursor-pointer shrink-0"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>

                          {/* Hover Popover Tooltip */}
                          <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 rounded-xl bg-slate-950/95 border border-indigo-500/50 shadow-2xl backdrop-blur-md opacity-0 group-hover/leveled:opacity-100 transition-all duration-150 z-40 space-y-2 text-left hidden sm:block">
                            <div className="flex items-center justify-between gap-1 pb-1.5 border-b border-slate-800">
                              <span className="font-bold text-slate-100 truncate">{sp.name}</span>
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 shrink-0">
                                Krąg {sp.level}
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-1 text-[10px] text-slate-300 font-mono">
                              <div className="bg-slate-900/80 p-1 rounded border border-slate-800">
                                <span className="text-slate-500 block text-[9px]">Czas</span>
                                <span className="truncate block font-semibold">
                                  {sp.castingTime}
                                </span>
                              </div>
                              <div className="bg-slate-900/80 p-1 rounded border border-slate-800">
                                <span className="text-slate-500 block text-[9px]">Zasięg</span>
                                <span className="truncate block font-semibold">{sp.range}</span>
                              </div>
                              <div className="bg-slate-900/80 p-1 rounded border border-slate-800">
                                <span className="text-slate-500 block text-[9px]">Trwanie</span>
                                <span className="truncate block font-semibold">{sp.duration}</span>
                              </div>
                            </div>
                            <p className="text-[11px] text-slate-300 line-clamp-3 leading-relaxed">
                              {sp.description}
                            </p>
                            <div className="text-[9px] text-indigo-400 font-medium flex items-center justify-between pt-1 border-t border-slate-800/80">
                              <span className="capitalize">{sp.school}</span>
                              <span>Kliknij (i), aby otworzyć pełne zasady →</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Add custom spell form */}
          <form
            onSubmit={handleAddCustomSpell}
            className="flex items-center gap-2 pt-2 border-t border-slate-800/80"
          >
            <input
              type="text"
              data-testid="wizard-custom-spell-input"
              placeholder="Wpisz inne zaklęcie (Homebrew)..."
              value={customSpellInput}
              onChange={(e) => setCustomSpellInput(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!customSpellInput.trim()}
              className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition disabled:opacity-40 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Currently selected spells badges */}
          {knownSpells.length > 0 && (
            <div className="pt-2 flex flex-wrap gap-1.5">
              {knownSpells.map((s) => (
                <span
                  key={s}
                  className="px-2 py-0.5 rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-indigo-200 text-xs font-medium flex items-center gap-1 shadow-sm"
                >
                  <Wand2 className="w-3 h-3 text-indigo-400" />
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
          )}
        </div>
      </div>

      {/* COMPENDIUM EQUIPMENT MODAL */}
      {isCompendiumModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-2xl max-h-[85vh] rounded-2xl p-5 border border-slate-700 flex flex-col gap-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Wybierz Ekwipunek z Kompendium SRD
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCompendiumModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Szukaj broni, zbroi, eliksirów..."
                value={compendiumSearch}
                onChange={(e) => setCompendiumSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 max-h-96 pr-1">
              {isLoadingCompendium ? (
                <p className="text-xs text-slate-400 text-center py-6">Ładowanie przedmiotów...</p>
              ) : filteredCompendiumItems.length > 0 ? (
                filteredCompendiumItems.map((cItem) => (
                  <div
                    key={cItem.index}
                    className="p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 flex items-center justify-between gap-3 transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-100">{cItem.name}</span>
                        <span className="text-[10px] text-indigo-300 font-mono">
                          ({cItem.type})
                        </span>
                        {cItem.rarity && (
                          <span className="text-[9px] px-1 rounded bg-slate-800 text-slate-400">
                            {cItem.rarity}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {cItem.damage ? `${cItem.damage.dice} ${cItem.damage.type} • ` : ''}
                        {cItem.armorClass ? `AC ${cItem.armorClass.base} • ` : ''}
                        Waga: {cItem.weight || 0} lbs {cItem.cost ? `• ${cItem.cost}` : ''}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddFromCompendium(cItem.name)}
                      className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition cursor-pointer"
                    >
                      + Wybierz
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 text-center py-6">
                  Nie znaleziono przedmiotów pasujących do wyszukiwania.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={onPrev}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Wstecz (Statystyki)</span>
        </button>

        <button
          type="button"
          data-testid="wizard-to-summary-btn"
          onClick={onNext}
          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition cursor-pointer"
        >
          <span>Dalej: Podsumowanie</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Spell Detail Inspection Modal */}
      {inspectingSpell && (
        <SpellDetailModal spell={inspectingSpell} onClose={() => setInspectingSpell(null)} />
      )}
    </div>
  );
}
