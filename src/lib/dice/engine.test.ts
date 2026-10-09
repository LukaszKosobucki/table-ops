import { describe, expect, it } from 'vitest';
import {
  executeRoll,
  formatBreakdown,
  formatFormula,
  isCriticalFailure,
  isCriticalSuccess,
  rollDie,
} from './engine';
import type { RollRequest } from './types';

// Helper mock crypto that returns deterministic uint32 values
function createMockCrypto(values: number[]): Crypto {
  let index = 0;
  return {
    getRandomValues: <T extends ArrayBufferView | null>(array: T): T => {
      if (array instanceof Uint32Array) {
        for (let i = 0; i < array.length; i++) {
          array[i] = values[index % values.length];
          index++;
        }
      }
      return array;
    },
  } as unknown as Crypto;
}

describe('Dice Engine - rollDie', () => {
  it('rolls values strictly within [1, sides] for all dice types', () => {
    const diceTypes = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'] as const;
    const sidesMap = { d4: 4, d6: 6, d8: 8, d10: 10, d12: 12, d20: 20, d100: 100 };

    for (const type of diceTypes) {
      const maxSides = sidesMap[type];
      for (let i = 0; i < 50; i++) {
        const val = rollDie(type);
        expect(val).toBeGreaterThanOrEqual(1);
        expect(val).toBeLessThanOrEqual(maxSides);
        expect(Number.isInteger(val)).toBe(true);
      }
    }
  });

  it('uses deterministic mock crypto correctly without bias', () => {
    // 0 corresponds to 1, max uint32 - 1 corresponds to max side
    const mockMin = createMockCrypto([0]);
    expect(rollDie('d20', mockMin)).toBe(1);

    const mockMax = createMockCrypto([19]);
    expect(rollDie('d20', mockMax)).toBe(20);
  });
});

describe('Dice Engine - executeRoll', () => {
  it('executes simple roll with multiple dice and positive modifier', () => {
    // Deterministic mock returning sequence that maps to:
    // d6 => 4, d6 => 6, d10 => 7, d10 => 6
    // Since formula is 1 + (val % sides), we mock:
    // For d6: 3 -> 4, 5 -> 6. For d10: 6 -> 7, 5 -> 6.
    const mock = createMockCrypto([3, 5, 6, 5]);

    const request: RollRequest = {
      id: 'req-1',
      dice: [
        { type: 'd6', count: 2 },
        { type: 'd10', count: 2 },
      ],
      modifier: 4,
      isSecret: false,
    };

    const result = executeRoll(request, 'Mistrz Gry', mock);

    expect(result.requestId).toBe('req-1');
    expect(result.actorName).toBe('Mistrz Gry');
    expect(result.modifier).toBe(4);
    expect(result.diceResults).toHaveLength(4);
    expect(result.diceResults.map((r) => r.value)).toEqual([4, 6, 7, 6]);
    // 4 + 6 + 7 + 6 + 4 = 27
    expect(result.total).toBe(27);
    expect(result.formula).toBe('2d6 + 2d10 + 4');
  });

  it('handles negative modifiers correctly', () => {
    const mock = createMockCrypto([9]); // d20 => 10

    const request: RollRequest = {
      id: 'req-neg',
      dice: [{ type: 'd20', count: 1 }],
      modifier: -3,
      isSecret: true,
    };

    const result = executeRoll(request, 'GM', mock);
    expect(result.isSecret).toBe(true);
    expect(result.modifier).toBe(-3);
    expect(result.total).toBe(7); // 10 - 3
    expect(result.formula).toBe('1d20 - 3');
  });

  it('clamps modifiers to [-99, +99]', () => {
    const mock = createMockCrypto([5]); // d6 => 6

    const requestOver: RollRequest = {
      id: 'req-over',
      dice: [{ type: 'd6', count: 1 }],
      modifier: 150,
      isSecret: false,
    };
    const resultOver = executeRoll(requestOver, 'GM', mock);
    expect(resultOver.modifier).toBe(99);
    expect(resultOver.total).toBe(105);

    const requestUnder: RollRequest = {
      id: 'req-under',
      dice: [{ type: 'd6', count: 1 }],
      modifier: -200,
      isSecret: false,
    };
    const resultUnder = executeRoll(requestUnder, 'GM', mock);
    expect(resultUnder.modifier).toBe(-99);
    expect(resultUnder.total).toBe(-93);
  });

  it('handles modifier-only rolls (0 dice)', () => {
    const request: RollRequest = {
      id: 'req-mod-only',
      dice: [],
      modifier: 5,
      isSecret: false,
    };
    const result = executeRoll(request, 'GM');
    expect(result.diceResults).toEqual([]);
    expect(result.total).toBe(5);
    expect(result.formula).toBe('+5');
  });
});

