import { describe, expect, it } from 'vitest';
import {
  applyDamage,
  applyHealing,
  applyLevelUp,
  applyTempHp,
  calculateEncounterDifficulty,
  calculateLevelUpHpGain,
  calculateMaxHp,
  calculatePartyXpThresholds,
  calculatePassivePerception,
  calculateProficiencyBonus,
  calculateSpellSlots,
  calculateUnarmoredAc,
  formatModifier,
  getAbilityModifier,
  getCanonicalClassName,
  getClassHitDie,
  getClassHitDieAverage,
  getDefaultClassEquipment,
  getEncounterMultiplier,
  getLevelFromXp,
  getMaxSpellLevel,
  getMonsterXp,
  getNextLevelXpThreshold,
  getRecommendedCantripsCount,
  getRecommendedLevelUpSpellsCount,
  getSpellcasterType,
  getXpForLevel,
  isAsiLevel,
  isSpellcasterClass,
  modifySpellSlot,
  roll4d6DropLowest,
  XP_LEVEL_THRESHOLDS,
} from './dnd-rules';

describe('dnd-rules - getAbilityModifier', () => {
  it('correctly calculates ability modifiers for typical D&D scores', () => {
    expect(getAbilityModifier(10)).toBe(0);
    expect(getAbilityModifier(11)).toBe(0);
    expect(getAbilityModifier(12)).toBe(1);
    expect(getAbilityModifier(13)).toBe(1);
    expect(getAbilityModifier(14)).toBe(2);
    expect(getAbilityModifier(16)).toBe(3);
    expect(getAbilityModifier(18)).toBe(4);
    expect(getAbilityModifier(20)).toBe(5);
    expect(getAbilityModifier(8)).toBe(-1);
    expect(getAbilityModifier(7)).toBe(-2);
    expect(getAbilityModifier(3)).toBe(-4);
  });
});

describe('dnd-rules - formatModifier', () => {
  it('formats positive and negative numbers with proper signs', () => {
    expect(formatModifier(16)).toBe('+3');
    expect(formatModifier(10)).toBe('+0');
    expect(formatModifier(8)).toBe('-1');
  });
});

describe('dnd-rules - calculateUnarmoredAc', () => {
  it('computes 10 + DEX modifier', () => {
    expect(calculateUnarmoredAc(10)).toBe(10);
    expect(calculateUnarmoredAc(14)).toBe(12); // DEX +2
    expect(calculateUnarmoredAc(8)).toBe(9); // DEX -1
  });
});

describe('dnd-rules - calculateMaxHp', () => {
  it('computes level 1 HP without average per level', () => {
    // Fighter (d10) with CON 14 (+2) at Level 1 => 10 + 2 = 12
    expect(calculateMaxHp(10, 14, 1)).toBe(12);
    // Wizard (d6) with CON 10 (+0) at Level 1 => 6 + 0 = 6
    expect(calculateMaxHp(6, 10, 1)).toBe(6);
  });

  it('computes higher level HP using standard D&D 5e averages', () => {
    // Paladin (d10), CON 14 (+2), Level 3:
    // lvl 1: 10 + 2 = 12
    // per level: 5 + 1 + 2 = 8
    // lvl 3: 12 + 2 * 8 = 28
    expect(calculateMaxHp(10, 14, 3)).toBe(28);
  });

  it('never returns HP less than 1', () => {
    expect(calculateMaxHp(6, 3, 1)).toBeGreaterThanOrEqual(1);
  });
});

describe('dnd-rules - calculatePassivePerception', () => {
  it('computes 10 + WIS modifier', () => {
    expect(calculatePassivePerception(10)).toBe(10);
    expect(calculatePassivePerception(14)).toBe(12);
    expect(calculatePassivePerception(16)).toBe(13);
  });
});

describe('dnd-rules - roll4d6DropLowest', () => {
  it('rolls 4 dice, drops the lowest, and returns a total between 3 and 18', () => {
    for (let i = 0; i < 20; i++) {
      const result = roll4d6DropLowest();
      expect(result.rolls).toHaveLength(4);
      expect(result.rolls.every((r) => r >= 1 && r <= 6)).toBe(true);
      expect(result.total).toBeGreaterThanOrEqual(3);
      expect(result.total).toBeLessThanOrEqual(18);
      expect(result.total).toBe(result.rolls.reduce((a, b) => a + b, 0) - result.dropped);
    }
  });
});

