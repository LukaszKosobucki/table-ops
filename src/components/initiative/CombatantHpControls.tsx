'use client';

import { useState } from 'react';

interface CombatantHpControlsProps {
  onHpChange: (delta: number) => void;
}

export function CombatantHpControls({ onHpChange }: CombatantHpControlsProps) {
  const [customHpInput, setCustomHpInput] = useState<string>('');

  const handleApplyCustomDamage = () => {
    const val = Number.parseInt(customHpInput, 10);
    if (!Number.isNaN(val) && val > 0) {
      onHpChange(-val);
      setCustomHpInput('');
    }
  };

  const handleApplyCustomHeal = () => {
    const val = Number.parseInt(customHpInput, 10);
    if (!Number.isNaN(val) && val > 0) {
      onHpChange(val);
      setCustomHpInput('');
    }
  };

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {/* Quick negative deltas */}
      <div className="flex items-center rounded-lg bg-slate-950/80 p-0.5 border border-slate-800">
        <button
          type="button"
          onClick={() => onHpChange(-10)}
          className="px-2 py-0.5 text-xs font-mono text-red-400 hover:bg-red-950/60 rounded transition cursor-pointer"
          title="-10 HP"
        >
          -10
        </button>
        <button
          type="button"
          onClick={() => onHpChange(-5)}
          className="px-2 py-0.5 text-xs font-mono text-red-400 hover:bg-red-950/60 rounded transition cursor-pointer"
          title="-5 HP"
        >
          -5
        </button>
        <button
          type="button"
          onClick={() => onHpChange(-1)}
          className="px-2 py-0.5 text-xs font-mono text-red-400 hover:bg-red-950/60 rounded transition cursor-pointer"
          title="-1 HP"
        >
          -1
        </button>
      </div>

      {/* Quick positive deltas */}
      <div className="flex items-center rounded-lg bg-slate-950/80 p-0.5 border border-slate-800">
        <button
          type="button"
          onClick={() => onHpChange(1)}
          className="px-2 py-0.5 text-xs font-mono text-emerald-400 hover:bg-emerald-950/60 rounded transition cursor-pointer"
          title="+1 HP"
        >
          +1
        </button>
        <button
          type="button"
          onClick={() => onHpChange(5)}
          className="px-2 py-0.5 text-xs font-mono text-emerald-400 hover:bg-emerald-950/60 rounded transition cursor-pointer"
          title="+5 HP"
        >
          +5
        </button>
        <button
          type="button"
          onClick={() => onHpChange(10)}
          className="px-2 py-0.5 text-xs font-mono text-emerald-400 hover:bg-emerald-950/60 rounded transition cursor-pointer"
          title="+10 HP"
        >
          +10
        </button>
      </div>

      {/* Custom HP Input */}
      <div className="flex items-center gap-1 ml-1">
        <input
          type="number"
          placeholder="Wartość"
          value={customHpInput}
          onChange={(e) => setCustomHpInput(e.target.value)}
          className="w-16 px-1.5 py-0.5 text-xs font-mono rounded bg-slate-950 border border-slate-800 text-slate-200 text-center focus:outline-none focus:border-indigo-500"
        />
        <button
          type="button"
          onClick={handleApplyCustomDamage}
          disabled={!customHpInput}
          className="px-2 py-0.5 text-[11px] font-semibold rounded bg-red-950/60 text-red-300 border border-red-800 hover:bg-red-900/60 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          title="Zadaj podane obrażenia"
        >
          Obrażenia
        </button>
        <button
          type="button"
          onClick={handleApplyCustomHeal}
          disabled={!customHpInput}
          className="px-2 py-0.5 text-[11px] font-semibold rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800 hover:bg-emerald-900/60 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          title="Wylecz podane HP"
        >
          Leczenie
        </button>
      </div>
    </div>
  );
}
