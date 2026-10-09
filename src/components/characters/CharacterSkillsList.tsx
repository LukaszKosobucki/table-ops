'use client';

import { Dices, Sparkles } from 'lucide-react';
import { calculateProficiencyBonus } from '@/lib/dnd-rules';
import {
  calculateSkillModifier,
  DND_SKILLS,
  type SkillKey,
  type SkillProficiencyLevel,
} from '@/lib/skills-and-traits';

export interface CharacterSkillsListProps {
  skills?: Record<string, SkillProficiencyLevel>;
  stats?: {
    str?: number;
    dex?: number;
    con?: number;
    int?: number;
    wis?: number;
    cha?: number;
  } | null;
  level?: number;
  onSkillToggle?: (skillKey: SkillKey) => void;
  onRollSkill?: (skillKey: SkillKey, skillName: string, modifier: number) => void;
  readOnly?: boolean;
}

export function CharacterSkillsList({
  skills = {},
  stats,
  level = 1,
  onSkillToggle,
  onRollSkill,
  readOnly = false,
}: CharacterSkillsListProps) {
  const pb = calculateProficiencyBonus(level);

  return (
    <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Biegłości w Umiejętnościach
          </h3>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-bold">
            PB: +{pb}
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono">
          <span className="flex items-center gap-1">
            <span className="w-3.5 h-3.5 rounded-full border border-slate-700 bg-slate-900/60 inline-flex items-center justify-center text-[8px] text-slate-500">
              ○
            </span>
            Brak
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3.5 h-3.5 rounded-full border border-emerald-500/60 bg-emerald-500/20 inline-flex items-center justify-center text-[8px] text-emerald-400">
              ●
            </span>
            Biegłość (+{pb})
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3.5 h-3.5 rounded-full border border-amber-500/60 bg-amber-500/20 inline-flex items-center justify-center text-[8px] text-amber-300">
              ★
            </span>
            Ekspertyza (+{2 * pb})
          </span>
        </div>
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {DND_SKILLS.map((skill) => {
          const profLevel: SkillProficiencyLevel = skills[skill.key] || 'none';
          const statScore = stats?.[skill.ability] ?? 10;
          const modifier = calculateSkillModifier(statScore, profLevel, pb);
          const modStr = modifier >= 0 ? `+${modifier}` : `${modifier}`;

          return (
            <div
              key={skill.key}
              data-testid={`skill-row-${skill.key}`}
              className="bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800/80 hover:border-slate-700/80 rounded-xl px-2.5 py-1.5 flex items-center justify-between gap-2 transition"
            >
              <div className="flex items-center gap-2 min-w-0">
                {/* 3-Way Proficiency Toggle Button */}
                {!readOnly ? (
                  <button
                    type="button"
                    data-testid={`skill-toggle-${skill.key}`}
                    onClick={() => onSkillToggle?.(skill.key)}
                    title={`Stan: ${
                      profLevel === 'none'
                        ? 'Brak biegłości (kliknij, aby nadać biegłość)'
                        : profLevel === 'proficient'
                          ? 'Biegłość (kliknij, aby nadać ekspertyzę)'
                          : 'Ekspertyza (kliknij, aby usunąć)'
                    }`}
                    className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold transition transform active:scale-90 cursor-pointer border shrink-0 ${
                      profLevel === 'expertise'
                        ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-sm shadow-amber-500/20'
                        : profLevel === 'proficient'
                          ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-400'
                          : 'bg-slate-950/60 border-slate-700 text-slate-600 hover:text-slate-400'
                    }`}
                  >
                    {profLevel === 'expertise' ? '★' : profLevel === 'proficient' ? '●' : '○'}
                  </button>
                ) : (
                  <span
                    className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold border shrink-0 ${
                      profLevel === 'expertise'
                        ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                        : profLevel === 'proficient'
                          ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-400'
                          : 'bg-slate-950/60 border-slate-700 text-slate-600'
                    }`}
                  >
                    {profLevel === 'expertise' ? '★' : profLevel === 'proficient' ? '●' : '○'}
                  </span>
                )}

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-200 truncate">
                      {skill.name}
                    </span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 font-mono font-bold shrink-0">
                      {skill.abilityLabel}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 block truncate">{skill.nameEn}</span>
                </div>
              </div>

              {/* Modifier and Roll Button */}
              <div className="flex items-center gap-1 shrink-0">
                <span
                  className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
                    profLevel === 'expertise'
                      ? 'text-amber-300 bg-amber-500/10'
                      : profLevel === 'proficient'
                        ? 'text-emerald-300 bg-emerald-500/10'
                        : 'text-slate-300 bg-slate-800/40'
                  }`}
                >
                  {modStr}
                </span>

                {onRollSkill && (
                  <button
                    type="button"
                    data-testid={`skill-roll-${skill.key}`}
                    onClick={() => onRollSkill(skill.key, skill.name, modifier)}
                    title={`Rzuć d20 ${modStr} na ${skill.name}`}
                    className="p-1 rounded-lg bg-slate-900 hover:bg-indigo-600/30 text-indigo-400 hover:text-indigo-200 border border-slate-800 hover:border-indigo-500/40 transition cursor-pointer"
                  >
                    <Dices className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
