'use client';

import { Clock, Dices, FileText, Flame, History, Moon, Swords, Wand2 } from 'lucide-react';
import { useState } from 'react';
import type { DashboardLog, SessionLogType } from './types';

interface TimelineSidebarProps {
  logs: DashboardLog[];
  selectedLogId: string | null;
  onSelectLog: (log: DashboardLog) => void;
  gmNotes: string;
  onChangeGmNotes: (notes: string) => void;
}

export function TimelineSidebar({
  logs,
  selectedLogId,
  onSelectLog,
  gmNotes,
  onChangeGmNotes,
}: TimelineSidebarProps) {
  const [quickRollResult, setQuickRollResult] = useState<{
    die: string;
    result: number;
  } | null>(null);

  const handleQuickRoll = (sides: number) => {
    const result = Math.floor(Math.random() * sides) + 1;
    setQuickRollResult({ die: `d${sides}`, result });
  };

  const getLogBadge = (type: SessionLogType) => {
    switch (type) {
      case 'REST_SHORT':
      case 'REST_LONG':
        return {
          icon: Moon,
          color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
          label: 'Odpoczynek',
        };
      case 'COMBAT_END':
        return {
          icon: Swords,
          color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
          label: 'Koniec walki',
        };
      case 'SPELL_CAST':
        return {
          icon: Wand2,
          color: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
          label: 'Zaklęcie',
        };
      case 'COMBAT_ACTION':
        return {
          icon: Flame,
          color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
          label: 'Akcja',
        };
      default:
        return {
          icon: FileText,
          color: 'text-slate-400 bg-slate-500/10 border-slate-500/30',
          label: 'Notatka',
        };
    }
  };

  const formatLogTime = (dateVal: string | Date) => {
    try {
      const d = typeof dateVal === 'string' ? new Date(dateVal) : dateVal;
      return new Intl.DateTimeFormat('pl-PL', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    } catch {
      return '';
    }
  };

  return (
    <aside
      aria-label="Panel Historii i Szybkich Rzutów"
      className="glass-panel rounded-2xl p-4 flex flex-col gap-5 border border-slate-800/80 shadow-xl h-full"
    >
      {/* 1. Quick Dice Roller Section */}
      <div className="space-y-2.5 pb-4 border-b border-slate-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Dices className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
              Szybkie Rzuty Kośćmi
            </h2>
          </div>
          {quickRollResult && (
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
              {quickRollResult.die}: {quickRollResult.result}
            </span>
          )}
        </div>

        <div className="grid grid-cols-4 gap-1.5 font-mono text-xs">
          {[4, 6, 8, 10, 12, 20, 100].map((sides) => (
            <button
              key={sides}
              type="button"
              onClick={() => handleQuickRoll(sides)}
              className="py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-amber-300 font-bold transition-all text-center active:scale-95 cursor-pointer"
            >
              d{sides}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleQuickRoll(20)}
            className="py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 font-bold transition-all text-center active:scale-95 cursor-pointer"
            title="Szybki test ataku lub cechy (d20)"
          >
            D20!
          </button>
        </div>
      </div>

      {/* 2. GM Notes Section */}
      <div className="space-y-2 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-slate-400" />
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Podręczne Notatki GM-a
          </h3>
        </div>
        <textarea
          value={gmNotes}
          onChange={(e) => onChangeGmNotes(e.target.value)}
          placeholder="Zanotuj ważne fakty, wskazówki fabularne lub stan środowiska..."
          rows={3}
          className="w-full text-xs p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-indigo-500/60 focus:outline-none text-slate-200 placeholder-slate-500 resize-none font-sans"
        />
      </div>

      {/* 3. Session Timeline / Event Logs */}
      <div className="flex-1 flex flex-col min-h-0 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <History className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
              Oś Czasu Sesji
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {logs.length > 0 ? `Ostatnie ${logs.length}` : 'Pusta'}
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="glass-card rounded-xl p-4 text-center text-slate-400 space-y-1 my-auto">
            <Clock className="w-6 h-6 mx-auto text-slate-600" />
            <p className="text-xs font-medium">Brak zdarzeń na osi czasu.</p>
            <p className="text-[10px] text-slate-500">
              Akcje walki, zaklęcia i odpoczynki pojawią się tutaj automatycznie.
            </p>
          </div>
        ) : (
          <div className="overflow-y-auto space-y-2 pr-1 flex-1 max-h-96">
            {logs.map((log) => {
              const badge = getLogBadge(log.logType);
              const Icon = badge.icon;
              const isSelected = selectedLogId === log.id;

              return (
                <button
                  key={log.id}
                  type="button"
                  onClick={() => onSelectLog(log)}
                  className={`w-full text-left p-2 rounded-xl transition-all border cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600/15 border-indigo-500/60 ring-1 ring-indigo-500/50 shadow-md'
                      : 'glass-card hover:bg-slate-800/40 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5 mb-1">
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${badge.color}`}
                    >
                      <Icon className="w-2.5 h-2.5" />
                      <span>{badge.label}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatLogTime(log.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {log.description}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
