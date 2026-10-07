'use client';

import { X } from 'lucide-react';
import { useState } from 'react';
import { AVAILABLE_CONDITIONS } from './types';

interface CombatantStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyStatus: (statusName: string, durationTurns: number) => void;
}

export function CombatantStatusModal({
  isOpen,
  onClose,
  onApplyStatus,
}: CombatantStatusModalProps) {
  const [selectedCondition, setSelectedCondition] = useState<string>(AVAILABLE_CONDITIONS[0]);
  const [selectedDuration, setSelectedDuration] = useState<number>(2);

  if (!isOpen) return null;

  const handleApply = () => {
    onApplyStatus(selectedCondition, selectedDuration);
    onClose();
  };

  return (
    <div className="mt-2 p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center gap-2.5 animate-in fade-in duration-200">
      <span className="text-xs text-slate-400 font-semibold">Nakładanie statusu:</span>

      <select
        value={selectedCondition}
        onChange={(e) => setSelectedCondition(e.target.value)}
        className="px-2 py-1 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500"
      >
        {AVAILABLE_CONDITIONS.map((cond) => (
          <option key={cond} value={cond}>
            {cond}
          </option>
        ))}
      </select>

      <div className="flex items-center gap-1">
        <span className="text-xs text-slate-400">Czas:</span>
        {[1, 2, 3, 5].map((dur) => (
          <button
            key={dur}
            type="button"
            onClick={() => setSelectedDuration(dur)}
            className={`px-2 py-0.5 text-xs rounded font-mono transition cursor-pointer ${
              selectedDuration === dur
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {dur} {dur === 1 ? 'tura' : 'tury'}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleApply}
        className="px-3 py-1 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow transition cursor-pointer"
      >
        Zastosuj
      </button>

      <button
        type="button"
        onClick={onClose}
        className="p-1 text-slate-500 hover:text-slate-300 cursor-pointer"
        title="Zamknij"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