describe('dnd-rules - getClassHitDie', () => {
  it('returns appropriate hit die for standard 5e classes (both EN and PL names)', () => {
    expect(getClassHitDie('Barbarian')).toBe(12);
    expect(getClassHitDie('Barbarzyńca')).toBe(12);

    expect(getClassHitDie('Fighter')).toBe(10);
    expect(getClassHitDie('Wojownik')).toBe(10);
    expect(getClassHitDie('Paladin')).toBe(10);
    expect(getClassHitDie('Ranger')).toBe(10);

    expect(getClassHitDie('Cleric')).toBe(8);
    expect(getClassHitDie('Kleryk')).toBe(8);
    expect(getClassHitDie('Druid')).toBe(8);
    expect(getClassHitDie('Bard')).toBe(8);
    expect(getClassHitDie('Monk')).toBe(8);
    expect(getClassHitDie('Rogue')).toBe(8);
    expect(getClassHitDie('Warlock')).toBe(8);

    expect(getClassHitDie('Wizard')).toBe(6);
    expect(getClassHitDie('Czarodziej')).toBe(6);
    expect(getClassHitDie('Sorcerer')).toBe(6);
    expect(getClassHitDie('Zaklinacz')).toBe(6);

    // Default fallback
    expect(getClassHitDie('Unknown')).toBe(8);
    expect(getClassHitDie(undefined)).toBe(8);
  });
});

describe('dnd-rules - calculateSpellSlots', () => {
  it('calculates full caster spell slots correctly for levels 1 to 20 (Wizard/Cleric/Druid/Bard/Sorcerer)', () => {
    // Level 1: 2 x 1st level slots
    const lvl1 = calculateSpellSlots('Wizard', 1);
    expect(lvl1[1]).toEqual({ max: 2, used: 0 });
    expect(lvl1[2]).toBeUndefined();

    // Level 3: 4 x 1st, 2 x 2nd
    const lvl3 = calculateSpellSlots('Czarodziej', 3);
    expect(lvl3[1]).toEqual({ max: 4, used: 0 });
    expect(lvl3[2]).toEqual({ max: 2, used: 0 });

    // Level 5: 4 x 1st, 3 x 2nd, 2 x 3rd
    const lvl5 = calculateSpellSlots('Cleric', 5);
    expect(lvl5[1]).toEqual({ max: 4, used: 0 });
    expect(lvl5[2]).toEqual({ max: 3, used: 0 });
    expect(lvl5[3]).toEqual({ max: 2, used: 0 });

    // Level 9: up to 5th level spells
    const lvl9 = calculateSpellSlots('Bard', 9);
    expect(lvl9[4]).toEqual({ max: 3, used: 0 });
    expect(lvl9[5]).toEqual({ max: 1, used: 0 });

    // Level 17: up to 9th level spells
    const lvl17 = calculateSpellSlots('Sorcerer', 17);
    expect(lvl17[9]).toEqual({ max: 1, used: 0 });

    // Level 20: full 5e progression
    const lvl20 = calculateSpellSlots('Wizard', 20);
    expect(lvl20[1]).toEqual({ max: 4, used: 0 });
    expect(lvl20[2]).toEqual({ max: 3, used: 0 });
    expect(lvl20[3]).toEqual({ max: 3, used: 0 });
    expect(lvl20[4]).toEqual({ max: 3, used: 0 });
    expect(lvl20[5]).toEqual({ max: 3, used: 0 });
    expect(lvl20[6]).toEqual({ max: 2, used: 0 });
    expect(lvl20[7]).toEqual({ max: 2, used: 0 });
    expect(lvl20[8]).toEqual({ max: 1, used: 0 });
    expect(lvl20[9]).toEqual({ max: 1, used: 0 });
  });

  it('calculates half-caster spell slots correctly (Paladin/Ranger)', () => {
    // Level 1 Paladin: no spells yet
    expect(calculateSpellSlots('Paladin', 1)).toEqual({});
    expect(calculateSpellSlots('Paladyn', 1)).toEqual({});

    // Level 2: 2 x 1st
    const lvl2 = calculateSpellSlots('Paladin', 2);
    expect(lvl2[1]).toEqual({ max: 2, used: 0 });

    // Level 5: 4 x 1st, 2 x 2nd
    const lvl5 = calculateSpellSlots('Ranger', 5);
    expect(lvl5[1]).toEqual({ max: 4, used: 0 });
    expect(lvl5[2]).toEqual({ max: 2, used: 0 });

    // Level 20: capped at 5th level spells
    const lvl20 = calculateSpellSlots('Paladin', 20);
    expect(lvl20[1]).toEqual({ max: 4, used: 0 });
    expect(lvl20[5]).toEqual({ max: 2, used: 0 });
    expect(lvl20[6]).toBeUndefined();
  });

  it('calculates warlock pact magic spell slots correctly', () => {
    // Level 1: 1 slot of 1st level
    expect(calculateSpellSlots('Warlock', 1)).toEqual({ 1: { max: 1, used: 0 } });

    // Level 2: 2 slots of 1st level
    expect(calculateSpellSlots('Czarnoksiężnik', 2)).toEqual({ 1: { max: 2, used: 0 } });

    // Level 3: 2 slots of 2nd level
    expect(calculateSpellSlots('Warlock', 3)).toEqual({ 2: { max: 2, used: 0 } });

    // Level 5: 2 slots of 3rd level
    expect(calculateSpellSlots('Warlock', 5)).toEqual({ 3: { max: 2, used: 0 } });

    // Level 9: 2 slots of 5th level
    expect(calculateSpellSlots('Warlock', 9)).toEqual({ 5: { max: 2, used: 0 } });

    // Level 11: 3 slots of 5th level
    expect(calculateSpellSlots('Warlock', 11)).toEqual({ 5: { max: 3, used: 0 } });

    // Level 17+: 4 slots of 5th level
    expect(calculateSpellSlots('Warlock', 20)).toEqual({ 5: { max: 4, used: 0 } });
  });

  it('returns empty spell slots for non-casters', () => {
    expect(calculateSpellSlots('Barbarian', 10)).toEqual({});
    expect(calculateSpellSlots('Barbarzyńca', 5)).toEqual({});
    expect(calculateSpellSlots('Fighter', 15)).toEqual({});
    expect(calculateSpellSlots('Wojownik', 20)).toEqual({});
    expect(calculateSpellSlots('Monk', 8)).toEqual({});
    expect(calculateSpellSlots('Rogue', 12)).toEqual({});
  });
});

