import { describe, expect, it } from 'vitest';
import {
  calculateMaxHp,
  calculatePassivePerception,
  calculateUnarmoredAc,
  formatModifier,
  getAbilityModifier,
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
