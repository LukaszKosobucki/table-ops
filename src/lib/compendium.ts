import fs from 'node:fs';
import path from 'node:path';
import { isDemoMode } from './mock-data';
import { getMonsters, type MonsterData } from './monsters';
import { prisma } from './prisma';

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

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

export interface SpellFilterOptions extends PaginationOptions {
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

export interface ItemFilterOptions extends PaginationOptions {
  search?: string;
  type?: string;
  rarity?: string;
}

export interface MonsterFilterOptions extends PaginationOptions {
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

async function fetchSpellsData(): Promise<CompendiumSpell[]> {
  if (isDemoMode()) {
    return loadSpells();
  }
  if (process.env.DATABASE_URL) {
    try {
      const dbSpells = await prisma.spell.findMany({
        orderBy: { name: 'asc' },
      });
      if (dbSpells.length > 0) {
        return dbSpells.map((s) => ({
          index: s.index,
          name: s.name,
          level: s.level,
          school: s.school,
          castingTime: s.castingTime,
          range: s.range,
          duration: s.duration,
          components: Array.isArray(s.components) ? (s.components as string[]) : ['V', 'S'],
          material: s.material || undefined,
          ritual: s.ritual,
          concentration: s.concentration,
          classes: Array.isArray(s.classes) ? (s.classes as string[]) : [],
          description: s.description,
          higherLevels: s.higherLevels || undefined,
        }));
      }
    } catch {
      // Database connection fallback
    }
  }
  return loadSpells();
}

async function fetchItemsData(): Promise<CompendiumItem[]> {
  if (isDemoMode()) {
    return loadItems();
  }
  if (process.env.DATABASE_URL) {
    try {
      const dbItems = await prisma.item.findMany({
        orderBy: { name: 'asc' },
      });
      if (dbItems.length > 0) {
        return dbItems.map((i) => ({
          index: i.index,
          name: i.name,
          type: i.type,
          rarity: i.rarity,
          cost: i.cost,
          weight: i.weight ?? undefined,
          properties: Array.isArray(i.properties) ? (i.properties as string[]) : undefined,
          damage: (i.damage as { dice: string; type: string }) || undefined,
          armorClass:
            (i.armorClass as { base: number; dexBonus: boolean; maxDex?: number }) || undefined,
          description: i.description,
        }));
      }
    } catch {
      // Database connection fallback
    }
  }
  return loadItems();
}

function filterSpellsList(
  spells: CompendiumSpell[],
  filter?: SpellFilterOptions
): CompendiumSpell[] {
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

export async function getCompendiumSpells(filter?: SpellFilterOptions): Promise<CompendiumSpell[]> {
  const allSpells = await fetchSpellsData();
  const filtered = filterSpellsList(allSpells, filter);
  if (filter?.limit !== undefined) {
    const offset = Math.max(0, Number(filter.offset) || 0);
    const limit = Math.max(1, Number(filter.limit));
    return filtered.slice(offset, offset + limit);
  }
  return filtered;
}

export async function getPaginatedCompendiumSpells(
  filter?: SpellFilterOptions
): Promise<PaginatedResult<CompendiumSpell>> {
  const allSpells = await fetchSpellsData();
  const filtered = filterSpellsList(allSpells, filter);
  const total = filtered.length;
  const limit = filter?.limit !== undefined ? Math.max(1, Number(filter.limit)) : 20;
  const offset = filter?.offset !== undefined ? Math.max(0, Number(filter.offset)) : 0;
  const data = filtered.slice(offset, offset + limit);
  return {
    data,
    total,
    limit,
    offset,
    hasMore: offset + data.length < total,
  };
}

function filterItemsList(items: CompendiumItem[], filter?: ItemFilterOptions): CompendiumItem[] {
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
      if (!item.type.toLowerCase().includes(targetType)) return false;
    }

    if (targetRarity) {
      if (item.rarity.toLowerCase() !== targetRarity) return false;
    }

    return true;
  });
}

export async function getCompendiumItems(filter?: ItemFilterOptions): Promise<CompendiumItem[]> {
  const allItems = await fetchItemsData();
  const filtered = filterItemsList(allItems, filter);
  if (filter?.limit !== undefined) {
    const offset = Math.max(0, Number(filter.offset) || 0);
    const limit = Math.max(1, Number(filter.limit));
    return filtered.slice(offset, offset + limit);
  }
  return filtered;
}

export async function getPaginatedCompendiumItems(
  filter?: ItemFilterOptions
): Promise<PaginatedResult<CompendiumItem>> {
  const allItems = await fetchItemsData();
  const filtered = filterItemsList(allItems, filter);
  const total = filtered.length;
  const limit = filter?.limit !== undefined ? Math.max(1, Number(filter.limit)) : 20;
  const offset = filter?.offset !== undefined ? Math.max(0, Number(filter.offset)) : 0;
  const data = filtered.slice(offset, offset + limit);
  return {
    data,
    total,
    limit,
    offset,
    hasMore: offset + data.length < total,
  };
}

function filterMonstersList(monsters: MonsterData[], filter?: MonsterFilterOptions): MonsterData[] {
  if (!filter) return monsters;

  const searchQuery = filter.search?.trim().toLowerCase();
  const targetCr = filter.cr !== undefined && filter.cr !== 'all' ? String(filter.cr) : null;
  const targetType = filter.type && filter.type !== 'all' ? filter.type.toLowerCase() : null;

  return monsters.filter((monster) => {
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

export async function getCompendiumMonsters(filter?: MonsterFilterOptions): Promise<MonsterData[]> {
  const allMonsters = await getMonsters();
  const filtered = filterMonstersList(allMonsters, filter);
  if (filter?.limit !== undefined) {
    const offset = Math.max(0, Number(filter.offset) || 0);
    const limit = Math.max(1, Number(filter.limit));
    return filtered.slice(offset, offset + limit);
  }
  return filtered;
}

export async function getPaginatedCompendiumMonsters(
  filter?: MonsterFilterOptions
): Promise<PaginatedResult<MonsterData>> {
  const allMonsters = await getMonsters();
  const filtered = filterMonstersList(allMonsters, filter);
  const total = filtered.length;
  const limit = filter?.limit !== undefined ? Math.max(1, Number(filter.limit)) : 20;
  const offset = filter?.offset !== undefined ? Math.max(0, Number(filter.offset)) : 0;
  const data = filtered.slice(offset, offset + limit);
  return {
    data,
    total,
    limit,
    offset,
    hasMore: offset + data.length < total,
  };
}
