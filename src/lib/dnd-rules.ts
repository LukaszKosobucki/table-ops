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
