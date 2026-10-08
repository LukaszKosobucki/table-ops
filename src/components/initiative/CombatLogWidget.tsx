'use client';

import {
  ChevronDown,
  ChevronUp,
  Clock,
  Flag,
  Heart,
  History,
  Info,
  Shield,
  Skull,
  Sparkles,
  Swords,
  Trash2,
  Wand2,
} from 'lucide-react';
import { useState } from 'react';
import type { CombatLogEntry } from './types';

interface CombatLogWidgetProps {
  entries: CombatLogEntry[];
  onClear?: () => void;
  activeCombatantName?: string;
  onAddCustomAction?: (text: string) => void;
}

function getLogTypeConfig(type?: CombatLogEntry['type']) {
  switch (type) {
    case 'damage':
      return {
        icon: Swords,
        label: 'Obrażenia',
        className: 'bg-rose-950/70 text-rose-300 border-rose-800/60',
      };
    case 'heal':
      return {
        icon: Heart,
        label: 'Leczenie',
        className: 'bg-emerald-950/70 text-emerald-300 border-emerald-800/60',
      };
    case 'spell':
      return {
        icon: Wand2,
        label: 'Zaklęcie',
        className: 'bg-sky-950/70 text-sky-300 border-sky-800/60',
      };
    case 'action':
      return {
        icon: Sparkles,
        label: 'Akcja',
        className: 'bg-amber-950/70 text-amber-300 border-amber-800/60',
      };
    case 'flee':
      return {
        icon: Flag,
        label: 'Ucieczka',
        className: 'bg-yellow-950/70 text-yellow-300 border-yellow-800/60',
      };
    case 'death_save':
      return {
        icon: Skull,
        label: 'Rzut na śmierć',
        className: 'bg-red-950/70 text-red-300 border-red-800/60',
      };
    case 'turn':
      return {
        icon: Clock,
        label: 'Tura',
        className: 'bg-indigo-950/70 text-indigo-300 border-indigo-800/60',
      };
    case 'status':
      return {
        icon: Shield,
        label: 'Status',
        className: 'bg-purple-950/70 text-purple-300 border-purple-800/60',
      };
    default:
      return {
        icon: Info,
        label: 'System',
        className: 'bg-slate-900 text-slate-400 border-slate-700/60',
      };
  }
}

export function CombatLogWidget({
  entries,
  onClear,
  activeCombatantName,
  onAddCustomAction,
}: CombatLogWidgetProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [customActionInput, setCustomActionInput] = useState('');

  const handleCustomActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customActionInput.trim();
    if (!trimmed) return;
    onAddCustomAction?.(trimmed);
    setCustomActionInput('');
  };

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
        <div className="space-y-2">
          {/* Custom Action Entry Form for active combatant turn */}
          {onAddCustomAction && (
            <form
              onSubmit={handleCustomActionSubmit}
              className="flex items-center gap-1.5 pb-2 border-b border-slate-800/80 animate-fadeIn"
            >
              <div
                data-testid="active-turn-indicator"
                className="shrink-0 text-[10px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-1.5 rounded-lg max-w-[120px] truncate"
                title={`Aktywna tura: ${activeCombatantName || 'Aktywna'}`}
              >
                Tura: {activeCombatantName || 'Aktywna'}
              </div>
              <input
                type="text"
                data-testid="custom-action-input"
                placeholder={`Akcja dla ${activeCombatantName || 'postaci'}...`}
                value={customActionInput}
                onChange={(e) => setCustomActionInput(e.target.value)}
                className="flex-1 min-w-0 text-xs bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                data-testid="submit-custom-action-btn"
                disabled={!customActionInput.trim()}
                className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold cursor-pointer transition shadow-sm shrink-0"
              >
                Dodaj
              </button>
            </form>
          )}

          {/* Entries list */}
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {entries.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2 text-center">
                Brak wpisów w kronice. Akcje walki pojawią się tutaj.
              </p>
            ) : (
              entries.map((log) => {
                const cfg = getLogTypeConfig(log.type);
                const Icon = cfg.icon;

                return (
                  <div
                    key={log.id}
                    data-testid={`combat-log-entry-${log.id}`}
                    className="p-2 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs flex items-start gap-2 hover:border-slate-700/60 transition"
                  >
                    <div className="shrink-0 mt-0.5">
                      <span
                        className={`p-1 rounded-lg border flex items-center justify-center ${cfg.className}`}
                      >
                        <Icon className="w-3 h-3" />
                      </span>
                    </div>

                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-[9px] uppercase px-1.5 py-0.2 rounded border font-mono font-bold ${cfg.className}`}
                          >
                            {cfg.label}
                          </span>

                          {/* Whose turn indicator */}
                          {log.actorName && (
                            <span
                              data-testid={`log-actor-${log.actorName}`}
                              className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-900 border border-slate-800 text-slate-300 font-medium inline-flex items-center gap-1"
                            >
                              {log.actorAvatar ? (
                                <img
                                  src={log.actorAvatar}
                                  alt={log.actorName}
                                  className="w-3.5 h-3.5 rounded-full object-cover shrink-0"
                                />
                              ) : null}
                              <span className="font-semibold text-slate-200">{log.actorName}</span>
                            </span>
                          )}

                          {/* Target indicator if different from actor */}
                          {log.targetName && log.targetName !== log.actorName && (
                            <span className="text-[10px] text-slate-400 font-medium inline-flex items-center gap-1">
                              <span className="text-rose-400 font-bold">➔</span>
                              <span className="font-semibold text-slate-200">{log.targetName}</span>
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] text-slate-500 font-mono shrink-0">
                          {log.timestamp}
                        </span>
                      </div>

                      <p className="text-slate-300 text-[11px] leading-relaxed break-words font-sans">
                        {log.text}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
