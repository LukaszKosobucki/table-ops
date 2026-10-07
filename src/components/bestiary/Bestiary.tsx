'use client';

import { Package, Skull, Wand2 } from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import type { CompendiumItem, CompendiumSpell } from '@/lib/compendium';
import type { MonsterData } from '@/lib/monsters';
import type { DashboardCharacter } from '../dashboard/types';
import { AssignToCharacterModal } from './AssignToCharacterModal';
import { HomebrewMonsterModal } from './HomebrewMonsterModal';
import { ItemCard } from './ItemCard';
import { ItemDetailModal } from './ItemDetailModal';
import { ItemFilters } from './ItemFilters';
import { MonsterCard } from './MonsterCard';
import { MonsterFilters } from './MonsterFilters';
import { MonsterStatblockModal } from './MonsterStatblockModal';
import { SpellCard } from './SpellCard';
import { SpellDetailModal } from './SpellDetailModal';
import { SpellFilters } from './SpellFilters';

export type CompendiumSubTab = 'monsters' | 'spells' | 'items';

interface BestiaryProps {
  initialMonsters: MonsterData[];
  initialSpells?: CompendiumSpell[];
  initialItems?: CompendiumItem[];
  characters?: DashboardCharacter[];
  onCharacterUpdate?: (character: DashboardCharacter) => void;
}