describe('dnd-rules - applyDamage', () => {
  it('absorbs damage using tempHp first, then reduces currentHp', () => {
    // 5 tempHp, taking 3 damage => 2 tempHp left, currentHp untouched
    const res1 = applyDamage(20, 20, 5, 3);
    expect(res1).toEqual({ currentHp: 20, tempHp: 2 });

    // 5 tempHp, taking 8 damage => tempHp 0, currentHp takes 3 damage (20 - 3 = 17)
    const res2 = applyDamage(20, 20, 5, 8);
    expect(res2).toEqual({ currentHp: 17, tempHp: 0 });

    // taking lethal damage => currentHp floored at 0
    const res3 = applyDamage(10, 20, 0, 25);
    expect(res3).toEqual({ currentHp: 0, tempHp: 0 });
  });

  it('handles 0 or negative damage safely', () => {
    const res = applyDamage(15, 20, 5, -5);
    expect(res).toEqual({ currentHp: 15, tempHp: 5 });
  });
});

describe('dnd-rules - applyHealing', () => {
  it('restores currentHp up to maxHp without touching tempHp', () => {
    const res1 = applyHealing(10, 20, 5, 6);
    expect(res1).toEqual({ currentHp: 16, tempHp: 5 });

    // overhealing capped at maxHp
    const res2 = applyHealing(18, 20, 5, 10);
    expect(res2).toEqual({ currentHp: 20, tempHp: 5 });
  });

  it('handles negative or zero heal safely', () => {
    const res = applyHealing(12, 20, 5, -4);
    expect(res).toEqual({ currentHp: 12, tempHp: 5 });
  });
});

describe('dnd-rules - applyTempHp', () => {
  it('takes the highest temporary HP per D&D 5e rules (does not stack)', () => {
    const res1 = applyTempHp(20, 20, 5, 8);
    expect(res1).toEqual({ currentHp: 20, tempHp: 8 });

    const res2 = applyTempHp(20, 20, 8, 4);
    expect(res2).toEqual({ currentHp: 20, tempHp: 8 });
  });
});

