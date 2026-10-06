import { AlertTriangle, Shield, ShieldCheck, Skull, Swords } from 'lucide-react';
import type { EncounterDifficulty } from '@/lib/dnd-rules';

interface DifficultyBadgeProps {
  difficulty: EncounterDifficulty;
  adjustedXp?: number;
  className?: string;
}

export function DifficultyBadge({ difficulty, adjustedXp, className = '' }: DifficultyBadgeProps) {
  switch (difficulty) {
    case 'deadly':
      return (
        <span
          data-testid="difficulty-badge-deadly"
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 border border-red-500/30 text-red-400 ${className}`}
        >
          <Skull className="w-3.5 h-3.5 text-red-400" />
          <span>Śmiertelna</span>
          {adjustedXp !== undefined && (
            <span className="font-mono text-[11px] text-red-300/80">({adjustedXp} XP)</span>
          )}
        </span>
      );

    case 'hard':
      return (
        <span
          data-testid="difficulty-badge-hard"
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-400 ${className}`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>Trudna</span>
          {adjustedXp !== undefined && (
            <span className="font-mono text-[11px] text-amber-300/80">({adjustedXp} XP)</span>
          )}
        </span>
      );

    case 'medium':
      return (
        <span
          data-testid="difficulty-badge-medium"
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/10 border border-sky-500/30 text-sky-400 ${className}`}
        >
          <Swords className="w-3.5 h-3.5 text-sky-400" />
          <span>Średnia</span>
          {adjustedXp !== undefined && (
            <span className="font-mono text-[11px] text-sky-300/80">({adjustedXp} XP)</span>
          )}
        </span>
      );

    case 'easy':
      return (
        <span
          data-testid="difficulty-badge-easy"
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 ${className}`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Łatwa</span>
          {adjustedXp !== undefined && (
            <span className="font-mono text-[11px] text-emerald-300/80">({adjustedXp} XP)</span>
          )}
        </span>
      );

    default:
      return (
        <span
          data-testid="difficulty-badge-trivial"
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-400 ${className}`}
        >
          <Shield className="w-3.5 h-3.5 text-slate-400" />
          <span>Trywialna</span>
          {adjustedXp !== undefined && (
            <span className="font-mono text-[11px] text-slate-400/80">({adjustedXp} XP)</span>
          )}
        </span>
      );
  }
}
