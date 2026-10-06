/**
 * D&D 5e Rules & Math Utilities
 * Pure helper functions for stat modifiers, health calculations, and dice rolls.
 */

/**
 * Calculates ability modifier from an ability score (e.g. 10 -> 0, 16 -> +3, 8 -> -1).
 */
export function getAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

/**
 * Formats modifier as string with explicit sign (e.g. "+3", "0", "-1").
 */
export function formatModifier(score: number): string {
  const mod = getAbilityModifier(score);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

/**
 * Calculates Armor Class for unarmored character (10 + DEX mod).
 */
export function calculateUnarmoredAc(dexScore: number): number {
  return 10 + getAbilityModifier(dexScore);
}

/**
 * Calculates Max Hit Points based on class hit die, CON score, and level.
 */
export function calculateMaxHp(hitDie: number, conScore: number, level: number = 1): number {
  const conMod = getAbilityModifier(conScore);
  const lvl1Hp = hitDie + conMod;
  if (level <= 1) return Math.max(1, lvl1Hp);

  const avgPerLevel = Math.floor(hitDie / 2) + 1 + conMod;
  return Math.max(1, lvl1Hp + (level - 1) * Math.max(1, avgPerLevel));
}

/**
 * Calculates Passive Perception (10 + WIS mod).
 */
export function calculatePassivePerception(wisScore: number): number {
  return 10 + getAbilityModifier(wisScore);
}

/**
 * Rolls 4d6 and drops the lowest die (standard D&D 5e ability score generation).
 */
export function roll4d6DropLowest(): { total: number; rolls: number[]; dropped: number } {
  const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
  const sorted = [...rolls].sort((a, b) => a - b);
  const dropped = sorted[0];
  const total = sorted.slice(1).reduce((acc, val) => acc + val, 0);

  return { total, rolls, dropped };
}

/**
 * Returns standard hit die size (e.g. 6, 8, 10, 12) for a given class.
 * Supports both English and Polish names, case-insensitive.
 */
export function getClassHitDie(className?: string): number {
  if (!className) return 8;
  const normalized = className.trim().toLowerCase();

  switch (normalized) {
    case 'barbarian':
    case 'barbarzyńca':
    case 'barbarzynca':
      return 12;

    case 'fighter':
    case 'wojownik':
    case 'paladin':
    case 'paladyn':
    case 'ranger':
    case 'łowca':
    case 'lowca':
      return 10;

    case 'sorcerer':
    case 'zaklinacz':
    case 'wizard':
    case 'czarodziej':
      return 6;

    default:
      return 8;
  }
}

export type CharacterSpellSlots = Record<number, { max: number; used: number }>;

// D&D 5e Full Caster spell slot matrix for levels 1 to 20
const FULL_CASTER_TABLE: number[][] = [
  [2], // L1
  [3], // L2
  [4, 2], // L3
  [4, 3], // L4
  [4, 3, 2], // L5
  [4, 3, 3], // L6
  [4, 3, 3, 1], // L7
  [4, 3, 3, 2], // L8
  [4, 3, 3, 3, 1], // L9
  [4, 3, 3, 3, 2], // L10
  [4, 3, 3, 3, 2, 1], // L11
  [4, 3, 3, 3, 2, 1], // L12
  [4, 3, 3, 3, 2, 1, 1], // L13
  [4, 3, 3, 3, 2, 1, 1], // L14
  [4, 3, 3, 3, 2, 1, 1, 1], // L15
  [4, 3, 3, 3, 2, 1, 1, 1], // L16
  [4, 3, 3, 3, 2, 1, 1, 1, 1], // L17
  [4, 3, 3, 3, 3, 1, 1, 1, 1], // L18
  [4, 3, 3, 3, 3, 2, 1, 1, 1], // L19
  [4, 3, 3, 3, 3, 2, 2, 1, 1], // L20
];

// D&D 5e Half Caster spell slot matrix for levels 1 to 20
const HALF_CASTER_TABLE: number[][] = [
  [], // L1
  [2], // L2
  [3], // L3
  [3], // L4
  [4, 2], // L5
  [4, 2], // L6
  [4, 3], // L7
  [4, 3], // L8
  [4, 3, 2], // L9
  [4, 3, 2], // L10
  [4, 3, 3], // L11
  [4, 3, 3], // L12
  [4, 3, 3, 1], // L13
  [4, 3, 3, 1], // L14
  [4, 3, 3, 2], // L15
  [4, 3, 3, 2], // L16
  [4, 3, 3, 3, 1], // L17
  [4, 3, 3, 3, 1], // L18
  [4, 3, 3, 3, 2], // L19
  [4, 3, 3, 3, 2], // L20
];

/**
 * Calculates spell slots for a given class and level (1-20).
 * Supports Full Casters, Half Casters, and Warlocks (Pact Magic).
 */
export function calculateSpellSlots(className?: string, level: number = 1): CharacterSpellSlots {
  if (!className) return {};
  const normalized = className.trim().toLowerCase();
  const clampedLevel = Math.max(1, Math.min(20, Math.floor(level)));

  // Full Casters
  const isFullCaster = [
    'wizard',
    'czarodziej',
    'cleric',
    'kleryk',
    'kapłan',
    'kaplan',
    'druid',
    'bard',
    'sorcerer',
    'zaklinacz',
  ].includes(normalized);

  if (isFullCaster) {
    const row = FULL_CASTER_TABLE[clampedLevel - 1] || [];
    const slots: CharacterSpellSlots = {};
    row.forEach((max, index) => {
      if (max > 0) {
        slots[index + 1] = { max, used: 0 };
      }
    });
    return slots;
  }

  // Half Casters
  const isHalfCaster = ['paladin', 'paladyn', 'ranger', 'łowca', 'lowca'].includes(normalized);

  if (isHalfCaster) {
    const row = HALF_CASTER_TABLE[clampedLevel - 1] || [];
    const slots: CharacterSpellSlots = {};
    row.forEach((max, index) => {
      if (max > 0) {
        slots[index + 1] = { max, used: 0 };
      }
    });
    return slots;
  }

  // Warlock (Pact Magic)
  const isWarlock = ['warlock', 'czarnoksiężnik', 'czarnoksieznik'].includes(normalized);
  if (isWarlock) {
    let slotLevel = 1;
    let slotCount = 1;

    if (clampedLevel >= 17) {
      slotLevel = 5;
      slotCount = 4;
    } else if (clampedLevel >= 11) {
      slotLevel = 5;
      slotCount = 3;
    } else if (clampedLevel >= 9) {
      slotLevel = 5;
      slotCount = 2;
    } else if (clampedLevel >= 7) {
      slotLevel = 4;
      slotCount = 2;
    } else if (clampedLevel >= 5) {
      slotLevel = 3;
      slotCount = 2;
    } else if (clampedLevel >= 3) {
      slotLevel = 2;
      slotCount = 2;
    } else if (clampedLevel >= 2) {
      slotLevel = 1;
      slotCount = 2;
    }

    return {
      [slotLevel]: { max: slotCount, used: 0 },
    };
  }

  // Non-casters (Fighter, Rogue, Barbarian, Monk, etc.)
  return {};
}

/**
 * Applies damage to a character according to D&D 5e rules:
 * Absorbs with tempHp first, then subtracts remainder from currentHp (floored at 0).
 */
export function applyDamage(
  currentHp: number,
  _maxHp: number,
  tempHp: number,
  damage: number
): { currentHp: number; tempHp: number } {
  const actualDamage = Math.max(0, damage);
  const tempAbsorbed = Math.min(Math.max(0, tempHp), actualDamage);
  const remainingTemp = Math.max(0, tempHp) - tempAbsorbed;
  const remainingDamage = actualDamage - tempAbsorbed;
  const newHp = Math.max(0, currentHp - remainingDamage);

  return { currentHp: newHp, tempHp: remainingTemp };
}

/**
 * Applies healing to a character according to D&D 5e rules:
 * Heals currentHp up to maxHp. Does not alter tempHp.
 */
export function applyHealing(
  currentHp: number,
  maxHp: number,
  tempHp: number,
  healAmount: number
): { currentHp: number; tempHp: number } {
  const actualHeal = Math.max(0, healAmount);
  const newHp = Math.min(maxHp, currentHp + actualHeal);

  return { currentHp: newHp, tempHp: Math.max(0, tempHp) };
}

/**
 * Applies temporary hit points according to D&D 5e rules:
 * Temp HP does not stack; retains the higher of the existing and new values.
 */
export function applyTempHp(
  currentHp: number,
  _maxHp: number,
  currentTempHp: number,
  newTempHp: number
): { currentHp: number; tempHp: number } {
  const resolvedTemp = Math.max(Math.max(0, currentTempHp), Math.max(0, newTempHp));
  return { currentHp, tempHp: resolvedTemp };
}

/**
 * Modifies spell slot count: 'use', 'recover', or explicit 'set'.
 * Ensures used slots are clamped between 0 and max.
 */
export function modifySpellSlot(
  slots: CharacterSpellSlots,
  slotLevel: number,
  action: 'use' | 'recover' | 'set',
  value?: number
): CharacterSpellSlots {
  const targetSlot = slots[slotLevel];
  if (!targetSlot) return slots;

  let newUsed = targetSlot.used;
  if (action === 'use') {
    newUsed = Math.min(targetSlot.max, targetSlot.used + 1);
  } else if (action === 'recover') {
    newUsed = Math.max(0, targetSlot.used - 1);
  } else if (action === 'set') {
    newUsed = Math.min(targetSlot.max, Math.max(0, value ?? 0));
  }

  return {
    ...slots,
    [slotLevel]: {
      ...targetSlot,
      used: newUsed,
    },
  };
}