describe('dnd-rules - modifySpellSlot', () => {
  it('correctly uses, recovers, or sets spell slot counts', () => {
    const initialSlots = {
      1: { max: 4, used: 1 },
      2: { max: 2, used: 0 },
    };

    // Use slot 1: used goes from 1 to 2
    const used = modifySpellSlot(initialSlots, 1, 'use');
    expect(used[1].used).toBe(2);

    // Over-use slot 2: max is 2
    let updated = modifySpellSlot(initialSlots, 2, 'use');
    updated = modifySpellSlot(updated, 2, 'use');
    updated = modifySpellSlot(updated, 2, 'use'); // attempts 3rd
    expect(updated[2].used).toBe(2);

    // Recover slot 1: used goes down
    const recovered = modifySpellSlot(used, 1, 'recover');
    expect(recovered[1].used).toBe(1);

    // Recover at 0: stays 0
    const zeroRecovered = modifySpellSlot(initialSlots, 2, 'recover');
    expect(zeroRecovered[2].used).toBe(0);

    // Explicit set
    const explicit = modifySpellSlot(initialSlots, 1, 'set', 3);
    expect(explicit[1].used).toBe(3);
  });
});

describe('dnd-rules - calculatePartyXpThresholds', () => {
  it('returns zeroes for empty party', () => {
    expect(calculatePartyXpThresholds([])).toEqual({
      easy: 0,
      medium: 0,
      hard: 0,
      deadly: 0,
    });
  });

  it('calculates thresholds for a single character (level 1)', () => {
    // Level 1 DMG p. 82: Easy 25, Medium 50, Hard 75, Deadly 100
    expect(calculatePartyXpThresholds([1])).toEqual({
      easy: 25,
      medium: 50,
      hard: 75,
      deadly: 100,
    });
  });

  it('aggregates thresholds for a standard 4-person party of level 3 adventurers', () => {
    // Level 3 per character: Easy 75, Medium 150, Hard 225, Deadly 400
    // Party of 4: 300, 600, 900, 1600
    expect(calculatePartyXpThresholds([3, 3, 3, 3])).toEqual({
      easy: 300,
      medium: 600,
      hard: 900,
      deadly: 1600,
    });
  });

  it('correctly aggregates mixed level party', () => {
    // L1 (25, 50, 75, 100) + L5 (250, 500, 750, 1100) = 275, 550, 825, 1200
    expect(calculatePartyXpThresholds([1, 5])).toEqual({
      easy: 275,
      medium: 550,
      hard: 825,
      deadly: 1200,
    });
  });
});

describe('dnd-rules - getEncounterMultiplier', () => {
  it('returns standard DMG multipliers for 3-5 person party', () => {
    expect(getEncounterMultiplier(1, 4)).toBe(1);
    expect(getEncounterMultiplier(2, 4)).toBe(1.5);
    expect(getEncounterMultiplier(3, 4)).toBe(2);
    expect(getEncounterMultiplier(6, 4)).toBe(2);
    expect(getEncounterMultiplier(7, 4)).toBe(2.5);
    expect(getEncounterMultiplier(10, 4)).toBe(2.5);
    expect(getEncounterMultiplier(11, 4)).toBe(3);
    expect(getEncounterMultiplier(14, 4)).toBe(3);
    expect(getEncounterMultiplier(15, 4)).toBe(4);
  });

  it('adjusts multiplier up for small parties (< 3 characters)', () => {
    // 1 monster normally 1x -> becomes 1.5x
    expect(getEncounterMultiplier(1, 2)).toBe(1.5);
    // 2 monsters normally 1.5x -> becomes 2x
    expect(getEncounterMultiplier(2, 2)).toBe(2);
  });

  it('adjusts multiplier down for large parties (>= 6 characters)', () => {
    // 2 monsters normally 1.5x -> becomes 1x
    expect(getEncounterMultiplier(2, 6)).toBe(1);
    // 1 monster normally 1x -> becomes 0.5x
    expect(getEncounterMultiplier(1, 6)).toBe(0.5);
  });

  it('handles 0 monsters gracefully', () => {
    expect(getEncounterMultiplier(0, 4)).toBe(1);
  });
});

