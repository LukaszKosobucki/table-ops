'use client';

import {
  Coins,
  FlaskConical,
  Package,
  Shield,
  Sparkles,
  Swords,
  UserPlus,
  Weight,
} from 'lucide-react';
import type { CompendiumItem } from '@/lib/compendium';

interface ItemCardProps {
  item: CompendiumItem;
  onSelect: () => void;
  onAssign?: () => void;
}

export function getItemRarityColor(rarity: string): string {
  switch (rarity.toLowerCase()) {
    case 'uncommon':
      return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    case 'rare':
      return 'text-sky-400 bg-sky-500/10 border-sky-500/30';
    case 'very rare':
    case 'very_rare':
      return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
    case 'legendary':
      return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    default:
      return 'text-slate-300 bg-slate-500/10 border-slate-500/30';
  }
}

export function getItemIcon(type: string) {
  const t = type.toLowerCase();
  if (t.includes('weapon')) return <Swords className="w-4 h-4" />;
  if (t.includes('armor') || t.includes('shield')) return <Shield className="w-4 h-4" />;
  if (t.includes('potion')) return <FlaskConical className="w-4 h-4" />;
  if (t.includes('wondrous')) return <Sparkles className="w-4 h-4" />;
  return <Package className="w-4 h-4" />;
}

export function ItemCard({ item, onSelect, onAssign }: ItemCardProps) {
  const rarityBadge = getItemRarityColor(item.rarity);

  return (
    <div
      data-testid={`item-card-${item.index}`}
      className="glass-card rounded-2xl p-4 border border-slate-800/80 hover:border-slate-700/80 transition flex flex-col justify-between gap-3 shadow-lg group hover:shadow-indigo-500/5 bg-slate-900/40"
    >
      <div className="space-y-2">
        {/* Header: Name, Type, Rarity */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              {getItemIcon(item.type)}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                {item.name}
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                {item.type} • <span className="capitalize">{item.rarity}</span>
              </p>
            </div>
          </div>

          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border font-mono capitalize ${rarityBadge}`}
          >
            {item.rarity}
          </span>
        </div>

        {/* Damage or Armor Class tags */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {item.damage && (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300">
              ⚔️ {item.damage.dice} {item.damage.type}
            </span>
          )}
          {item.armorClass && (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/30 text-sky-300">
              🛡️ AC {item.armorClass.base}
              {item.armorClass.dexBonus ? ' + DEX' : ''}
              {item.armorClass.maxDex !== undefined ? ` (max +${item.armorClass.maxDex})` : ''}
            </span>
          )}
          {item.properties?.slice(0, 3).map((prop) => (
            <span
              key={prop}
              className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-slate-800 text-slate-400"
            >
              {prop}
            </span>
          ))}
          {item.properties && item.properties.length > 3 && (
            <span className="text-[9px] text-slate-500">+{item.properties.length - 3}</span>
          )}
        </div>

        {/* Cost & Weight */}
        <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-1 font-mono">
          <div className="flex items-center gap-1 text-amber-300/80">
            <Coins className="w-3 h-3 text-amber-400 shrink-0" />
            <span>{item.cost}</span>
          </div>
          {item.weight !== undefined && (
            <div className="flex items-center gap-1 text-slate-400">
              <Weight className="w-3 h-3 text-slate-500 shrink-0" />
              <span>{item.weight} lb</span>
            </div>
          )}
        </div>

        {/* Short description preview */}
        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed pt-1">
          {item.description}
        </p>
      </div>

      {/* Action Footer */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onSelect}
          className="text-xs text-slate-400 hover:text-slate-200 font-medium transition cursor-pointer"
        >
          Szczegóły ➔
        </button>

        {onAssign && (
          <button
            type="button"
            data-testid={`assign-item-btn-${item.index}`}
            onClick={onAssign}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition cursor-pointer"
          >
            <UserPlus className="w-3 h-3" />
            <span>+ Dodaj</span>
          </button>
        )}
      </div>
    </div>
  );
}
