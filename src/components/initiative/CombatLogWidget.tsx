'use client';

import { ChevronDown, ChevronUp, History, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { CombatLogEntry } from './types';

interface CombatLogWidgetProps {
  entries: CombatLogEntry[];
  onClear?: () => void;
}

export function CombatLogWidget({ entries, onClear }: CombatLogWidgetProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="glass-card rounded-2xl p-4 border border-slate-800 space-y-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-2 text-slate-200 font-semibold text-sm hover:text-white transition cursor-pointer"
        >
          <History className="w-4 h-4 text-amber-400" />
          <span>Kronika Walki ({entries.length})</span>
          {isOpen ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          )}
        </button>

        {entries.length > 0 && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="p-1 text-slate-500 hover:text-slate-300 transition cursor-pointer"
            title="Wyczyść wpisy kroniki"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
          {entries.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-2 text-center">
              Brak wpisów w kronice. Akcje walki pojawią się tutaj.
            </p>
          ) : (
            entries.map((log) => {
              const badgeClass =
                log.type === 'turn'
                  ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                  : log.type === 'damage'
                    ? 'bg-red-950/60 text-red-300 border-red-800/60'
                    : log.type === 'heal'
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                      : log.type === 'status'
                        ? 'bg-purple-950/60 text-purple-300 border-purple-800/60'
                        : 'bg-indigo-950/60 text-indigo-300 border-indigo-800/60';

              return (
                <div
                  key={log.id}
                  className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/60 text-xs flex items-start gap-2"
                >
                  <span className="text-[10px] text-slate-500 font-mono shrink-0 mt-0.5">
                    {log.timestamp}
                  </span>
                  <div className="flex-1">
                    {log.type && (
                      <span
                        className={`inline-block text-[9px] uppercase px-1.5 py-0.2 rounded border font-mono font-semibold mr-1.5 ${badgeClass}`}
                      >
                        {log.type}
                      </span>
                    )}
                    <span className="text-slate-300 text-[11px] leading-tight">{log.text}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
