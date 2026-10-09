'use client';

import {
  AlertTriangle,
  Backpack,
  Check,
  Package,
  Plus,
  Search,
  Shield,
  Sparkles,
  Swords,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { CompendiumItem } from '@/lib/compendium';
import {
  calculateCarryingCapacity,
  calculateTotalWeight,
  createCustomItem,
  createEquipmentSnapshot,
  type EquipmentItem,
  type ItemCategory,
  isEncumbered,
  toggleAttuned,
  toggleEquipped,
} from '@/lib/inventory';

export interface InventoryManagerProps {
  items: EquipmentItem[];
  strengthScore?: number;
  onChange: (items: EquipmentItem[]) => void;
  readOnly?: boolean;
}

const CATEGORIES: ItemCategory[] = [
  'Weapon',
  'Armor',
  'Shield',
  'Wondrous Item',
  'Potion',
  'Ammunition',
  'Ring',
  'Rod',
  'Scroll',
  'Staff',
  'Wand',
  'Adventuring Gear',
  'Other',
];

export function InventoryManager({
  items,
  strengthScore = 10,
  onChange,
  readOnly = false,
}: InventoryManagerProps) {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isCompendiumOpen, setIsCompendiumOpen] = useState(false);
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Compendium modal state
  const [compendiumItems, setCompendiumItems] = useState<CompendiumItem[]>([]);
  const [compendiumSearch, setCompendiumSearch] = useState('');
  const [isLoadingCompendium, setIsLoadingCompendium] = useState(false);

  // Custom item form state
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState<ItemCategory>('Weapon');
  const [customWeight, setCustomWeight] = useState('1');
  const [customCost, setCustomCost] = useState('');
  const [customRequiresAttunement, setCustomRequiresAttunement] = useState(false);
  const [customDamageDice, setCustomDamageDice] = useState('1d6');
  const [customDamageType, setCustomDamageType] = useState('Slashing');
  const [customAcBase, setCustomAcBase] = useState('12');
  const [customDescription, setCustomDescription] = useState('');

  // Quick inline add state (for fast simple items)
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickItemName, setQuickItemName] = useState('');

  const totalWeight = calculateTotalWeight(items);
  const carryingCapacity = calculateCarryingCapacity(strengthScore);
  const encumbered = isEncumbered(totalWeight, strengthScore);
  const attunedCount = items.filter((i) => i.isAttuned).length;

  // Load compendium items on demand
  useEffect(() => {
    if (isCompendiumOpen && compendiumItems.length === 0) {
      setIsLoadingCompendium(true);
      fetch('/api/compendium/items?limit=600')
        .then((res) => (res.ok ? res.json() : { items: [] }))
        .then((data) => {
          setCompendiumItems(data.items || data.data || []);
        })
        .catch(() => {})
        .finally(() => setIsLoadingCompendium(false));
    }
  }, [isCompendiumOpen, compendiumItems.length]);

  const handleToggleEquip = (itemId: string) => {
    const { items: updated, error } = toggleEquipped(items, itemId);
    if (error) {
      setErrorMessage(error);
      setTimeout(() => setErrorMessage(null), 4000);
    }
    onChange(updated);
  };

  const handleToggleAttune = (itemId: string) => {
    const { items: updated, error } = toggleAttuned(items, itemId);
    if (error) {
      setErrorMessage(error);
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }
    onChange(updated);
  };

  const handleRemoveItem = (itemId: string) => {
    onChange(items.filter((i) => i.id !== itemId));
  };

  const handleAddCompendiumItem = (compItem: CompendiumItem) => {
    const snapshot = createEquipmentSnapshot(compItem);
    onChange([...items, snapshot]);
    setIsCompendiumOpen(false);
  };

  const handleCreateCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const custom = createCustomItem({
      name: customName.trim(),
      category: customCategory,
      weight: parseFloat(customWeight) || 0,
      cost: customCost.trim(),
      requiresAttunement: customRequiresAttunement,
      description: customDescription.trim(),
      armorClass:
        customCategory === 'Armor' || customCategory === 'Shield'
          ? {
              base: parseInt(customAcBase, 10) || 10,
              dexBonus: customCategory === 'Armor',
            }
          : undefined,
      weaponDetails:
        customCategory === 'Weapon'
          ? {
              damageDice: customDamageDice.trim(),
              damageType: customDamageType.trim(),
              isFinesse: false,
              isRanged: false,
            }
          : undefined,
    });

    onChange([...items, custom]);
    setIsCustomOpen(false);
    // Reset form
    setCustomName('');
    setCustomDescription('');
    setCustomCost('');
    setCustomWeight('1');
  };

  const handleQuickAddSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = quickItemName.trim();
    if (!trimmed) return;

    const newItem: EquipmentItem = {
      id: trimmed,
      name: trimmed,
      category: 'Adventuring Gear',
      weight: 1,
      isEquipped: false,
      isAttuned: false,
      requiresAttunement: false,
      isCustom: false,
    };

    onChange([...items, newItem]);
    setQuickItemName('');
    setIsQuickAddOpen(false);
  };

  const filteredItems = items.filter((item) => {
    if (filterCategory === 'equipped') return item.isEquipped;
    if (filterCategory === 'attuned') return item.isAttuned;
    if (filterCategory !== 'all')
      return item.category.toLowerCase() === filterCategory.toLowerCase();
    return true;
  });

  const filteredCompendium = compendiumItems.filter((item) => {
    if (!compendiumSearch.trim()) return true;
    const q = compendiumSearch.toLowerCase().trim();
    return item.name.toLowerCase().includes(q) || (item.type?.toLowerCase().includes(q) ?? false);
  });

  return (
    <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-4">
      {/* Header and Capacity Indicators */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Backpack className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Ekwipunek i Plecak
          </h3>
        </div>

        {/* Capacity & Attunement Pips */}
        <div className="flex items-center gap-3">
          {/* Weight Indicator */}
          <div
            className={`text-[11px] font-mono px-2 py-0.5 rounded-md border flex items-center gap-1.5 ${
              encumbered
                ? 'bg-rose-950/60 border-rose-800 text-rose-300 font-bold animate-pulse'
                : 'bg-slate-900 border-slate-800 text-slate-300'
            }`}
            title={`Maksymalny udźwig: STR (${strengthScore}) × 15 = ${carryingCapacity} lbs`}
          >
            {encumbered && <AlertTriangle className="w-3 h-3 text-rose-400" />}
            <span>
              Waga: {totalWeight} / {carryingCapacity} lbs
            </span>
          </div>

          {/* Attunement Badge */}
          <div
            className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-purple-950/40 border border-purple-800/60 text-purple-300 flex items-center gap-1"
            title="Dostrojone przedmioty magiczne (limit D&D 5e: 3)"
          >
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>Dostrojone: {attunedCount}/3</span>
          </div>
        </div>
      </div>

      {/* Error / Validation Banner */}
      {errorMessage && (
        <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-center gap-2 animate-fadeIn">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Actions and Category Filters */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1 text-[11px]">
          <button
            type="button"
            onClick={() => setFilterCategory('all')}
            className={`px-2 py-1 rounded transition cursor-pointer ${
              filterCategory === 'all'
                ? 'bg-indigo-600 text-white font-bold'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Wszystkie ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory('equipped')}
            className={`px-2 py-1 rounded transition cursor-pointer ${
              filterCategory === 'equipped'
                ? 'bg-indigo-600 text-white font-bold'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Założone ({items.filter((i) => i.isEquipped).length})
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory('weapon')}
            className={`px-2 py-1 rounded transition cursor-pointer ${
              filterCategory === 'weapon'
                ? 'bg-indigo-600 text-white font-bold'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Bronie
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory('armor')}
            className={`px-2 py-1 rounded transition cursor-pointer ${
              filterCategory === 'armor'
                ? 'bg-indigo-600 text-white font-bold'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Pancerze
          </button>
        </div>

        {/* Add buttons */}
        {!readOnly && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="open-add-item-btn"
              onClick={() => setIsQuickAddOpen(!isQuickAddOpen)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-3 h-3 text-indigo-400" />
              <span>{isQuickAddOpen ? 'Anuluj' : 'Szybkie'}</span>
            </button>
            <button
              type="button"
              data-testid="open-compendium-btn"
              onClick={() => setIsCompendiumOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm shadow-indigo-600/30"
            >
              <Search className="w-3 h-3" />
              <span>Z Kompendium</span>
            </button>
            <button
              type="button"
              data-testid="open-custom-item-btn"
              onClick={() => setIsCustomOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-3 h-3 text-amber-400" />
              <span>Własny (Homebrew)</span>
            </button>
          </div>
        )}
      </div>

      {/* Quick Inline Add Form */}
      {isQuickAddOpen && (
        <form
          onSubmit={handleQuickAddSubmit}
          className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 animate-fadeIn"
        >
          <input
            type="text"
            data-testid="new-item-input"
            placeholder="Wpisz nazwę przedmiotu..."
            value={quickItemName}
            onChange={(e) => setQuickItemName(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
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

      {/* Items List */}
      <div className="space-y-1.5">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <div
              key={item.id}
              data-testid={`inventory-item-row-${item.id}`}
              className="bg-slate-900/70 hover:bg-slate-800/70 border border-slate-800 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-3 transition"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                    item.isEquipped
                      ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                      : 'bg-slate-950 border-slate-800 text-slate-500'
                  }`}
                >
                  {item.category === 'Weapon' ? (
                    <Swords className="w-3.5 h-3.5" />
                  ) : item.category === 'Armor' || item.category === 'Shield' ? (
                    <Shield className="w-3.5 h-3.5" />
                  ) : (
                    <Package className="w-3.5 h-3.5" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-100 truncate">{item.name}</span>

                    {/* Source Tag */}
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                        item.isCustom
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                      }`}
                    >
                      {item.isCustom ? 'Homebrew' : 'SRD'}
                    </span>

                    {/* Category */}
                    <span className="text-[10px] text-slate-400">({item.category})</span>

                    {/* Stats summary */}
                    {item.weaponDetails && (
                      <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/40 px-1 rounded">
                        {item.weaponDetails.damageDice} {item.weaponDetails.damageType}
                      </span>
                    )}

                    {item.armorClass && (
                      <span className="text-[10px] font-mono font-bold text-sky-400 bg-sky-950/40 px-1 rounded">
                        AC {item.armorClass.base}
                        {item.armorClass.dexBonus ? ' + DEX' : ''}
                      </span>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-400 flex items-center gap-3 mt-0.5">
                    <span>Waga: {item.weight} lbs</span>
                    {item.cost && <span>Wartość: {item.cost}</span>}
                    {item.requiresAttunement && (
                      <span className="text-purple-300 italic">Wymaga dostrojenia</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status toggles & Delete */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Equip toggle */}
                {!readOnly && (
                  <button
                    type="button"
                    data-testid={`toggle-equipped-${item.id}`}
                    onClick={() => handleToggleEquip(item.id)}
                    className={`text-[10px] px-2 py-1 rounded font-semibold transition cursor-pointer border flex items-center gap-1 ${
                      item.isEquipped
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm shadow-indigo-600/30'
                        : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {item.isEquipped ? <Check className="w-3 h-3" /> : null}
                    <span>{item.isEquipped ? 'Założone' : 'Załóż'}</span>
                  </button>
                )}

                {/* Attune toggle (only if requires attunement) */}
                {!readOnly && item.requiresAttunement && (
                  <button
                    type="button"
                    data-testid={`toggle-attuned-${item.id}`}
                    onClick={() => handleToggleAttune(item.id)}
                    className={`text-[10px] px-2 py-1 rounded font-semibold transition cursor-pointer border flex items-center gap-1 ${
                      item.isAttuned
                        ? 'bg-purple-600 text-white border-purple-400 shadow-sm shadow-purple-600/30'
                        : 'bg-slate-900 text-purple-400 border-purple-900/60 hover:bg-purple-950/40'
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{item.isAttuned ? 'Dostrojone' : 'Dostrój'}</span>
                  </button>
                )}

                {/* Remove item button */}
                {!readOnly && (
                  <button
                    type="button"
                    data-testid={`remove-item-${item.id}`}
                    onClick={() => handleRemoveItem(item.id)}
                    title={`Usuń ${item.name}`}
                    className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-slate-500 italic py-2 text-center">
            Pusty ekwipunek w tej kategorii. Dodaj przedmiot z kompendium lub stwórz własny.
          </p>
        )}
      </div>

      {/* Compendium Modal */}
      {isCompendiumOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-2xl max-h-[85vh] rounded-2xl p-5 border border-slate-700 flex flex-col gap-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Wybierz Przedmiot z Kompendium D&D 5e (SRD)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCompendiumOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                data-testid="compendium-search-input"
                placeholder="Szukaj broni, pancerzy, mikstur lub pierścieni..."
                value={compendiumSearch}
                onChange={(e) => setCompendiumSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 max-h-96 pr-1">
              {isLoadingCompendium ? (
                <p className="text-xs text-slate-400 text-center py-6">Ładowanie kompendium...</p>
              ) : filteredCompendium.length > 0 ? (
                filteredCompendium.map((cItem) => (
                  <div
                    key={cItem.index}
                    data-testid={`compendium-item-row-${cItem.index}`}
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
                      data-testid={`add-compendium-item-${cItem.index}`}
                      onClick={() => handleAddCompendiumItem(cItem)}
                      className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition cursor-pointer"
                    >
                      + Weź
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 text-center py-6">
                  Nie znaleziono przedmiotów pasujących do frazy.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Custom Item (Homebrew) Modal */}
      {isCustomOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <form
            onSubmit={handleCreateCustomSubmit}
            className="glass-panel w-full max-w-lg rounded-2xl p-5 border border-slate-700 flex flex-col gap-3 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Stwórz Własny Przedmiot (Homebrew)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-[11px] text-slate-400 block mb-1">Nazwa Przedmiotu *</label>
                <input
                  type="text"
                  required
                  data-testid="custom-item-name-input"
                  placeholder="np. Ostrze Płomieni, Tarcza Przodków..."
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Kategoria</label>
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value as ItemCategory)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Waga (lbs)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={customWeight}
                  onChange={(e) => setCustomWeight(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              {customCategory === 'Weapon' && (
                <>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Kość Obrażeń</label>
                    <input
                      type="text"
                      placeholder="1d8"
                      value={customDamageDice}
                      onChange={(e) => setCustomDamageDice(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Typ Obrażeń</label>
                    <input
                      type="text"
                      placeholder="Slashing / Fire"
                      value={customDamageType}
                      onChange={(e) => setCustomDamageType(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </>
              )}

              {(customCategory === 'Armor' || customCategory === 'Shield') && (
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Baza AC</label>
                  <input
                    type="number"
                    min="1"
                    value={customAcBase}
                    onChange={(e) => setCustomAcBase(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              )}

              <div className="col-span-2 flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="requires-attunement-checkbox"
                  checked={customRequiresAttunement}
                  onChange={(e) => setCustomRequiresAttunement(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-0"
                />
                <label htmlFor="requires-attunement-checkbox" className="text-xs text-slate-300">
                  Wymaga dostrojenia (Requires Attunement)
                </label>
              </div>

              <div className="col-span-2">
                <label className="text-[11px] text-slate-400 block mb-1">
                  Opis lub właściwości
                </label>
                <textarea
                  rows={2}
                  placeholder="Krótki opis, efekty specjalne..."
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsCustomOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition cursor-pointer"
              >
                Anuluj
              </button>
              <button
                type="submit"
                data-testid="submit-custom-item-btn"
                className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold transition cursor-pointer shadow-sm shadow-amber-500/20"
              >
                Stwórz Przedmiot
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
