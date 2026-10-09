'use client';

import { Eye, Plus, Shield, ShieldAlert, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import {
  COMMON_CONDITIONS,
  COMMON_SENSES,
  type CombatantDefenses,
  DAMAGE_TYPES,
} from '@/lib/skills-and-traits';

export interface CharacterDefensesEditorProps {
  defenses?: Partial<CombatantDefenses>;
  onChange?: (updated: CombatantDefenses) => void;
  readOnly?: boolean;
}

export function CharacterDefensesEditor({
  defenses,
  onChange,
  readOnly = false,
}: CharacterDefensesEditorProps) {
  const current: CombatantDefenses = {
    resistances: defenses?.resistances ? [...defenses.resistances] : [],
    damageImmunities: defenses?.damageImmunities ? [...defenses.damageImmunities] : [],
    conditionImmunities: defenses?.conditionImmunities ? [...defenses.conditionImmunities] : [],
    senses: defenses?.senses ? [...defenses.senses] : [],
  };

  const [activePicker, setActivePicker] = useState<
    'resistance' | 'immunity' | 'condition' | 'sense' | null
  >(null);
  const [customSenseInput, setCustomSenseInput] = useState('');

  const handleToggleResistance = (nameWithEn: string) => {
    const updated = current.resistances.includes(nameWithEn)
      ? current.resistances.filter((r) => r !== nameWithEn)
      : [...current.resistances, nameWithEn];
    onChange?.({ ...current, resistances: updated });
  };

  const handleToggleImmunity = (nameWithEn: string) => {
    const updated = current.damageImmunities.includes(nameWithEn)
      ? current.damageImmunities.filter((i) => i !== nameWithEn)
      : [...current.damageImmunities, nameWithEn];
    onChange?.({ ...current, damageImmunities: updated });
  };

  const handleToggleCondition = (nameWithEn: string) => {
    const updated = current.conditionImmunities.includes(nameWithEn)
      ? current.conditionImmunities.filter((c) => c !== nameWithEn)
      : [...current.conditionImmunities, nameWithEn];
    onChange?.({ ...current, conditionImmunities: updated });
  };

  const handleToggleSense = (sense: string) => {
    const updated = current.senses.includes(sense)
      ? current.senses.filter((s) => s !== sense)
      : [...current.senses, sense];
    onChange?.({ ...current, senses: updated });
  };

  const handleAddCustomSense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSenseInput.trim()) return;
    const sense = customSenseInput.trim();
    if (!current.senses.includes(sense)) {
      onChange?.({ ...current, senses: [...current.senses, sense] });
    }
    setCustomSenseInput('');
  };

  return (
    <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Odporności, Niewrażliwości i Zmysły
          </h3>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">D&D 5e Combat Traits</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Odporności (Resistances) */}
        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-sky-400 flex items-center gap-1.5 uppercase">
              <Shield className="w-3.5 h-3.5" />
              <span>Odporności (50% obr.)</span>
            </span>
            {!readOnly && (
              <button
                type="button"
                data-testid="add-resistance-btn"
                onClick={() => setActivePicker(activePicker === 'resistance' ? null : 'resistance')}
                className="text-[10px] font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-0.5 transition cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>{activePicker === 'resistance' ? 'Zamknij' : 'Dodaj'}</span>
              </button>
            )}
          </div>

          {/* Active Picker Popout */}
          {activePicker === 'resistance' && (
            <div className="p-2 rounded-lg bg-slate-950 border border-sky-800/40 flex flex-wrap gap-1 animate-fadeIn">
              {DAMAGE_TYPES.map((dt) => {
                const label = `${dt.name} (${dt.nameEn})`;
                const isSelected = current.resistances.includes(label);
                return (
                  <button
                    key={dt.key}
                    type="button"
                    data-testid={`select-damage-type-${dt.key}`}
                    onClick={() => handleToggleResistance(label)}
                    className={`text-[10px] px-2 py-0.5 rounded transition cursor-pointer border ${
                      isSelected
                        ? 'bg-sky-500/30 text-sky-200 border-sky-400 font-bold'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {dt.name}
                  </button>
                );
              })}
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-1 min-h-6">
            {current.resistances.length > 0 ? (
              current.resistances.map((res) => (
                <span
                  key={res}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-sky-950/60 text-sky-300 border border-sky-800/60 flex items-center gap-1.5"
                >
                  <span>{res}</span>
                  {!readOnly && (
                    <button
                      type="button"
                      data-testid={`remove-resistance-${res}`}
                      onClick={() => handleToggleResistance(res)}
                      className="text-sky-400 hover:text-rose-400 transition cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))
            ) : (
              <span className="text-[10px] text-slate-500 italic">Brak odporności</span>
            )}
          </div>
        </div>

        {/* 2. Niewrażliwości na obrażenia (Damage Immunities) */}
        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5 uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Niewrażliwości (0 obr.)</span>
            </span>
            {!readOnly && (
              <button
                type="button"
                data-testid="add-immunity-btn"
                onClick={() => setActivePicker(activePicker === 'immunity' ? null : 'immunity')}
                className="text-[10px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5 transition cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>{activePicker === 'immunity' ? 'Zamknij' : 'Dodaj'}</span>
              </button>
            )}
          </div>

          {/* Active Picker Popout */}
          {activePicker === 'immunity' && (
            <div className="p-2 rounded-lg bg-slate-950 border border-emerald-800/40 flex flex-wrap gap-1 animate-fadeIn">
              {DAMAGE_TYPES.map((dt) => {
                const label = `${dt.name} (${dt.nameEn})`;
                const isSelected = current.damageImmunities.includes(label);
                return (
                  <button
                    key={dt.key}
                    type="button"
                    data-testid={`select-immunity-type-${dt.key}`}
                    onClick={() => handleToggleImmunity(label)}
                    className={`text-[10px] px-2 py-0.5 rounded transition cursor-pointer border ${
                      isSelected
                        ? 'bg-emerald-500/30 text-emerald-200 border-emerald-400 font-bold'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {dt.name}
                  </button>
                );
              })}
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-1 min-h-6">
            {current.damageImmunities.length > 0 ? (
              current.damageImmunities.map((imm) => (
                <span
                  key={imm}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 flex items-center gap-1.5"
                >
                  <span>{imm}</span>
                  {!readOnly && (
                    <button
                      type="button"
                      data-testid={`remove-immunity-${imm}`}
                      onClick={() => handleToggleImmunity(imm)}
                      className="text-emerald-400 hover:text-rose-400 transition cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))
            ) : (
              <span className="text-[10px] text-slate-500 italic">Brak niewrażliwości</span>
            )}
          </div>
        </div>

        {/* 3. Niewrażliwość na stany (Condition Immunities) */}
        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5 uppercase">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Niewrażliwość na Stany</span>
            </span>
            {!readOnly && (
              <button
                type="button"
                data-testid="add-condition-btn"
                onClick={() => setActivePicker(activePicker === 'condition' ? null : 'condition')}
                className="text-[10px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-0.5 transition cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>{activePicker === 'condition' ? 'Zamknij' : 'Dodaj'}</span>
              </button>
            )}
          </div>

          {/* Active Picker Popout */}
          {activePicker === 'condition' && (
            <div className="p-2 rounded-lg bg-slate-950 border border-amber-800/40 flex flex-wrap gap-1 animate-fadeIn">
              {COMMON_CONDITIONS.map((cond) => {
                const label = `${cond.name} (${cond.nameEn})`;
                const isSelected = current.conditionImmunities.includes(label);
                return (
                  <button
                    key={cond.key}
                    type="button"
                    data-testid={`select-condition-${cond.key}`}
                    onClick={() => handleToggleCondition(label)}
                    className={`text-[10px] px-2 py-0.5 rounded transition cursor-pointer border ${
                      isSelected
                        ? 'bg-amber-500/30 text-amber-200 border-amber-400 font-bold'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {cond.name}
                  </button>
                );
              })}
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-1 min-h-6">
            {current.conditionImmunities.length > 0 ? (
              current.conditionImmunities.map((cond) => (
                <span
                  key={cond}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-amber-950/60 text-amber-300 border border-amber-800/60 flex items-center gap-1.5"
                >
                  <span>{cond}</span>
                  {!readOnly && (
                    <button
                      type="button"
                      data-testid={`remove-condition-${cond}`}
                      onClick={() => handleToggleCondition(cond)}
                      className="text-amber-400 hover:text-rose-400 transition cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))
            ) : (
              <span className="text-[10px] text-slate-500 italic">
                Brak niewrażliwości na stany
              </span>
            )}
          </div>
        </div>

        {/* 4. Zmysły (Senses) */}
        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-400 flex items-center gap-1.5 uppercase">
              <Eye className="w-3.5 h-3.5" />
              <span>Zmysły (Senses)</span>
            </span>
            {!readOnly && (
              <button
                type="button"
                data-testid="add-sense-btn"
                onClick={() => setActivePicker(activePicker === 'sense' ? null : 'sense')}
                className="text-[10px] font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-0.5 transition cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>{activePicker === 'sense' ? 'Zamknij' : 'Dodaj'}</span>
              </button>
            )}
          </div>

          {/* Active Picker Popout */}
          {activePicker === 'sense' && (
            <div className="p-2 rounded-lg bg-slate-950 border border-purple-800/40 space-y-2 animate-fadeIn">
              <div className="flex flex-wrap gap-1">
                {COMMON_SENSES.map((sense) => {
                  const isSelected = current.senses.includes(sense);
                  return (
                    <button
                      key={sense}
                      type="button"
                      onClick={() => handleToggleSense(sense)}
                      className={`text-[10px] px-2 py-0.5 rounded transition cursor-pointer border ${
                        isSelected
                          ? 'bg-purple-500/30 text-purple-200 border-purple-400 font-bold'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {sense}
                    </button>
                  );
                })}
              </div>

              {/* Custom sense input form */}
              <form onSubmit={handleAddCustomSense} className="flex gap-1.5 pt-1">
                <input
                  type="text"
                  placeholder="Inny zmysł (np. Węch 9m)..."
                  value={customSenseInput}
                  onChange={(e) => setCustomSenseInput(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
                <button
                  type="submit"
                  className="px-2 py-0.5 rounded bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold cursor-pointer"
                >
                  Dodaj
                </button>
              </form>
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-1 min-h-6">
            {current.senses.length > 0 ? (
              current.senses.map((sense) => (
                <span
                  key={sense}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-purple-950/60 text-purple-300 border border-purple-800/60 flex items-center gap-1.5"
                >
                  <span>{sense}</span>
                  {!readOnly && (
                    <button
                      type="button"
                      data-testid={`remove-sense-${sense}`}
                      onClick={() => handleToggleSense(sense)}
                      className="text-purple-400 hover:text-rose-400 transition cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))
            ) : (
              <span className="text-[10px] text-slate-500 italic">Standardowy wzrok</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
