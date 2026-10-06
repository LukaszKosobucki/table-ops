'use client';

import { Edit3, X } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import type { SessionItem } from './types';

interface EditSessionModalProps {
  isOpen: boolean;
  session: SessionItem | null;
  onClose: () => void;
  onUpdate: (id: string, name: string) => Promise<boolean | undefined>;
}

export function EditSessionModal({ isOpen, session, onClose, onUpdate }: EditSessionModalProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (session && isOpen) {
      setName(session.name);
      setError(null);
      setIsSubmitting(false);
    }
  }, [session, isOpen]);

  if (!isOpen || !session) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();

    if (trimmed.length < 2) {
      setError('Nazwa sesji musi mieć co najmniej 2 znaki');
      return;
    }

    if (trimmed.length > 60) {
      setError('Nazwa sesji może mieć maksymalnie 60 znaków');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onUpdate(session.id, trimmed);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się zaktualizować sesji');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-session-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
    >
      <div className="relative w-full max-w-lg glass-panel rounded-2xl border border-slate-800 p-6 shadow-2xl shadow-indigo-950/40">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
          aria-label="Zamknij"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400">
            <Edit3 className="w-5 h-5" />
          </div>
          <div>
            <h2 id="edit-session-title" className="text-lg font-bold text-slate-100">
              Zmień nazwę sesji
            </h2>
            <p className="text-xs text-slate-400">Zaktualizuj nazwę wyświetlaną kampanii</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="edit-session-name"
              className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
            >
              Nowa nazwa sesji
            </label>
            <input
              id="edit-session-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              maxLength={60}
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans"
            />
            {error && <p className="mt-1.5 text-xs text-rose-400 font-medium">{error}</p>}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={isSubmitting || name.trim().length < 2 || name.trim() === session.name}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-600/30 border border-indigo-400/30 transition-all"
            >
              {isSubmitting ? 'Zapisywanie...' : 'Zapisz zmiany'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
