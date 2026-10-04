'use client';

import React, { useState } from 'react';
import { Award } from 'lucide-react';
import { Character, CharacterStats, RACES, CLASSES } from './types';
import { CharacterCard } from './CharacterCard';
import { WizardProgress } from './WizardProgress';
import { StepRaceClass } from './StepRaceClass';
import { StepStats } from './StepStats';
import { StepIdentity } from './StepIdentity';
import { StepSummary } from './StepSummary';

export function CharacterWizard() {
  const [createdCharacters, setCreatedCharacters] = useState<Character[]>([
    {
      id: 'c-1',
      name: 'Valerius z Ostrej Bieli',
      race: 'Człowiek (Human)',
      class: 'Paladyn (Paladin)',
      level: 3,
      hp: 28,
      maxHp: 28,
      ac: 18,
      passivePerception: 13,
      stats: { str: 16, dex: 10, con: 14, int: 10, wis: 12, cha: 14 },
    },
    {
      id: 'c-2',
      name: 'Eldrin Srebrny Liść',
      race: 'Elf (Elf)',
      class: 'Czarodziej (Wizard)',
      level: 3,
      hp: 16,
      maxHp: 16,
      ac: 12,
      passivePerception: 14,
      stats: { str: 8, dex: 14, con: 12, int: 17, wis: 13, cha: 10 },
    },
  ]);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Wizard state
  const [charName, setCharName] = useState('');
  const [selectedRace, setSelectedRace] = useState(RACES[0].name);
  const [selectedClass, setSelectedClass] = useState(CLASSES[0].name);
  const [level, setLevel] = useState(1);

  const [stats, setStats] = useState<CharacterStats>({
    str: 15,
    dex: 14,
    con: 13,
    int: 12,
    wis: 10,
    cha: 8,
  });

  const getMod = (val: number) => Math.floor((val - 10) / 2);

  const calculateAc = () => 10 + getMod(stats.dex);
  const calculateHp = () => {
    const cls = CLASSES.find((c) => c.name === selectedClass);
    const hitDie = cls ? cls.hitDie : 8;
    const conMod = getMod(stats.con);
    return hitDie + conMod + (level - 1) * (Math.floor(hitDie / 2) + 1 + conMod);
  };
  const calculatePassivePerception = () => 10 + getMod(stats.wis);

  const handleFinishWizard = () => {
    if (!charName) return;

    const hp = calculateHp();
    const newChar: Character = {
      id: `c-${Date.now()}`,
      name: charName,
      race: selectedRace,
      class: selectedClass,
      level,
      hp,
      maxHp: hp,
      ac: calculateAc(),
      passivePerception: calculatePassivePerception(),
      stats,
    };

    setCreatedCharacters((prev) => [newChar, ...prev]);
    setStep(1);
    setCharName('');
  };

  return (
    <div className="space-y-6">
      {/* Existing Character Cards Carousel / Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-400" />
          Karty Postaci Graczy (GM View)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {createdCharacters.map((c) => (
            <CharacterCard key={c.id} character={c} />
          ))}
        </div>
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
            onPrev={() => setStep(2)}
            onNext={() => setStep(4)}
          />
        )}

        {/* Step 4: Summary & Generate */}
        {step === 4 && (
          <StepSummary
            charName={charName}
            level={level}
            selectedRace={selectedRace}
            selectedClass={selectedClass}
            calculatedHp={calculateHp()}
            calculatedAc={calculateAc()}
            calculatedPassivePerception={calculatePassivePerception()}
            onPrev={() => setStep(3)}
            onFinish={handleFinishWizard}
          />
        )}
      </div>
    </div>
  );
}
