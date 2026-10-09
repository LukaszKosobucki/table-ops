'use client';

import { Dices, Flag, Heart, Shield, Skull, Sparkles, Swords, Trash2, User, X } from 'lucide-react';
import { useState } from 'react';
import type { DiceGroup } from '@/lib/dice/types';
import { CombatantHpControls } from './CombatantHpControls';
import { CombatantStatusModal } from './CombatantStatusModal';
import type { Combatant, CombatPhase, DeathSaveState } from './types';

export interface CombatantCardProps {
  combatant: Combatant;
  isActiveTurn: boolean;
  phase?: CombatPhase;
  onHpChange: (delta: number) => void;
  onToggleCondition?: (condition: string) => void;
  onAddStatus?: (statusName: string, durationTurns: number) => void;
  onRemoveStatus?: (statusId: string) => void;
  onInitiativeChange?: (initiative: number) => void;
  onRemove: () => void;
  onFlee?: () => void;
  onRollDeathSave?: () => void;
  onUpdateDeathSaves?: (saves: DeathSaveState) => void;
  onRequestDiceRoll?: (
    dice: DiceGroup[],
    modifier: number,
    context?: {
      characterId?: string;
      combatantId?: string;
      actionName?: string;
      characterName?: string;
    }
  ) => void;
}

