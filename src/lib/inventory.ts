import type { CompendiumItem } from './compendium';

export type ItemCategory =
  | 'Weapon'
  | 'Armor'
  | 'Shield'
  | 'Wondrous Item'
  | 'Potion'
  | 'Ammunition'
  | 'Ring'
  | 'Rod'
  | 'Scroll'
  | 'Staff'
  | 'Wand'
  | 'Adventuring Gear'
  | 'Other';

export interface EquipmentArmorClass {
  base: number;
  dexBonus: boolean;
  maxBonus?: number;
}

export interface EquipmentWeaponDetails {
  damageDice: string;
  damageType: string;
  isFinesse: boolean;
  isRanged: boolean;
  attackBonus?: number;
}

export interface EquipmentItem {
  id: string;
  name: string;
  category: ItemCategory;
  rarity?: string;
  weight: number;
  cost?: string;
  isEquipped: boolean;
  isAttuned: boolean;
  requiresAttunement: boolean;
  armorClass?: EquipmentArmorClass;
  weaponDetails?: EquipmentWeaponDetails;
  description?: string;
  properties?: string[];
  isCustom?: boolean;
}

function inferCategoryFromName(name: string): ItemCategory {
  const lower = name.toLowerCase();
  if (
    lower.includes('miecz') ||
    lower.includes('topór') ||
    lower.includes('łuk') ||
    lower.includes('sztylet') ||
    lower.includes('sword') ||
    lower.includes('bow') ||
    lower.includes('axe') ||
    lower.includes('dagger')
  ) {
    return 'Weapon';
  }
  if (lower.includes('tarcza') || lower.includes('shield')) {
    return 'Shield';
  }
  if (
    lower.includes('zbroja') ||
    lower.includes('pancerz') ||
    lower.includes('kolczuga') ||
    lower.includes('armor') ||
    lower.includes('mail')
  ) {
    return 'Armor';
  }
  if (lower.includes('mikstura') || lower.includes('eliksir') || lower.includes('potion')) {
    return 'Potion';
  }
  if (lower.includes('zwój') || lower.includes('scroll')) {
    return 'Scroll';
  }
  if (lower.includes('pierścień') || lower.includes('ring')) {
    return 'Ring';
  }
  if (lower.includes('różdżka') || lower.includes('wand')) {
    return 'Wand';
  }
  return 'Adventuring Gear';
}

function detectCategoryFromCompendium(compendiumItem: CompendiumItem): ItemCategory {
  const typeLower = (compendiumItem.type || '').toLowerCase();
  const nameLower = compendiumItem.name.toLowerCase();

  if (
    nameLower.includes('shield') ||
    (typeLower === 'armor' &&
      compendiumItem.armorClass?.base === 2 &&
      !compendiumItem.armorClass.dexBonus)
  ) {
    return 'Shield';
  }
  if (typeLower.includes('armor')) {
    return 'Armor';
  }
  if (typeLower.includes('weapon') || compendiumItem.damage) {
    return 'Weapon';
  }
  if (typeLower.includes('potion')) {
    return 'Potion';
  }
  if (typeLower.includes('ring')) {
    return 'Ring';
  }
  if (typeLower.includes('wand')) {
    return 'Wand';
  }
  if (typeLower.includes('scroll')) {
    return 'Scroll';
  }
  if (typeLower.includes('staff')) {
    return 'Staff';
  }
  if (typeLower.includes('rod')) {
    return 'Rod';
  }
  if (typeLower.includes('wondrous')) {
    return 'Wondrous Item';
  }
  if (typeLower.includes('ammunition')) {
    return 'Ammunition';
  }
  return 'Adventuring Gear';
}

/**
 * Normalizes any existing inventory array (string[] or EquipmentItem[]) into strongly typed EquipmentItem[].
 */
export function normalizeInventory(rawInventory?: unknown[] | null): EquipmentItem[] {
  if (!Array.isArray(rawInventory)) return [];

  return rawInventory.map((item, index) => {
    if (typeof item === 'string') {
      return {
        id: item,
        name: item,
        category: inferCategoryFromName(item),
        weight: 1,
        isEquipped: false,
        isAttuned: false,
        requiresAttunement: false,
        isCustom: false,
      };
    }

    if (item && typeof item === 'object') {
      const obj = item as Partial<EquipmentItem>;
      return {
        id: obj.id || `item-${Date.now()}-${index}`,
        name: obj.name || 'Przedmiot',
        category: obj.category || 'Adventuring Gear',
        rarity: obj.rarity || 'Common',
        weight: typeof obj.weight === 'number' ? obj.weight : 0,
        cost: obj.cost || '',
        isEquipped: Boolean(obj.isEquipped),
        isAttuned: Boolean(obj.isAttuned),
        requiresAttunement: Boolean(obj.requiresAttunement),
        armorClass: obj.armorClass,
        weaponDetails: obj.weaponDetails,
        description: obj.description,
        properties: Array.isArray(obj.properties) ? obj.properties : [],
        isCustom: Boolean(obj.isCustom),
      };
    }

    return {
      id: `item-${Date.now()}-${index}`,
      name: 'Nieznany przedmiot',
      category: 'Other',
      weight: 0,
      isEquipped: false,
      isAttuned: false,
      requiresAttunement: false,
    };
  });
}

/**
 * Serializes inventory items back, preserving simple string format for unequipped legacy items.
 */