describe('dnd-rules - calculateEncounterDifficulty', () => {
  it('identifies trivial encounter when adjusted XP is below easy threshold', () => {
    // Party: 4x lvl 1 (easy=100, medium=200, hard=300, deadly=400)
    // Monster: 1x 50 XP (adjusted XP = 50)
    const result = calculateEncounterDifficulty([50], [1, 1, 1, 1]);
    expect(result.difficulty).toBe('trivial');
    expect(result.totalXp).toBe(50);
    expect(result.adjustedXp).toBe(50);
    expect(result.multiplier).toBe(1);
  });

  it('identifies easy encounter when adjusted XP is between easy and medium', () => {
    // Party: 4x lvl 1 (easy=100, medium=200)
    // Monster: 1x 100 XP (adjusted XP = 100)
    const result = calculateEncounterDifficulty([100], [1, 1, 1, 1]);
    expect(result.difficulty).toBe('easy');
    expect(result.adjustedXp).toBe(100);
  });

  it('identifies medium encounter with multiple monsters applying multiplier', () => {
    // Party: 4x lvl 1 (easy=100, med=200, hard=300, deadly=400)
    // Monsters: 2x 75 XP = 150 base XP. Multiplier for 2 monsters = 1.5 => 225 adjusted XP
    // 225 is >= medium (200) and < hard (300)
    const result = calculateEncounterDifficulty([75, 75], [1, 1, 1, 1]);
    expect(result.totalXp).toBe(150);
    expect(result.multiplier).toBe(1.5);
    expect(result.adjustedXp).toBe(225);
    expect(result.difficulty).toBe('medium');
  });

  it('identifies hard and deadly encounters accurately', () => {
    // Party: 4x lvl 1 (hard=300, deadly=400)
    // Hard: 350 adjusted XP
    const hardResult = calculateEncounterDifficulty([350], [1, 1, 1, 1]);
    expect(hardResult.difficulty).toBe('hard');

    // Deadly: 450 adjusted XP
    const deadlyResult = calculateEncounterDifficulty([450], [1, 1, 1, 1]);
    expect(deadlyResult.difficulty).toBe('deadly');
  });
});

describe('dnd-rules - getMonsterXp', () => {
  it('returns explicit xp when provided and positive', () => {
    expect(getMonsterXp({ xp: 450, challengeRating: 2 })).toBe(450);
    expect(getMonsterXp({ xp: 50 })).toBe(50);
  });

  it('derives XP from CR when explicit xp is missing or zero', () => {
    expect(getMonsterXp({ challengeRating: 0 })).toBe(10);
    expect(getMonsterXp({ challengeRating: 0.125 })).toBe(25);
    expect(getMonsterXp({ challengeRating: 0.25 })).toBe(50);
    expect(getMonsterXp({ challengeRating: 0.5 })).toBe(100);
    expect(getMonsterXp({ challengeRating: 1 })).toBe(200);
    expect(getMonsterXp({ challengeRating: 2 })).toBe(450);
    expect(getMonsterXp({ challengeRating: 3 })).toBe(700);
    expect(getMonsterXp({ challengeRating: 5 })).toBe(1800);
  });

  it('handles empty or undefined monster input gracefully', () => {
    expect(getMonsterXp(undefined)).toBe(10);
    expect(getMonsterXp({})).toBe(10);
  });
});

describe('dnd-rules - getCanonicalClassName & isSpellcasterClass', () => {
  it('maps localized Polish and English class names to canonical SRD identifiers', () => {
    expect(getCanonicalClassName('Czarodziej (Wizard)')).toBe('Wizard');
    expect(getCanonicalClassName('Kleryk (Cleric)')).toBe('Cleric');
    expect(getCanonicalClassName('Wojownik (Fighter)')).toBe('Fighter');
    expect(getCanonicalClassName('Paladyn')).toBe('Paladin');
    expect(getCanonicalClassName('Łotrzyk')).toBe('Rogue');
    expect(getCanonicalClassName(undefined)).toBe('Fighter');
  });

  it('correctly identifies spellcasters vs non-spellcasters', () => {
    expect(isSpellcasterClass('Wizard')).toBe(true);
    expect(isSpellcasterClass('Kleryk (Cleric)')).toBe(true);
    expect(isSpellcasterClass('Paladin')).toBe(true);
    expect(isSpellcasterClass('Wojownik (Fighter)')).toBe(false);
    expect(isSpellcasterClass('Barbarzyńca')).toBe(false);
    expect(isSpellcasterClass('Łotrzyk')).toBe(false);
  });
});

