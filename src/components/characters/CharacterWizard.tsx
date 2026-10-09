'use client';

import { ArrowLeft, Plus, Sparkles, Users } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CharacterInspectionCard } from '@/components/dashboard/CharacterInspectionCard';
import type { DashboardCharacter } from '@/components/dashboard/types';
import {
  calculateMaxHp,
  calculatePassivePerception,
  calculateSpellSlots,
  calculateUnarmoredAc,
  getClassHitDie,
  getDefaultClassEquipment,
} from '@/lib/dnd-rules';
import type { EquipmentItem } from '@/lib/inventory';
import type { SkillProficiencyLevel } from '@/lib/skills-and-traits';
import { CharacterCard } from './CharacterCard';
import { StepEquipmentSpells } from './StepEquipmentSpells';
import { StepIdentity } from './StepIdentity';
import { StepRaceClass } from './StepRaceClass';
import { StepStats } from './StepStats';
import { StepSummary } from './StepSummary';
import { type Character, type CharacterSpells, type CharacterStats, CLASSES, RACES } from './types';
import { WizardProgress } from './WizardProgress';

interface CharacterWizardProps {
  sessionId?: string;
  initialCharacters?: Character[];
  onCharacterCreated?: (character: Character) => void;
  onCharactersLoaded?: (characters: Character[]) => void;
}

export const DEFAULT_CHARACTERS: Character[] = [
  {
    id: 'c-1',
    name: 'Valerius z Ostrej Bieli',
    type: 'HERO',
    race: 'Człowiek (Human)',
    class: 'Paladyn (Paladin)',
    level: 3,
    hp: 28,
    maxHp: 28,
    ac: 18,
    passivePerception: 13,
    stats: { str: 16, dex: 10, con: 14, int: 10, wis: 12, cha: 14 },
    traits: ['Niezłomna wiara w sprawiedliwość'],
    inventory: ['Długi miecz +1', 'Tarcza herbowa', 'Płytowa zbroja'],
  },
  {
    id: 'c-2',
    name: 'Eldrin Srebrny Liść',
    type: 'HERO',
    race: 'Elf (Elf)',
    class: 'Czarodziej (Wizard)',
    level: 3,
    hp: 16,
    maxHp: 16,
    ac: 12,
    passivePerception: 14,
    stats: { str: 8, dex: 14, con: 12, int: 17, wis: 13, cha: 10 },
    traits: ['Ciekawski i analityczny'],
    inventory: ['Księga zaklęć', 'Różdżka magicznych pocisków'],
  },
];

