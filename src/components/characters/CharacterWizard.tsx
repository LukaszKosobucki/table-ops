'use client';

import { Award } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  calculateMaxHp,
  calculatePassivePerception,
  calculateSpellSlots,
  calculateUnarmoredAc,
  getClassHitDie,
} from '@/lib/dnd-rules';
import { CharacterCard } from './CharacterCard';
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
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Wizard state
  const [charName, setCharName] = useState('');
  const [charType, setCharType] = useState<'HERO' | 'NPC'>('HERO');
  const [selectedRace, setSelectedRace] = useState(RACES[0].name);
  const [selectedClass, setSelectedClass] = useState(CLASSES[0].name);
  const [level, setLevel] = useState(1);
  const [traits, setTraits] = useState('');
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
              sessionId?: string | null;
              name: string;
              type?: 'HERO' | 'NPC';
              race?: string | null;
              class?: string | null;
              level?: number;
              currentHp: number;
              maxHp: number;
              ac: number;
              passivePerception: number;
              stats?: CharacterStats | null;
              traits?: string[] | null;
              inventory?: string[] | null;
              spells?: CharacterSpells | null;
            }) => ({
              id: c.id,
              sessionId: c.sessionId,
              name: c.name,
              type: c.type || 'HERO',
              race: c.race || 'Nieznana rasa',
              class: c.class || 'Klasa nieznana',
              level: c.level || 1,
              hp: c.currentHp,
              maxHp: c.maxHp,
              currentHp: c.currentHp,
              ac: c.ac,
              passivePerception: c.passivePerception,
              stats: (c.stats as CharacterStats) || {
                str: 10,
                dex: 10,
                con: 10,
                int: 10,
                wis: 10,
                cha: 10,
              },
              traits: Array.isArray(c.traits) ? c.traits : [],
              inventory: Array.isArray(c.inventory) ? c.inventory : [],
              spells: c.spells || null,
            })
          );
          setCreatedCharacters(mapped);
          onCharactersLoadedRef.current?.(mapped);
        }
      }
    } catch {
      // Offline fallback
    } finally {
      setIsLoadingCharacters(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (initialCharacters) {
      setCreatedCharacters(initialCharacters);
      setIsLoadingCharacters(false);
      lastFetchedSessionIdRef.current = sessionId;
      return;
    }

    if (lastFetchedSessionIdRef.current !== sessionId) {
      lastFetchedSessionIdRef.current = sessionId;
      fetchSessionCharacters();
    }
  }, [initialCharacters, sessionId, fetchSessionCharacters]);

  const calculateAc = () => calculateUnarmoredAc(stats.dex);
  const calculateHp = () => {
    const hitDie = getClassHitDie(selectedClass);
    return calculateMaxHp(hitDie, stats.con, level);
  };
  const calculatePassive = () => calculatePassivePerception(stats.wis);

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
      spells: hasSpells ? { slots: spellSlots, known: [], prepared: [] } : null,
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
            spells: data.character.spells || null,
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
    }
  };

  return (
    <div className="space-y-6">
      {/* Existing Character Cards Carousel / Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-400" />
          <span>Karty Postaci Graczy (GM View)</span>
        </h2>

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
          <div className="glass-card rounded-2xl p-6 border border-slate-800 text-center text-slate-400 space-y-1">
            <p className="text-sm font-medium">Brak zapisanych postaci w tej sesji</p>
            <p className="text-xs text-slate-500">
              Wypełnij poniższy formularz, aby dodać pierwszą postać do sesji.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {createdCharacters.map((c) => (
              <CharacterCard key={c.id} character={c} />
            ))}
          </div>
        )}
      </div>

      {/* Multi-Step Character Creator Wizard */}
      <div className="glass-panel rounded-2xl p-6 border border-indigo-500/30 space-y-6">
        <WizardProgress currentStep={step} />

        {/* Step 1: Race & Class */}
        {step === 1 && (
          <StepRaceClass
            selectedRace={selectedRace}
            onSelectRace={setSelectedRace}
            selectedClass={selectedClass}
            onSelectClass={setSelectedClass}
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
            onPrev={() => setStep(2)}
            onNext={() => setStep(4)}
          />
        )}

        {/* Step 4: Summary & Generate */}
        {step === 4 && (
          <StepSummary
            charName={charName}
            level={level}
            type={charType}
            selectedRace={selectedRace}
            selectedClass={selectedClass}
            traits={traits}
            calculatedHp={calculateHp()}
            calculatedAc={calculateAc()}
            calculatedPassivePerception={calculatePassive()}
            isSaving={isSaving}
            onPrev={() => setStep(3)}
            onFinish={handleFinishWizard}
          />
        )}
      </div>
    </div>
  );
}
