'use client';

import {
  Clock,
  Dices,
  FileText,
  Filter,
  Flame,
  History,
  Moon,
  Plus,
  Sparkles,
  Swords,
  Wand2,
} from 'lucide-react';
import { useState } from 'react';
import type { MonsterData } from '@/lib/monsters';
import { AddCombatantsPanel } from '../initiative/AddCombatantsPanel';
import { CombatLogWidget } from '../initiative/CombatLogWidget';
import type { Combatant, CombatLogEntry } from '../initiative/types';
import { AddNoteModal } from './AddNoteModal';
import { LongRestModal } from './LongRestModal';
import { ShortRestModal } from './ShortRestModal';
import type {
  CenterWorkspaceView,
  DashboardCharacter,
  DashboardLog,
  SessionLogType,
} from './types';

export type TimelineFilter = 'all' | 'rests' | 'combat' | 'spells' | 'notes';

interface TimelineSidebarProps {
  logs: DashboardLog[];
  selectedLogId: string | null;
  onSelectLog: (log: DashboardLog) => void;
  gmNotes: string;
  onChangeGmNotes: (notes: string) => void;
  activeWorkspace?: CenterWorkspaceView;
  monsters?: MonsterData[];
  onAddCombatant?: (combatant: Combatant) => void;
  combatantsCountForType?: (type: string) => number;
  combatLogEntries?: CombatLogEntry[];
  onClearCombatLog?: () => void;
  sessionId?: string;
  heroes?: DashboardCharacter[];
  onRestComplete?: (updatedCharacters: DashboardCharacter[], newLog: DashboardLog) => void;
  onAddSessionLog?: (newLog: DashboardLog) => void;
}

export type SidebarTab = 'all' | 'timeline' | 'tactics';

