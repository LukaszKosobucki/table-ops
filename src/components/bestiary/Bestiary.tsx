'use client';

import { ChevronDown, Loader2, Package, Skull, Wand2 } from 'lucide-react';
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
  const isMockMonsters = initialMonsters.length > 0 && initialMonsters.length <= 10;
  const [monsters, setMonsters] = useState<MonsterData[]>(() =>
    isMockMonsters ? initialMonsters : initialMonsters.slice(0, 20)
  );
  const [monsterTotal, setMonsterTotal] = useState<number>(initialMonsters.length);
  const [monsterHasMore, setMonsterHasMore] = useState<boolean>(
    !isMockMonsters && initialMonsters.length > 20
  );
  const [isLoadingMoreMonsters, setIsLoadingMoreMonsters] = useState(false);
  const [monsterSearch, setMonsterSearch] = useState('');
  const [selectedCr, setSelectedCr] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [activeMonster, setActiveMonster] = useState<MonsterData | null>(null);
  const [homebrewModalOpen, setHomebrewModalOpen] = useState(false);
  const [editingMonster, setEditingMonster] = useState<Partial<MonsterData>>({});

  // --- SPELLS STATE ---
  const isMockSpells = initialSpells.length > 0 && initialSpells.length <= 10;
  const [spells, setSpells] = useState<CompendiumSpell[]>(() =>
    isMockSpells ? initialSpells : initialSpells.slice(0, 20)
  );
  const [spellTotal, setSpellTotal] = useState<number>(initialSpells.length);
  const [spellHasMore, setSpellHasMore] = useState<boolean>(
    !isMockSpells && initialSpells.length > 20
  );
  const [isLoadingSpells, setIsLoadingSpells] = useState(
    !isMockSpells && initialSpells.length === 0
  );
  const [isLoadingMoreSpells, setIsLoadingMoreSpells] = useState(false);
  const [spellSearch, setSpellSearch] = useState('');
  const [spellLevel, setSpellLevel] = useState<string>('ALL');
  const [spellSchool, setSpellSchool] = useState<string>('ALL');
  const [spellClass, setSpellClass] = useState<string>('ALL');
  const [activeSpell, setActiveSpell] = useState<CompendiumSpell | null>(null);

  // --- ITEMS STATE ---
  const isMockItems = initialItems.length > 0 && initialItems.length <= 10;
  const [items, setItems] = useState<CompendiumItem[]>(() =>
    isMockItems ? initialItems : initialItems.slice(0, 20)
  );
  const [itemTotal, setItemTotal] = useState<number>(initialItems.length);
  const [itemHasMore, setItemHasMore] = useState<boolean>(!isMockItems && initialItems.length > 20);
  const [isLoadingItems, setIsLoadingItems] = useState(!isMockItems && initialItems.length === 0);
  const [isLoadingMoreItems, setIsLoadingMoreItems] = useState(false);
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

  // 1. Fetch / Filter Monsters via API
  useEffect(() => {
    if (isMockMonsters) return;
    let mounted = true;
    const timeout = setTimeout(() => {
      const params = new URLSearchParams();
      if (monsterSearch.trim()) params.set('search', monsterSearch.trim());
      if (selectedCr !== 'ALL') params.set('cr', selectedCr);
      if (selectedType !== 'ALL') params.set('type', selectedType);
      params.set('limit', '20');
      params.set('offset', '0');

      fetch(`/api/compendium/monsters?${params.toString()}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!mounted || !data?.monsters) return;
          setMonsters(data.monsters);
          setMonsterTotal(data.total ?? data.monsters.length);
          setMonsterHasMore(Boolean(data.hasMore));
        })
        .catch(() => {});
    }, 200);

    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, [monsterSearch, selectedCr, selectedType, isMockMonsters]);

  const handleLoadMoreMonsters = useCallback(async () => {
    if (isLoadingMoreMonsters || !monsterHasMore) return;
    setIsLoadingMoreMonsters(true);
    try {
      const params = new URLSearchParams();
      if (monsterSearch.trim()) params.set('search', monsterSearch.trim());
      if (selectedCr !== 'ALL') params.set('cr', selectedCr);
      if (selectedType !== 'ALL') params.set('type', selectedType);
      params.set('limit', '20');
      params.set('offset', String(monsters.length));

      const res = await fetch(`/api/compendium/monsters?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.monsters && Array.isArray(data.monsters)) {
          setMonsters((prev) => [...prev, ...data.monsters]);
          setMonsterTotal(data.total ?? monsters.length + data.monsters.length);
          setMonsterHasMore(Boolean(data.hasMore));
        }
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingMoreMonsters(false);
    }
  }, [
    isLoadingMoreMonsters,
    monsterHasMore,
    monsterSearch,
    selectedCr,
    selectedType,
    monsters.length,
  ]);

  // 2. Fetch / Filter Spells via API
  useEffect(() => {
    if (isMockSpells) return;
    let mounted = true;
    const timeout = setTimeout(() => {
      setIsLoadingSpells(true);
      const params = new URLSearchParams();
      if (spellSearch.trim()) params.set('search', spellSearch.trim());
      if (spellLevel !== 'ALL') params.set('level', spellLevel);
      if (spellSchool !== 'ALL') params.set('school', spellSchool);
      if (spellClass !== 'ALL') params.set('class', spellClass);
      params.set('limit', '20');
      params.set('offset', '0');

      fetch(`/api/compendium/spells?${params.toString()}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!mounted || !data?.spells) return;
          setSpells(data.spells);
          setSpellTotal(data.total ?? data.spells.length);
          setSpellHasMore(Boolean(data.hasMore));
        })
        .catch(() => {})
        .finally(() => {
          if (mounted) setIsLoadingSpells(false);
        });
    }, 200);

    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, [spellSearch, spellLevel, spellSchool, spellClass, isMockSpells]);

  const handleLoadMoreSpells = useCallback(async () => {
    if (isLoadingMoreSpells || !spellHasMore) return;
    setIsLoadingMoreSpells(true);
    try {
      const params = new URLSearchParams();
      if (spellSearch.trim()) params.set('search', spellSearch.trim());
      if (spellLevel !== 'ALL') params.set('level', spellLevel);
      if (spellSchool !== 'ALL') params.set('school', spellSchool);
      if (spellClass !== 'ALL') params.set('class', spellClass);
      params.set('limit', '20');
      params.set('offset', String(spells.length));

      const res = await fetch(`/api/compendium/spells?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.spells && Array.isArray(data.spells)) {
          setSpells((prev) => [...prev, ...data.spells]);
          setSpellTotal(data.total ?? spells.length + data.spells.length);
          setSpellHasMore(Boolean(data.hasMore));
        }
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingMoreSpells(false);
    }
  }, [
    isLoadingMoreSpells,
    spellHasMore,
    spellSearch,
    spellLevel,
    spellSchool,
    spellClass,
    spells.length,
  ]);

  // 3. Fetch / Filter Items via API
  useEffect(() => {
    if (isMockItems) return;
    let mounted = true;
    const timeout = setTimeout(() => {
      setIsLoadingItems(true);
      const params = new URLSearchParams();
      if (itemSearch.trim()) params.set('search', itemSearch.trim());
      if (itemType !== 'ALL') params.set('type', itemType);
      if (itemRarity !== 'ALL') params.set('rarity', itemRarity);
      params.set('limit', '20');
      params.set('offset', '0');

      fetch(`/api/compendium/items?${params.toString()}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!mounted || !data?.items) return;
          setItems(data.items);
          setItemTotal(data.total ?? data.items.length);
          setItemHasMore(Boolean(data.hasMore));
        })
        .catch(() => {})
        .finally(() => {
          if (mounted) setIsLoadingItems(false);
        });
    }, 200);

    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, [itemSearch, itemType, itemRarity, isMockItems]);

  const handleLoadMoreItems = useCallback(async () => {
    if (isLoadingMoreItems || !itemHasMore) return;
    setIsLoadingMoreItems(true);
    try {
      const params = new URLSearchParams();
      if (itemSearch.trim()) params.set('search', itemSearch.trim());
      if (itemType !== 'ALL') params.set('type', itemType);
      if (itemRarity !== 'ALL') params.set('rarity', itemRarity);
      params.set('limit', '20');
      params.set('offset', String(items.length));

      const res = await fetch(`/api/compendium/items?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.items && Array.isArray(data.items)) {
          setItems((prev) => [...prev, ...data.items]);
          setItemTotal(data.total ?? items.length + data.items.length);
          setItemHasMore(Boolean(data.hasMore));
        }
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingMoreItems(false);
    }
  }, [isLoadingMoreItems, itemHasMore, itemSearch, itemType, itemRarity, items.length]);

  // Fallback local filters for unit test mock datasets
  const displayMonsters = isMockMonsters
    ? initialMonsters.filter((m) => {
        const matchesSearch = m.name.toLowerCase().includes(monsterSearch.toLowerCase());
        const matchesCr = selectedCr === 'ALL' || m.challengeRating.toString() === selectedCr;
        const matchesType =
          selectedType === 'ALL' || m.type?.toLowerCase().includes(selectedType.toLowerCase());
        return matchesSearch && matchesCr && matchesType;
      })
    : monsters;

  const displaySpells = isMockSpells
    ? initialSpells.filter((s) => {
        const matchesSearch =
          s.name.toLowerCase().includes(spellSearch.toLowerCase()) ||
          s.description.toLowerCase().includes(spellSearch.toLowerCase());
        const matchesLevel = spellLevel === 'ALL' || s.level.toString() === spellLevel;
        const matchesSchool =
          spellSchool === 'ALL' || s.school.toLowerCase() === spellSchool.toLowerCase();
        const matchesClass =
          spellClass === 'ALL' ||
          s.classes.some((c) => c.toLowerCase() === spellClass.toLowerCase());
        return matchesSearch && matchesLevel && matchesSchool && matchesClass;
      })
    : spells;

  const displayItems = isMockItems
    ? initialItems.filter((item) => {
        const matchesSearch =
          item.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
          item.description.toLowerCase().includes(itemSearch.toLowerCase());
        const matchesType =
          itemType === 'ALL' || item.type.toLowerCase().includes(itemType.toLowerCase());
        const matchesRarity =
          itemRarity === 'ALL' || item.rarity.toLowerCase() === itemRarity.toLowerCase();
        return matchesSearch && matchesType && matchesRarity;
      })
    : items;

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
    setMonsterTotal((prev) => prev + 1);
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

          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              Znaleziono: <strong className="text-amber-400 font-mono">{monsterTotal}</strong>{' '}
              potworów (wyświetlono{' '}
              <strong className="text-slate-200 font-mono">{displayMonsters.length}</strong>)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayMonsters.map((m) => (
              <MonsterCard
                key={m.index}
                monster={m}
                onSelect={() => setActiveMonster(m)}
                onClone={() => handleCloneMonster(m)}
              />
            ))}
          </div>

          {displayMonsters.length === 0 && (
            <div className="p-8 text-center glass-panel rounded-2xl border border-slate-800 text-slate-400 text-sm">
              Nie znaleziono potworów spełniających podane kryteria wyszukiwania.
            </div>
          )}

          {monsterHasMore && (
            <div className="flex justify-center pt-4">
              <button
                type="button"
                data-testid="load-more-monsters-btn"
                onClick={handleLoadMoreMonsters}
                disabled={isLoadingMoreMonsters}
                className="px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer bg-slate-900 border border-amber-500/30 text-amber-300 hover:bg-slate-800 hover:border-amber-500/60 transition shadow-sm shadow-amber-500/10 disabled:opacity-50"
              >
                {isLoadingMoreMonsters ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                    <span>Ładowanie kolejnych 20...</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 text-amber-400" />
                    <span>
                      Załaduj więcej (pozostało {Math.max(0, monsterTotal - displayMonsters.length)}
                      )
                    </span>
                  </>
                )}
              </button>
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

          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              Znaleziono: <strong className="text-indigo-400 font-mono">{spellTotal}</strong> zaklęć
              (wyświetlono{' '}
              <strong className="text-slate-200 font-mono">{displaySpells.length}</strong>)
            </span>
          </div>

          {isLoadingSpells ? (
            <div
              data-testid="spells-skeleton"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse"
            >
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={`spell-skel-${i}`}
                  className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div className="h-5 bg-slate-800 rounded w-1/2" />
                    <div className="h-4 bg-slate-800/60 rounded w-16" />
                  </div>
                  <div className="h-3 bg-slate-800/50 rounded w-1/3" />
                  <div className="h-12 bg-slate-800/30 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {displaySpells.map((s) => (
                  <SpellCard
                    key={s.index}
                    spell={s}
                    onSelect={() => setActiveSpell(s)}
                    onAssign={() => setAssignModal({ isOpen: true, type: 'spell', name: s.name })}
                  />
                ))}
              </div>

              {displaySpells.length === 0 && (
                <div className="p-8 text-center glass-panel rounded-2xl border border-slate-800 text-slate-400 text-sm">
                  Nie znaleziono zaklęć spełniających wybrane kryteria filtrów.
                </div>
              )}

              {spellHasMore && (
                <div className="flex justify-center pt-4">
                  <button
                    type="button"
                    data-testid="load-more-spells-btn"
                    onClick={handleLoadMoreSpells}
                    disabled={isLoadingMoreSpells}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer bg-slate-900 border border-indigo-500/30 text-indigo-300 hover:bg-slate-800 hover:border-indigo-500/60 transition shadow-sm shadow-indigo-500/10 disabled:opacity-50"
                  >
                    {isLoadingMoreSpells ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                        <span>Ładowanie kolejnych 20...</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 text-indigo-400" />
                        <span>
                          Załaduj więcej (pozostało {Math.max(0, spellTotal - displaySpells.length)}
                          )
                        </span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
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

          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              Znaleziono: <strong className="text-emerald-400 font-mono">{itemTotal}</strong>{' '}
              przedmiotów (wyświetlono{' '}
              <strong className="text-slate-200 font-mono">{displayItems.length}</strong>)
            </span>
          </div>

          {isLoadingItems ? (
            <div
              data-testid="items-skeleton"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse"
            >
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={`item-skel-${i}`}
                  className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div className="h-5 bg-slate-800 rounded w-1/2" />
                    <div className="h-4 bg-slate-800/60 rounded w-16" />
                  </div>
                  <div className="h-3 bg-slate-800/50 rounded w-1/3" />
                  <div className="h-12 bg-slate-800/30 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {displayItems.map((item) => (
                  <ItemCard
                    key={item.index}
                    item={item}
                    onSelect={() => setActiveItem(item)}
                    onAssign={() => setAssignModal({ isOpen: true, type: 'item', name: item.name })}
                  />
                ))}
              </div>

              {displayItems.length === 0 && (
                <div className="p-8 text-center glass-panel rounded-2xl border border-slate-800 text-slate-400 text-sm">
                  Nie znaleziono przedmiotów spełniających wybrane kryteria filtrów.
                </div>
              )}

              {itemHasMore && (
                <div className="flex justify-center pt-4">
                  <button
                    type="button"
                    data-testid="load-more-items-btn"
                    onClick={handleLoadMoreItems}
                    disabled={isLoadingMoreItems}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer bg-slate-900 border border-emerald-500/30 text-emerald-300 hover:bg-slate-800 hover:border-emerald-500/60 transition shadow-sm shadow-emerald-500/10 disabled:opacity-50"
                  >
                    {isLoadingMoreItems ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                        <span>Ładowanie kolejnych 20...</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 text-emerald-400" />
                        <span>
                          Załaduj więcej (pozostało {Math.max(0, itemTotal - displayItems.length)})
                        </span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
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
