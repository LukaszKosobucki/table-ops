'use client';

import { Eye, Shield, Skull, User, Users } from 'lucide-react';
import type { DashboardCharacter, HealthStatus } from './types';

interface PartySidebarProps {
  characters: DashboardCharacter[];
  selectedCharacterId: string | null;
  onSelectCharacter: (character: DashboardCharacter) => void;
}

export function getHealthStatus(currentHp: number, maxHp: number): HealthStatus {
  if (currentHp <= 0) return 'dead';
  const ratio = currentHp / (maxHp || 1);
  if (ratio <= 0.2) return 'critical';
  if (ratio <= 0.5) return 'bloodied';
  return 'healthy';
}

export function PartySidebar({
  characters,
  selectedCharacterId,
  onSelectCharacter,
}: PartySidebarProps) {
  const heroes = characters.filter((c) => c.type === 'HERO');
  const npcs = characters.filter((c) => c.type === 'NPC');

  return (
    <aside
      aria-label="Panel Drużyny i NPC"
      className="glass-panel rounded-2xl p-4 flex flex-col gap-4 border border-slate-800/80 shadow-xl h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 tracking-tight">Drużyna & NPC</h2>
            <p className="text-[11px] text-slate-400">
              {heroes.length} bohaterów • {npcs.length} NPC
            </p>
          </div>
        </div>
      </div>

      {characters.length === 0 ? (
        <div className="glass-card rounded-xl p-6 text-center text-slate-400 space-y-2">
          <User className="w-8 h-8 mx-auto text-slate-600" />
          <p className="text-xs">Brak postaci w tej sesji.</p>
          <p className="text-[11px] text-slate-500">
            Użyj kreatora postaci w górnym menu, aby dodać bohaterów.
          </p>
        </div>
      ) : (
        <div className="space-y-4 overflow-y-auto pr-1">
          {/* Heroes Section */}
          {heroes.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/80 px-1">
                Bohaterowie Graczy ({heroes.length})
              </span>
              <div className="space-y-2">
                {heroes.map((char) => (
                  <CharacterCard
                    key={char.id}
                    character={char}
                    isSelected={selectedCharacterId === char.id}
                    onSelect={() => onSelectCharacter(char)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* NPCs Section */}
          {npcs.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-800/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/80 px-1">
                Ważni NPC ({npcs.length})
              </span>
              <div className="space-y-2">
                {npcs.map((char) => (
                  <CharacterCard
                    key={char.id}
                    character={char}
                    isSelected={selectedCharacterId === char.id}
                    onSelect={() => onSelectCharacter(char)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}

function CharacterCard({
  character,
  isSelected,
  onSelect,
}: {
  character: DashboardCharacter;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const status = getHealthStatus(character.currentHp, character.maxHp);
  const hpPercent = Math.max(
    0,
    Math.min(100, Math.round((character.currentHp / (character.maxHp || 1)) * 100))
  );

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left p-2.5 rounded-xl transition-all border cursor-pointer ${
        isSelected
          ? 'bg-indigo-600/15 border-indigo-500/60 shadow-lg shadow-indigo-950/40 ring-1 ring-indigo-500/50'
          : 'glass-card hover:bg-slate-800/40 border-slate-800/80 hover:border-slate-700'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          {/* Avatar initial */}
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
              character.type === 'HERO'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
            }`}
          >
            {character.name.charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0">
            <h3 className="text-xs font-bold text-slate-100 truncate">{character.name}</h3>
            <p className="text-[10px] text-slate-400 truncate">
              {character.class || character.race || (character.type === 'HERO' ? 'Bohater' : 'NPC')}
              {character.level ? ` • Poz. ${character.level}` : ''}
            </p>
          </div>
        </div>

        {/* Vitality Indicator */}
        <div className="shrink-0 flex items-center gap-1.5">
          {status === 'dead' ? (
            <span
              title="Nieprzytomny / Martwy (0 HP)"
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-bold"
            >
              <Skull className="w-3 h-3 text-rose-400" />
              <span>0</span>
            </span>
          ) : status === 'critical' ? (
            <span
              title="Stan krytyczny (HP <= 20%)"
              className="relative flex h-2.5 w-2.5 items-center justify-center"
            >
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
            </span>
          ) : status === 'bloodied' ? (
            <span
              title="Ranny / Bloodied (HP <= 50%)"
              className="inline-block h-2 w-2 rounded-full bg-amber-400"
            />
          ) : (
            <span
              title="W pełni sił (Healthy)"
              className="inline-block h-2 w-2 rounded-full bg-emerald-400"
            />
          )}
        </div>
      </div>

      {/* Health Bar */}
      <div className="space-y-1 mt-2">
        <div className="flex justify-between text-[10px] font-mono">
          <span className="text-slate-400">HP</span>
          <span
            className={
              status === 'dead'
                ? 'text-rose-400 font-bold'
                : status === 'critical'
                  ? 'text-orange-400 font-bold'
                  : 'text-slate-200'
            }
          >
            {character.currentHp}/{character.maxHp}
          </span>
        </div>
        <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              status === 'dead'
                ? 'bg-rose-500'
                : status === 'critical'
                  ? 'bg-orange-500'
                  : status === 'bloodied'
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
            }`}
            style={{ width: `${hpPercent}%` }}
          />
        </div>
      </div>

      {/* AC and Perception Badges */}
      <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-slate-800/40 text-[10px] text-slate-400 font-mono">
        <div className="flex items-center gap-1" title="Klasa Pancerza (AC)">
          <Shield className="w-3 h-3 text-slate-400" />
          <span>AC {character.ac}</span>
        </div>
        <div className="flex items-center gap-1" title="Pasywna Percepcja">
          <Eye className="w-3 h-3 text-slate-400" />
          <span>PP {character.passivePerception}</span>
        </div>
      </div>
    </button>
  );
}
