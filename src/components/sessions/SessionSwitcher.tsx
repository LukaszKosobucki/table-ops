'use client';

import { ChevronDown, FolderPlus, Sparkles, SwitchCamera } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { SessionItem } from './types';

interface SessionSwitcherProps {
  sessions: SessionItem[];
  activeSession: SessionItem | null;
  onSelectSession: (session: SessionItem) => void;
  onOpenSessionList: () => void;
  onOpenCreateModal?: () => void;
}

export function SessionSwitcher({
  sessions,
  activeSession,
  onSelectSession,
  onOpenSessionList,
  onOpenCreateModal,
}: SessionSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  if (!activeSession) {
    return (
      <button
        type="button"
        onClick={onOpenSessionList}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 text-xs font-medium transition-colors"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>Wybierz Sesję</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/80 hover:border-indigo-500/50 text-slate-200 text-xs font-medium transition-all shadow-sm max-w-[220px]"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50 shrink-0" />
        <span className="truncate">{activeSession.name}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 glass-panel rounded-xl border border-slate-800 p-1.5 shadow-xl shadow-black/50 z-50 animate-fadeIn space-y-1">
          <div className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Zmień aktywną sesję
          </div>

          <div className="max-h-48 overflow-y-auto space-y-0.5 custom-scrollbar">
            {sessions.map((session) => {
              const isActive = session.id === activeSession.id;
              return (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => {
                    onSelectSession(session);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <span className="truncate">{session.name}</span>
                  {isActive && (
                    <span className="text-[10px] text-indigo-400 font-mono">Aktywna</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-1 border-t border-slate-800/80 space-y-0.5">
            {onOpenCreateModal && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenCreateModal();
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-indigo-300 hover:bg-slate-800 flex items-center gap-2 transition-colors"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>+ Nowa sesja</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenSessionList();
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2 transition-colors"
            >
              <SwitchCamera className="w-3.5 h-3.5 text-amber-400" />
              <span>Wszystkie sesje (Lista)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
