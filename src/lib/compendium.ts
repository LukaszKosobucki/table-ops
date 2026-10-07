import fs from 'node:fs';
import path from 'node:path';
import { getMonsters, type MonsterData } from './monsters';

export interface CompendiumSpell {
  index: string;
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  duration: string;
  components: string[];
  material?: string;
  ritual: boolean;
  concentration: boolean;
  classes: string[];
  description: string;
  higherLevels?: string;
}

export interface SpellFilterOptions {
  search?: string;
  level?: number | string;
  school?: string;
  class?: string;
  concentration?: boolean;
  ritual?: boolean;
}

export interface CompendiumItem {
  index: string;
  name: string;
  type: string;
  rarity: string;
  cost: string;
  weight?: number;
  properties?: string[];
  damage?: { dice: string; type: string };
  armorClass?: { base: number; dexBonus: boolean; maxDex?: number };
  description: string;
}

export interface ItemFilterOptions {
  search?: string;
  type?: string;
  rarity?: string;
}

export interface MonsterFilterOptions {
  search?: string;
  cr?: string | number;
  type?: string;
}

let cachedSpells: CompendiumSpell[] | null = null;
let cachedItems: CompendiumItem[] | null = null;

function loadSpells(): CompendiumSpell[] {
  if (cachedSpells) return cachedSpells;
  try {
    const seedPath = path.join(process.cwd(), 'prisma', 'spells_seed.json');
    if (fs.existsSync(seedPath)) {
      const data = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
      if (Array.isArray(data) && data.length > 0) {
        cachedSpells = data;
        return data;
      }
    }
  } catch (err) {
    console.warn('Failed to load spells from prisma/spells_seed.json:', err);
  }
  return [];
}

function loadItems(): CompendiumItem[] {
  if (cachedItems) return cachedItems;
  try {
    const seedPath = path.join(process.cwd(), 'prisma', 'items_seed.json');
    if (fs.existsSync(seedPath)) {
      const data = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
      if (Array.isArray(data) && data.length > 0) {
        cachedItems = data;
        return data;
      }
    }
  } catch (err) {
    console.warn('Failed to load items from prisma/items_seed.json:', err);
  }
  return [];
}

export async function getCompendiumSpells(filter?: SpellFilterOptions): Promise<CompendiumSpell[]> {
  const spells = loadSpells();
  if (!filter) return spells;

  const searchQuery = filter.search?.trim().toLowerCase();
  const targetLevel =
    filter.level !== undefined && filter.level !== 'all' ? Number(filter.level) : null;
  const targetSchool =
    filter.school && filter.school !== 'all' ? filter.school.toLowerCase() : null;
  const targetClass = filter.class && filter.class !== 'all' ? filter.class.toLowerCase() : null;

  return spells.filter((spell) => {
    if (searchQuery) {
      const nameMatch = spell.name.toLowerCase().includes(searchQuery);
      const descMatch = spell.description.toLowerCase().includes(searchQuery);
      if (!nameMatch && !descMatch) return false;
    }

    if (targetLevel !== null && !Number.isNaN(targetLevel)) {
      if (spell.level !== targetLevel) return false;
    }

    if (targetSchool) {
      if (spell.school.toLowerCase() !== targetSchool) return false;
    }

    if (targetClass) {
      if (!spell.classes.some((c) => c.toLowerCase() === targetClass)) return false;
    }

    if (filter.concentration !== undefined) {
      if (spell.concentration !== filter.concentration) return false;
    }

    if (filter.ritual !== undefined) {
      if (spell.ritual !== filter.ritual) return false;
    }

    return true;
  });
}

export async function getCompendiumItems(filter?: ItemFilterOptions): Promise<CompendiumItem[]> {
  const items = loadItems();
  if (!filter) return items;

  const searchQuery = filter.search?.trim().toLowerCase();
  const targetType = filter.type && filter.type !== 'all' ? filter.type.toLowerCase() : null;
  const targetRarity =
    filter.rarity && filter.rarity !== 'all' ? filter.rarity.toLowerCase() : null;

  return items.filter((item) => {
    if (searchQuery) {
      const nameMatch = item.name.toLowerCase().includes(searchQuery);
      const descMatch = item.description.toLowerCase().includes(searchQuery);
      if (!nameMatch && !descMatch) return false;
    }

    if (targetType) {
      if (item.type.toLowerCase() !== targetType) return false;
    }

    if (targetRarity) {
      if (item.rarity.toLowerCase() !== targetRarity) return false;
    }

    return true;
  });
}

export async function getCompendiumMonsters(filter?: MonsterFilterOptions): Promise<MonsterData[]> {
  const allMonsters = await getMonsters();
  if (!filter) return allMonsters;

  const searchQuery = filter.search?.trim().toLowerCase();
  const targetCr = filter.cr !== undefined && filter.cr !== 'all' ? String(filter.cr) : null;
  const targetType = filter.type && filter.type !== 'all' ? filter.type.toLowerCase() : null;

  return allMonsters.filter((monster) => {
    if (searchQuery) {
      const nameMatch = monster.name.toLowerCase().includes(searchQuery);
      if (!nameMatch) return false;
    }

    if (targetCr !== null) {
      if (String(monster.challengeRating) !== targetCr) return false;
    }

    if (targetType) {
      if (!monster.type?.toLowerCase().includes(targetType)) return false;
    }

    return true;
  });
}