describe('Dice Engine - Advantage & Disadvantage', () => {
  it('rolls two d20s for Advantage, keeps the highest and ignores the lowest', () => {
    // Mock generates: first roll = 8 (val 9), second roll = 17 (val 18)
    const mock = createMockCrypto([8, 17]);

    const request: RollRequest = {
      id: 'req-adv',
      dice: [{ type: 'd20', count: 1 }],
      modifier: 3,
      advantageMode: 'advantage',
      isSecret: false,
    };

    const result = executeRoll(request, 'Bohater', mock);

    expect(result.diceResults).toHaveLength(2);
    // Highest is 18 (not ignored), lowest is 9 (ignored)
    const active = result.diceResults.find((d) => !d.ignored);
    const ignored = result.diceResults.find((d) => d.ignored);

    expect(active?.value).toBe(18);
    expect(ignored?.value).toBe(9);
    expect(result.total).toBe(21); // 18 + 3
    expect(result.formula).toBe('1d20 (Advantage) + 3');
  });

  it('rolls two d20s for Disadvantage, keeps the lowest and ignores the highest', () => {
    // Mock generates: first roll = 18 (val 19), second roll = 3 (val 4)
    const mock = createMockCrypto([18, 3]);

    const request: RollRequest = {
      id: 'req-disadv',
      dice: [{ type: 'd20', count: 1 }],
      modifier: 2,
      advantageMode: 'disadvantage',
      isSecret: false,
    };

    const result = executeRoll(request, 'Bohater', mock);

    expect(result.diceResults).toHaveLength(2);
    const active = result.diceResults.find((d) => !d.ignored);
    const ignored = result.diceResults.find((d) => d.ignored);

    expect(active?.value).toBe(4);
    expect(ignored?.value).toBe(19);
    expect(result.total).toBe(6); // 4 + 2
    expect(result.formula).toBe('1d20 (Disadvantage) + 2');
  });

  it('handles tied rolls in advantage/disadvantage by ignoring exactly one', () => {
    // Both roll 12 (val 13)
    const mock = createMockCrypto([12, 12]);

    const request: RollRequest = {
      id: 'req-tie',
      dice: [{ type: 'd20', count: 1 }],
      modifier: 0,
      advantageMode: 'advantage',
      isSecret: false,
    };

    const result = executeRoll(request, 'Bohater', mock);
    expect(result.diceResults).toHaveLength(2);
    expect(result.diceResults.filter((d) => !d.ignored)).toHaveLength(1);
    expect(result.diceResults.filter((d) => d.ignored)).toHaveLength(1);
    expect(result.total).toBe(13);
  });

  it('does not apply advantage/disadvantage to non-d20 dice in mixed pools', () => {
    // d20: 2 rolls (14, 8), d6: 1 roll (5)
    const mock = createMockCrypto([13, 7, 4]);

    const request: RollRequest = {
      id: 'req-mixed',
      dice: [
        { type: 'd20', count: 1 },
        { type: 'd6', count: 1 },
      ],
      modifier: 0,
      advantageMode: 'advantage',
      isSecret: false,
    };

    const result = executeRoll(request, 'Bohater', mock);
    const d20s = result.diceResults.filter((d) => d.type === 'd20');
    const d6s = result.diceResults.filter((d) => d.type === 'd6');

    expect(d20s).toHaveLength(2);
    expect(d6s).toHaveLength(1);
    expect(d6s[0].ignored).toBeFalsy();
    // d20 kept is 14, d6 is 5 => total = 19
    expect(result.total).toBe(19);
  });
});

