'use client';

import { Sparkles } from 'lucide-react';
import type React from 'react';
import type { MonsterData } from '@/lib/monsters';

interface HomebrewMonsterModalProps {
  isOpen: boolean;
  onClose: () => void;
  monsterData: Partial<MonsterData>;
  onChangeMonster: (data: Partial<MonsterData>) => void;
  onSave: (e: React.FormEvent) => void;
}

export function HomebrewMonsterModal({
  isOpen,
  onClose,
  monsterData,
  onChangeMonster,
  onSave,
}: HomebrewMonsterModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <form
        onSubmit={onSave}
        className="glass-panel w-full max-w-lg rounded-2xl border border-amber-500/30 p-6 space-y-4 shadow-2xl"
      >
        <h3 className="text-xl font-bold text-amber-400 flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Tworzenie Nowego Potwora (Homebrew)
        </h3>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Nazwa Potwora</label>
            <input
              type="text"
              required
              value={monsterData.name || ''}
              onChange={(e) => onChangeMonster({ ...monsterData, name: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Klasa Pancerza (AC)</label>
              <input
                type="number"
                value={monsterData.armorClass || 10}
                onChange={(e) =>
                  onChangeMonster({ ...monsterData, armorClass: Number(e.target.value) })
                }
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Max HP</label>
              <input
                type="number"
                value={monsterData.hitPoints || 10}
                onChange={(e) =>
                  onChangeMonster({ ...monsterData, hitPoints: Number(e.target.value) })
                }
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Challenge Rating (CR)</label>
              <input
                type="number"
                step="0.125"
                value={monsterData.challengeRating || 1}
                onChange={(e) =>
                  onChangeMonster({ ...monsterData, challengeRating: Number(e.target.value) })
                }
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">
                Typ (e.g. humanoid, dragon)
              </label>
              <input
                type="text"
                value={monsterData.type || 'humanoid'}
                onChange={(e) => onChangeMonster({ ...monsterData, type: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
          >
            Anuluj
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition"
          >
            Zapisz do Bestiariusza
          </button>
        </div>
      </form>
    </div>
  );
}