export function TimelineSidebar({
  logs,
  selectedLogId,
  onSelectLog,
  gmNotes,
  onChangeGmNotes,
  activeWorkspace = 'combat',
  monsters,
  onAddCombatant,
  combatantsCountForType,
  combatLogEntries,
  onClearCombatLog,
  sessionId,
  heroes = [],
  onRestComplete,
  onAddSessionLog,
}: TimelineSidebarProps) {
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('all');
  const [quickRollResult, setQuickRollResult] = useState<{
    die: string;
    result: number;
  } | null>(null);

  const [activeFilter, setActiveFilter] = useState<TimelineFilter>('all');
  const [isLongRestOpen, setIsLongRestOpen] = useState(false);
  const [isShortRestOpen, setIsShortRestOpen] = useState(false);
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);

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
          label: type === 'REST_LONG' ? 'Długi Odpoczynek' : 'Krótki Odpoczynek',
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

  const filteredLogs = logs.filter((log) => {
    if (activeFilter === 'rests') {
      return log.logType === 'REST_SHORT' || log.logType === 'REST_LONG';
    }
    if (activeFilter === 'combat') {
      return log.logType === 'COMBAT_END' || log.logType === 'COMBAT_ACTION';
    }
    if (activeFilter === 'spells') {
      return log.logType === 'SPELL_CAST';
    }
    if (activeFilter === 'notes') {
      return log.logType === 'CUSTOM_NOTE';
    }
    return true;
  });

  return (
    <aside
      aria-label="Panel Historii i Szybkich Rzutów"
      className="glass-panel rounded-2xl p-4 flex flex-col gap-4 border border-slate-800/80 shadow-xl max-h-[85vh] lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] overflow-y-auto"
    >
      {/* 0. Top View Switcher Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-900/90 border border-slate-800 rounded-xl shrink-0">
        <button
          type="button"
          data-testid="sidebar-tab-timeline"
          onClick={() => setSidebarTab('timeline')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
            sidebarTab === 'timeline'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-3.5 h-3.5 text-indigo-300" />
          <span>Oś Czasu</span>
          {logs.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
              {logs.length}
            </span>
          )}
        </button>

        {activeWorkspace === 'combat' && (
          <button
            type="button"
            data-testid="sidebar-tab-tactics"
            onClick={() => setSidebarTab('tactics')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              sidebarTab === 'tactics'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Swords className="w-3.5 h-3.5 text-amber-400" />
            <span>Taktyka Walki</span>
          </button>
        )}

        <button
          type="button"
          data-testid="sidebar-tab-all"
          onClick={() => setSidebarTab('all')}
          className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer ${
            sidebarTab === 'all'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Pokaż wszystkie sekcje w jednym panelu"
        >
          <span>Wszystko</span>
        </button>
      </div>

      {/* 1. Quick Dice Roller Section */}
      {(sidebarTab === 'all' || sidebarTab === 'tactics') && (
        <div className="space-y-2.5 pb-4 border-b border-slate-800/80 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Dices className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono">
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
      )}

      {/* 2. Combat Tactics: Add Combatants & Combat Chronicle (when in combat workspace) */}
      {(sidebarTab === 'all' || sidebarTab === 'tactics') &&
        activeWorkspace === 'combat' &&
        onAddCombatant &&
        monsters && (
          <div className="space-y-4 pb-4 border-b border-slate-800/80 shrink-0">
            <AddCombatantsPanel
              monsters={monsters}
              onAddCombatant={onAddCombatant}
              existingCombatantCountForType={combatantsCountForType ?? (() => 0)}
            />

            {combatLogEntries && (
              <CombatLogWidget entries={combatLogEntries} onClear={onClearCombatLog} />
            )}
          </div>
        )}

      {/* 3. GM Notes Section */}
      {(sidebarTab === 'all' || sidebarTab === 'timeline') && (
        <div className="space-y-2 pb-4 border-b border-slate-800/80 shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
              Podręczne Notatki GM-a
            </h3>
          </div>
          <textarea
            value={gmNotes}
            onChange={(e) => onChangeGmNotes(e.target.value)}
            placeholder="Zanotuj ważne fakty, wskazówki fabularne lub stan środowiska..."
            rows={2}
            className="w-full text-xs p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-indigo-500/60 focus:outline-none text-slate-200 placeholder-slate-500 resize-none font-sans"
          />
        </div>
      )}

      {/* 4. Session Timeline & Rest Actions (Chunk 7.2) */}
      {(sidebarTab === 'all' || sidebarTab === 'timeline') && (
        <div className="flex flex-col space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <History className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono">
                Oś Czasu Sesji
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-mono">
                {filteredLogs.length > 0 ? `${filteredLogs.length} wpisów` : 'Pusta'}
              </span>
              {sidebarTab === 'all' && (
                <button
                  type="button"
                  onClick={() => setSidebarTab('timeline')}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium hover:underline cursor-pointer"
                  title="Rozwiń na pełny widok osi czasu"
                >
                  Tylko oś ➔
                </button>
              )}
            </div>
          </div>

          {/* Rest & Note Quick Triggers */}
          {sessionId && (
            <div className="grid grid-cols-3 gap-1.5 text-[11px] font-semibold">
              <button
                type="button"
                data-testid="open-short-rest-btn"
                onClick={() => setIsShortRestOpen(true)}
                className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-800/50 text-purple-200 hover:text-white transition cursor-pointer"
                title="Krótki Odpoczynek (1h) - wydawanie kości życia"
              >
                <Moon className="w-3 h-3 text-purple-400" />
                <span>Krótki (1h)</span>
              </button>

              <button
                type="button"
                data-testid="open-long-rest-btn"
                onClick={() => setIsLongRestOpen(true)}
                className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-800/50 text-indigo-200 hover:text-white transition cursor-pointer"
                title="Długi Odpoczynek (8h) - regeneracja 100% HP i slotów"
              >
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span>Długi (8h)</span>
              </button>

              <button
                type="button"
                data-testid="open-add-note-btn"
                onClick={() => setIsAddNoteOpen(true)}
                className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-amber-950/30 hover:bg-amber-900/40 border border-amber-800/40 text-amber-200 hover:text-amber-100 transition cursor-pointer"
                title="Dodaj notatkę fabularną do kroniki sesji"
              >
                <Plus className="w-3 h-3 text-amber-400" />
                <span>Notatka</span>
              </button>
            </div>
          )}

          {/* Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] font-mono no-scrollbar">
            <Filter className="w-3 h-3 text-slate-500 shrink-0" />
            {(
              [
                { id: 'all', label: 'Wszystkie' },
                { id: 'rests', label: 'Odpoczynki' },
                { id: 'combat', label: 'Walki' },
                { id: 'spells', label: 'Zaklęcia' },
                { id: 'notes', label: 'Notatki' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id)}
                className={`px-2 py-0.5 rounded-md whitespace-nowrap transition cursor-pointer ${
                  activeFilter === f.id
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Logs List */}
          {filteredLogs.length === 0 ? (
            <div className="glass-card rounded-xl p-4 text-center text-slate-400 space-y-1 my-auto">
              <Clock className="w-6 h-6 mx-auto text-slate-600" />
              <p className="text-xs font-medium">Brak zdarzeń na osi czasu.</p>
              <p className="text-[10px] text-slate-500">
                {activeFilter !== 'all'
                  ? 'Brak zdarzeń dla wybranego filtra.'
                  : 'Akcje walki, zaklęcia i odpoczynki pojawią się tutaj automatycznie.'}
              </p>
            </div>
          ) : (
            <div
              className={`space-y-2 pr-1 overflow-y-auto ${
                sidebarTab === 'timeline'
                  ? 'max-h-[calc(100vh-22rem)] min-h-[220px]'
                  : 'max-h-80 min-h-[160px]'
              }`}
            >
              {filteredLogs.map((log) => {
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
      )}

      {/* Rest & Note Modals */}
      {sessionId && (
        <>
          <LongRestModal
            isOpen={isLongRestOpen}
            onClose={() => setIsLongRestOpen(false)}
            sessionId={sessionId}
            heroes={heroes}
            onRestComplete={(updated, newLog) => {
              onRestComplete?.(updated, newLog);
            }}
          />

          <ShortRestModal
            isOpen={isShortRestOpen}
            onClose={() => setIsShortRestOpen(false)}
            sessionId={sessionId}
            heroes={heroes}
            onRestComplete={(updated, newLog) => {
              onRestComplete?.(updated, newLog);
            }}
          />

          <AddNoteModal
            isOpen={isAddNoteOpen}
            onClose={() => setIsAddNoteOpen(false)}
            sessionId={sessionId}
            onNoteAdded={(newLog) => {
              onAddSessionLog?.(newLog);
            }}
          />
        </>
      )}
    </aside>
  );
}