describe('dnd-rules - getMaxSpellLevel & getRecommendedCantripsCount', () => {
  it('calculates maximum spell level accessible based on class and level', () => {
    // Full Caster: Wizard
    expect(getMaxSpellLevel('Wizard', 1)).toBe(1);
    expect(getMaxSpellLevel('Wizard', 3)).toBe(2);
    expect(getMaxSpellLevel('Wizard', 5)).toBe(3);
    expect(getMaxSpellLevel('Wizard', 9)).toBe(5);
    expect(getMaxSpellLevel('Wizard', 17)).toBe(9);

    // Half Caster: Paladin (no spells at level 1, 1st level at level 2)
    expect(getMaxSpellLevel('Paladin', 1)).toBe(0);
    expect(getMaxSpellLevel('Paladin', 2)).toBe(1);
    expect(getMaxSpellLevel('Paladin', 5)).toBe(2);

    // Warlock (Pact Magic caps at 5)
    expect(getMaxSpellLevel('Warlock', 1)).toBe(1);
    expect(getMaxSpellLevel('Warlock', 9)).toBe(5);
    expect(getMaxSpellLevel('Warlock', 20)).toBe(5);

    // Non-caster: Fighter
    expect(getMaxSpellLevel('Fighter', 5)).toBe(0);
  });

  it('provides recommended cantrips count based on class and level', () => {
    expect(getRecommendedCantripsCount('Wizard', 1)).toBe(3);
    expect(getRecommendedCantripsCount('Wizard', 4)).toBe(4);
    expect(getRecommendedCantripsCount('Sorcerer', 1)).toBe(4);
    expect(getRecommendedCantripsCount('Warlock', 1)).toBe(2);
    expect(getRecommendedCantripsCount('Paladin', 1)).toBe(0);
    expect(getRecommendedCantripsCount('Fighter', 1)).toBe(0);
  });
});

describe('dnd-rules - getSpellcasterType & getRecommendedLevelUpSpellsCount', () => {
  it('correctly categorizes classes by spellcasting mechanism', () => {
    expect(getSpellcasterType('Wizard')).toBe('spellbook');
    expect(getSpellcasterType('Czarodziej (Wizard)')).toBe('spellbook');
    expect(getSpellcasterType('Sorcerer')).toBe('known');
    expect(getSpellcasterType('Bard')).toBe('known');
    expect(getSpellcasterType('Warlock')).toBe('known');
    expect(getSpellcasterType('Ranger')).toBe('known');
    expect(getSpellcasterType('Cleric')).toBe('prepared');
    expect(getSpellcasterType('Kleryk (Cleric)')).toBe('prepared');
    expect(getSpellcasterType('Druid')).toBe('prepared');
    expect(getSpellcasterType('Paladin')).toBe('prepared');
    expect(getSpellcasterType('Fighter')).toBe('none');
    expect(getSpellcasterType('Wojownik (Fighter)')).toBe('none');
    expect(getSpellcasterType('Barbarzyńca')).toBe('none');
  });

  it('calculates recommended level up spells count for wizard (2 per level)', () => {
    expect(getRecommendedLevelUpSpellsCount('Wizard', 2)).toBe(2);
    expect(getRecommendedLevelUpSpellsCount('Wizard', 3)).toBe(2);
    expect(getRecommendedLevelUpSpellsCount('Wizard', 10)).toBe(2);
    expect(getRecommendedLevelUpSpellsCount('Czarodziej (Wizard)', 5)).toBe(2);
  });

  it('calculates recommended level up spells count for sorcerer, bard, warlock and ranger', () => {
    // Sorcerer: 1 per level up to 17, 0 on 18-20
    expect(getRecommendedLevelUpSpellsCount('Sorcerer', 2)).toBe(1);
    expect(getRecommendedLevelUpSpellsCount('Sorcerer', 17)).toBe(1);
    expect(getRecommendedLevelUpSpellsCount('Sorcerer', 18)).toBe(0);

    // Bard: 1 standard, 2 on magical secrets (10, 14, 18), 0 on 12, 16, 19, 20
    expect(getRecommendedLevelUpSpellsCount('Bard', 2)).toBe(1);
    expect(getRecommendedLevelUpSpellsCount('Bard', 10)).toBe(2);
    expect(getRecommendedLevelUpSpellsCount('Bard', 12)).toBe(0);

    // Warlock: 1 on level 2-9, 11, etc.
    expect(getRecommendedLevelUpSpellsCount('Warlock', 2)).toBe(1);
    expect(getRecommendedLevelUpSpellsCount('Warlock', 10)).toBe(0);
    expect(getRecommendedLevelUpSpellsCount('Warlock', 11)).toBe(1);

    // Ranger: 2 on level 2, 1 on odd levels, 0 on even
    expect(getRecommendedLevelUpSpellsCount('Ranger', 2)).toBe(2);
    expect(getRecommendedLevelUpSpellsCount('Ranger', 3)).toBe(1);
    expect(getRecommendedLevelUpSpellsCount('Ranger', 4)).toBe(0);
  });

  it('returns 0 recommended new spells for prepared casters and non-casters', () => {
    expect(getRecommendedLevelUpSpellsCount('Cleric', 2)).toBe(0);
    expect(getRecommendedLevelUpSpellsCount('Druid', 3)).toBe(0);
    expect(getRecommendedLevelUpSpellsCount('Paladin', 2)).toBe(0);
    expect(getRecommendedLevelUpSpellsCount('Fighter', 4)).toBe(0);
  });
});

