'use client';

import { Filter, Package, Search } from 'lucide-react';

interface ItemFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedType: string;
  onTypeChange: (type: string) => void;
  selectedRarity: string;
  onRarityChange: (rarity: string) => void;
}

export const ITEM_TYPES = [
  { value: 'ALL', label: 'Wszystkie Typy' },
  { value: 'Weapon', label: 'Broń (Weapon)' },
  { value: 'Armor', label: 'Pancerz i Tarcze (Armor)' },
  { value: 'Potion', label: 'Mikstury (Potion)' },
  { value: 'Wondrous Item', label: 'Cudowne Przedmioty (Wondrous)' },
  { value: 'Adventuring Gear', label: 'Wyposażenie Wyprawowe (Gear)' },
];

export const ITEM_RARITIES = [
  { value: 'ALL', label: 'Wszystkie Rzadkości' },
  { value: 'common', label: 'Pospolity (Common)' },
  { value: 'uncommon', label: 'Niepospolity (Uncommon)' },
  { value: 'rare', label: 'Rzadki (Rare)' },
  { value: 'very rare', label: 'Bardzo Rzadki (Very Rare)' },
  { value: 'legendary', label: 'Legendarny (Legendary)' },
];

export function ItemFilters({
  searchQuery,
  onSearchChange,
  selectedType,
  onTypeChange,
  selectedRarity,
  onRarityChange,
}: ItemFiltersProps) {
  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-400" />
            Ekwipunek i Przedmioty Magiczne (D&D 5e SRD)
          </h2>
          <p className="text-xs text-slate-400">
            Przeglądaj bronie, pancerze, eliksiry i artefakty oraz dodawaj je bezpośrednio do
            plecaka bohatera.
          </p>
        </div>

        {/* Search box */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Szukaj przedmiotu (np. Longsword, Potion)..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Filter Selects */}
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/60">
        {/* Type filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-amber-500" />
          <span className="text-xs text-slate-400 font-medium">Typ:</span>
          <select
            value={selectedType}
            onChange={(e) => onTypeChange(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          >
            {ITEM_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Rarity filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Rzadkość:</span>
          <select
            value={selectedRarity}
            onChange={(e) => onRarityChange(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          >
            {ITEM_RARITIES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
