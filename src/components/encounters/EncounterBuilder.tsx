'use client';

import {
  AlertCircle,
  ArrowLeft,
  Check,
  Filter,
  Minus,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Skull,
  Swords,
  Trash2,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { DashboardCharacter } from '@/components/dashboard/types';
import type { Combatant } from '@/components/initiative/types';
import {
  calculateEncounterDifficulty,
  calculatePartyXpThresholds,
  getMonsterXp,
} from '@/lib/dnd-rules';
import type { MonsterData } from '@/lib/monsters';
import { DifficultyBadge } from './DifficultyBadge';
import type { EncounterMemberDraft, SavedEncounter } from './types';

interface EncounterBuilderProps {
  sessionId: string;
  monsters: MonsterData[];
  characters: DashboardCharacter[];
  onBackToCombat: () => void;
  onLoadCombatants: (combatants: Combatant[]) => void;
}

export function EncounterBuilder({
  sessionId,
  monsters,
  characters,
  onBackToCombat,
  onLoadCombatants,
}: EncounterBuilderProps) {
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [savedEncounters, setSavedEncounters] = useState<SavedEncounter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingEncounterId, setEditingEncounterId] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formMembers, setFormMembers] = useState<EncounterMemberDraft[]>([]);
  const [selectedMonsterIndex, setSelectedMonsterIndex] = useState('');
  const [addCount, setAddCount] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [crFilter, setCrFilter] = useState('all');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Fetch saved encounters
  const fetchEncounters = useCallback(async () => {
    if (!sessionId) return;
    try {
      setIsLoading(true);
      const res = await fetch(`/api/sessions/${sessionId}/encounters`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.encounters)) {
          setSavedEncounters(data.encounters);
        }
      }
    } catch (err) {
      console.warn('Failed to load encounters:', err);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchEncounters();
  }, [fetchEncounters]);

  // Active party character levels (default to HEROes if present, or all)
  const partyLevels = useMemo(() => {
    const heroes = characters.filter((c) => c.type === 'HERO');
    const targetGroup = heroes.length > 0 ? heroes : characters;
    if (targetGroup.length === 0) return [1];
    return targetGroup.map((c) => Math.max(1, Math.min(20, c.level ?? 1)));
  }, [characters]);

  // Current party XP thresholds
  const partyThresholds = useMemo(() => {
    return calculatePartyXpThresholds(partyLevels);
  }, [partyLevels]);

  // Filter monsters in selector
  const filteredMonsters = useMemo(() => {
    return monsters.filter((m) => {
      const matchesSearch =
        searchQuery.trim().length === 0 ||
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.index.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesCr = true;
      if (crFilter === '0-1') {
        matchesCr = m.challengeRating <= 1;
      } else if (crFilter === '2-4') {
        matchesCr = m.challengeRating >= 2 && m.challengeRating <= 4;
      } else if (crFilter === '5+') {
        matchesCr = m.challengeRating >= 5;
      }

      return matchesSearch && matchesCr;
    });
  }, [monsters, searchQuery, crFilter]);

  // Live encounter difficulty calculation for draft
  const currentDraftDifficulty = useMemo(() => {
    const expandedXps: number[] = [];
    for (const member of formMembers) {
      for (let i = 0; i < member.count; i++) {
        expandedXps.push(member.xp);
      }
    }
    return calculateEncounterDifficulty(expandedXps, partyLevels);
  }, [formMembers, partyLevels]);

  // Calculate difficulty for a saved encounter
  const getSavedEncounterDifficulty = useCallback(
    (encounter: SavedEncounter) => {
      const expandedXps: number[] = [];
      for (const member of encounter.members) {
        const matchedMonster =
          member.monster ||
          monsters.find((m) => m.index === member.apiMonsterId || m.id === member.monsterId);
        const xp = getMonsterXp(matchedMonster ?? undefined);
        for (let i = 0; i < member.count; i++) {
          expandedXps.push(xp);
        }
      }
      return calculateEncounterDifficulty(expandedXps, partyLevels);
    },
    [monsters, partyLevels]
  );

  // Add monster to draft
  const handleAddMonsterToDraft = () => {
    if (!selectedMonsterIndex) return;
    const target = monsters.find((m) => m.index === selectedMonsterIndex);
    if (!target) return;

    const countToAdd = Math.max(1, Math.floor(addCount));
    const xp = getMonsterXp(target);

    setFormMembers((prev) => {
      const existingIdx = prev.findIndex((item) => item.monsterIndex === target.index);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          count: updated[existingIdx].count + countToAdd,
        };
        return updated;
      }
      return [
        ...prev,
        {
          monsterIndex: target.index,
          monsterName: target.name,
          count: countToAdd,
          cr: target.challengeRating,
          xp,
          hp: target.hitPoints,
          ac: target.armorClass,
          monsterId: target.id ?? null,
        },
      ];
    });

    setAddCount(1);
    setErrorMessage(null);
  };

  // Modify draft member count
  const handleUpdateDraftCount = (index: number, delta: number) => {
    setFormMembers((prev) => {
      const updated = [...prev];
      const newCount = updated[index].count + delta;
      if (newCount <= 0) {
        return updated.filter((_, i) => i !== index);
      }
      updated[index] = { ...updated[index], count: newCount };
      return updated;
    });
  };

  const handleRemoveDraftMember = (index: number) => {
    setFormMembers((prev) => prev.filter((_, i) => i !== index));
  };

  // Start new encounter form
  const handleStartCreate = () => {
    setEditingEncounterId(null);
    setFormName('');
    setFormMembers([]);
    setSelectedMonsterIndex('');
    setAddCount(1);
    setErrorMessage(null);
    setStatusMessage(null);
    setViewMode('form');
  };

  // Edit existing encounter
  const handleStartEdit = (encounter: SavedEncounter) => {
    setEditingEncounterId(encounter.id);
    setFormName(encounter.name);

    const drafts: EncounterMemberDraft[] = encounter.members.map((mem) => {
      const matched =
        mem.monster || monsters.find((m) => m.index === mem.apiMonsterId || m.id === mem.monsterId);
      const name = matched?.name || mem.apiMonsterId || 'Potwór';
      const cr = matched?.challengeRating ?? 0;
      const xp = getMonsterXp(matched ?? undefined);
      const hp = matched?.hitPoints ?? 10;
      const ac = matched?.armorClass ?? 10;

      return {
        monsterIndex: mem.apiMonsterId || matched?.index || 'custom',
        monsterName: name,
        count: mem.count,
        cr,
        xp,
        hp,
        ac,
        monsterId: mem.monsterId,
      };
    });

    setFormMembers(drafts);
    setErrorMessage(null);
    setStatusMessage(null);
    setViewMode('form');
  };

  // Save encounter to backend
  const handleSaveEncounter = async (andLoadIntoCombat = false) => {
    if (!formName.trim()) {
      setErrorMessage('Nazwa potyczki jest wymagana');
      return;
    }
    if (formMembers.length === 0) {
      setErrorMessage('Dodaj przynajmniej jednego przeciwnika do potyczki');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const payload = {
        name: formName.trim(),
        members: formMembers.map((m) => ({
          apiMonsterId: m.monsterIndex,
          monsterId: m.monsterId,
          count: m.count,
        })),
      };

      let savedResult: SavedEncounter | null = null;

      if (editingEncounterId) {
        const res = await fetch(`/api/encounters/${editingEncounterId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Błąd aktualizacji potyczki');
        }
        savedResult = data.encounter;
        setSavedEncounters((prev) =>
          prev.map((item) => (item.id === editingEncounterId ? data.encounter : item))
        );
      } else {
        const res = await fetch(`/api/sessions/${sessionId}/encounters`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Błąd tworzenia potyczki');
        }
        savedResult = data.encounter;
        setSavedEncounters((prev) => [data.encounter, ...prev]);
      }

      setStatusMessage('Potyczka zapisana pomyślnie!');

      if (andLoadIntoCombat && savedResult) {
        handleLoadEncounterIntoCombat(savedResult);
      } else {
        setViewMode('list');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Nie udało się zapisać potyczki';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete saved encounter
  const handleDeleteEncounter = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć tę potyczkę?')) return;
    try {
      const res = await fetch(`/api/encounters/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSavedEncounters((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.warn('Failed to delete encounter:', err);
    }
  };

  // Convert encounter members to combatants and load into initiative
  const handleLoadEncounterIntoCombat = (encounter: SavedEncounter) => {
    const newCombatants: Combatant[] = [];

    for (const member of encounter.members) {
      const matched =
        member.monster ||
        monsters.find((m) => m.index === member.apiMonsterId || m.id === member.monsterId);
      const baseName = matched?.name || member.apiMonsterId || 'Potwór';
      const hp = matched?.hitPoints ?? 10;
      const ac = matched?.armorClass ?? 10;
      const dex = matched?.stats?.dex ?? 10;
      const dexMod = Math.floor((dex - 10) / 2);

      for (let i = 1; i <= member.count; i++) {
        const initRoll = Math.floor(Math.random() * 20) + 1 + dexMod;
        const displayName = member.count > 1 ? `${baseName} #${i}` : baseName;

        newCombatants.push({
          id: `enc-mon-${member.id || baseName}-${i}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: displayName,
          initiative: initRoll,
          currentHp: hp,
          maxHp: hp,
          ac,
          isMonster: true,
          type: baseName,
          conditions: [],
        });
      }
    }

    onLoadCombatants(newCombatants);
    onBackToCombat();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation */}
      <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToCombat}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              title="Powrót do walki"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Skull className="w-5 h-5 text-amber-500" />
                <span>Kreator Potyczek (Encounter Builder)</span>
              </h2>
              <p className="text-xs text-slate-400">
                Planowanie walki, kalkulator trudności DMG i szybkie ładowanie do Inicjatywy
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {viewMode === 'list' ? (
              <button
                type="button"
                data-testid="new-encounter-btn"
                onClick={handleStartCreate}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nowa Potyczka</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition cursor-pointer"
              >
                Anuluj edycję
              </button>
            )}
          </div>
        </div>

        {/* Active Party Summary Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span>
              Aktywna drużyna:{' '}
              <strong className="text-slate-200">{partyLevels.length} bohaterów</strong> (Poziomy:{' '}
              {partyLevels.join(', ')})
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono">
            <span>Łatwa: {partyThresholds.easy} XP</span>
            <span>Średnia: {partyThresholds.medium} XP</span>
            <span>Trudna: {partyThresholds.hard} XP</span>
            <span>Śmiertelna: {partyThresholds.deadly} XP</span>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW MODE: LIST (Zapisane Potyczki)                                      */}
      {/* ========================================================================= */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
              <Swords className="w-4 h-4 text-indigo-400" />
              <span>Zapisane Zestawy ({savedEncounters.length})</span>
            </h3>
            <button
              type="button"
              onClick={fetchEncounters}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer transition"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Odśwież</span>
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="glass-card rounded-2xl p-5 border border-slate-800 animate-pulse space-y-3"
                >
                  <div className="h-5 bg-slate-800 rounded w-1/3" />
                  <div className="h-4 bg-slate-800/60 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : savedEncounters.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center text-slate-400 space-y-3 border border-slate-800">
              <Skull className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm">Brak zapisanych grup potyczkowych dla tej sesji.</p>
              <button
                type="button"
                onClick={handleStartCreate}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Stwórz pierwszą potyczkę</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {savedEncounters.map((enc) => {
                const diff = getSavedEncounterDifficulty(enc);
                const totalMonsters = enc.members.reduce((acc, m) => acc + m.count, 0);

                return (
                  <div
                    key={enc.id}
                    data-testid={`encounter-card-${enc.id}`}
                    className="glass-card rounded-2xl p-5 border border-slate-800 hover:border-slate-700 transition space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-slate-100 text-base">{enc.name}</h4>
                        <p className="text-xs text-slate-400">
                          {totalMonsters} {totalMonsters === 1 ? 'przeciwnik' : 'przeciwników'} •
                          Bazowe XP: {diff.totalXp} XP • Mnożnik: {diff.multiplier}x
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <DifficultyBadge
                          difficulty={diff.difficulty}
                          adjustedXp={diff.adjustedXp}
                        />
                      </div>
                    </div>

                    {/* Member chips */}
                    <div className="flex flex-wrap gap-2">
                      {enc.members.map((mem) => {
                        const m =
                          mem.monster ||
                          monsters.find(
                            (item) => item.index === mem.apiMonsterId || item.id === mem.monsterId
                          );
                        const name = m?.name || mem.apiMonsterId || 'Przeciwnik';
                        return (
                          <span
                            key={mem.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-slate-900 border border-slate-800 text-slate-300 font-mono"
                          >
                            <span>{name}</span>
                            <span className="text-amber-400 font-bold">x{mem.count}</span>
                          </span>
                        );
                      })}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(enc)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Edytuj</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteEncounter(enc.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 text-xs transition cursor-pointer"
                          title="Usuń potyczkę"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        data-testid="load-encounter-btn"
                        onClick={() => handleLoadEncounterIntoCombat(enc)}
                        className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shadow-md shadow-amber-600/20 cursor-pointer"
                      >
                        <Swords className="w-4 h-4" />
                        <span>Załaduj do Inicjatywy</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW MODE: FORM / BUILDER                                                */}
      {/* ========================================================================= */}
      {viewMode === 'form' && (
        <div className="space-y-6">
          {/* Encounter Name Input */}
          <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Nazwa Zestawu Potyczki *
            </label>
            <input
              type="text"
              data-testid="encounter-name-input"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="np. Zasadzka Goblinów w Starym Lesie"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Live Difficulty Meter */}
          <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-slate-100 flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  <span>Kalkulator Trudności Potyczki (DMG)</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Łącznie przeciwników:{' '}
                  <strong className="text-slate-200">
                    {formMembers.reduce((acc, m) => acc + m.count, 0)}
                  </strong>
                </p>
              </div>

              <DifficultyBadge
                difficulty={currentDraftDifficulty.difficulty}
                adjustedXp={currentDraftDifficulty.adjustedXp}
                className="text-sm px-3.5 py-1.5"
              />
            </div>

            {/* XP Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Bazowe XP
                </span>
                <span className="text-sm font-bold font-mono text-slate-200">
                  {currentDraftDifficulty.totalXp} XP
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Mnożnik
                </span>
                <span className="text-sm font-bold font-mono text-indigo-400">
                  {currentDraftDifficulty.multiplier}x
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Skorygowane XP
                </span>
                <span className="text-sm font-bold font-mono text-amber-400">
                  {currentDraftDifficulty.adjustedXp} XP
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Budżet Śmiertelny
                </span>
                <span className="text-sm font-bold font-mono text-red-400">
                  {partyThresholds.deadly} XP
                </span>
              </div>
            </div>
          </div>

          {/* Current Selected Monsters in Draft */}
          <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
            <h4 className="font-bold text-slate-100 flex items-center justify-between text-sm">
              <span>Wybrani Przeciwnicy ({formMembers.length})</span>
              <span className="text-xs text-slate-400 font-normal">
                Dostosuj liczebność przeciwników w grupie
              </span>
            </h4>

            {formMembers.length === 0 ? (
              <div className="p-6 text-center text-slate-400 rounded-xl bg-slate-900/50 border border-slate-800/80">
                <p className="text-xs">
                  Brak przeciwników w zestawie. Dodaj potwory z Bestiariusza poniżej.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {formMembers.map((member, idx) => (
                  <div
                    key={member.monsterIndex}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800"
                  >
                    <div>
                      <span className="font-bold text-slate-200 text-sm block">
                        {member.monsterName}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        CR {member.cr} • {member.xp} XP/szt. • HP {member.hp} • AC {member.ac}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Count Stepper */}
                      <div className="flex items-center rounded-lg bg-slate-800 border border-slate-700">
                        <button
                          type="button"
                          onClick={() => handleUpdateDraftCount(idx, -1)}
                          className="p-1.5 text-slate-400 hover:text-slate-100 transition cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2.5 text-xs font-bold font-mono text-slate-100">
                          {member.count}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateDraftCount(idx, 1)}
                          className="p-1.5 text-slate-400 hover:text-slate-100 transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="text-xs font-mono font-semibold text-slate-300 w-16 text-right">
                        {member.count * member.xp} XP
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemoveDraftMember(idx)}
                        className="p-1.5 text-slate-500 hover:text-red-400 transition cursor-pointer"
                        title="Usuń"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add from Bestiary Picker */}
          <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
            <h4 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <Skull className="w-4 h-4 text-amber-500" />
              <span>Dodaj z Bestiariusza (D&D 5e API)</span>
            </h4>

            {/* Search and CR filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filtruj po nazwie potwora..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                {['all', '0-1', '2-4', '5+'].map((cr) => (
                  <button
                    key={cr}
                    type="button"
                    onClick={() => setCrFilter(cr)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      crFilter === cr
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cr === 'all' ? 'Wszystkie CR' : `CR ${cr}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Selector dropdown and Add button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <select
                data-testid="monster-select"
                value={selectedMonsterIndex}
                onChange={(e) => setSelectedMonsterIndex(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="">-- Wybierz Przeciwnika ({filteredMonsters.length}) --</option>
                {filteredMonsters.map((m) => (
                  <option key={m.index} value={m.index}>
                    {m.name} (CR {m.challengeRating}, {getMonsterXp(m)} XP, HP {m.hitPoints}, AC{' '}
                    {m.armorClass})
                  </option>
                ))}
              </select>

              {/* Add Quantity Stepper */}
              <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 px-2">
                <button
                  type="button"
                  onClick={() => setAddCount((c) => Math.max(1, c - 1))}
                  className="p-1.5 text-slate-400 hover:text-slate-100 cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={addCount}
                  onChange={(e) => setAddCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-12 text-center bg-transparent text-xs font-bold font-mono text-slate-100 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setAddCount((c) => c + 1)}
                  className="p-1.5 text-slate-400 hover:text-slate-100 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                data-testid="add-monster-btn"
                onClick={handleAddMonsterToDraft}
                disabled={!selectedMonsterIndex}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs transition whitespace-nowrap cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Dodaj do grupy</span>
              </button>
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition cursor-pointer w-full sm:w-auto"
            >
              Anuluj
            </button>

            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                data-testid="save-encounter-btn"
                disabled={isSubmitting}
                onClick={() => handleSaveEncounter(false)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs transition shadow-lg shadow-indigo-600/30 cursor-pointer w-full sm:w-auto text-center"
              >
                {isSubmitting ? 'Zapisywanie...' : 'Zapisz Potyczkę'}
              </button>

              <button
                type="button"
                data-testid="save-and-load-btn"
                disabled={isSubmitting}
                onClick={() => handleSaveEncounter(true)}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-slate-950 font-bold text-xs transition shadow-lg shadow-amber-600/30 cursor-pointer w-full sm:w-auto flex items-center justify-center gap-1.5"
              >
                <Swords className="w-4 h-4" />
                <span>Zapisz i Załaduj do Walki</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