describe('dnd-rules - getDefaultClassEquipment', () => {
  it('returns appropriate starter equipment package for class', () => {
    const fighterEquip = getDefaultClassEquipment('Fighter');
    expect(fighterEquip).toContain('Długi miecz (Longsword)');
    expect(fighterEquip).toContain('Tarcza (Shield)');

    const wizardEquip = getDefaultClassEquipment('Czarodziej (Wizard)');
    expect(wizardEquip).toContain('Księga zaklęć (Spellbook)');
    expect(wizardEquip).toContain('Sztylet (Dagger)');

    const clericEquip = getDefaultClassEquipment('Kleryk (Cleric)');
    expect(clericEquip).toContain('Święty symbol (Holy Symbol)');
  });
});

describe('dnd-rules - XP thresholds and level calculation', () => {
  it('correctly returns official D&D 5e XP thresholds for levels 1-20', () => {
    expect(XP_LEVEL_THRESHOLDS).toHaveLength(20);
    expect(getXpForLevel(1)).toBe(0);
    expect(getXpForLevel(2)).toBe(300);
    expect(getXpForLevel(3)).toBe(900);
    expect(getXpForLevel(4)).toBe(2700);
    expect(getXpForLevel(5)).toBe(6500);
    expect(getXpForLevel(20)).toBe(355000);
  });

  it('calculates character level from total XP points', () => {
    expect(getLevelFromXp(0)).toBe(1);
    expect(getLevelFromXp(250)).toBe(1);
    expect(getLevelFromXp(300)).toBe(2);
    expect(getLevelFromXp(899)).toBe(2);
    expect(getLevelFromXp(900)).toBe(3);
    expect(getLevelFromXp(2700)).toBe(4);
    expect(getLevelFromXp(6500)).toBe(5);
    expect(getLevelFromXp(500000)).toBe(20);
  });

  it('calculates next level threshold, remaining XP and progress percentage', () => {
    // At 600 XP (Level 2: 300 to 900) -> 300 earned of 600 span = 50%
    const progress = getNextLevelXpThreshold(600);
    expect(progress.currentLevel).toBe(2);
    expect(progress.nextLevel).toBe(3);
    expect(progress.currentLevelXp).toBe(300);
    expect(progress.nextLevelXp).toBe(900);
    expect(progress.remainingXp).toBe(300);
    expect(progress.progressPercent).toBe(50);

    // At Level 20
    const maxProgress = getNextLevelXpThreshold(400000);
    expect(maxProgress.currentLevel).toBe(20);
    expect(maxProgress.nextLevel).toBe(20);
    expect(maxProgress.remainingXp).toBe(0);
    expect(maxProgress.progressPercent).toBe(100);
  });
});