export function CharacterWizard({
  sessionId = 'test',
  initialCharacters,
  onCharacterCreated,
  onCharactersLoaded,
}: CharacterWizardProps) {
  const [createdCharacters, setCreatedCharacters] = useState<Character[]>(initialCharacters || []);
  const [isLoadingCharacters, setIsLoadingCharacters] = useState<boolean>(
    !initialCharacters && Boolean(sessionId)
  );

  // View modes: default cards list, wizard creation, or detailed card inspection
  const [isCreating, setIsCreating] = useState<boolean>(
    !initialCharacters || initialCharacters.length === 0
  );
  const [inspectedCharacter, setInspectedCharacter] = useState<Character | null>(null);

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Wizard form state
  const [charName, setCharName] = useState('');
  const [charType, setCharType] = useState<'HERO' | 'NPC'>('HERO');
  const [selectedRace, setSelectedRace] = useState(RACES[0].name);
  const [selectedClass, setSelectedClass] = useState(CLASSES[0].name);
  const [level, setLevel] = useState(1);
  const [traits, setTraits] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [inventory, setInventory] = useState<string[]>(() =>
    getDefaultClassEquipment(CLASSES[0].name)
  );
  const [knownSpells, setKnownSpells] = useState<string[]>([]);
  const [skills, setSkills] = useState<Record<string, SkillProficiencyLevel>>({});
  const [isSaving, setIsSaving] = useState(false);

  const [stats, setStats] = useState<CharacterStats>({
    str: 15,
    dex: 14,
    con: 13,
    int: 12,
    wis: 10,
    cha: 8,
  });

  const onCharactersLoadedRef = useRef(onCharactersLoaded);
  useEffect(() => {
    onCharactersLoadedRef.current = onCharactersLoaded;
  }, [onCharactersLoaded]);

  const lastFetchedSessionIdRef = useRef<string | null>(null);

  // Fetch session characters on mount
  const fetchSessionCharacters = useCallback(async () => {
    if (!sessionId) {
      setIsLoadingCharacters(false);
      return;
    }
    try {
      const res = await fetch(`/api/sessions/${sessionId}/characters`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.characters)) {
          const mapped: Character[] = data.characters.map(
            (c: {
              id: string;
              sessionId: string;
              name: string;
              type?: 'HERO' | 'NPC';
              race?: string | null;
              class?: string | null;
              level?: number;
              currentHp?: number;
              maxHp?: number;
              ac?: number;
              passivePerception?: number;
              stats?: CharacterStats | null;
              traits?: string[] | null;
              inventory?: (string | EquipmentItem)[] | string[] | null;
              avatarUrl?: string | null;
              spells?: CharacterSpells | null;
              proficiencies?: Character['proficiencies'];
              defenses?: Character['defenses'];
            }) => ({
              id: c.id,
              sessionId: c.sessionId,
              name: c.name,
              type: c.type || 'HERO',
              race: c.race || 'Nieznana rasa',
              class: c.class || 'Klasa nieznana',
              level: c.level || 1,
              hp: c.currentHp ?? c.maxHp ?? 10,
              maxHp: c.maxHp ?? 10,
              currentHp: c.currentHp,
              ac: c.ac ?? 10,
              passivePerception: c.passivePerception ?? 10,
              stats: c.stats || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
              traits: Array.isArray(c.traits) ? c.traits : [],
              inventory: Array.isArray(c.inventory) ? c.inventory : [],
              avatarUrl: c.avatarUrl || null,
              spells: c.spells || null,
              proficiencies: c.proficiencies || null,
              defenses: c.defenses,
            })
          );
          setCreatedCharacters(mapped);
          onCharactersLoadedRef.current?.(mapped);
          // If we fetched characters, default view is the list of characters
          if (mapped.length > 0) {
            setIsCreating(false);
          }
        }
      }
    } catch {
      // Fallback
    } finally {
      setIsLoadingCharacters(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (initialCharacters) {
      setCreatedCharacters(initialCharacters);
      setIsLoadingCharacters(false);
      if (initialCharacters.length > 0) {
        setIsCreating(false);
      }
      return;
    }

    if (sessionId && lastFetchedSessionIdRef.current !== sessionId) {
      lastFetchedSessionIdRef.current = sessionId;
      fetchSessionCharacters();
    }
  }, [initialCharacters, sessionId, fetchSessionCharacters]);

  // D&D Rule Calculations
  const calculateHp = useCallback(() => {
    const hitDie = getClassHitDie(selectedClass);
    return calculateMaxHp(level, hitDie, stats.con);
  }, [selectedClass, level, stats.con]);

  const calculateAc = useCallback(() => {
    return calculateUnarmoredAc(stats.dex);
  }, [stats.dex]);

  const calculatePassive = useCallback(() => {
    return calculatePassivePerception(stats.wis);
  }, [stats.wis]);

  const handleFinishWizard = async () => {
    if (!charName.trim()) return;

    const hp = calculateHp();
    const ac = calculateAc();
    const pp = calculatePassive();
    const spellSlots = calculateSpellSlots(selectedClass, level);
    const hasSpells = Object.keys(spellSlots).length > 0;

    setIsSaving(true);

    const payload = {
      sessionId,
      name: charName.trim(),
      type: charType,
      race: selectedRace,
      class: selectedClass,
      level,
      maxHp: hp,
      currentHp: hp,
      ac,
      passivePerception: pp,
      stats: { ...stats, tempHp: 0 },
      traits: traits.trim() ? [traits.trim()] : [],
      inventory,
      avatarUrl: avatarUrl.trim() || null,
      proficiencies: {
        skills,
      },
      spells:
        hasSpells || knownSpells.length > 0
          ? { slots: spellSlots, known: knownSpells, prepared: [] }
          : null,
    };

    let newChar: Character = {
      id: `c-${Date.now()}`,
      ...payload,
      hp,
    };

    try {
      const res = await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.character) {
          newChar = {
            id: data.character.id,
            sessionId: data.character.sessionId,
            name: data.character.name,
            type: data.character.type,
            race: data.character.race || selectedRace,
            class: data.character.class || selectedClass,
            level: data.character.level,
            hp: data.character.currentHp,
            maxHp: data.character.maxHp,
            currentHp: data.character.currentHp,
            ac: data.character.ac,
            passivePerception: data.character.passivePerception,
            stats: (data.character.stats as CharacterStats) || stats,
            traits: (data.character.traits as string[]) || (traits ? [traits] : []),
            inventory: data.character.inventory || inventory,
            avatarUrl: data.character.avatarUrl || avatarUrl.trim() || null,
            proficiencies: data.character.proficiencies || { skills },
            spells:
              data.character.spells ||
              (knownSpells.length > 0
                ? { slots: spellSlots, known: knownSpells, prepared: [] }
                : null),
          };
        }
      }
    } catch {
      // Local fallback in case network/offline error
    } finally {
      setIsSaving(false);
      setCreatedCharacters((prev) => [newChar, ...prev]);
      onCharacterCreated?.(newChar);
      setStep(1);
      setCharName('');
      setTraits('');
      setAvatarUrl('');
      setSkills({});
      setIsCreating(false);
    }
  };

  const toDashboardCharacter = (c: Character): DashboardCharacter => ({
    id: c.id,
    sessionId: c.sessionId,
    name: c.name,
    type: (c.type || 'HERO') as 'HERO' | 'NPC',
    race: c.race,
    class: c.class,
    level: c.level,
    currentHp: c.currentHp ?? c.hp,
    maxHp: c.maxHp,
    ac: c.ac,
    passivePerception: c.passivePerception,
    avatarUrl: c.avatarUrl,
    stats: c.stats,
    traits: c.traits,
    inventory: c.inventory,
    spells: c.spells,
    proficiencies: c.proficiencies,
    defenses: c.defenses,
  });

  const handleUpdateFromInspection = (updatedDash: DashboardCharacter) => {
    const updated: Character = {
      id: updatedDash.id,
      sessionId: updatedDash.sessionId || undefined,
      name: updatedDash.name,
      type: updatedDash.type,
      race: updatedDash.race || '',
      class: updatedDash.class || '',
      level: updatedDash.level || 1,
      hp: updatedDash.currentHp,
      maxHp: updatedDash.maxHp,
      currentHp: updatedDash.currentHp,
      ac: updatedDash.ac,
      passivePerception: updatedDash.passivePerception,
      avatarUrl: updatedDash.avatarUrl,
      stats: {
        str: updatedDash.stats?.str ?? 10,
        dex: updatedDash.stats?.dex ?? 10,
        con: updatedDash.stats?.con ?? 10,
        int: updatedDash.stats?.int ?? 10,
        wis: updatedDash.stats?.wis ?? 10,
        cha: updatedDash.stats?.cha ?? 10,
        tempHp: updatedDash.stats?.tempHp ?? 0,
      },
      traits: updatedDash.traits || [],
      inventory: (updatedDash.inventory || []) as (string | EquipmentItem)[],
      spells: updatedDash.spells,
      proficiencies: updatedDash.proficiencies,
      defenses: updatedDash.defenses,
    };

    setCreatedCharacters((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setInspectedCharacter(updated);
  };

  return (
    <div className="space-y-6">
      {/* VIEW A: INSPECTED CHARACTER CARD */}
      {inspectedCharacter ? (
        <div className="space-y-4">
          <CharacterInspectionCard
            character={toDashboardCharacter(inspectedCharacter)}
            onBackToCombat={() => setInspectedCharacter(null)}
            onCharacterUpdate={handleUpdateFromInspection}
          />
        </div>
      ) : isCreating ? (
        /* VIEW B: MULTI-STEP CREATION WIZARD */
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-1">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 hover:text-white transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>← Wróć do listy postaci ({createdCharacters.length})</span>
            </button>
            <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider">
              Kreator Nowej Postaci / NPC
            </span>
          </div>

          <div className="glass-panel rounded-2xl p-6 border border-indigo-500/30 space-y-6 animate-fadeIn">
            <WizardProgress currentStep={step} />

            {/* Step 1: Race & Class */}
            {step === 1 && (
              <StepRaceClass
                selectedRace={selectedRace}
                onSelectRace={setSelectedRace}
                selectedClass={selectedClass}
                onSelectClass={(cls) => {
                  setSelectedClass(cls);
                  setInventory(getDefaultClassEquipment(cls));
                  setKnownSpells([]);
                }}
                onNext={() => setStep(2)}
              />
            )}

            {/* Step 2: Stats Assignment */}
            {step === 2 && (
              <StepStats
                stats={stats}
                onStatsChange={setStats}
                onPrev={() => setStep(1)}
                onNext={() => setStep(3)}
              />
            )}

            {/* Step 3: Identity & Level */}
            {step === 3 && (
              <StepIdentity
                charName={charName}
                onCharNameChange={setCharName}
                level={level}
                onLevelChange={setLevel}
                type={charType}
                onTypeChange={setCharType}
                traits={traits}
                onTraitsChange={setTraits}
                avatarUrl={avatarUrl}
                onAvatarUrlChange={setAvatarUrl}
                onPrev={() => setStep(2)}
                onNext={() => setStep(4)}
              />
            )}

            {/* Step 4: Equipment, Skills & Spells */}
            {step === 4 && (
              <StepEquipmentSpells
                selectedClass={selectedClass}
                level={level}
                inventory={inventory}
                onInventoryChange={setInventory}
                knownSpells={knownSpells}
                onKnownSpellsChange={setKnownSpells}
                skills={skills}
                onSkillsChange={setSkills}
                onPrev={() => setStep(3)}
                onNext={() => setStep(5)}
              />
            )}

            {/* Step 5: Summary & Generate */}
            {step === 5 && (
              <StepSummary
                charName={charName}
                level={level}
                type={charType}
                selectedRace={selectedRace}
                selectedClass={selectedClass}
                traits={traits}
                inventory={inventory}
                knownSpells={knownSpells}
                skills={skills}
                calculatedHp={calculateHp()}
                calculatedAc={calculateAc()}
                calculatedPassivePerception={calculatePassive()}
                avatarUrl={avatarUrl}
                isSaving={isSaving}
                onPrev={() => setStep(4)}
                onFinish={handleFinishWizard}
              />
            )}
          </div>
        </div>
      ) : (
        /* VIEW C: CARDS LIST VIEW WITH PROMINENT CREATE BUTTON AT TOP */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-bold text-slate-100">
                  Karty Postaci Graczy i NPC (GM View)
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Kliknij dowolną kartę, aby otworzyć szczegóły, zarządzać ekwipunkiem i czarami (
                {createdCharacters.length}).
              </p>
            </div>

            <button
              type="button"
              data-testid="open-create-character-btn"
              onClick={() => {
                setStep(1);
                setIsCreating(true);
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition cursor-pointer self-start sm:self-auto"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>+ Stwórz nową postać lub NPC</span>
            </button>
          </div>

          {isLoadingCharacters ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[1, 2].map((i) => (
                <div
                  key={`wizard-char-skel-${i}`}
                  className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4 animate-pulse"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="h-5 bg-slate-800/80 rounded w-44" />
                      <div className="h-3 bg-slate-900 rounded w-28" />
                    </div>
                    <div className="h-8 w-24 bg-slate-900/80 rounded-xl" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 h-14" />
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 h-14" />
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 h-14" />
                  </div>
                </div>
              ))}
            </div>
          ) : createdCharacters.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 border border-slate-800 text-center text-slate-400 space-y-3">
              <p className="text-sm font-medium">Brak zapisanych postaci w tej sesji</p>
              <p className="text-xs text-slate-500">
                Użyj kreatora, aby dodać pierwszego bohatera lub postać niezależną (NPC).
              </p>
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setIsCreating(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Stwórz pierwszą postać</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {createdCharacters.map((c) => (
                <CharacterCard key={c.id} character={c} onClick={() => setInspectedCharacter(c)} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
