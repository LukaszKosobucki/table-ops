'use client';

import { ArrowLeft, Clock, FileText, Flame, History, Moon, Swords, Wand2 } from 'lucide-react';
import type { DashboardLog, SessionLogType } from './types';

interface LogInspectionCardProps {
  log: DashboardLog;
  onBackToCombat: () => void;
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
        <p className="text-sm text-slate-200 leading-relaxed font-sans">{log.description}</p>
      </div>

      {/* Metadata payload (if provided) */}
      {log.metadata && Object.keys(log.metadata).length > 0 && (
        <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-2">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Szczegóły Techniczne / Wyniki
          </h3>
          <pre className="text-xs text-slate-300 bg-slate-950/80 p-3 rounded-lg overflow-x-auto font-mono border border-slate-800/80">
            {JSON.stringify(log.metadata, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
