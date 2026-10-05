'use client';

import type { RollLog } from './types';

interface RollHistoryProps {
  logs: RollLog[];
  onClear: () => void;
}

export function RollHistory({ logs, onClear }: RollHistoryProps) {
  return (
    <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
      <h3 className="font-bold text-slate-100 flex items-center justify-between">
        <span>Dziennik Rzutów</span>
        <button
          onClick={onClear}
          type="button"
          className="text-xs text-slate-500 hover:text-slate-300 transition"
        >
          Wyczyść
        </button>
      </h3>

      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {logs.map((log) => (
          <div
            key={log.id}
            className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
              log.isCrit
                ? 'bg-amber-950/40 border-amber-500/60 text-amber-200'
                : log.isFumble
                  ? 'bg-red-950/40 border-red-800/60 text-red-300'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="font-bold font-mono px-1.5 py-0.5 rounded bg-slate-950 text-slate-400">
                {log.dice}
              </span>
              <span>
                Kość: <strong className="font-mono">{log.result}</strong>{' '}
                {log.modifier !== 0 && `(${log.modifier >= 0 ? '+' : ''}${log.modifier})`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm font-mono text-slate-100">{log.total}</span>
              <span className="text-[10px] text-slate-500 font-mono">{log.timestamp}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
