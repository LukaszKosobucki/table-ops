'use client';

import { AlertCircle, CheckCircle2, Loader2, Moon, Plus, X } from 'lucide-react';
import { useState } from 'react';
import type { DashboardCharacter, DashboardLog } from './types';

interface ShortRestModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  heroes: DashboardCharacter[];
  onRestComplete: (updatedCharacters: DashboardCharacter[], newLog: DashboardLog) => void;
}

export function ShortRestModal({
  isOpen,
  onClose,
  sessionId,
  heroes,
  onRestComplete,
}: ShortRestModalProps) {
  const [heals, setHeals] = useState<Record<string, number>>({});
  const [hitDice] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleHealChange = (heroId: string, val: string) => {
    const num = Number.parseInt(val, 10);
    setHeals((prev) => ({
      ...prev,
      [heroId]: Number.isNaN(num) ? 0 : Math.max(0, num),
    }));
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const healPayload = Object.entries(heals)
        .filter(([, amount]) => amount > 0)
        .map(([characterId, hpHealed]) => ({
          characterId,
          hpHealed,
          hitDiceSpent: hitDice[characterId] || 1,
        }));

      const res = await fetch(`/api/sessions/${sessionId}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logType: 'REST_SHORT',
          heals: healPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Nie udało się zapisać Krótkiego Odpoczynku');
      }

      onRestComplete(data.updatedCharacters || [], data.log);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił nieoczekiwany błąd');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="short-rest-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
    >
      <div className="glass-panel w-full max-w-lg rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-md shadow-purple-500/10">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h2 id="short-rest-title" className="text-base font-bold text-slate-100">
                Krótki Odpoczynek (1 godzina)
              </h2>
              <p className="text-xs text-slate-400">
                Wydawanie Kości Wytrzymałości (Hit Dice) i leczenie ran
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-800/40 text-xs text-purple-200 space-y-1.5 font-sans">
            <span className="font-semibold text-purple-300">Reguły Krótkiego Odpoczynku:</span>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Gracze mogą rzucić kośćmi życia (Hit Dice) i dodać modyfikator Kondycji, aby odzyskać
              punkty życia do maksymalnego poziomu.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
              Odzyskane Punkty Życia Bohaterów
            </h3>

            {heroes.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3 text-center">
                Brak bohaterów w tej sesji.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {heroes.map((hero) => {
                  const currentHeal = heals[hero.id] || 0;
                  const estimatedNewHp = Math.min(hero.maxHp, hero.currentHp + currentHeal);

                  return (
                    <div
                      key={hero.id}
                      className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-slate-200">{hero.name}</span>
                          <span className="text-[10px] text-slate-400 ml-2">
                            {hero.class || 'Bohater'}
                          </span>
                        </div>
                        <div className="font-mono text-xs">
                          <span className="text-amber-400 font-bold">
                            {hero.currentHp} / {hero.maxHp} HP
                          </span>
                          {currentHeal > 0 && (
                            <span className="text-emerald-400 ml-1.5 font-bold">
                              ➔ {estimatedNewHp} HP
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <label
                          htmlFor={`heal-input-${hero.id}`}
                          className="text-[11px] text-slate-400 flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3 text-emerald-400" />
                          <span>Leczenie HP:</span>
                        </label>
                        <input
                          id={`heal-input-${hero.id}`}
                          data-testid={`heal-input-${hero.id}`}
                          type="number"
                          min="0"
                          max={hero.maxHp - hero.currentHp}
                          value={heals[hero.id] ?? ''}
                          onChange={(e) => handleHealChange(hero.id, e.target.value)}
                          placeholder="0"
                          className="w-20 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-center text-slate-100 focus:outline-none focus:border-purple-500"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setHeals((prev) => ({
                              ...prev,
                              [hero.id]: Math.max(0, hero.maxHp - hero.currentHp),
                            }))
                          }
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 font-mono transition cursor-pointer"
                        >
                          Max
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/40 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            Anuluj
          </button>
          <button
            type="button"
            data-testid="confirm-short-rest-btn"
            onClick={handleConfirm}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-60"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>Zakończ Krótki Odpoczynek</span>
          </button>
        </div>
      </div>
    </div>
  );
}