export function CombatantCard({
  combatant: c,
  isActiveTurn,
  phase = 'ACTIVE',
  onHpChange,
  onToggleCondition,
  onAddStatus,
  onRemoveStatus,
  onInitiativeChange,
  onRemove,
  onFlee,
  onRollDeathSave,
  onUpdateDeathSaves,
  onRequestDiceRoll,
}: CombatantCardProps) {
  const isMonsterDead = c.isMonster && c.currentHp <= 0;
  const isFled = c.isMonster && !!c.isFled;
  const isHeroDown = !c.isMonster && c.currentHp <= 0;
  const isHeroDead =
    !c.isMonster && (c.deathSaves?.isDead === true || c.conditions.includes('Martwy'));
  const isHeroStabilized =
    !c.isMonster &&
    (c.deathSaves?.isStabilized === true || c.conditions.includes('Ustabilizowany'));
  const isDeadOrInactive = isMonsterDead || isHeroDead || isFled;

  const hpPercent = c.maxHp > 0 ? Math.round((c.currentHp / c.maxHp) * 100) : 0;
  const [showStatusModal, setShowStatusModal] = useState<boolean>(false);

  const handleApplyStatus = (statusName: string, durationTurns: number) => {
    if (onAddStatus) {
      onAddStatus(statusName, durationTurns);
    } else if (onToggleCondition) {
      onToggleCondition(statusName);
    }
  };

  return (
    <div
      data-testid={`combatant-card-${c.id}`}
      className={`relative rounded-2xl p-4 transition-all duration-300 ${
        isActiveTurn
          ? 'bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/30 border-2 border-amber-500/90 shadow-xl shadow-amber-500/10'
          : isDeadOrInactive
            ? 'bg-slate-950/60 border border-red-900/40 opacity-60'
            : isHeroDown
              ? 'bg-gradient-to-r from-red-950/30 via-slate-900 to-slate-950 border border-amber-600/40'
              : 'glass-card hover:bg-slate-800/50'
      }`}
    >
      {/* Active turn marker bar */}
      {isActiveTurn && (
        <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-3 h-10 bg-amber-500 rounded-r-md shadow-lg shadow-amber-500/50" />
      )}

      <div className="flex flex-col gap-3">
        {/* Top Row: Initiative, Name, AC, Active Turn Badge & Delete */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left: Initiative Box & Combatant Title */}
          <div className="flex items-center gap-3">
            {phase === 'PREPARING' && onInitiativeChange ? (
              <div className="flex flex-col items-center">
                <input
                  type="number"
                  aria-label={`Inicjatywa ${c.name}`}
                  value={c.initiative === 0 ? '' : c.initiative}
                  placeholder="0"
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 0 : Number.parseInt(e.target.value, 10);
                    onInitiativeChange(Number.isNaN(val) ? 0 : val);
                  }}
                  className="w-12 h-10 rounded-xl bg-slate-950 border border-amber-500/40 text-center font-bold text-amber-400 text-lg font-mono focus:ring-1 focus:ring-amber-400 focus:outline-none"
                  title="Edytuj inicjatywę"
                />
                <span className="text-[9px] uppercase tracking-wider text-slate-500 font-mono mt-0.5">
                  INIT
                </span>
              </div>
            ) : (
              <div
                className={`w-10 h-10 rounded-xl bg-slate-950 border flex items-center justify-center font-bold text-lg font-mono shrink-0 ${
                  isActiveTurn
                    ? 'border-amber-500/80 text-amber-400 shadow-md shadow-amber-500/20'
                    : 'border-slate-800 text-amber-400/80'
                }`}
                title={`Inicjatywa: ${c.initiative}`}
              >
                {c.initiative}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                {c.avatarUrl ? (
                  <img
                    src={c.avatarUrl}
                    alt={c.name}
                    className="w-5 h-5 rounded-md object-cover border border-amber-500/30 shrink-0"
                  />
                ) : c.isMonster ? (
                  <Skull className="w-4 h-4 text-red-400 shrink-0" />
                ) : (
                  <User className="w-4 h-4 text-indigo-400 shrink-0" />
                )}
                <span
                  className={`font-bold text-base ${isDeadOrInactive ? 'line-through text-slate-500' : 'text-slate-100'}`}
                >
                  {c.name}
                </span>

                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono inline-flex items-center gap-1">
                  <Shield className="w-3 h-3 text-slate-400" /> AC {c.ac}
                </span>

                {isActiveTurn && (
                  <span
                    data-testid="active-turn-badge"
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/50 flex items-center gap-1 animate-pulse"
                  >
                    <Swords className="w-3 h-3 text-amber-400" /> TERAZ TURA
                  </span>
                )}

                {isFled && (
                  <span
                    data-testid="combatant-fled-badge"
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-950 text-amber-400 border border-amber-800 flex items-center gap-1"
                  >
                    <Flag className="w-3 h-3 text-amber-400" /> UCIEKŁ
                  </span>
                )}

                {isMonsterDead && (
                  <span
                    data-testid="combatant-dead-badge"
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-950 text-red-400 border border-red-800 flex items-center gap-1"
                  >
                    POKONANY
                  </span>
                )}

                {isHeroDead && (
                  <span
                    data-testid="hero-dead-badge"
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-950 text-red-400 border border-red-800 flex items-center gap-1"
                  >
                    <Skull className="w-3 h-3 text-red-400" /> MARTWY
                  </span>
                )}

                {isHeroDown && !isHeroDead && (
                  <span
                    data-testid="hero-down-badge"
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                      isHeroStabilized
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-amber-950 text-amber-400 border border-amber-800 animate-pulse'
                    }`}
                  >
                    {isHeroStabilized ? 'USTABILIZOWANY' : 'POWALONY (0 HP)'}
                  </span>
                )}
              </div>

              {/* Status / Condition Badges */}
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                {/* Timed statuses with duration */}
                {c.statuses?.map((st) => (
                  <span
                    key={st.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-950/60 text-amber-200 border border-amber-800/60 text-xs font-mono"
                  >
                    <span>{st.statusName}</span>
                    <span className="text-[10px] px-1 py-0.2 rounded bg-amber-900/80 text-amber-300 font-semibold">
                      {st.durationTurns}{' '}
                      {st.durationTurns === 1
                        ? 'tura'
                        : st.durationTurns >= 2 && st.durationTurns <= 4
                          ? 'tury'
                          : 'tur'}
                    </span>
                    {onRemoveStatus && (
                      <button
                        type="button"
                        onClick={() => onRemoveStatus(st.id)}
                        className="hover:text-red-400 ml-0.5 cursor-pointer text-amber-400/80 transition"
                        title={`Zdejmij status: ${st.statusName}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}

                {/* Legacy/simple string conditions */}
                {c.conditions.map((cond) => {
                  const alreadyInTimed = c.statuses?.some((st) => st.statusName === cond);
                  if (alreadyInTimed) return null;
                  return (
                    <span
                      key={cond}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-950/70 text-red-300 border border-red-800 text-xs"
                    >
                      <span>{cond}</span>
                      {onToggleCondition && (
                        <button
                          type="button"
                          onClick={() => onToggleCondition(cond)}
                          className="hover:text-red-200 ml-0.5 cursor-pointer text-red-400 transition"
                          title={`Usuń: ${cond}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: HP Meter & Delete Button */}
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <div className="flex flex-col items-end gap-1">
              <span
                className={`text-xs font-mono font-bold flex items-center gap-1 ${
                  isDeadOrInactive ? 'text-red-500' : 'text-slate-300'
                }`}
              >
                <Heart className="w-3 h-3 text-red-400" />
                {c.currentHp} / {c.maxHp} HP
              </span>
              <div className="w-28 sm:w-36 bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
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

            <button
              type="button"
              onClick={onRemove}
              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
              title="Usuń z walki"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Death Saving Throws Widget for Downed Heroes (HP = 0) */}
        {isHeroDown && !isHeroDead && !isHeroStabilized && phase === 'ACTIVE' && (
          <div
            data-testid="death-saves-container"
            className="p-3 rounded-xl bg-slate-950/90 border border-red-900/60 flex flex-wrap items-center justify-between gap-3 animate-fadeIn"
          >
            <div className="flex items-center gap-4 flex-wrap">
              {/* Successes */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                  Sukcesy:
                </span>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3].map((num) => {
                    const checked = (c.deathSaves?.successes || 0) >= num;
                    return (
                      <button
                        key={num}
                        type="button"
                        data-testid={`death-save-success-${num}`}
                        onClick={() => {
                          const next = checked ? num - 1 : num;
                          onUpdateDeathSaves?.({
                            successes: next,
                            failures: c.deathSaves?.failures || 0,
                            isStabilized: next >= 3,
                            isDead: false,
                          });
                        }}
                        className={`w-4 h-4 rounded-full border transition cursor-pointer flex items-center justify-center ${
                          checked
                            ? 'bg-emerald-500 border-emerald-400 shadow-sm shadow-emerald-500/50'
                            : 'bg-slate-900 border-slate-700 hover:border-emerald-500/50'
                        }`}
                        title={`Sukces ${num} (kliknij aby przełączyć)`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Failures */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider">
                  Porażki:
                </span>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3].map((num) => {
                    const checked = (c.deathSaves?.failures || 0) >= num;
                    return (
                      <button
                        key={num}
                        type="button"
                        data-testid={`death-save-failure-${num}`}
                        onClick={() => {
                          const next = checked ? num - 1 : num;
                          onUpdateDeathSaves?.({
                            successes: c.deathSaves?.successes || 0,
                            failures: next,
                            isStabilized: false,
                            isDead: next >= 3,
                          });
                        }}
                        className={`w-4 h-4 rounded-full border transition cursor-pointer flex items-center justify-center ${
                          checked
                            ? 'bg-red-600 border-red-500 shadow-sm shadow-red-600/50'
                            : 'bg-slate-900 border-slate-700 hover:border-red-500/50'
                        }`}
                        title={`Porażka ${num} (kliknij aby przełączyć)`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Roll Death Save Button */}
            {onRollDeathSave && (
              <button
                type="button"
                data-testid="roll-death-save-btn"
                onClick={onRollDeathSave}
                className="px-3 py-1 rounded-lg bg-gradient-to-r from-red-700 to-rose-700 hover:from-red-600 hover:to-rose-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-950/50 transition cursor-pointer"
              >
                <Skull className="w-3.5 h-3.5" />
                <span>Rzuć na śmierć (k20)</span>
              </button>
            )}
          </div>
        )}

        {/* Bottom Row: HP Quick Buttons & Custom Input & Status Button */}
        {!isFled && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
            <CombatantHpControls onHpChange={onHpChange} />

            <div className="flex items-center gap-2">
              {/* Quick Dice Roll button */}
              {onRequestDiceRoll && !isDeadOrInactive && (
                <button
                  type="button"
                  data-testid={`combatant-roll-btn-${c.id}`}
                  onClick={() =>
                    onRequestDiceRoll([{ type: 'd20', count: 1 }], 0, {
                      combatantId: c.id,
                      characterId: c.characterId ?? undefined,
                      characterName: c.name,
                      actionName: `Rzut: ${c.name}`,
                    })
                  }
                  className="px-2.5 py-1 text-xs rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 transition cursor-pointer"
                  title="Otwórz rzutnik kości dla tej postaci"
                >
                  <Dices className="w-3 h-3 text-indigo-400" />
                  <span>Rzut (k20)</span>
                </button>
              )}

              {/* Flee button for monsters */}
              {c.isMonster && phase === 'ACTIVE' && !c.isFled && c.currentHp > 0 && onFlee && (
                <button
                  type="button"
                  data-testid="combatant-flee-btn"
                  onClick={onFlee}
                  className="px-2.5 py-1 text-xs rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 flex items-center gap-1.5 transition cursor-pointer"
                  title="Oznacz ucieczkę przeciwnika z pola walki (50% PD)"
                >
                  <Flag className="w-3 h-3 text-yellow-400" />
                  <span>Ucieczka (50% PD)</span>
                </button>
              )}

              {/* Add Status Button */}
              <button
                type="button"
                onClick={() => setShowStatusModal((prev) => !prev)}
                className="px-2.5 py-1 text-xs rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 transition cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span>+ Status czasowy</span>
              </button>
            </div>
          </div>
        )}

        {/* Timed Status Popover / Modal */}
        <CombatantStatusModal
          isOpen={showStatusModal}
          onClose={() => setShowStatusModal(false)}
          onApplyStatus={handleApplyStatus}
        />
      </div>
    </div>
  );
}