describe('dnd-rules - ASI, Hit Die Average, HP Gain and Proficiency Bonus', () => {
  it('identifies Ability Score Improvement (ASI) levels for standard and special classes', () => {
    // Wizard: 4, 8, 12, 16, 19
    expect(isAsiLevel('Wizard', 4)).toBe(true);
    expect(isAsiLevel('Wizard', 6)).toBe(false);
    expect(isAsiLevel('Wizard', 8)).toBe(true);
    expect(isAsiLevel('Wizard', 12)).toBe(true);

    // Fighter: 4, 6, 8, 12, 14, 16, 19
    expect(isAsiLevel('Fighter', 6)).toBe(true);
    expect(isAsiLevel('Wojownik', 14)).toBe(true);
    expect(isAsiLevel('Fighter', 5)).toBe(false);

    // Rogue: 4, 8, 10, 12, 16, 19
    expect(isAsiLevel('Rogue', 10)).toBe(true);
    expect(isAsiLevel('Rogue', 6)).toBe(false);
  });

  it('returns canonical Hit Die average values', () => {
    expect(getClassHitDieAverage('Wizard')).toBe(4); // d6 -> 4
    expect(getClassHitDieAverage('Cleric')).toBe(5); // d8 -> 5
    expect(getClassHitDieAverage('Fighter')).toBe(6); // d10 -> 6
    expect(getClassHitDieAverage('Barbarian')).toBe(7); // d12 -> 7
  });

  it('calculates HP gain on level up with minimum of 1 HP', () => {
    // Fighter (d10, avg 6) with CON +2 (+2 modifier)
    expect(calculateLevelUpHpGain('Fighter', 2, 'average')).toBe(8);

    // Wizard (d6, avg 4) with low CON -4 (-4 modifier) -> min 1 HP
    expect(calculateLevelUpHpGain('Wizard', -4, 'average')).toBe(1);

    // Rolled value: Barbarian rolls 10 with CON +3 -> 13 HP
    expect(calculateLevelUpHpGain('Barbarian', 3, 'roll', 10)).toBe(13);
  });

  it('calculates proficiency bonus according to level tier', () => {
    expect(calculateProficiencyBonus(1)).toBe(2);
    expect(calculateProficiencyBonus(4)).toBe(2);
    expect(calculateProficiencyBonus(5)).toBe(3);
    expect(calculateProficiencyBonus(8)).toBe(3);
    expect(calculateProficiencyBonus(9)).toBe(4);
    expect(calculateProficiencyBonus(13)).toBe(5);
    expect(calculateProficiencyBonus(17)).toBe(6);
    expect(calculateProficiencyBonus(20)).toBe(6);
  });
});

describe('dnd-rules - applyLevelUp', () => {
  it('applies level up with ASI, HP increase and spell slot updates', () => {
    const character = {
      level: 3,
      class: 'Czarodziej (Wizard)',
      maxHp: 20,
      currentHp: 18,
      ac: 12,
      passivePerception: 11,
      stats: { str: 8, dex: 14, con: 12, int: 17, wis: 12, cha: 10 },
      spells: {
        slots: { 1: { max: 4, used: 1 }, 2: { max: 2, used: 0 } },
        known: ['Magiczny Pocisk'],
      },
    };

    // Level up to 4 (ASI level): +1 INT (17 -> 18), +1 CON (12 -> 13)
    const updated = applyLevelUp(character, {
      hpGainMethod: 'average', // Wizard avg 4 + CON mod +1 = +5 HP
      abilityScoreImprovements: { int: 1, con: 1 },
      newSpells: ['Kula Ognia'],
    });

    expect(updated.level).toBe(4);
    expect(updated.maxHp).toBe(25);
    expect(updated.currentHp).toBe(23);
    expect(updated.stats.int).toBe(18);
    expect(updated.stats.con).toBe(13);
    // Spells: Wizard level 4 has 4 1st-level slots and 3 2nd-level slots
    expect(updated.spells.slots[2].max).toBe(3);
    expect(updated.spells.known).toContain('Kula Ognia');
    expect(updated.spells.known).toContain('Magiczny Pocisk');
  });

  it('caps ability scores at 20 when applying ASI', () => {
    const character = {
      level: 3,
      class: 'Wojownik (Fighter)',
      maxHp: 30,
      currentHp: 30,
      ac: 14,
      passivePerception: 10,
      stats: { str: 19, dex: 14, con: 14, int: 10, wis: 10, cha: 8 },
    };

    const updated = applyLevelUp(character, {
      hpGainMethod: 'average',
      abilityScoreImprovements: { str: 2 }, // 19 + 2 would be 21, but caps at 20
    });

    expect(updated.stats.str).toBe(20);
  });
});
