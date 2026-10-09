import {
  type AdvantageMode,
  DICE_CONFIG,
  DICE_ORDER,
  type DiceGroup,
  type DiceType,
  type RollRequest,
  type RollResult,
  type SingleDieResult,
} from './types';

export const DICE_SIDES: Record<DiceType, number> = {
  d4: 4,
  d6: 6,
  d8: 8,
  d10: 10,
  d12: 12,
  d20: 20,
  d100: 100,
};

/**
 * Rolls a single die using cryptographically secure random values.
 * Uses rejection sampling against 2^32 to guarantee zero modulo bias.
 */
export function rollDie(type: DiceType, cryptoObj?: Crypto): number {
  const activeCrypto =
    cryptoObj ??
    (typeof window !== 'undefined' && window.crypto ? window.crypto : globalThis.crypto);

  if (!activeCrypto || typeof activeCrypto.getRandomValues !== 'function') {
    throw new Error('Web Crypto API is not available.');
  }

  const sides = DICE_SIDES[type];
  // 0x100000000 is 2^32
  const limit = 0x100000000 - (0x100000000 % sides);
  const buffer = new Uint32Array(1);

  let raw: number;
  do {
    activeCrypto.getRandomValues(buffer);
    raw = buffer[0];
  } while (raw >= limit);

  return (raw % sides) + 1;
}

/**
 * Clamps numeric modifier to allowed range [-99, +99].
 */
export function clampModifier(mod: number): number {
  const rounded = Number.isFinite(mod) ? Math.round(mod) : 0;
  return Math.max(-99, Math.min(99, rounded));
}

/**
 * Formats a clean dice formula string like "4d6 + 2d10 + 4" or "1d20 (Advantage) + 3".
 */
export function formatFormula(
  dice: DiceGroup[],
  modifier: number,
  advantageMode: AdvantageMode = 'none'
): string {
  const parts: string[] = [];

  const nonZeroGroups = dice.filter((g) => g.count > 0);
  for (const group of nonZeroGroups) {
    let part = `${group.count}${group.type}`;
    if (group.type === 'd20') {
      if (advantageMode === 'advantage') {
        part += ' (Advantage)';
      } else if (advantageMode === 'disadvantage') {
        part += ' (Disadvantage)';
      }
    }
    parts.push(part);
  }

  const diceStr = parts.join(' + ');
  const clampedMod = clampModifier(modifier);

  if (diceStr.length === 0) {
    if (clampedMod > 0) return `+${clampedMod}`;
    if (clampedMod < 0) return `${clampedMod}`;
    return '0';
  }

  if (clampedMod > 0) {
    return `${diceStr} + ${clampedMod}`;
  }
  if (clampedMod < 0) {
    return `${diceStr} - ${Math.abs(clampedMod)}`;
  }
  return diceStr;
}

/**
 * Formats a tabletop breakdown string like:
 * "4k6 [4, 6, 2, 5] + 2k10 [7, 6] + 4 = 34"
 * or
 * "1k20 (Advantage) [18, (7)] + 3 = 21"
 */
export function formatBreakdown(result: RollResult): string {
  const parts: string[] = [];

  for (const diceType of DICE_ORDER) {
    const diceOfThisType = result.diceResults.filter((d) => d.type === diceType);
    if (diceOfThisType.length === 0) continue;

    const sides = DICE_CONFIG[diceType].sides;
    const label = `k${sides}`;
    const activeCount = diceOfThisType.filter((d) => !d.ignored).length;

    let modeLabel = '';
    if (diceType === 'd20') {
      if (result.advantageMode === 'advantage') {
        modeLabel = ' (Advantage)';
      } else if (result.advantageMode === 'disadvantage') {
        modeLabel = ' (Disadvantage)';
      }
    }

    const valuesFormatted = diceOfThisType.map((d) => (d.ignored ? `(${d.value})` : `${d.value}`));
    parts.push(`${activeCount}${label}${modeLabel} [${valuesFormatted.join(', ')}]`);
  }

  const diceStr = parts.join(' + ');
  const mod = clampModifier(result.modifier);

  let prefix = diceStr;
  if (parts.length === 0) {
    prefix = mod >= 0 ? `+${mod}` : `${mod}`;
    return `${prefix} = ${result.total}`;
  }

  if (mod > 0) {
    prefix += ` + ${mod}`;
  } else if (mod < 0) {
    prefix += ` - ${Math.abs(mod)}`;
  }

  return `${prefix} = ${result.total}`;
}

/**
 * Executes a deterministic roll request and returns a complete RollResult object.
 */
export function executeRoll(
  request: RollRequest,
  actorName = 'Mistrz Gry',
  cryptoObj?: Crypto
): RollResult {
  const modifier = clampModifier(request.modifier);
  const advantageMode = request.advantageMode ?? 'none';
  const diceResults: SingleDieResult[] = [];

  for (const group of request.dice) {
    if (group.count <= 0) continue;

    if (
      group.type === 'd20' &&
      (advantageMode === 'advantage' || advantageMode === 'disadvantage')
    ) {
      for (let i = 0; i < group.count; i++) {
        const roll1 = rollDie('d20', cryptoObj);
        const roll2 = rollDie('d20', cryptoObj);

        if (advantageMode === 'advantage') {
          if (roll1 >= roll2) {
            diceResults.push({ id: `d20-${i}-k`, type: 'd20', value: roll1, ignored: false });
            diceResults.push({ id: `d20-${i}-i`, type: 'd20', value: roll2, ignored: true });
          } else {
            diceResults.push({ id: `d20-${i}-k`, type: 'd20', value: roll2, ignored: false });
            diceResults.push({ id: `d20-${i}-i`, type: 'd20', value: roll1, ignored: true });
          }
        } else {
          // disadvantage
          if (roll1 <= roll2) {
            diceResults.push({ id: `d20-${i}-k`, type: 'd20', value: roll1, ignored: false });
            diceResults.push({ id: `d20-${i}-i`, type: 'd20', value: roll2, ignored: true });
          } else {
            diceResults.push({ id: `d20-${i}-k`, type: 'd20', value: roll2, ignored: false });
            diceResults.push({ id: `d20-${i}-i`, type: 'd20', value: roll1, ignored: true });
          }
        }
      }
    } else {
      for (let i = 0; i < group.count; i++) {
        const val = rollDie(group.type, cryptoObj);
        diceResults.push({
          id: `${group.type}-${i}`,
          type: group.type,
          value: val,
          ignored: false,
        });
      }
    }
  }

  const activeSum = diceResults
    .filter((d) => !d.ignored)
    .reduce((sum, curr) => sum + curr.value, 0);

  const total = activeSum + modifier;
  const formula = formatFormula(request.dice, modifier, advantageMode);
  const id = `roll-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const timestamp = new Date().toISOString();

  return {
    id,
    requestId: request.id,
    timestamp,
    diceResults,
    modifier,
    total,
    formula,
    isSecret: Boolean(request.isSecret),
    actorName,
    advantageMode,
    sourceContext: request.sourceContext,
  };
}

/**
 * Checks if the roll contains a natural 20 on an active d20 die.
 */
export function isCriticalSuccess(result: RollResult): boolean {
  return result.diceResults.some((d) => d.type === 'd20' && !d.ignored && d.value === 20);
}

/**
 * Checks if the roll contains a natural 1 on an active d20 die.
 */
export function isCriticalFailure(result: RollResult): boolean {
  return result.diceResults.some((d) => d.type === 'd20' && !d.ignored && d.value === 1);
}