describe('Dice Engine - Critical Checks', () => {
  it('detects critical success (nat 20) on active d20', () => {
    const mock = createMockCrypto([19]); // 20
    const res = executeRoll(
      {
        id: '1',
        dice: [{ type: 'd20', count: 1 }],
        modifier: 0,
        isSecret: false,
      },
      'GM',
      mock
    );
    expect(isCriticalSuccess(res)).toBe(true);
    expect(isCriticalFailure(res)).toBe(false);
  });

  it('detects critical failure (nat 1) on active d20', () => {
    const mock = createMockCrypto([0]); // 1
    const res = executeRoll(
      {
        id: '2',
        dice: [{ type: 'd20', count: 1 }],
        modifier: 5,
        isSecret: false,
      },
      'GM',
      mock
    );
    expect(isCriticalSuccess(res)).toBe(false);
    expect(isCriticalFailure(res)).toBe(true);
  });

  it('correctly ignores discarded d20 when determining critical', () => {
    // In Advantage: rolled 1 (0) and 20 (19).
    // The active one is 20, ignored is 1. Should be CRITICAL SUCCESS, not failure!
    const mockAdv = createMockCrypto([0, 19]);
    const resAdv = executeRoll(
      {
        id: '3',
        dice: [{ type: 'd20', count: 1 }],
        modifier: 0,
        advantageMode: 'advantage',
        isSecret: false,
      },
      'GM',
      mockAdv
    );
    expect(isCriticalSuccess(resAdv)).toBe(true);
    expect(isCriticalFailure(resAdv)).toBe(false);

    // In Disadvantage: rolled 20 (19) and 1 (0).
    // The active one is 1, ignored is 20. Should be CRITICAL FAILURE, not success!
    const mockDis = createMockCrypto([19, 0]);
    const resDis = executeRoll(
      {
        id: '4',
        dice: [{ type: 'd20', count: 1 }],
        modifier: 0,
        advantageMode: 'disadvantage',
        isSecret: false,
      },
      'GM',
      mockDis
    );
    expect(isCriticalSuccess(resDis)).toBe(false);
    expect(isCriticalFailure(resDis)).toBe(true);
  });
});

describe('Dice Engine - Formatting and Breakdown', () => {
  it('formats standard formula string', () => {
    expect(
      formatFormula(
        [
          { type: 'd6', count: 4 },
          { type: 'd10', count: 2 },
        ],
        4
      )
    ).toBe('4d6 + 2d10 + 4');
    expect(formatFormula([{ type: 'd20', count: 1 }], 0)).toBe('1d20');
    expect(formatFormula([{ type: 'd20', count: 1 }], -5)).toBe('1d20 - 5');
    expect(formatFormula([], 3)).toBe('+3');
    expect(formatFormula([], -2)).toBe('-2');
    expect(formatFormula([], 0)).toBe('0');
  });

  it('formats Polish tabletop breakdown according to spec', () => {
    const mock = createMockCrypto([3, 5, 1, 4, 6, 5]); // 4, 6, 2, 5 for d6 and 7, 6 for d10
    const request: RollRequest = {
      id: 'req-b',
      dice: [
        { type: 'd6', count: 4 },
        { type: 'd10', count: 2 },
      ],
      modifier: 4,
      isSecret: false,
    };
    const result = executeRoll(request, 'GM', mock);
    // 4k6 [4, 6, 2, 5] + 2k10 [7, 6] + 4 = 34
    expect(formatBreakdown(result)).toBe('4k6 [4, 6, 2, 5] + 2k10 [7, 6] + 4 = 34');
  });

  it('formats breakdown with advantage showing ignored die in brackets or strikethrough', () => {
    const mock = createMockCrypto([17, 6]); // 18 and 7
    const request: RollRequest = {
      id: 'req-adv-b',
      dice: [{ type: 'd20', count: 1 }],
      modifier: 3,
      advantageMode: 'advantage',
      isSecret: false,
    };
    const result = executeRoll(request, 'GM', mock);
    // Active is 18, ignored is 7
    expect(formatBreakdown(result)).toBe('1k20 (Advantage) [18, (7)] + 3 = 21');
  });
});
