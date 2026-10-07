'use client';

import {
  Backpack,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { CompendiumSpell } from '@/lib/compendium';
import {
  getCanonicalClassName,
  getDefaultClassEquipment,
  getMaxSpellLevel,
  getRecommendedCantripsCount,
  isSpellcasterClass,
} from '@/lib/dnd-rules';

interface StepEquipmentSpellsProps {
  selectedClass: string;
  level: number;
  inventory: string[];
  onInventoryChange: (inv: string[]) => void;
  knownSpells: string[];
  onKnownSpellsChange: (spells: string[]) => void;
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

  // New item input state
  const [newItemInput, setNewItemInput] = useState('');
  // Custom spell input state
  const [customSpellInput, setCustomSpellInput] = useState('');

  // Auto-fetch spells on mount
  useEffect(() => {
    let mounted = true;
    setIsLoadingSpells(true);
    fetch('/api/compendium/spells')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!mounted || !data) return;
        const list = Array.isArray(data) ? data : data.spells;
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

  // Filter spells for class
  const classSpells = compendiumSpells.filter((s) =>
    s.classes.some((c) => c.toLowerCase() === canonicalClass.toLowerCase())
  );
  const availableCantrips = classSpells.filter((s) => s.level === 0);
  const availableLeveledSpells = classSpells.filter((s) => s.level > 0 && s.level <= maxSpellLvl);

  // Equipment handlers
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newItemInput.trim();
    if (!trimmed) return;
    onInventoryChange([...inventory, trimmed]);
    setNewItemInput('');
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

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h4 className="font-bold text-indigo-400 text-sm uppercase tracking-wider">
          Krok 4: Ekwipunek Początkowy i Zaklęcia
        </h4>
        <p className="text-xs text-slate-400 pt-0.5">
          Dopasuj rynsztunek startowy oraz wybierz początkowe zaklęcia i sztuczki (cantripy) dla
          klasy <span className="text-amber-400 font-semibold">{selectedClass}</span>.
        </p>
      </div>

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
                key={item}
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
                Pusty plecak. Kliknij „Domyślne”, aby dodać rynsztunek startowy klasy.
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
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
              <p className="text-xs text-slate-300">
                Klasa <strong className="text-amber-400">{selectedClass}</strong> standardowo nie
                używa komórek czarów na tym poziomie.
              </p>
              <p className="text-[11px] text-slate-500">
                Możesz przejść dalej lub dodać zaklęcie poniżej, jeśli postać posiada zdolność
                rasową lub archetyp magiczny.
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
              {/* CANTRIPS SECTION */}
              {availableCantrips.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-bold text-indigo-300">
                      Sztuczki (Cantripy, Poziom 0):
                    </span>
                    <span className="font-mono text-[10px]">
                      {availableCantrips.filter((c) => knownSpells.includes(c.name)).length} wybrane
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {availableCantrips.map((c) => {
                      const isSelected = knownSpells.includes(c.name);
                      return (
                        <button
                          key={c.index}
                          type="button"
                          onClick={() => handleToggleSpell(c.name)}
                          className={`p-2 rounded-xl text-left text-xs font-medium border transition flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-200 shadow-sm'
                              : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                          }`}
                        >
                          <span className="truncate">{c.name}</span>
                          <span className="text-[9px] font-mono px-1 rounded bg-slate-800/80 text-slate-400 ml-1">
                            Cantrip
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* LEVELED SPELLS SECTION */}
              {availableLeveledSpells.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800/60">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-bold text-amber-300">
                      Zaklęcia Klasowe (Kręgi 1–{maxSpellLvl}):
                    </span>
                    <span className="font-mono text-[10px]">
                      {availableLeveledSpells.filter((s) => knownSpells.includes(s.name)).length}{' '}
                      wybrane
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {availableLeveledSpells.map((s) => {
                      const isSelected = knownSpells.includes(s.name);
                      return (
                        <button
                          key={s.index}
                          type="button"
                          onClick={() => handleToggleSpell(s.name)}
                          className={`p-2 rounded-xl text-left text-xs font-medium border transition flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500/20 border-amber-500/50 text-amber-200 shadow-sm'
                              : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                          }`}
                        >
                          <span className="truncate">{s.name}</span>
                          <span className="text-[9px] font-mono px-1 rounded bg-slate-800/80 text-amber-400/80 ml-1">
                            Lvl {s.level}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {isLoadingSpells && (
                <p className="text-xs text-slate-500 italic text-center py-2">
                  Ładowanie zaklęć z kompendium...
                </p>
              )}
            </div>
          )}

          {/* Custom spell input form */}
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
    </div>
  );
}
