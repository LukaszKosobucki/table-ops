'use client';

import { AlertCircle, CheckCircle2, Heart, Loader2, Moon, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import type { DashboardCharacter, DashboardLog } from './types';

interface LongRestModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  heroes: DashboardCharacter[];
  onRestComplete: (updatedCharacters: DashboardCharacter[], newLog: DashboardLog) => void;
}

export function LongRestModal({
  isOpen,
  onClose,
  sessionId,
  heroes,
  onRestComplete,
}: LongRestModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/sessions/${sessionId}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logType: 'REST_LONG',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Nie udało się wykonać Długiego Odpoczynku');
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
      aria-labelledby="long-rest-title"
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
              <h2 id="long-rest-title" className="text-base font-bold text-slate-100">
                Długi Odpoczynek (8 godzin)
              </h2>
              <p className="text-xs text-slate-400">
                Regeneracja sił w bezpiecznym obozowisku lub karczmie
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

          {/* D&D 5e Rules info box */}
          <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-800/40 text-xs text-purple-200 space-y-2 font-sans">
            <div className="font-semibold flex items-center gap-1.5 text-purple-300">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Zasady D&D 5e Long Rest:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1 text-[11px] leading-relaxed">
              <li>Wszyscy bohaterowie graczy odzyskują pełne punkty życia (100% max HP).</li>
              <li>Wygasają wszelkie tymczasowe punkty życia (temp HP = 0).</li>
              <li>Wszystkie zużyte komórki czarów zostają całkowicie odnowione.</li>
              <li>Na Osi Czasu Sesji zostanie odnotowany wpis z podsumowaniem odpoczynku.</li>
            </ul>
          </div>

          {/* Heroes List Preview */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
              Bohaterowie w drużynie ({heroes.length})
            </h3>

            {heroes.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3 text-center">
                Brak bohaterów graczy w tej sesji.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {heroes.map((hero) => {
                  const hasDamage = hero.currentHp < hero.maxHp;
                  return (
                    <div
                      key={hero.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-semibold text-slate-200">{hero.name}</span>
                        <div className="text-[10px] text-slate-400">
                          {hero.class || 'Bohater'} • Poziom {hero.level || 1}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span
                            className={`font-mono font-bold ${
                              hasDamage ? 'text-amber-400' : 'text-emerald-400'
                            }`}
                          >
                            {hero.currentHp} / {hero.maxHp} HP
                          </span>
                          <span className="text-[10px] text-purple-300 block font-mono">
                            ➔ {hero.maxHp} HP
                          </span>
                        </div>
                        <Heart className="w-4 h-4 text-purple-400 shrink-0" />
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
            data-testid="confirm-long-rest-btn"
            onClick={handleConfirm}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-60"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>Wykonaj Długi Odpoczynek</span>
          </button>
        </div>
      </div>
    </div>
  );
}
