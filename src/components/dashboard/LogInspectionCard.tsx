'use client';

import {
  ArrowLeft,
  Clock,
  FileText,
  Flag,
  Flame,
  Heart,
  History,
  Moon,
  Skull,
  Sparkles,
  Swords,
  Wand2,
} from 'lucide-react';
import type { DashboardLog, SessionLogType } from './types';

interface LogInspectionCardProps {
  log: DashboardLog;
  onBackToCombat: () => void;
}

interface CombatEndMetadata {
  rounds?: number;
  totalXp?: number;
  defeatedEnemies?: Array<{ name: string; xp?: number } | string>;
  fledEnemies?: Array<{ name: string; xp?: number } | string>;
  deadHeroes?: string[];
  unconsciousHeroes?: Array<{ name: string; isStabilized?: boolean } | string>;
  spellSlotsUsed?: Record<string, Record<string | number, number>>;
}

export function LogInspectionCard({ log, onBackToCombat }: LogInspectionCardProps) {
  const formatDateTime = (dateVal: string | Date) => {
    try {
      const d = typeof dateVal === 'string' ? new Date(dateVal) : dateVal;
      return new Intl.DateTimeFormat('pl-PL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    } catch {
      return String(dateVal);
    }
  };

  const getLogMeta = (type: SessionLogType) => {
    switch (type) {
      case 'COMBAT_END':
        return {
          icon: Swords,
          title: 'Podsumowanie Zakończonej Potyczki',
          color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
        };
      case 'REST_SHORT':
      case 'REST_LONG':
        return {
          icon: Moon,
          title: 'Odpoczynek i Regeneracja Drużyny',
          color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
        };
      case 'SPELL_CAST':
        return {
          icon: Wand2,
          title: 'Rzucenie Zaklęcia & Zużycie Zasobów',
          color: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
        };
      case 'COMBAT_ACTION':
        return {
          icon: Flame,
          title: 'Wydarzenie Taktyczne w Walce',
          color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        };
      default:
        return {
          icon: FileText,
          title: 'Wpis w Kronice Mistrza Gry',
          color: 'text-slate-400 bg-slate-500/10 border-slate-500/30',
        };
    }
  };

  const meta = getLogMeta(log.logType);
  const Icon = meta.icon;

  const combatEndMeta: CombatEndMetadata | null =
    log.logType === 'COMBAT_END' && log.metadata
      ? (log.metadata as unknown as CombatEndMetadata)
      : null;

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-2xl space-y-6 animate-fadeIn">
      {/* Top action: Back button */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <button
          type="button"
          onClick={onBackToCombat}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 hover:text-white transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Powrót do Walki / Tracker Inicjatywy</span>
        </button>

        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${meta.color}`}
        >
          <Icon className="w-3.5 h-3.5" />
          <span>{log.logType}</span>
        </span>
      </div>

      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-100">{meta.title}</h2>
        <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatDateTime(log.createdAt)}</span>
          </span>
          {log.combatId && (
            <span className="flex items-center gap-1 text-rose-400">
              <Swords className="w-3.5 h-3.5" />
              <span>ID Walki: {log.combatId.slice(0, 8)}</span>
            </span>
          )}
        </div>
      </div>

      {/* Event Narrative Body */}
      <div className="glass-card p-5 rounded-xl border border-slate-800 space-y-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <History className="w-3.5 h-3.5 text-indigo-400" />
          <span>Zapis w Kronice Sesji</span>
        </h3>
        <p className="text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-line">
          {log.description}
        </p>
      </div>

      {/* Rich Combat Conclusion Breakdown */}
      {combatEndMeta && (
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Swords className="w-4 h-4 text-rose-400" />
            <span>Szczegółowy Raport Bitewny</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* XP Award Card */}
            <div className="glass-card p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 space-y-1">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Doświadczenie (PD)</span>
              </div>
              <div className="text-2xl font-extrabold text-amber-200 font-mono">
                {combatEndMeta.totalXp ?? 0} PD
              </div>
              <p className="text-[11px] text-amber-400/80">
                100% za pokonanych, 50% za uciekinierów
              </p>
            </div>

            {/* Defeated Enemies Card */}
            <div className="glass-card p-4 rounded-xl border border-red-500/30 bg-red-950/20 space-y-1">
              <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase">
                <Skull className="w-4 h-4" />
                <span>Pokonani Przeciwnicy (100% PD)</span>
              </div>
              {combatEndMeta.defeatedEnemies && combatEndMeta.defeatedEnemies.length > 0 ? (
                <ul className="text-xs text-slate-200 space-y-1 pt-1 font-mono">
                  {combatEndMeta.defeatedEnemies.map((e, idx) => {
                    const name = typeof e === 'string' ? e : e.name;
                    const xp = typeof e === 'object' && e.xp ? ` (${e.xp} PD)` : '';
                    return (
                      // biome-ignore lint/suspicious/noArrayIndexKey: combat log summary list
                      <li key={`defeated-${idx}`} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                        <span>
                          {name}
                          {xp}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-xs text-slate-400">Brak zabitych wrogów</p>
              )}
            </div>

            {/* Fled Enemies Card */}
            <div className="glass-card p-4 rounded-xl border border-yellow-500/30 bg-yellow-950/20 space-y-1">
              <div className="flex items-center gap-2 text-yellow-400 font-bold text-xs uppercase">
                <Flag className="w-4 h-4" />
                <span>Uciekający Wrogowie (50% PD)</span>
              </div>
              {combatEndMeta.fledEnemies && combatEndMeta.fledEnemies.length > 0 ? (
                <ul className="text-xs text-slate-200 space-y-1 pt-1 font-mono">
                  {combatEndMeta.fledEnemies.map((e, idx) => {
                    const name = typeof e === 'string' ? e : e.name;
                    const xp = typeof e === 'object' && e.xp ? ` (${e.xp} PD)` : '';
                    return (
                      // biome-ignore lint/suspicious/noArrayIndexKey: combat log summary list
                      <li key={`fled-${idx}`} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />
                        <span>
                          {name}
                          {xp}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-xs text-slate-400">Żaden przeciwnik nie uciekł</p>
              )}
            </div>

            {/* Dead Heroes Card */}
            <div
              className={`glass-card p-4 rounded-xl border space-y-1 ${
                combatEndMeta.deadHeroes && combatEndMeta.deadHeroes.length > 0
                  ? 'border-red-600 bg-red-950/40 text-red-200'
                  : 'border-slate-800 bg-slate-900/40 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs uppercase text-red-400">
                <Skull className="w-4 h-4" />
                <span>Polegli Bohaterowie</span>
              </div>
              {combatEndMeta.deadHeroes && combatEndMeta.deadHeroes.length > 0 ? (
                <ul className="text-xs font-semibold text-rose-300 space-y-1 pt-1">
                  {combatEndMeta.deadHeroes.map((name) => (
                    <li key={`dead-${name}`} className="flex items-center gap-1.5">
                      <span>💀</span>
                      <span>{name}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-emerald-400/80 font-medium">
                  Wszyscy bohaterowie przeżyli
                </p>
              )}
            </div>

            {/* Unconscious / Downed Heroes Card */}
            <div className="glass-card p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 space-y-1">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase">
                <Heart className="w-4 h-4 text-amber-400" />
                <span>Powaleni / Ustabilizowani (0 HP)</span>
              </div>
              {combatEndMeta.unconsciousHeroes && combatEndMeta.unconsciousHeroes.length > 0 ? (
                <ul className="text-xs text-amber-200 space-y-1 pt-1 font-mono">
                  {combatEndMeta.unconsciousHeroes.map((h, idx) => {
                    const name = typeof h === 'string' ? h : h.name;
                    const st =
                      typeof h === 'object' && h.isStabilized ? ' (ustabilizowany)' : ' (0 HP)';
                    return (
                      // biome-ignore lint/suspicious/noArrayIndexKey: combat log summary list
                      <li key={`unconscious-${idx}`} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                        <span>
                          {name}
                          {typeof h === 'object' ? st : ''}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-xs text-slate-400">Brak powalonych graczy</p>
              )}
            </div>

            {/* Spell Slots Used Card */}
            <div className="glass-card p-4 rounded-xl border border-indigo-500/30 bg-indigo-950/20 space-y-1">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase">
                <Wand2 className="w-4 h-4" />
                <span>Zużyte Komórki Czarów</span>
              </div>
              {combatEndMeta.spellSlotsUsed &&
              Object.keys(combatEndMeta.spellSlotsUsed).length > 0 ? (
                <div className="text-xs text-slate-200 space-y-1 pt-1 font-mono">
                  {Object.entries(combatEndMeta.spellSlotsUsed).map(([charName, slots]) => (
                    <div key={`char-${charName}`} className="space-y-0.5">
                      <span className="font-bold text-indigo-300">{charName}:</span>
                      <div className="flex flex-wrap gap-1.5 pl-2">
                        {Object.entries(slots).map(([lvl, count]) => (
                          <span
                            key={`lvl-${charName}-${lvl}`}
                            className="px-1.5 py-0.5 rounded bg-indigo-900/60 border border-indigo-700/60 text-[10px] text-indigo-200"
                          >
                            {count}x {lvl}. krąg
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">Nie zużyto komórek czarów</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
