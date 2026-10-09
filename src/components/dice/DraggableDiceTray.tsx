'use client';

import { Dices, History, Minus, RotateCcw, Sparkles, Trash2, X } from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  executeRoll,
  formatBreakdown,
  formatFormula,
  isCriticalFailure,
  isCriticalSuccess,
} from '@/lib/dice/engine';
import {
  type AdvantageMode,
  DICE_CONFIG,
  DICE_ORDER,
  type DiceGroup,
  type DiceType,
  type RollRequest,
  type RollResult,
} from '@/lib/dice/types';
import { DiceTokensTray } from './DiceTokensTray';

export interface RollContext {
  characterId?: string;
  combatantId?: string;
  characterName?: string;
  actionName?: string;
  timestamp?: number;
}

export interface DraggableDiceTrayProps {
  isOpen: boolean;
  isMinimized: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onRoll?: (result: RollResult) => void;
  initialDice?: DiceGroup[];
  initialModifier?: number;
  actorName?: string;
  isSecretDefault?: boolean;
  rollContext?: RollContext;
}

const STORAGE_KEY_POS = 'tableops_dice_tray_pos';

export function DraggableDiceTray({
  isOpen,
  isMinimized,
  onClose,
  onMinimize,
  onRoll,
  initialDice,
  initialModifier = 0,
  actorName = 'Mistrz Gry',
  isSecretDefault = false,
  rollContext,
}: DraggableDiceTrayProps) {
  // Dice pool state: count of each die type
  const [dicePool, setDicePool] = useState<Record<DiceType, number>>(() => {
    const initial: Record<DiceType, number> = {
      d4: 0,
      d6: 0,
      d8: 0,
      d10: 0,
      d12: 0,
      d20: 0,
      d100: 0,
    };
    if (initialDice) {
      for (const group of initialDice) {
        if (initial[group.type] !== undefined) {
          initial[group.type] = group.count;
        }
      }
    }
    return initial;
  });

  const [modifier, setModifier] = useState<number>(initialModifier);
  const [advantageMode, setAdvantageMode] = useState<AdvantageMode>('none');
  const [lastResult, setLastResult] = useState<RollResult | null>(null);

  const [history, setHistory] = useState<RollResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Dragging state
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_POS);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
            return parsed;
          }
        }
      } catch {
        // ignore parse errors
      }
      return { x: Math.max(16, window.innerWidth - 450), y: 80 };
    }
    return { x: 80, y: 80 };
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    mouseX: number;
    mouseY: number;
  } | null>(null);
  const trayRef = useRef<HTMLDivElement | null>(null);

  // Synchronize when initial props change
  useEffect(() => {
    if (initialDice && initialDice.length > 0) {
      setDicePool(() => {
        const reset: Record<DiceType, number> = {
          d4: 0,
          d6: 0,
          d8: 0,
          d10: 0,
          d12: 0,
          d20: 0,
          d100: 0,
        };
        for (const g of initialDice) {
          if (reset[g.type] !== undefined) {
            reset[g.type] = g.count;
          }
        }
        return reset;
      });
    }
  }, [initialDice]);

  useEffect(() => {
    if (initialModifier !== undefined) {
      setModifier(initialModifier);
    }
  }, [initialModifier]);

  // Dice groups array for engine
  const diceGroups = useMemo<DiceGroup[]>(() => {
    return DICE_ORDER.filter((type) => dicePool[type] > 0).map((type) => ({
      type,
      count: dicePool[type],
    }));
  }, [dicePool]);

  // Current formula string
  const currentFormula = useMemo(() => {
    if (diceGroups.length === 0) {
      if (modifier !== 0) {
        return modifier > 0 ? `+${modifier}` : `${modifier}`;
      }
      return '0';
    }
    return formatFormula(diceGroups, modifier, advantageMode);
  }, [diceGroups, modifier, advantageMode]);

  // Actions
  const handleIncrementDie = useCallback((type: DiceType) => {
    setDicePool((prev) => ({
      ...prev,
      [type]: Math.min(prev[type] + 1, 50),
    }));
  }, []);

  const handleDecrementDie = useCallback((type: DiceType, e: React.MouseEvent) => {
    e.stopPropagation();
    setDicePool((prev) => ({
      ...prev,
      [type]: Math.max(prev[type] - 1, 0),
    }));
  }, []);

  const handleClearPool = useCallback(() => {
    setDicePool({
      d4: 0,
      d6: 0,
      d8: 0,
      d10: 0,
      d12: 0,
      d20: 0,
      d100: 0,
    });
    setModifier(0);
    setAdvantageMode('none');
  }, []);

  const handleRoll = useCallback(() => {
    const request: RollRequest = {
      id: `req-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      dice: diceGroups,
      modifier,
      advantageMode,
      isSecret: Boolean(isSecretDefault),
      sourceContext: rollContext
        ? {
            characterId: rollContext.characterId,
            actionName: rollContext.actionName,
          }
        : undefined,
    };

    const effectiveActor = rollContext?.characterName || actorName;
    const result = executeRoll(request, effectiveActor);
    setLastResult(result);
    setHistory((prev) => [result, ...prev].slice(0, 20));
    onRoll?.(result);
  }, [diceGroups, modifier, advantageMode, isSecretDefault, actorName, rollContext, onRoll]);

  const handleReroll = useCallback(
    (pastResult: RollResult) => {
      const newPool: Record<DiceType, number> = {
        d4: 0,
        d6: 0,
        d8: 0,
        d10: 0,
        d12: 0,
        d20: 0,
        d100: 0,
      };

      for (const d of pastResult.diceResults) {
        if (!d.ignored) {
          newPool[d.type] = (newPool[d.type] || 0) + 1;
        }
      }

      setDicePool(newPool);
      setModifier(pastResult.modifier);
      setAdvantageMode(pastResult.advantageMode || 'none');

      const request: RollRequest = {
        id: `req-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        dice: DICE_ORDER.filter((t) => newPool[t] > 0).map((t) => ({
          type: t,
          count: newPool[t],
        })),
        modifier: pastResult.modifier,
        advantageMode: pastResult.advantageMode || 'none',
        isSecret: Boolean(pastResult.isSecret),
      };

      const freshResult = executeRoll(request, actorName);
      setLastResult(freshResult);
      setHistory((prev) => [freshResult, ...prev].slice(0, 20));
      onRoll?.(freshResult);
    },
    [actorName, onRoll]
  );

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen || isMinimized) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl?.getAttribute('contenteditable') === 'true';

      if (e.key === 'Enter' && !isInput) {
        e.preventDefault();
        handleRoll();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key.toLowerCase() === 'c' && !isInput && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleClearPool();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isMinimized, handleRoll, onClose, handleClearPool]);

  // Drag handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button, input, select, label')) {
      return;
    }
    setIsDragging(true);
    dragStartRef.current = {
      startX: position.x,
      startY: position.y,
      mouseX: e.clientX,
      mouseY: e.clientY,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    const deltaX = e.clientX - dragStartRef.current.mouseX;
    const deltaY = e.clientY - dragStartRef.current.mouseY;

    const width = trayRef.current?.offsetWidth || 420;
    const height = trayRef.current?.offsetHeight || 480;

    const nextX = Math.max(
      16,
      Math.min(window.innerWidth - width - 16, dragStartRef.current.startX + deltaX)
    );
    const nextY = Math.max(
      16,
      Math.min(window.innerHeight - height - 16, dragStartRef.current.startY + deltaY)
    );

    setPosition({ x: nextX, y: nextY });
  };

  const handlePointerUp = () => {
    if (isDragging) {
      setIsDragging(false);
      dragStartRef.current = null;
      try {
        localStorage.setItem(STORAGE_KEY_POS, JSON.stringify(position));
      } catch {
        // ignore
      }
    }
  };

  if (!isOpen || isMinimized) {
    return null;
  }

  const isCritSuccess = lastResult ? isCriticalSuccess(lastResult) : false;
  const isCritFailure = lastResult ? isCriticalFailure(lastResult) : false;

  return (
    <div
      ref={trayRef}
      data-testid="dice-tray-window"
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
      }}
      className="fixed top-0 left-0 z-50 w-[420px] max-w-[calc(100vw-32px)] bg-slate-950/95 backdrop-blur-xl border border-indigo-500/40 rounded-2xl shadow-2xl shadow-indigo-950/60 flex flex-col overflow-hidden select-none transition-shadow duration-200"
    >
      {/* Title Bar & Drag Handle */}
      <div
        data-testid="dice-tray-handle"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border-b border-indigo-500/30 cursor-grab active:cursor-grabbing text-slate-100"
      >
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Dices className="w-4 h-4 text-amber-400" />
          </span>
          <h3 className="text-xs font-bold tracking-wide text-slate-100">
            Podręczny Rzutnik Kości
          </h3>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            data-testid="toggle-history-btn"
            onClick={() => setShowHistory((prev) => !prev)}
            className={`p-1.5 rounded-lg transition cursor-pointer text-xs flex items-center gap-1 ${
              showHistory
                ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Historia ostatnich rzutów"
          >
            <History className="w-3.5 h-3.5" />
            {history.length > 0 && (
              <span className="text-[10px] font-mono bg-slate-800 px-1 rounded text-slate-300">
                {history.length}
              </span>
            )}
          </button>
          <button
            type="button"
            data-testid="minimize-dice-tray-btn"
            onClick={onMinimize}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
            title="Minimalizuj rzutnik do paska dokowania"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            data-testid="close-dice-tray-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
            title="Zamknij rzutnik (Esc)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Optional Context Banner */}
      {rollContext?.actionName && (
        <div
          data-testid="roll-context-banner"
          className="px-3.5 py-1.5 bg-indigo-950/70 border-b border-indigo-500/20 text-xs text-indigo-300 font-medium flex items-center justify-between"
        >
          <span className="truncate">
            Kontekst:{' '}
            <strong className="text-white">
              {rollContext.characterName ? `${rollContext.characterName} — ` : ''}
              {rollContext.actionName}
            </strong>
          </span>
          <span className="text-[10px] font-mono text-indigo-400">Rzut bezpośredni</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="p-3 space-y-2.5 max-h-[calc(100vh-140px)] overflow-y-auto">
        {/* Dice Pool Selector */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
              Wybierz kości do puli
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              Klik = +1 • Prawy klik = -1
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {DICE_ORDER.map((type) => {
              const meta = DICE_CONFIG[type];
              const count = dicePool[type];

              return (
                <button
                  key={type}
                  type="button"
                  data-testid={`die-btn-${type}`}
                  onClick={() => handleIncrementDie(type)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    handleDecrementDie(type, e);
                  }}
                  className={`group relative flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer ${
                    count > 0
                      ? `${meta.badgeBg} ${meta.borderColor} ring-1 ring-white/10 shadow-sm`
                      : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                  title={`${meta.label.toUpperCase()} (${meta.sides} ścianek). Kliknij, aby dodać.`}
                >
                  <span
                    className="font-black text-sm tracking-tight transition-transform group-hover:scale-110"
                    style={{ color: meta.colorHex }}
                  >
                    {meta.label}
                  </span>

                  {count > 0 ? (
                    <span
                      data-testid={`die-count-${type}`}
                      className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full text-[10px] font-bold font-mono bg-indigo-600 text-white flex items-center justify-center shadow"
                    >
                      {count}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-600 font-mono mt-0.5">0</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Advantage / Disadvantage for d20 & Quick Modifiers Row */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
          {/* Advantage Switcher */}
          <div>
            <label className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 block mb-1">
              Mechanika k20
            </label>
            <div className="flex rounded-lg bg-slate-900 p-0.5 border border-slate-800 text-[11px]">
              <button
                type="button"
                data-testid="adv-mode-none"
                onClick={() => setAdvantageMode('none')}
                className={`flex-1 py-1 rounded text-center font-medium transition cursor-pointer ${
                  advantageMode === 'none'
                    ? 'bg-slate-800 text-slate-100 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Std
              </button>
              <button
                type="button"
                data-testid="adv-mode-advantage"
                onClick={() => setAdvantageMode('advantage')}
                className={`flex-1 py-1 rounded text-center font-medium transition cursor-pointer ${
                  advantageMode === 'advantage'
                    ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-emerald-400'
                }`}
                title="Advantage (Ułatwienie - 2k20, wybór wyższego)"
              >
                ADV
              </button>
              <button
                type="button"
                data-testid="adv-mode-disadvantage"
                onClick={() => setAdvantageMode('disadvantage')}
                className={`flex-1 py-1 rounded text-center font-medium transition cursor-pointer ${
                  advantageMode === 'disadvantage'
                    ? 'bg-rose-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-rose-400'
                }`}
                title="Disadvantage (Utrudnienie - 2k20, wybór niższego)"
              >
                DIS
              </button>
            </div>
          </div>

          {/* Numeric Modifier */}
          <div>
            <label className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 block mb-1">
              Modyfikator
            </label>
            <div className="flex items-center rounded-lg bg-slate-900 border border-slate-800 overflow-hidden">
              <button
                type="button"
                data-testid="modifier-minus-btn"
                onClick={() => setModifier((prev) => Math.max(prev - 1, -99))}
                className="px-2.5 py-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 font-bold text-xs cursor-pointer"
              >
                -
              </button>
              <input
                type="number"
                data-testid="modifier-input"
                value={modifier}
                onChange={(e) => {
                  const val = Number.parseInt(e.target.value, 10);
                  setModifier(Number.isNaN(val) ? 0 : Math.max(-99, Math.min(99, val)));
                }}
                className="w-full text-center bg-transparent text-xs font-mono font-semibold text-slate-100 focus:outline-none"
              />
              <button
                type="button"
                data-testid="modifier-plus-btn"
                onClick={() => setModifier((prev) => Math.min(prev + 1, 99))}
                className="px-2.5 py-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 font-bold text-xs cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Options Row: Clear Pool */}
        <div className="flex items-center justify-end text-xs pt-1">
          <button
            type="button"
            data-testid="clear-pool-btn"
            onClick={handleClearPool}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/40 transition cursor-pointer"
            title="Wyczyść bufor kości (Skrót: C)"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Wyczyść kości (C)</span>
          </button>
        </div>

        {/* Formula Display & Roll Trigger Button */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500">
              Formuła rzutu
            </div>
            <div
              data-testid="dice-pool-formula"
              className="text-sm font-mono font-bold text-amber-400 truncate tracking-wide"
            >
              {currentFormula}
            </div>
          </div>

          <button
            type="button"
            data-testid="roll-dice-btn"
            onClick={handleRoll}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-slate-950 hover:text-white font-bold text-xs shadow-lg shadow-indigo-900/40 hover:shadow-indigo-600/50 transition-all cursor-pointer shrink-0"
          >
            <Dices className="w-4 h-4" />
            <span>Rzuć [Enter]</span>
          </button>
        </div>

        {/* Quick Polyhedral Dice Tray Viewport */}
        <DiceTokensTray rollResult={lastResult} />

        {/* Roll Result Card */}
        {lastResult && (
          <div
            data-testid="dice-result-card"
            className={`p-3 rounded-xl border transition-all ${
              isCritSuccess
                ? 'bg-amber-950/40 border-amber-500/60 ring-1 ring-amber-500/40'
                : isCritFailure
                  ? 'bg-rose-950/40 border-rose-500/60 ring-1 ring-rose-500/40'
                  : 'bg-slate-900/70 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Wynik rzutu:</span>
              </span>
            </div>

            <div className="flex items-baseline justify-between gap-2">
              <div
                data-testid="dice-result-total"
                className={`text-3xl font-black font-mono tracking-tight ${
                  isCritSuccess
                    ? 'text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]'
                    : isCritFailure
                      ? 'text-rose-400 drop-shadow-[0_0_12px_rgba(244,63,94,0.6)]'
                      : 'text-slate-100'
                }`}
              >
                {lastResult.total}
              </div>

              {isCritSuccess && (
                <span className="text-xs font-bold text-amber-400 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 animate-pulse">
                  KRYTYK! (Nat 20) ✨
                </span>
              )}

              {isCritFailure && (
                <span className="text-xs font-bold text-rose-400 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40">
                  PECH! (Nat 1) 💀
                </span>
              )}
            </div>

            {/* Breakdown detail */}
            <div
              data-testid="dice-result-breakdown"
              className="mt-1 text-xs font-mono text-slate-300 break-words"
            >
              {formatBreakdown(lastResult)}
            </div>
          </div>
        )}
      </div>

      {/* History Drawer */}
      {showHistory && (
        <div
          data-testid="dice-history-drawer"
          className="border-t border-slate-800 bg-slate-950 p-3 space-y-2 max-h-[190px] overflow-y-auto"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
              Ostatnie rzuty ({history.length})
            </span>
            <button
              type="button"
              onClick={() => setHistory([])}
              className="text-[10px] text-slate-500 hover:text-slate-300"
            >
              Wyczyść historię
            </button>
          </div>

          {history.length === 0 ? (
            <div className="text-center py-4 text-xs text-slate-500">Brak historii rzutów</div>
          ) : (
            <div className="space-y-1.5">
              {history.map((item, idx) => (
                <div
                  key={item.id || `${item.timestamp}-${idx}`}
                  data-testid={`roll-history-item-${idx}`}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800/80 text-xs hover:border-slate-700 transition"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-mono font-bold text-amber-400 truncate">
                      {item.formula}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {formatBreakdown(item)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-base font-black font-mono text-slate-100">
                      {item.total}
                    </span>
                    <button
                      type="button"
                      data-testid={`reroll-btn-${idx}`}
                      onClick={() => handleReroll(item)}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                      title="Powtórz rzut z tą samą pulą"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
