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
function normalizeClassName(className?: string): string {
  if (!className) return '';
  // Strip parentheses content like 'Czarodziej (Wizard)' -> 'czarodziej'
  const stripped = className
    .replace(/\(.*?\)/g, '')
    .trim()
    .toLowerCase();
  if (stripped) return stripped;
  return className.trim().toLowerCase();
}

export function getClassHitDie(className?: string): number {
  if (!className) return 8;
  const normalized = normalizeClassName(className);

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
  const normalized = normalizeClassName(className);
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
 * Resolves localized or formatted class names to standard English SRD class identifiers.
 */
export function getCanonicalClassName(className?: string): string {
  if (!className) return 'Fighter';
  const norm = normalizeClassName(className);
  switch (norm) {
    case 'wizard':
    case 'czarodziej':
      return 'Wizard';
    case 'cleric':
    case 'kleryk':
    case 'kapłan':
    case 'kaplan':
      return 'Cleric';
    case 'druid':
      return 'Druid';
    case 'bard':
      return 'Bard';
    case 'sorcerer':
    case 'zaklinacz':
      return 'Sorcerer';
    case 'warlock':
    case 'czarnoksiężnik':
    case 'czarnoksieznik':
      return 'Warlock';
    case 'paladin':
    case 'paladyn':
      return 'Paladin';
    case 'ranger':
    case 'łowca':
    case 'lowca':
      return 'Ranger';
    case 'barbarian':
    case 'barbarzyńca':
    case 'barbarzynca':
      return 'Barbarian';
    case 'rogue':
    case 'łotrzyk':
    case 'lotrzyk':
      return 'Rogue';
    case 'monk':
    case 'mnich':
      return 'Monk';
    default:
      return 'Fighter';
  }
}

/**
 * Checks whether the specified class possesses spellcasting capability in D&D 5e SRD.
 */
export function isSpellcasterClass(className?: string): boolean {
  const canonical = getCanonicalClassName(className);
  return ['Wizard', 'Cleric', 'Druid', 'Bard', 'Sorcerer', 'Warlock', 'Paladin', 'Ranger'].includes(
    canonical
  );
}

/**
 * Returns the maximum spell level/circle (0-9) accessible to a character based on class and level.
 */
export function getMaxSpellLevel(className?: string, level: number = 1): number {
  if (!className) return 0;
  const canonical = getCanonicalClassName(className);
  const clampedLevel = Math.max(1, Math.min(20, Math.floor(level)));

  // Full Casters: Wizard, Cleric, Druid, Bard, Sorcerer
  if (['Wizard', 'Cleric', 'Druid', 'Bard', 'Sorcerer'].includes(canonical)) {
    return Math.min(9, Math.ceil(clampedLevel / 2));
  }

  // Warlock (Pact Magic caps at 5th level slots)
  if (canonical === 'Warlock') {
    if (clampedLevel >= 9) return 5;
    if (clampedLevel >= 7) return 4;
    if (clampedLevel >= 5) return 3;
    if (clampedLevel >= 3) return 2;
    return 1;
  }

  // Half Casters: Paladin, Ranger (get spells at level 2)
  if (['Paladin', 'Ranger'].includes(canonical)) {
    if (clampedLevel < 2) return 0;
    return Math.min(5, Math.ceil(clampedLevel / 4));
  }

  return 0;
}

/**
 * Returns the recommended number of cantrips known according to D&D 5e PHB class progression.
 */
export function getRecommendedCantripsCount(className?: string, level: number = 1): number {
  if (!className) return 0;
  const canonical = getCanonicalClassName(className);
  const clampedLevel = Math.max(1, Math.min(20, Math.floor(level)));

  if (canonical === 'Sorcerer') {
    if (clampedLevel >= 10) return 6;
    if (clampedLevel >= 4) return 5;
    return 4;
  }
  if (['Wizard', 'Cleric', 'Druid'].includes(canonical)) {
    if (clampedLevel >= 10) return 5;
    if (clampedLevel >= 4) return 4;
    return 3;
  }
  if (['Bard', 'Warlock'].includes(canonical)) {
    if (clampedLevel >= 10) return 4;
    if (clampedLevel >= 4) return 3;
    return 2;
  }
  return 0;
}

/**
 * Returns canonical starting equipment package for a class according to D&D 5e rules.
 */
export function getDefaultClassEquipment(className?: string): string[] {
  const canonical = getCanonicalClassName(className);
  switch (canonical) {
    case 'Fighter':
      return [
        'Długi miecz (Longsword)',
        'Tarcza (Shield)',
        'Kolczuga (Chain Mail)',
        'Kusza lekka (Light Crossbow) i 20 bełtów',
        "Zestaw odkrywcy (Dungeoneer's Pack)",
      ];
    case 'Wizard':
      return [
        'Sztylet (Dagger)',
        'Księga zaklęć (Spellbook)',
        'Różdżka (Wand)',
        'Torba na komponenty (Component Pouch)',
        "Zestaw uczonego (Scholar's Pack)",
      ];
    case 'Cleric':
      return [
        'Buzdygan (Mace)',
        'Tarcza (Shield)',
        'Pancerz łuskowy (Scale Mail)',
        'Święty symbol (Holy Symbol)',
        "Zestaw kapłana (Priest's Pack)",
      ];
    case 'Rogue':
      return [
        'Rapier',
        'Krótki łuk i 20 strzał',
        'Skórzana zbroja (Leather Armor)',
        'Dwa sztylety (2x Dagger)',
        "Narzędzia złodziejskie (Thieves' Tools)",
      ];
    case 'Paladin':
      return [
        'Długi miecz (Longsword)',
        'Tarcza (Shield)',
        'Pięć oszczepów (5x Javelins)',
        'Kolczuga (Chain Mail)',
        'Święty symbol (Holy Symbol)',
      ];
    case 'Barbarian':
      return [
        'Topór dwuręczny (Greataxe)',
        'Dwa toporki (2x Handaxes)',
        'Cztery oszczepy (4x Javelins)',
        "Zestaw odkrywcy (Explorer's Pack)",
      ];
    case 'Ranger':
      return [
        'Pancerz łuskowy (Scale Mail)',
        'Dwa krótkie miecze (2x Shortswords)',
        'Długi łuk i kołczan z 20 strzałami',
        "Zestaw odkrywcy (Explorer's Pack)",
      ];
    case 'Druid':
      return [
        'Drewniana tarcza (Wooden Shield)',
        'Kordelas (Scimitar)',
        'Skórzana zbroja (Leather Armor)',
        'Fokus druidyczny (Druidic Focus)',
        "Zestaw odkrywcy (Explorer's Pack)",
      ];
    case 'Bard':
      return [
        'Rapier',
        'Lutnia (Lute)',
        'Skórzana zbroja (Leather Armor)',
        'Sztylet (Dagger)',
        "Zestaw dyplomaty (Diplomat's Pack)",
      ];
    case 'Warlock':
      return [
        'Kusza lekka i 20 bełtów',
        'Torba na komponenty (Component Pouch)',
        'Skórzana zbroja (Leather Armor)',
        'Dwa sztylety (2x Daggers)',
        "Zestaw uczonego (Scholar's Pack)",
      ];
    case 'Sorcerer':
      return [
        'Kusza lekka i 20 bełtów',
        'Kryształowy fokus (Arcane Focus)',
        'Dwa sztylety (2x Daggers)',
        "Zestaw odkrywcy (Dungeoneer's Pack)",
      ];
    case 'Monk':
      return [
        'Krótki miecz (Shortsword)',
        '10 rzutek (10x Darts)',
        "Zestaw odkrywcy (Dungeoneer's Pack)",
      ];
    default:
      return ["Zestaw podróżnika (Explorer's Pack)"];
  }
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

export type EncounterDifficulty = 'trivial' | 'easy' | 'medium' | 'hard' | 'deadly';

export interface XpThresholds {
  easy: number;
  medium: number;
  hard: number;
  deadly: number;
}

export interface EncounterDifficultyResult {
  totalXp: number;
  adjustedXp: number;
  multiplier: number;
  difficulty: EncounterDifficulty;
  thresholds: XpThresholds;
}

/**
 * Standard D&D 5e XP Thresholds by Character Level (DMG p. 82).
 */
export const XP_THRESHOLDS_PER_LEVEL: Record<number, XpThresholds> = {
  1: { easy: 25, medium: 50, hard: 75, deadly: 100 },
  2: { easy: 50, medium: 100, hard: 150, deadly: 200 },
  3: { easy: 75, medium: 150, hard: 225, deadly: 400 },
  4: { easy: 125, medium: 250, hard: 375, deadly: 500 },
  5: { easy: 250, medium: 500, hard: 750, deadly: 1100 },
  6: { easy: 300, medium: 600, hard: 900, deadly: 1400 },
  7: { easy: 350, medium: 750, hard: 1100, deadly: 1700 },
  8: { easy: 450, medium: 900, hard: 1400, deadly: 2100 },
  9: { easy: 550, medium: 1100, hard: 1600, deadly: 2400 },
  10: { easy: 600, medium: 1200, hard: 1900, deadly: 2800 },
  11: { easy: 800, medium: 1600, hard: 2400, deadly: 3600 },
  12: { easy: 1000, medium: 2000, hard: 3000, deadly: 4500 },
  13: { easy: 1100, medium: 2200, hard: 3400, deadly: 5100 },
  14: { easy: 1250, medium: 2500, hard: 3800, deadly: 5700 },
  15: { easy: 1400, medium: 2800, hard: 4300, deadly: 6400 },
  16: { easy: 1600, medium: 3200, hard: 4800, deadly: 7200 },
  17: { easy: 2000, medium: 3900, hard: 5900, deadly: 8800 },
  18: { easy: 2100, medium: 4200, hard: 6300, deadly: 9500 },
  19: { easy: 2400, medium: 4900, hard: 7300, deadly: 10900 },
  20: { easy: 2800, medium: 5700, hard: 8500, deadly: 12700 },
};

/**
 * Calculates aggregate XP thresholds (Easy, Medium, Hard, Deadly) for a party of character levels.
 */
export function calculatePartyXpThresholds(levels: number[]): XpThresholds {
  const result: XpThresholds = { easy: 0, medium: 0, hard: 0, deadly: 0 };
  for (const level of levels) {
    const clampedLevel = Math.max(1, Math.min(20, Math.floor(level)));
    const row = XP_THRESHOLDS_PER_LEVEL[clampedLevel];
    if (row) {
      result.easy += row.easy;
      result.medium += row.medium;
      result.hard += row.hard;
      result.deadly += row.deadly;
    }
  }
  return result;
}

const MULTIPLIER_TIERS = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5];

/**
 * Calculates standard D&D 5e encounter XP multiplier (DMG p. 82-83)
 * based on monster count, adjusted for party size.
 */
export function getEncounterMultiplier(monsterCount: number, partySize?: number): number {
  if (monsterCount <= 0) return 1;

  let baseIndex = 1; // 1 monster = 1x
  if (monsterCount === 2) {
    baseIndex = 2; // 1.5x
  } else if (monsterCount >= 3 && monsterCount <= 6) {
    baseIndex = 3; // 2x
  } else if (monsterCount >= 7 && monsterCount <= 10) {
    baseIndex = 4; // 2.5x
  } else if (monsterCount >= 11 && monsterCount <= 14) {
    baseIndex = 5; // 3x
  } else if (monsterCount >= 15) {
    baseIndex = 6; // 4x
  }

  if (partySize !== undefined && partySize > 0) {
    if (partySize < 3) {
      baseIndex = Math.min(MULTIPLIER_TIERS.length - 1, baseIndex + 1);
    } else if (partySize >= 6) {
      baseIndex = Math.max(0, baseIndex - 1);
    }
  }

  return MULTIPLIER_TIERS[baseIndex];
}

/**
 * Calculates total XP, adjusted XP, multiplier, and overall difficulty rating
 * for an encounter given a list of monster XP values and party member levels.
 */
export function calculateEncounterDifficulty(
  monsterXps: number[],
  partyLevels: number[]
): EncounterDifficultyResult {
  const totalXp = monsterXps.reduce((acc, xp) => acc + Math.max(0, xp), 0);
  const multiplier = getEncounterMultiplier(monsterXps.length, partyLevels.length);
  const adjustedXp = Math.round(totalXp * multiplier);
  const thresholds = calculatePartyXpThresholds(partyLevels);

  let difficulty: EncounterDifficulty = 'trivial';
  if (thresholds.deadly > 0 && adjustedXp >= thresholds.deadly) {
    difficulty = 'deadly';
  } else if (thresholds.hard > 0 && adjustedXp >= thresholds.hard) {
    difficulty = 'hard';
  } else if (thresholds.medium > 0 && adjustedXp >= thresholds.medium) {
    difficulty = 'medium';
  } else if (thresholds.easy > 0 && adjustedXp >= thresholds.easy) {
    difficulty = 'easy';
  }

  return {
    totalXp,
    adjustedXp,
    multiplier,
    difficulty,
    thresholds,
  };
}

export const CR_TO_XP_TABLE: Record<number, number> = {
  0: 10,
  0.125: 25,
  0.25: 50,
  0.5: 100,
  1: 200,
  2: 450,
  3: 700,
  4: 1100,
  5: 1800,
  6: 2300,
  7: 2900,
  8: 3900,
  9: 5000,
  10: 5900,
  11: 7200,
  12: 8400,
  13: 10000,
  14: 11500,
  15: 13000,
  16: 15000,
  17: 18000,
  18: 20000,
  19: 22000,
  20: 25000,
  21: 33000,
  22: 41000,
  23: 50000,
  24: 62000,
  30: 155000,
};

/**
 * Returns the monster's XP value, falling back to standard D&D 5e CR conversion if needed.
 */
export function getMonsterXp(monster?: { xp?: number; challengeRating?: number }): number {
  if (!monster) return 10;
  if (monster.xp !== undefined && monster.xp > 0) return monster.xp;
  if (monster.challengeRating !== undefined) {
    const cr = monster.challengeRating;
    if (CR_TO_XP_TABLE[cr] !== undefined) return CR_TO_XP_TABLE[cr];
    const crKeys = Object.keys(CR_TO_XP_TABLE)
      .map(Number)
      .sort((a, b) => a - b);
    let matched = 10;
    for (const key of crKeys) {
      if (cr >= key) matched = CR_TO_XP_TABLE[key];
    }
    return matched;
  }
  return 10;
}
