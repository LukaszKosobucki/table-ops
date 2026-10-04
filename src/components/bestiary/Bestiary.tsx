'use client';

import React, { useState, useCallback } from 'react';
import { MonsterData } from '@/lib/monsters';
import { MonsterFilters } from './MonsterFilters';
import { MonsterCard } from './MonsterCard';
import { MonsterStatblockModal } from './MonsterStatblockModal';
import { HomebrewMonsterModal } from './HomebrewMonsterModal';

interface BestiaryProps {
  initialMonsters: MonsterData[];
}

export function Bestiary({ initialMonsters }: BestiaryProps) {
  const [monsters, setMonsters] = useState<MonsterData[]>(initialMonsters);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCr, setSelectedCr] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [activeMonster, setActiveMonster] = useState<MonsterData | null>(null);

  // Homebrew editing state
  const [homebrewModalOpen, setHomebrewModalOpen] = useState(false);
  const [editingMonster, setEditingMonster] = useState<Partial<MonsterData>>({});

  const filteredMonsters = monsters.filter((m) => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCr = selectedCr === 'ALL' || m.challengeRating.toString() === selectedCr;
    const matchesType =
      selectedType === 'ALL' || (m.type && m.type.toLowerCase().includes(selectedType.toLowerCase()));
    return matchesSearch && matchesCr && matchesType;
  });

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
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <MonsterFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCr={selectedCr}
        onCrChange={setSelectedCr}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
      />

      {/* Grid of Monsters */}
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

      {/* Detail Modal */}
      <MonsterStatblockModal
        monster={activeMonster}
        onClose={() => setActiveMonster(null)}
        onClone={handleCloneMonster}
      />

      {/* Homebrew Edit Modal */}
      <HomebrewMonsterModal
        isOpen={homebrewModalOpen}
        onClose={() => setHomebrewModalOpen(false)}
        monsterData={editingMonster}
        onChangeMonster={setEditingMonster}
        onSave={handleSaveHomebrew}
      />
    </div>
  );
}
