'use client';

import { Filter, Search, Sparkles } from 'lucide-react';

interface MonsterFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCr: string;
  onCrChange: (cr: string) => void;
  selectedType: string;
  onTypeChange: (type: string) => void;
}

export function MonsterFilters({
  searchQuery,
  onSearchChange,
  selectedCr,
  onCrChange,
  selectedType,
  onTypeChange,
}: MonsterFiltersProps) {
  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            Kompendium Bestiariusza (D&D 5e SRD)
          </h2>
          <p className="text-xs text-slate-400">
            Przeglądaj statystyki potworów lub klonuj i twórz wersje Homebrew dla swojej kampanii.
          </p>
        </div>

        {/* Search box */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Szukaj potwora..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/60">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-amber-500" />
          <span className="text-xs text-slate-400 font-medium">Filtruj po CR:</span>
          <select
            value={selectedCr}
            onChange={(e) => onCrChange(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
          >
            <option value="ALL">Wszystkie CR</option>
            <option value="0.25">CR 1/4</option>
            <option value="0.5">CR 1/2</option>
            <option value="1">CR 1</option>
            <option value="2">CR 2</option>
            <option value="3">CR 3</option>
            <option value="5">CR 5</option>
            <option value="10">CR 10</option>
            <option value="17">CR 17</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Typ:</span>
          <select
            value={selectedType}
            onChange={(e) => onTypeChange(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
          >
            <option value="ALL">Wszystkie typy</option>
            <option value="humanoid">Humanoid</option>
            <option value="undead">Undead (Ożywieniec)</option>
            <option value="monstrosity">Monstrosity</option>
            <option value="dragon">Dragon (Smok)</option>
            <option value="fiend">Fiend</option>
            <option value="aberration">Aberration</option>
          </select>
        </div>
      </div>
    </div>
  );
}
