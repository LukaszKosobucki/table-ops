'use client';

import { AlertCircle, CheckCircle2, FileText, Loader2, X } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import type { DashboardLog } from './types';

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  onNoteAdded: (newLog: DashboardLog) => void;
}

export function AddNoteModal({ isOpen, onClose, sessionId, onNoteAdded }: AddNoteModalProps) {
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Treść notatki nie może być pusta.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/sessions/${sessionId}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logType: 'CUSTOM_NOTE',
          description: description.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Nie udało się zapisać notatki');
      }

      onNoteAdded(data.log);
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
      aria-labelledby="add-note-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
    >
      <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md shadow-amber-500/10">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 id="add-note-title" className="text-base font-bold text-slate-100">
                Wpis na Osi Czasu Sesji
              </h2>
              <p className="text-xs text-slate-400">Notatka narracyjna do kroniki kampanii</p>
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
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="note-description-input"
              className="block text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono"
            >
              Treść Notatki / Wydarzenia
            </label>
            <textarea
              id="note-description-input"
              data-testid="note-description-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Np. Drużyna dotarła do opuszczonej krypty pod ruinami zamku. Znaleziono zamkniętą żelazną skrzynię..."
              rows={4}
              required
              className="w-full text-xs p-3 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-amber-500/60 focus:outline-none text-slate-200 placeholder-slate-500 resize-none font-sans"
            />
          </div>

          {/* Footer */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              Anuluj
            </button>
            <button
              type="submit"
              data-testid="save-note-btn"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-600/30 transition-all cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
              )}
              <span>Zapisz Notatkę</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
