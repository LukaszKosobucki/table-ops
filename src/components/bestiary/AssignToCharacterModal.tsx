'use client';

import { CheckCircle2, Shield, User, Wand2, X } from 'lucide-react';
import { useState } from 'react';
import type { DashboardCharacter } from '../dashboard/types';

interface AssignToCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'spell' | 'item';
  entityName: string;
  characters: DashboardCharacter[];
  onCharacterUpdated?: (updated: DashboardCharacter) => void;
}

export function AssignToCharacterModal({
  isOpen,
  onClose,
  entityType,
  entityName,
  characters,
  onCharacterUpdated,
}: AssignToCharacterModalProps) {
  const heroes = characters.filter((c) => c.type === 'HERO');
  const [selectedHeroId, setSelectedHeroId] = useState<string>(heroes[0]?.id || '');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAssign = async () => {
    if (!selectedHeroId) return;
    const hero = heroes.find((h) => h.id === selectedHeroId);
    if (!hero) return;

    try {
      setIsSaving(true);
      setErrorMessage(null);

      let payload: Partial<DashboardCharacter> = {};
      let updatedChar: DashboardCharacter = { ...hero };

      if (entityType === 'spell') {
        const existingSpells = hero.spells || {};
        const existingKnown = existingSpells.known || [];
        if (!existingKnown.includes(entityName)) {
          const newKnown = [...existingKnown, entityName];
          payload = {
            spells: {
              ...existingSpells,
              known: newKnown,
            },
          };
          updatedChar = {
            ...hero,
            spells: {
              ...existingSpells,
              known: newKnown,
            },
          };
        }
      } else {
        const existingInventory = hero.inventory || [];
        const newInventory = [...existingInventory, entityName];
        payload = { inventory: newInventory };
        updatedChar = {
          ...hero,
          inventory: newInventory,
        };
      }

      // If character has backend ID, persist via PUT /api/characters/:id
      if (hero.id && !hero.id.startsWith('local-')) {
        const res = await fetch(`/api/characters/${hero.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          throw new Error('Nie udało się zaktualizować postaci w bazie.');
        }
      }

      onCharacterUpdated?.(updatedChar);
      setSuccessMessage(
        `Pomyślnie dodano ${entityType === 'spell' ? 'zaklęcie' : 'przedmiot'} „${entityName}” do karty postaci ${hero.name}!`
      );
      setTimeout(() => {
        onClose();
        setSuccessMessage(null);
      }, 1200);
    } catch (err: unknown) {
      console.error('Failed to assign to character:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Wystąpił błąd podczas przypisywania.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="assign-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
    >
      <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-800 shadow-2xl p-6 space-y-5 bg-slate-950/95 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              {entityType === 'spell' ? (
                <Wand2 className="w-4 h-4" />
              ) : (
                <Shield className="w-4 h-4" />
              )}
            </div>
            <div>
              <h2 id="assign-modal-title" className="text-sm font-bold text-slate-100">
                Przypisz do Postaci
              </h2>
              <p className="text-[11px] text-slate-400">
                {entityType === 'spell' ? 'Zaklęcie' : 'Ekwipunek'}:{' '}
                <span className="text-amber-300 font-semibold">{entityName}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {heroes.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-2">
            <User className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-xs text-slate-300 font-medium">Brak bohaterów w tej sesji.</p>
            <p className="text-[11px] text-slate-400">
              Przejdź do Kreatora Postaci w górnym menu, aby stworzyć pierwszego bohatera.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <label
              htmlFor="character-select"
              className="text-xs font-semibold text-slate-300 block"
            >
              Wybierz bohatera drużyny:
            </label>
            <select
              id="character-select"
              data-testid="assign-character-select"
              value={selectedHeroId}
              onChange={(e) => setSelectedHeroId(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:outline-none text-slate-200 cursor-pointer"
            >
              {heroes.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.class || 'Bohater'} • Poz. {h.level})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Feedback Messages */}
        {successMessage && (
          <div
            data-testid="assign-success-message"
            className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs animate-fadeIn">
            {errorMessage}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-slate-100 text-xs font-medium transition cursor-pointer"
          >
            Anuluj
          </button>

          {heroes.length > 0 && (
            <button
              type="button"
              data-testid="confirm-assign-btn"
              disabled={isSaving || !selectedHeroId}
              onClick={handleAssign}
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition cursor-pointer"
            >
              {isSaving ? 'Zapisywanie...' : 'Zatwierdź i Przypisz'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
