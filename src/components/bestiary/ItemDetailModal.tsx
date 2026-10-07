'use client';

import { Coins, Shield, Swords, UserPlus, Weight, X } from 'lucide-react';
import type { CompendiumItem } from '@/lib/compendium';
import { getItemIcon, getItemRarityColor } from './ItemCard';

interface ItemDetailModalProps {
  item: CompendiumItem | null;
  onClose: () => void;
  onAssign?: (item: CompendiumItem) => void;
}

export function ItemDetailModal({ item, onClose, onAssign }: ItemDetailModalProps) {
  if (!item) return null;

  const rarityBadge = getItemRarityColor(item.rarity);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="item-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
    >
      <div className="glass-panel w-full max-w-lg rounded-2xl border border-slate-800 shadow-2xl p-6 space-y-5 bg-slate-950/95 text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              {getItemIcon(item.type)}
            </div>
            <div>
              <h2 id="item-modal-title" className="text-base font-bold text-slate-100">
                {item.name}
              </h2>
              <div className="flex items-center gap-2 pt-0.5">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border font-mono capitalize ${rarityBadge}`}
                >
                  {item.rarity}
                </span>
                <span className="text-xs text-slate-400">{item.type}</span>
              </div>
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

        {/* Quick parameters grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <Coins className="w-3 h-3 text-amber-400" />
              <span>Cena</span>
            </span>
            <span className="text-amber-300 font-semibold text-[11px] block">{item.cost}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <Weight className="w-3 h-3 text-slate-400" />
              <span>Waga</span>
            </span>
            <span className="text-slate-200 font-semibold text-[11px] block">
              {item.weight !== undefined ? `${item.weight} lb` : '—'}
            </span>
          </div>

          {item.damage && (
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1 sm:col-span-2">
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Swords className="w-3 h-3 text-rose-400" />
                <span>Obrażenia</span>
              </span>
              <span className="text-rose-300 font-semibold text-[11px] block">
                {item.damage.dice} {item.damage.type}
              </span>
            </div>
          )}

          {item.armorClass && (
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1 sm:col-span-2">
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Shield className="w-3 h-3 text-sky-400" />
                <span>Klasa Pancerza (AC)</span>
              </span>
              <span className="text-sky-300 font-semibold text-[11px] block">
                {item.armorClass.base}
                {item.armorClass.dexBonus ? ' + mod. Zręczności' : ''}
                {item.armorClass.maxDex !== undefined ? ` (maks. +${item.armorClass.maxDex})` : ''}
              </span>
            </div>
          )}
        </div>

        {/* Properties list */}
        {item.properties && item.properties.length > 0 && (
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
              Właściwości
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {item.properties.map((prop) => (
                <span
                  key={prop}
                  className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono"
                >
                  {prop}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
            Opis Przedmiotu
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80">
            {item.description}
          </p>
        </div>

        {/* Modal footer actions */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition cursor-pointer"
          >
            Zamknij
          </button>

          {onAssign && (
            <button
              type="button"
              onClick={() => {
                onAssign(item);
                onClose();
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Dodaj do karty postaci</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
