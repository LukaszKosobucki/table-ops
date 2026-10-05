'use client';

import { Heart, Shield } from 'lucide-react';
import { useState } from 'react';
import { getHealthStatus } from '@/lib/theme';

interface HpControlsProps {
  currentHp: number;
  maxHp: number;
  ac: number;
  onModifyHp: (amount: number) => void;
}

export function HpControls({ currentHp, maxHp, ac, onModifyHp }: HpControlsProps) {
  const [customDelta, setCustomDelta] = useState('');
  const status = getHealthStatus(currentHp, maxHp);
  const hpPercent =
    maxHp > 0 ? Math.max(0, Math.min(100, Math.round((currentHp / maxHp) * 100))) : 0;

  const handleApplyCustom = (isDamage: boolean) => {
    const val = parseInt(customDelta, 10);
    if (Number.isNaN(val) || val <= 0) return;
    onModifyHp(isDamage ? -val : val);
    setCustomDelta('');
  };

  return (
    <div className="space-y-2">
      {/* HP Bar & Numbers */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Heart className="w-3.5 h-3.5 text-rose-400" />
          <span className="font-semibold text-foreground">
            {currentHp} / {maxHp} HP
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${status.badgeClass}`}>
            {status.label}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-muted text-xs">
          <Shield className="w-3.5 h-3.5 text-brand-primary" />
          <span className="font-medium text-foreground">AC {ac}</span>
        </div>
      </div>

      {/* Progress Track */}
      <div className="hp-track">
        <div className={`hp-fill ${status.fillClass}`} style={{ width: `${hpPercent}%` }} />
      </div>

      {/* Quick HP Adjustment Buttons */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onModifyHp(-5)}
            className="px-2 py-1 text-[11px] font-mono font-medium rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors"
            title="Zadaj 5 obrażeń"
          >
            -5
          </button>
          <button
            type="button"
            onClick={() => onModifyHp(-1)}
            className="px-2 py-1 text-[11px] font-mono font-medium rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors"
            title="Zadaj 1 obrażenie"
          >
            -1
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onModifyHp(1)}
            className="px-2 py-1 text-[11px] font-mono font-medium rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-colors"
            title="Ulecz 1 HP"
          >
            +1
          </button>
          <button
            type="button"
            onClick={() => onModifyHp(5)}
            className="px-2 py-1 text-[11px] font-mono font-medium rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-colors"
            title="Ulecz 5 HP"
          >
            +5
          </button>
        </div>

        {/* Custom Input */}
        <div className="flex items-center gap-1 ml-auto">
          <input
            type="number"
            min="1"
            placeholder="Ilość"
            value={customDelta}
            onChange={(e) => setCustomDelta(e.target.value)}
            className="w-14 px-1.5 py-0.5 text-xs text-center rounded bg-surface-card border border-border-default text-foreground placeholder:text-muted/50 focus:outline-none focus:border-brand-primary"
          />
          <button
            type="button"
            onClick={() => handleApplyCustom(true)}
            disabled={!customDelta}
            className="px-2 py-0.5 text-[11px] font-medium rounded bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/40 disabled:opacity-40 transition-colors"
            title="Zadaj obrażenia"
          >
            Atak
          </button>
          <button
            type="button"
            onClick={() => handleApplyCustom(false)}
            disabled={!customDelta}
            className="px-2 py-0.5 text-[11px] font-medium rounded bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/40 disabled:opacity-40 transition-colors"
            title="Ulecz"
          >
            Lecz
          </button>
        </div>
      </div>
    </div>
  );
}
