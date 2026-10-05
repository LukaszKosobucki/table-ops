'use client';

import { Skull, Trash2, User } from 'lucide-react';
import { AVAILABLE_CONDITIONS, type Combatant } from './types';

interface CombatantCardProps {
  combatant: Combatant;
  isActiveTurn: boolean;
  onHpChange: (delta: number) => void;
  onToggleCondition: (condition: string) => void;
  onRemove: () => void;
}

export function CombatantCard({
  combatant: c,
  isActiveTurn,
  onHpChange,
  onToggleCondition,
  onRemove,
}: CombatantCardProps) {
  const isDead = c.currentHp <= 0;
  const hpPercent = c.maxHp > 0 ? Math.round((c.currentHp / c.maxHp) * 100) : 0;

  return (
    <div
      className={`relative rounded-2xl p-4 transition-all duration-300 ${
        isActiveTurn
          ? 'bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-900 border-2 border-indigo-500 shadow-xl shadow-indigo-500/10'
          : isDead
            ? 'bg-slate-950/60 border border-red-900/40 opacity-60'
            : 'glass-card hover:bg-slate-800/50'
      }`}
    >
      {isActiveTurn && (
        <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-3 h-8 bg-amber-500 rounded-r-md shadow-lg shadow-amber-500/50" />
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left: Initiative & Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center font-bold text-amber-400 text-lg font-mono">
            {c.initiative}
          </div>
          <div>
            <div className="flex items-center gap-2">
              {c.isMonster ? (
                <Skull className="w-4 h-4 text-red-400" />
              ) : (
                <User className="w-4 h-4 text-indigo-400" />
              )}
              <span
                className={`font-bold ${isDead ? 'line-through text-slate-500' : 'text-slate-100'}`}
              >
                {c.name}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                AC {c.ac}
              </span>
            </div>

            {/* Conditions pills */}
            {c.conditions.length > 0 && (
              <div className="flex items-center gap-1 mt-1 flex-wrap">
                {c.conditions.map((cond) => (
                  <span
                    key={cond}
                    className="inline-block px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 text-[10px]"
                  >
                    {cond}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: HP tracker & Controls */}
        <div className="flex items-center gap-3 self-end sm:self-center">
          <div className="flex flex-col items-end gap-1">
            <span
              className={`text-xs font-mono font-bold ${isDead ? 'text-red-500' : 'text-slate-300'}`}
            >
              {c.currentHp} / {c.maxHp} HP
            </span>
            <div className="w-32 bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-300 ${
                  hpPercent <= 25
                    ? 'bg-red-500'
                    : hpPercent <= 50
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, hpPercent))}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onHpChange(-5)}
              className="px-2 py-1 text-xs font-mono rounded bg-slate-900 hover:bg-red-950 text-red-400 border border-slate-800 transition cursor-pointer"
              title="-5 HP"
            >
              -5
            </button>
            <button
              onClick={() => onHpChange(-1)}
              className="px-2 py-1 text-xs font-mono rounded bg-slate-900 hover:bg-red-950 text-red-400 border border-slate-800 transition cursor-pointer"
              title="-1 HP"
            >
              -1
            </button>
            <button
              onClick={() => onHpChange(1)}
              className="px-2 py-1 text-xs font-mono rounded bg-slate-900 hover:bg-emerald-950 text-emerald-400 border border-slate-800 transition cursor-pointer"
              title="+1 HP"
            >
              +1
            </button>
            <button
              onClick={() => onHpChange(5)}
              className="px-2 py-1 text-xs font-mono rounded bg-slate-900 hover:bg-emerald-950 text-emerald-400 border border-slate-800 transition cursor-pointer"
              title="+5 HP"
            >
              +5
            </button>
          </div>

          <button
            onClick={onRemove}
            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
            title="Usuń z walki"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Add Condition Menu */}
      <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-500 font-medium text-[11px] whitespace-nowrap">+ Stan:</span>
        {AVAILABLE_CONDITIONS.map((cond) => {
          const isSelected = c.conditions.includes(cond);
          return (
            <button
              key={cond}
              onClick={() => onToggleCondition(cond)}
              className={`px-2 py-0.5 rounded text-[11px] transition whitespace-nowrap cursor-pointer ${
                isSelected
                  ? 'bg-red-900/60 text-red-300 border border-red-700'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cond}
            </button>
          );
        })}
      </div>
    </div>
  );
}
