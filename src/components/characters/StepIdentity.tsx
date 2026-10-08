'use client';

import { ChevronLeft, ChevronRight, Image as ImageIcon, Shield, User } from 'lucide-react';
import { AVATAR_PRESETS } from '@/lib/avatars';

interface StepIdentityProps {
  charName: string;
  onCharNameChange: (name: string) => void;
  level: number;
  onLevelChange: (level: number) => void;
  type?: 'HERO' | 'NPC';
  onTypeChange?: (type: 'HERO' | 'NPC') => void;
  traits?: string;
  onTraitsChange?: (traits: string) => void;
  avatarUrl?: string;
  onAvatarUrlChange?: (url: string) => void;
  onPrev: () => void;
  onNext: () => void;
}

export function StepIdentity({
  charName,
  onCharNameChange,
  level,
  onLevelChange,
  type = 'HERO',
  onTypeChange,
  traits = '',
  onTraitsChange,
  avatarUrl = '',
  onAvatarUrlChange,
  onPrev,
  onNext,
}: StepIdentityProps) {
  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <h4 className="font-bold text-amber-400 text-sm uppercase tracking-wider">
        Krok 3: Tożsamość i Poziom Postaci
      </h4>

      <div className="space-y-4 max-w-lg">
        {/* Character Type (HERO vs NPC) */}
        <div>
          <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Rola Postaci</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onTypeChange?.('HERO')}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                type === 'HERO'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Bohater Gracza (HERO)</span>
            </button>
            <button
              type="button"
              onClick={() => onTypeChange?.('NPC')}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                type === 'NPC'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Postać Niezależna (NPC)</span>
            </button>
          </div>
        </div>

        {/* Character Name */}
        <div>
          <label className="text-xs font-semibold text-slate-300 mb-1 block">
            Imię i Tytuł Postaci
          </label>
          <input
            type="text"
            placeholder="np. Thorin Dębowa Tarcza"
            value={charName}
            onChange={(e) => onCharNameChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Avatar Selection */}
        <div>
          <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
            <span>Awatar / Portret Postaci</span>
          </label>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Podgląd awatara" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-slate-400">
                  {charName ? charName.charAt(0).toUpperCase() : '?'}
                </span>
              )}
            </div>
            <input
              type="url"
              data-testid="character-avatar-url-input"
              placeholder="Wklej link URL do obrazka lub wybierz z galerii poniżej..."
              value={avatarUrl}
              onChange={(e) => onAvatarUrlChange?.(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Quick preset gallery */}
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400">Szybki wybór portretu D&D:</span>
            <div className="flex gap-2 overflow-x-auto pb-1 max-w-full">
              {AVATAR_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onAvatarUrlChange?.(preset.url)}
                  title={`${preset.name} (${preset.category})`}
                  className={`w-9 h-9 rounded-lg overflow-hidden border shrink-0 transition-transform hover:scale-105 cursor-pointer ${
                    avatarUrl === preset.url
                      ? 'border-amber-400 ring-2 ring-amber-400/40'
                      : 'border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Level */}
        <div>
          <label className="text-xs font-semibold text-slate-300 mb-1 block">
            Poziom Postaci (1 - 20)
          </label>
          <input
            type="number"
            min={1}
            max={20}
            value={level}
            onChange={(e) => onLevelChange(parseInt(e.target.value, 10) || 1)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>

        {/* LARP / Personality Hints */}
        <div>
          <label className="text-xs font-semibold text-slate-300 mb-1 block">
            Wskazówki dla Mistrza Gry / Cechy Charakteru (LARP)
          </label>
          <textarea
            rows={2}
            placeholder="np. Porywczy krasnoludzki weteran, zawsze dotrzymuje słowa, nie ufa magii."
            value={traits}
            onChange={(e) => onTraitsChange?.(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 resize-none"
          />
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={onPrev}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Wstecz</span>
        </button>
        <button
          type="button"
          disabled={!charName.trim()}
          onClick={onNext}
          data-testid="wizard-to-equipment-btn"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm transition cursor-pointer"
        >
          <span>Dalej: Ekwipunek i Zaklęcia</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
