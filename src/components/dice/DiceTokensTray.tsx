'use client';

import { Dices } from 'lucide-react';
import type { RollResult } from '@/lib/dice/types';
import { PolyhedralDieToken } from './PolyhedralDieToken';

export interface DiceTokensTrayProps {
  rollResult: RollResult | null;
  className?: string;
}

/**
 * Quick Polyhedral Dice Tray
 * Displays the current roll result using authentic polyhedral geometric shapes
 * (d4 triangle, d6 square, d8 diamond, d10 kite, d12 pentagon, d20 icosahedron, d100 percentile)
 * without text labels, with centered numbers and critical success/failure radiance.
 */
export function DiceTokensTray({ rollResult, className = '' }: DiceTokensTrayProps) {
  if (!rollResult || rollResult.diceResults.length === 0) {
    return (
      <div
        data-testid="dice-tray-empty-placeholder"
        className={`w-full min-h-[105px] rounded-xl bg-slate-950/60 border border-dashed border-slate-800/80 flex flex-col items-center justify-center p-4 text-center select-none ${className}`}
      >
        <div className="flex items-center gap-2 text-slate-500 text-xs font-mono">
          <Dices className="w-4 h-4 text-slate-600" />
          <span>Wybierz kości do puli i kliknij „Rzuć [Enter]”</span>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="dice-tokens-tray"
      className={`relative w-full min-h-[105px] rounded-xl bg-slate-950/90 border border-indigo-950/60 shadow-inner flex flex-wrap items-center justify-center gap-3 p-4 select-none ${className}`}
    >
      {rollResult.diceResults.map((die, idx) => (
        <PolyhedralDieToken
          key={die.id || `${die.type}-${idx}`}
          type={die.type}
          value={die.value}
          ignored={die.ignored}
          size={54}
        />
      ))}
    </div>
  );
}