export function serializeInventory(items: EquipmentItem[]): (string | EquipmentItem)[] {
  return items.map((i) => {
    if (
      !i.isCustom &&
      !i.isEquipped &&
      !i.isAttuned &&
      !i.requiresAttunement &&
      !i.armorClass &&
      !i.weaponDetails &&
      !i.cost &&
      !i.description &&
      (!i.properties || i.properties.length === 0)
    ) {
      return i.name;
    }
    return i;
  });
}

/**
 * Creates an independent snapshot from a compendium item.
 */
export function createEquipmentSnapshot(
  compendiumItem: CompendiumItem,
  overrides?: Partial<EquipmentItem>
): EquipmentItem {
  const category = detectCategoryFromCompendium(compendiumItem);
  const descLower = (compendiumItem.description || '').toLowerCase();
  const requiresAttunement =
    descLower.includes('requires attunement') || descLower.includes('wymaga dostrojenia');

  let weaponDetails: EquipmentWeaponDetails | undefined;
  if (category === 'Weapon' || compendiumItem.damage) {
    const props = compendiumItem.properties || [];
    weaponDetails = {
      damageDice: compendiumItem.damage?.dice || '1d6',
      damageType: compendiumItem.damage?.type || 'Bludgeoning',
      isFinesse: props.includes('Finesse') || props.includes('Finezyjna'),
      isRanged:
        props.includes('Ammunition') || props.includes('Ranged') || props.includes('Dystansowa'),
    };
  }

  const snapshot: EquipmentItem = {
    id: `item-${compendiumItem.index}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: compendiumItem.name,
    category,
    rarity: compendiumItem.rarity || 'Common',
    weight: typeof compendiumItem.weight === 'number' ? compendiumItem.weight : 0,
    cost: compendiumItem.cost || '',
    isEquipped: false,
    isAttuned: false,
    requiresAttunement,
    armorClass: compendiumItem.armorClass
      ? {
          base: compendiumItem.armorClass.base,
          dexBonus: compendiumItem.armorClass.dexBonus,
          maxBonus: compendiumItem.armorClass.maxDex,
        }
      : undefined,
    weaponDetails,
    description: compendiumItem.description,
    properties: compendiumItem.properties,
    isCustom: false,
    ...overrides,
  };

  return snapshot;
}

/**
 * Creates a custom item marked as isCustom: true.
 */
export function createCustomItem(item: Partial<EquipmentItem>): EquipmentItem {
  return {
    id: `custom-item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: item.name || 'Własny Przedmiot',
    category: item.category || 'Adventuring Gear',
    rarity: item.rarity || 'Common',
    weight: typeof item.weight === 'number' ? item.weight : 0,
    cost: item.cost || '',
    isEquipped: false,
    isAttuned: false,
    requiresAttunement: Boolean(item.requiresAttunement),
    armorClass: item.armorClass,
    weaponDetails: item.weaponDetails,
    description: item.description,
    properties: item.properties || [],
    isCustom: true,
    ...item,
  };
}

/**
 * Calculates sum of weight of all inventory items.
 */
export function calculateTotalWeight(items: EquipmentItem[]): number {
  const sum = items.reduce((acc, val) => acc + (val.weight || 0), 0);
  return Math.round(sum * 10) / 10;
}

/**
 * Carrying capacity in D&D 5e is STR score * 15 lbs.
 */
export function calculateCarryingCapacity(strScore: number = 10): number {
  return Math.max(0, strScore * 15);
}

/**
 * Returns true if total weight exceeds carrying capacity.
 */
export function isEncumbered(totalWeight: number, strScore: number = 10): boolean {
  return totalWeight > calculateCarryingCapacity(strScore);
}

/**
 * Toggles equipped status for an item with D&D 5e validation (max 1 armor, max 1 shield).
 */
export function toggleEquipped(
  items: EquipmentItem[],
  itemId: string
): { items: EquipmentItem[]; error?: string } {
  const target = items.find((i) => i.id === itemId);
  if (!target) return { items };

  const willBeEquipped = !target.isEquipped;

  const updated = items.map((i) => {
    if (i.id === itemId) {
      return { ...i, isEquipped: willBeEquipped };
    }

    // If equipping Armor, unequip any other Armor
    if (willBeEquipped && target.category === 'Armor' && i.category === 'Armor' && i.isEquipped) {
      return { ...i, isEquipped: false };
    }

    // If equipping Shield, unequip any other Shield
    if (willBeEquipped && target.category === 'Shield' && i.category === 'Shield' && i.isEquipped) {
      return { ...i, isEquipped: false };
    }

    return i;
  });

  return { items: updated };
}

/**
 * Toggles attuned status for an item with D&D 5e validation (max 3 attuned items).
 */
export function toggleAttuned(
  items: EquipmentItem[],
  itemId: string
): { items: EquipmentItem[]; error?: string } {
  const target = items.find((i) => i.id === itemId);
  if (!target) return { items };

  const willBeAttuned = !target.isAttuned;

  if (willBeAttuned) {
    const currentAttunedCount = items.filter((i) => i.isAttuned).length;
    if (currentAttunedCount >= 3) {
      return {
        items,
        error: 'Osiągnięto limit 3 dostrojonych przedmiotów (D&D 5e Attunement limit).',
      };
    }
  }

  const updated = items.map((i) => (i.id === itemId ? { ...i, isAttuned: willBeAttuned } : i));
  return { items: updated };
}
