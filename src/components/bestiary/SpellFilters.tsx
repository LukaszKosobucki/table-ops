'use client';

import { Filter, Search, Sparkles } from 'lucide-react';

interface SpellFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedLevel: string;
  onLevelChange: (level: string) => void;
  selectedSchool: string;
  onSchoolChange: (school: string) => void;
  selectedClass: string;
  onClassChange: (className: string) => void;
}

export const SPELL_SCHOOLS = [
  { value: 'ALL', label: 'Wszystkie Szkoły' },
  { value: 'abjuration', label: 'Abjuration (Odpychanie)' },
  { value: 'conjuration', label: 'Conjuration (Przywoływanie)' },
  { value: 'divination', label: 'Divination (Wieszczenie)' },
  { value: 'enchantment', label: 'Enchantment (Zaczarowanie)' },
  { value: 'evocation', label: 'Evocation (Ewokacja)' },
  { value: 'illusion', label: 'Illusion (Iluzja)' },
  { value: 'necromancy', label: 'Necromancy (Nekromancja)' },
  { value: 'transmutation', label: 'Transmutation (Transmutacja)' },
];

export const SPELL_LEVELS = [
  { value: 'ALL', label: 'Wszystkie Poziomy' },
  { value: '0', label: 'Sztuczki (Cantrip)' },
  { value: '1', label: 'Poziom 1' },
  { value: '2', label: 'Poziom 2' },
  { value: '3', label: 'Poziom 3' },
  { value: '4', label: 'Poziom 4' },
  { value: '5', label: 'Poziom 5' },
  { value: '6', label: 'Poziom 6' },
  { value: '7', label: 'Poziom 7' },
  { value: '8', label: 'Poziom 8' },
  { value: '9', label: 'Poziom 9' },
];

export const SPELL_CLASSES = [
  { value: 'ALL', label: 'Wszystkie Klasy' },
  { value: 'Bard', label: 'Bard' },
  { value: 'Cleric', label: 'Kleryk (Cleric)' },
  { value: 'Druid', label: 'Druid' },
  { value: 'Paladin', label: 'Paladyn (Paladin)' },
  { value: 'Ranger', label: 'Tropiciel (Ranger)' },
  { value: 'Sorcerer', label: 'Czarownik (Sorcerer)' },
  { value: 'Warlock', label: 'Czarnoksiężnik (Warlock)' },
  { value: 'Wizard', label: 'Mag (Wizard)' },
];

export function SpellFilters({
  searchQuery,
  onSearchChange,
  selectedLevel,
  onLevelChange,
  selectedSchool,
  onSchoolChange,
  selectedClass,
  onClassChange,
}: SpellFiltersProps) {
  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            Księga Zaklęć (D&D 5e SRD)
          </h2>
          <p className="text-xs text-slate-400">
            Wyszukuj zaklęcia wg kręgów i szkół magii oraz przypisuj je do kart bohaterów drużyny.
          </p>
        </div>

        {/* Search box */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Szukaj zaklęcia (np. Cure Wounds, Fireball)..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Filter Selects */}
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/60">
        {/* Level filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-indigo-400" />
          <span className="text-xs text-slate-400 font-medium">Poziom:</span>
          <select
            value={selectedLevel}
            onChange={(e) => onLevelChange(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            {SPELL_LEVELS.map((lvl) => (
              <option key={lvl.value} value={lvl.value}>
                {lvl.label}
              </option>
            ))}
          </select>
        </div>

        {/* School filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Szkoła:</span>
          <select
            value={selectedSchool}
            onChange={(e) => onSchoolChange(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            {SPELL_SCHOOLS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Class filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Klasa:</span>
          <select
            value={selectedClass}
            onChange={(e) => onClassChange(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            {SPELL_CLASSES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