export function Bestiary({
  initialMonsters,
  initialSpells = [],
  initialItems = [],
  characters = [],
  onCharacterUpdate,
}: BestiaryProps) {
  const [activeSubTab, setActiveSubTab] = useState<CompendiumSubTab>('monsters');

  // --- MONSTERS STATE ---
  const [monsters, setMonsters] = useState<MonsterData[]>(initialMonsters);
  const [monsterSearch, setMonsterSearch] = useState('');
  const [selectedCr, setSelectedCr] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [activeMonster, setActiveMonster] = useState<MonsterData | null>(null);
  const [homebrewModalOpen, setHomebrewModalOpen] = useState(false);
  const [editingMonster, setEditingMonster] = useState<Partial<MonsterData>>({});

  // --- SPELLS STATE ---
  const [spells, setSpells] = useState<CompendiumSpell[]>(initialSpells);
  const [spellSearch, setSpellSearch] = useState('');
  const [spellLevel, setSpellLevel] = useState<string>('ALL');
  const [spellSchool, setSpellSchool] = useState<string>('ALL');
  const [spellClass, setSpellClass] = useState<string>('ALL');
  const [activeSpell, setActiveSpell] = useState<CompendiumSpell | null>(null);

  // --- ITEMS STATE ---
  const [items, setItems] = useState<CompendiumItem[]>(initialItems);
  const [itemSearch, setItemSearch] = useState('');
  const [itemType, setItemType] = useState<string>('ALL');
  const [itemRarity, setItemRarity] = useState<string>('ALL');
  const [activeItem, setActiveItem] = useState<CompendiumItem | null>(null);

  // --- ASSIGN TO CHARACTER MODAL STATE ---
  const [assignModal, setAssignModal] = useState<{
    isOpen: boolean;
    type: 'spell' | 'item';
    name: string;
  } | null>(null);

  // Auto-fetch spells & items on mount if not provided via props
  useEffect(() => {
    let mounted = true;
    if (spells.length === 0) {
      fetch('/api/compendium/spells')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!mounted || !data) return;
          const list = Array.isArray(data) ? data : data.spells;
          if (Array.isArray(list)) setSpells(list);
        })
        .catch(() => {});
    }
    if (items.length === 0) {
      fetch('/api/compendium/items')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!mounted || !data) return;
          const list = Array.isArray(data) ? data : data.items;
          if (Array.isArray(list)) setItems(list);
        })
        .catch(() => {});
    }
    return () => {
      mounted = false;
    };
  }, [spells.length, items.length]);

  // Filtered Monsters
  const filteredMonsters = monsters.filter((m) => {
    const matchesSearch = m.name.toLowerCase().includes(monsterSearch.toLowerCase());
    const matchesCr = selectedCr === 'ALL' || m.challengeRating.toString() === selectedCr;
    const matchesType =
      selectedType === 'ALL' || m.type?.toLowerCase().includes(selectedType.toLowerCase());
    return matchesSearch && matchesCr && matchesType;
  });

  // Filtered Spells
  const filteredSpells = spells.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(spellSearch.toLowerCase()) ||
      s.description.toLowerCase().includes(spellSearch.toLowerCase());
    const matchesLevel = spellLevel === 'ALL' || s.level.toString() === spellLevel;
    const matchesSchool =
      spellSchool === 'ALL' || s.school.toLowerCase() === spellSchool.toLowerCase();
    const matchesClass =
      spellClass === 'ALL' || s.classes.some((c) => c.toLowerCase() === spellClass.toLowerCase());
    return matchesSearch && matchesLevel && matchesSchool && matchesClass;
  });

  // Filtered Items
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
      item.description.toLowerCase().includes(itemSearch.toLowerCase());
    const matchesType =
      itemType === 'ALL' || item.type.toLowerCase().includes(itemType.toLowerCase());
    const matchesRarity =
      itemRarity === 'ALL' || item.rarity.toLowerCase() === itemRarity.toLowerCase();
    return matchesSearch && matchesType && matchesRarity;
  });

  // Clone monster homebrew handler
  const handleCloneMonster = useCallback((m: MonsterData) => {
    setEditingMonster({
      index: `${m.index}-homebrew-${Date.now()}`,
      name: `${m.name} (Custom)`,
      size: m.size,
      type: m.type,
      alignment: m.alignment,
      armorClass: m.armorClass + 1,
      hitPoints: Math.round(m.hitPoints * 1.2),
      hitDice: m.hitDice,
      challengeRating: m.challengeRating,
      xp: m.xp,
      stats: m.stats ? { ...m.stats } : { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      actions: m.actions ? [...m.actions] : [],
      specialAbilities: m.specialAbilities ? [...m.specialAbilities] : [],
    });
    setHomebrewModalOpen(true);
  }, []);

  const handleSaveHomebrew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMonster.name) return;

    const newMonster: MonsterData = {
      index: editingMonster.index || `custom-${Date.now()}`,
      name: editingMonster.name,
      size: editingMonster.size || 'Medium',
      type: editingMonster.type || 'humanoid',
      alignment: editingMonster.alignment || 'neutral',
      armorClass: Number(editingMonster.armorClass) || 10,
      hitPoints: Number(editingMonster.hitPoints) || 10,
      hitDice: editingMonster.hitDice || '2d8',
      challengeRating: Number(editingMonster.challengeRating) || 1,
      xp: Number(editingMonster.xp) || 200,
      stats: editingMonster.stats || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      actions: editingMonster.actions || [],
      specialAbilities: editingMonster.specialAbilities || [],
    };

    setMonsters((prev) => [newMonster, ...prev]);
    setHomebrewModalOpen(false);
    setActiveMonster(newMonster);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
        <button
          type="button"
          onClick={() => setActiveSubTab('monsters')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSubTab === 'monsters'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
          }`}
        >
          <Skull className="w-4 h-4 text-amber-400" />
          <span>Bestiariusz (Potwory)</span>
        </button>

        <button
          type="button"
          data-testid="compendium-spells-tab"
          onClick={() => setActiveSubTab('spells')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSubTab === 'spells'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm shadow-indigo-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
          }`}
        >
          <Wand2 className="w-4 h-4 text-indigo-400" />
          <span>Księga Zaklęć (Spells)</span>
        </button>

        <button
          type="button"
          data-testid="compendium-items-tab"
          onClick={() => setActiveSubTab('items')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSubTab === 'items'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
          }`}
        >
          <Package className="w-4 h-4 text-emerald-400" />
          <span>Ekwipunek i Przedmioty (Items)</span>
        </button>
      </div>

      {/* --- TAB 1: MONSTERS --- */}
      {activeSubTab === 'monsters' && (
        <div className="space-y-6">
          <MonsterFilters
            searchQuery={monsterSearch}
            onSearchChange={setMonsterSearch}
            selectedCr={selectedCr}
            onCrChange={setSelectedCr}
            selectedType={selectedType}
            onTypeChange={setSelectedType}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredMonsters.map((m) => (
              <MonsterCard
                key={m.index}
                monster={m}
                onSelect={() => setActiveMonster(m)}
                onClone={() => handleCloneMonster(m)}
              />
            ))}
          </div>

          {filteredMonsters.length === 0 && (
            <div className="p-8 text-center glass-panel rounded-2xl border border-slate-800 text-slate-400 text-sm">
              Nie znaleziono potworów spełniających podane kryteria wyszukiwania.
            </div>
          )}

          <MonsterStatblockModal
            monster={activeMonster}
            onClose={() => setActiveMonster(null)}
            onClone={handleCloneMonster}
          />

          <HomebrewMonsterModal
            isOpen={homebrewModalOpen}
            onClose={() => setHomebrewModalOpen(false)}
            monsterData={editingMonster}
            onChangeMonster={setEditingMonster}
            onSave={handleSaveHomebrew}
          />
        </div>
      )}

      {/* --- TAB 2: SPELLS --- */}
      {activeSubTab === 'spells' && (
        <div className="space-y-6">
          <SpellFilters
            searchQuery={spellSearch}
            onSearchChange={setSpellSearch}
            selectedLevel={spellLevel}
            onLevelChange={setSpellLevel}
            selectedSchool={spellSchool}
            onSchoolChange={setSpellSchool}
            selectedClass={spellClass}
            onClassChange={setSpellClass}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSpells.map((s) => (
              <SpellCard
                key={s.index}
                spell={s}
                onSelect={() => setActiveSpell(s)}
                onAssign={() => setAssignModal({ isOpen: true, type: 'spell', name: s.name })}
              />
            ))}
          </div>

          {filteredSpells.length === 0 && (
            <div className="p-8 text-center glass-panel rounded-2xl border border-slate-800 text-slate-400 text-sm">
              Nie znaleziono zaklęć spełniających wybrane kryteria filtrów.
            </div>
          )}

          <SpellDetailModal
            spell={activeSpell}
            onClose={() => setActiveSpell(null)}
            onAssign={(s) => setAssignModal({ isOpen: true, type: 'spell', name: s.name })}
          />
        </div>
      )}

      {/* --- TAB 3: ITEMS --- */}
      {activeSubTab === 'items' && (
        <div className="space-y-6">
          <ItemFilters
            searchQuery={itemSearch}
            onSearchChange={setItemSearch}
            selectedType={itemType}
            onTypeChange={setItemType}
            selectedRarity={itemRarity}
            onRarityChange={setItemRarity}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredItems.map((item) => (
              <ItemCard
                key={item.index}
                item={item}
                onSelect={() => setActiveItem(item)}
                onAssign={() => setAssignModal({ isOpen: true, type: 'item', name: item.name })}
              />
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="p-8 text-center glass-panel rounded-2xl border border-slate-800 text-slate-400 text-sm">
              Nie znaleziono przedmiotów spełniających wybrane kryteria filtrów.
            </div>
          )}

          <ItemDetailModal
            item={activeItem}
            onClose={() => setActiveItem(null)}
            onAssign={(it) => setAssignModal({ isOpen: true, type: 'item', name: it.name })}
          />
        </div>
      )}

      {/* Assign Spell/Item to Hero Modal */}
      {assignModal && (
        <AssignToCharacterModal
          isOpen={assignModal.isOpen}
          onClose={() => setAssignModal(null)}
          entityType={assignModal.type}
          entityName={assignModal.name}
          characters={characters}
          onCharacterUpdated={onCharacterUpdate}
        />
      )}
    </div>
  );
}
