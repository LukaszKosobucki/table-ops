'use client';

import { Sparkles } from 'lucide-react';

interface WizardProgressProps {
  currentStep: 1 | 2 | 3 | 4;
}

export function WizardProgress({ currentStep }: WizardProgressProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
      <div>
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          Kreator Wielokrokowy Postaci (Wizard)
        </h3>
        <p className="text-xs text-slate-400">
          Wygeneruj czystą kartę postaci w 4 szybkich krokach.
        </p>
      </div>

      {/* Steps Indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs font-mono transition ${
              currentStep === s
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : currentStep > s
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                  : 'bg-slate-900 text-slate-500 border border-slate-800'
            }`}
          >
            {currentStep > s ? '✓' : s}
          </div>
        ))}
      </div>
    </div>
  );
}
