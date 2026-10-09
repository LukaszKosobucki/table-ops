'use client';

import { Dices, FileText, Sparkles } from 'lucide-react';

interface BottomDockProps {
  isNotesOpen: boolean;
  isNotesMinimized: boolean;
  onRestoreNotes: () => void;
  onToggleNotes?: () => void;
  hasNotesUrl: boolean;
  isDiceOpen?: boolean;
  isDiceMinimized?: boolean;
  onRestoreDice?: () => void;
  onToggleDice?: () => void;
}

export function BottomDock({
  isNotesOpen,
  isNotesMinimized,
  onRestoreNotes,
  onToggleNotes,
  hasNotesUrl,
  isDiceOpen,
  isDiceMinimized,
  onRestoreDice,
  onToggleDice,
}: BottomDockProps) {
  // If notes or dice are minimized, we render them as docked pills.
  return (
    <footer
      data-testid="bottom-dock"
      className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/85 backdrop-blur-md border-t border-slate-800/80 px-4 py-1.5 flex items-center justify-between text-xs transition-all pointer-events-auto"
    >
      {/* Left side: Active / Minimized windows */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 hidden sm:inline-flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500/70" />
          <span>TableOps GM Dock</span>
        </span>

        {/* Minimized or Active External Notes Window Pill */}
        {isNotesMinimized ? (
          <button
            type="button"
            data-testid="dock-minimized-notes-btn"
            onClick={onRestoreNotes}
            className="flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/70 border border-indigo-500/50 text-indigo-200 hover:text-white transition cursor-pointer shadow-sm animate-pulse"
            title="Kliknij, aby przywrócić okno zewnętrznych notatek"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold text-xs">Zewnętrzne Notatki</span>
            <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-sm shadow-indigo-400/80" />
          </button>
        ) : (
          <button
            type="button"
            data-testid="dock-notes-btn"
            onClick={isNotesOpen ? onRestoreNotes : onToggleNotes || onRestoreNotes}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition cursor-pointer text-xs ${
              isNotesOpen
                ? 'bg-slate-800/80 border-slate-700 text-slate-200 hover:text-white'
                : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Otwórz lub zminimalizuj okno zewnętrznych notatek"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>Notatki</span>
            {hasNotesUrl && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
          </button>
        )}
      </div>

      {/* Right side: Dice Roller launcher & Minimized Pill */}
      <div className="flex items-center gap-2">
        {isDiceMinimized ? (
          <button
            type="button"
            data-testid="dock-minimized-dice-btn"
            onClick={onRestoreDice}
            className="flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-950/60 hover:bg-amber-900/70 border border-amber-500/50 text-amber-200 hover:text-white transition cursor-pointer shadow-sm animate-pulse"
            title="Kliknij, aby przywrócić rzutnik kości"
          >
            <Dices className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold text-xs">Rzutnik Kości</span>
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400/80" />
          </button>
        ) : (
          <button
            type="button"
            data-testid="dock-dice-btn"
            onClick={onToggleDice}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition cursor-pointer text-xs ${
              isDiceOpen
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-200'
                : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800 text-slate-300 hover:text-amber-400'
            }`}
            title="Rzutnik kości (Skrót: D)"
          >
            <Dices className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-medium text-xs">Kości 3D</span>
          </button>
        )}
      </div>
    </footer>
  );
}
