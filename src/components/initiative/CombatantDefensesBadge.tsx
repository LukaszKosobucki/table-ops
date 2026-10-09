'use client';

import { Eye, Shield, ShieldAlert, X } from 'lucide-react';
import { useState } from 'react';
import type { CombatantDefenses } from '@/lib/skills-and-traits';

export interface CombatantDefensesBadgeProps {
  combatantId: string;
  defenses?: Partial<CombatantDefenses>;
}

export function CombatantDefensesBadge({ combatantId, defenses }: CombatantDefensesBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);

  const resistances = defenses?.resistances || [];
  const damageImmunities = defenses?.damageImmunities || [];
  const conditionImmunities = defenses?.conditionImmunities || [];
  const senses = defenses?.senses || [];

  const totalCount =
    resistances.length + damageImmunities.length + conditionImmunities.length + senses.length;

  if (totalCount === 0) return null;

  return (
    <div className="relative inline-block">
      <button
        type="button"
        data-testid={`defenses-badge-btn-${combatantId}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Odporności, niewrażliwości i zmysły (kliknij, aby rozwinąć)"
        className={`px-1.5 py-0.5 rounded text-[11px] font-mono inline-flex items-center gap-1 border transition cursor-pointer ${
          isOpen
            ? 'bg-amber-500/30 text-amber-300 border-amber-500/60 shadow-sm shadow-amber-500/20'
            : 'bg-slate-800/80 hover:bg-slate-700/80 text-amber-400 border-slate-700/80 hover:border-amber-500/40'
        }`}
      >
        <Shield className="w-3 h-3 text-amber-400" />
        <span className="text-[10px] font-semibold hidden sm:inline">Obrona</span>
      </button>

      {/* Popover */}
      {isOpen && (
        <div
          data-testid={`defenses-popover-${combatantId}`}
          className="absolute z-40 left-0 top-full mt-1.5 w-72 max-w-[90vw] glass-panel rounded-xl p-3.5 border border-slate-700/80 bg-slate-950/95 shadow-2xl space-y-2.5 animate-fadeIn"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Cechy Obronne & Zmysły</span>
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Resistances */}
          {resistances.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
                🛡️ Odporności (50% obr.):
              </span>
              <div className="flex flex-wrap gap-1">
                {resistances.map((res) => (
                  <span
                    key={res}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-sky-950/60 text-sky-300 border border-sky-800/60"
                  >
                    {res}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Damage Immunities */}
          {damageImmunities.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                ⛔ Niewrażliwości na obrażenia:
              </span>
              <div className="flex flex-wrap gap-1">
                {damageImmunities.map((imm) => (
                  <span
                    key={imm}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/60"
                  >
                    {imm}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Condition Immunities */}
          {conditionImmunities.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                💫 Niewrażliwość na stany:
              </span>
              <div className="flex flex-wrap gap-1">
                {conditionImmunities.map((cond) => (
                  <span
                    key={cond}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/60"
                  >
                    {cond}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Senses */}
          {senses.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>Zmysły:</span>
              </span>
              <div className="flex flex-wrap gap-1">
                {senses.map((sense) => (
                  <span
                    key={sense}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/60"
                  >
                    {sense}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
