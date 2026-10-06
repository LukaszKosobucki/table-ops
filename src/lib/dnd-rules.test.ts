import { describe, expect, it } from 'vitest';
import {
  applyDamage,
  applyHealing,
  applyTempHp,
  calculateMaxHp,
  calculatePassivePerception,
  calculateSpellSlots,
  calculateUnarmoredAc,
  formatModifier,
  getAbilityModifier,
  getClassHitDie,
  modifySpellSlot,
  roll4d6DropLowest,
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
