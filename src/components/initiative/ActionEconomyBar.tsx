'use client';

import { Check, Circle, Plus, Swords, Zap } from 'lucide-react';
import type { CombatantTurnResources, TurnActionType } from './types';

export interface ActionEconomyBarProps {
  combatantId: string;
  resources: CombatantTurnResources;
  onToggleAction: (type: TurnActionType, extraIndex?: number) => void;
  onAddExtraAction: () => void;
  onToggleAttackSegment?: (attackId: string) => void;
  isCurrentTurn?: boolean;
}

export function ActionEconomyBar({
  combatantId,
  resources,
  onToggleAction,
  onAddExtraAction,
  onToggleAttackSegment,
}: ActionEconomyBarProps) {
  const {
    actionUsed,
    bonusActionUsed,
    reactionUsed,
    extraActions = 0,
    extraActionsUsed = 0,
    attacksRemaining = 0,
    totalAttacks = 0,
    attacks = [],
  } = resources;

  const hasMultiattack = attacks.length > 1;

  return (
    <div
      data-testid={`action-economy-bar-${combatantId}`}
      className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2.5 animate-fadeIn"
    >
      {/* Row 1: Zasoby Tury (Action, Bonus Action, Reaction, Extra Actions, + Dodaj akcję) */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Label */}
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400 uppercase tracking-wider shrink-0 mr-1">
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
            <span>ZASOBY TURY:</span>
          </div>

          {/* Akcja Główna Pip */}
          <button
            type="button"
            data-testid="pip-action"
            onClick={() => onToggleAction('action')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
              actionUsed
                ? 'bg-slate-900/60 text-slate-500 border-slate-800 line-through opacity-60 hover:opacity-90'
                : 'bg-sky-500/10 text-sky-300 border-sky-500/30 hover:bg-sky-500/20 shadow-sm shadow-sky-500/10'
            }`}
            title={
              actionUsed
                ? 'Akcja zużyta (kliknij, aby odnowić)'
                : 'Akcja gotowa (kliknij, aby zużyć)'
            }
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 transition-colors ${
                actionUsed
                  ? 'border border-slate-600 bg-transparent'
                  : 'bg-sky-400 shadow-sm shadow-sky-400/80'
              }`}
            />
            <span>{actionUsed ? 'Akcja (Zużyta)' : 'Akcja Główna'}</span>
          </button>

          {/* Bonus Action Pip */}
          <button
            type="button"
            data-testid="pip-bonus-action"
            onClick={() => onToggleAction('bonus_action')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
              bonusActionUsed
                ? 'bg-slate-900/60 text-slate-500 border-slate-800 line-through opacity-60 hover:opacity-90'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20 shadow-sm shadow-amber-500/10'
            }`}
            title={
              bonusActionUsed
                ? 'Bonus Action zużyta (kliknij, aby odnowić)'
                : 'Bonus Action gotowa (kliknij, aby zużyć)'
            }
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 transition-colors ${
                bonusActionUsed
                  ? 'border border-slate-600 bg-transparent'
                  : 'bg-amber-400 shadow-sm shadow-amber-400/80'
              }`}
            />
            <span>{bonusActionUsed ? 'Bonus (Zużyta)' : 'Bonus Action'}</span>
          </button>

          {/* Reakcja Pip */}
          <button
            type="button"
            data-testid="pip-reaction"
            onClick={() => onToggleAction('reaction')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
              reactionUsed
                ? 'bg-slate-900/60 text-slate-500 border-slate-800 line-through opacity-60 hover:opacity-90'
                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20 shadow-sm shadow-emerald-500/10'
            }`}
            title={
              reactionUsed
                ? 'Reakcja zużyta (odnawia się na początku tury tej postaci)'
                : 'Reakcja gotowa (kliknij, aby zużyć na atak okazyjny lub zaklęcie)'
            }
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 transition-colors ${
                reactionUsed
                  ? 'border border-slate-600 bg-transparent'
                  : 'bg-emerald-400 shadow-sm shadow-emerald-400/80'
              }`}
            />
            <span>{reactionUsed ? 'Reakcja (Zużyta)' : 'Reakcja'}</span>
          </button>

          {/* Dynamic Extra Action Pips */}
          {Array.from({ length: extraActions }, (_, idx) => ({
            id: `${combatantId}-extra-act-${idx}`,
            idx,
            isUsed: idx < extraActionsUsed,
          })).map((item) => (
            <button
              key={item.id}
              type="button"
              data-testid={`pip-extra-action-${item.idx}`}
              onClick={() => onToggleAction('extra_action', item.idx)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                item.isUsed
                  ? 'bg-slate-900/60 text-slate-500 border-slate-800 line-through opacity-60 hover:opacity-90'
                  : 'bg-purple-500/10 text-purple-300 border-purple-500/30 hover:bg-purple-500/20 shadow-sm shadow-purple-500/10'
              }`}
              title="Dodatkowa akcja (np. Action Surge, Haste)"
            >
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  item.isUsed
                    ? 'border border-slate-600 bg-transparent'
                    : 'bg-purple-400 shadow-sm shadow-purple-400/80'
                }`}
              />
              <span>
                {item.isUsed
                  ? `Dodatkowa #${item.idx + 1} (Zużyta)`
                  : `Dodatkowa Akcja #${item.idx + 1}`}
              </span>
            </button>
          ))}
        </div>

        {/* Button: + Dodatkowa Akcja */}
        <button
          type="button"
          data-testid="add-extra-action-btn"
          onClick={onAddExtraAction}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 transition cursor-pointer self-start sm:self-auto"
          title="Dodaj dodatkową akcję w tej turze (np. Action Surge, czar Haste lub akcja legendarna)"
        >
          <Plus className="w-3.5 h-3.5 text-indigo-400" />
          <span>+ Dodaj akcję</span>
        </button>
      </div>

      {/* Row 2: Wieloatak (Multiattack / Extra Attack) */}
      {hasMultiattack && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400 uppercase tracking-wider shrink-0 mr-1">
              <Swords className="w-3.5 h-3.5 text-amber-400" />
              <span>MULTIATTACK:</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {attacks.map((atk) => (
                <button
                  key={atk.id}
                  type="button"
                  data-testid={`attack-segment-${atk.id}`}
                  onClick={() => onToggleAttackSegment?.(atk.id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                    atk.used
                      ? 'bg-slate-900/80 text-slate-500 border-slate-800 line-through opacity-70 hover:opacity-100'
                      : 'bg-amber-500/15 text-amber-200 border-amber-500/40 hover:bg-amber-500/25 shadow-sm shadow-amber-500/10'
                  }`}
                  title={`Atak: ${atk.name} (kliknij, aby oznaczyć wykonanie)`}
                >
                  {atk.used ? (
                    <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="w-2.5 h-2.5 text-amber-400 fill-amber-400/40 shrink-0" />
                  )}
                  <span>{atk.name}</span>
                </button>
              ))}
            </div>
          </div>

          <span
            data-testid="multiattack-remaining"
            className="text-xs font-mono text-slate-400 font-semibold"
          >
            (Pozostało: {attacksRemaining}/{totalAttacks})
          </span>
        </div>
      )}
    </div>
  );
}
