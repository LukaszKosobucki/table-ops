'use client';

import React, { useState } from 'react';
import { User, Shield, Heart, Eye, Sparkles, CheckCircle2, ChevronRight, ChevronLeft, Dices, Award } from 'lucide-react';

interface Character {
  id: string;
  name: string;
  race: string;
  class: string;
  level: number;
  hp: number;
  maxHp: number;
  ac: number;
  passivePerception: number;
  stats: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
}

const RACES = [
  { name: 'Człowiek (Human)', bonus: '+1 do wszystkich cech', desc: 'Wszechstronni i ambitni mieszkańcy Faerûnu.' },
  { name: 'Elf (Elf)', bonus: '+2 DEX, Widzenie w ciemności', desc: 'Szlachetni i długowieczni, z naturalną biegłością w magii lub łucznictwie.' },
  { name: 'Krasnolud (Dwarf)', bonus: '+2 CON, Odporność na trucizny', desc: 'Twardzi jak skała mistrzowie rzemiosła i topora.' },
  { name: 'Niziołek (Halfling)', bonus: '+2 DEX, Szczęście niziołka', desc: 'Zwrotni i odważni, potrafią przerzucać pechowe jedynki na D20.' },
  { name: 'Smocze Dziecię (Dragonborn)', bonus: '+2 STR, +1 CHA, Zioło smocze', desc: 'Dumni wojownicy władający żywiołami smoczych przodków.' },
];

const CLASSES = [
  { name: 'Wojownik (Fighter)', hitDie: 10, primary: 'STR / DEX', desc: 'Mistrz walki w zwarciu i dystansie.' },
  { name: 'Czarodziej (Wizard)', hitDie: 6, primary: 'INT', desc: 'Władca potężnych zaklęć z księgi czarów.' },
  { name: 'Paladyn (Paladin)', hitDie: 10, primary: 'STR / CHA', desc: 'Święty rycerz związany przysięgą i boskim światłem.' },
  { name: 'Łotrzyk (Rogue)', hitDie: 8, primary: 'DEX', desc: 'Mistrz podstępu, skradania i precyzyjnych ciosów w czułe punkty.' },
  { name: 'Kleryk (Cleric)', hitDie: 8, primary: 'WIS', desc: 'Boski pośrednik leczący rany i rozpraszający mrok.' },
];

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

  const [stats, setStats] = useState({
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

  const handleRandomizeStats = () => {
    const roll4d6DropLowest = () => {
      const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
      rolls.sort((a, b) => a - b);
      return rolls[1] + rolls[2] + rolls[3];
    };

    setStats({
      str: roll4d6DropLowest(),
      dex: roll4d6DropLowest(),
      con: roll4d6DropLowest(),
      int: roll4d6DropLowest(),
      wis: roll4d6DropLowest(),
      cha: roll4d6DropLowest(),
    });
  };

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
            <div key={c.id} className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-lg text-slate-100">{c.name}</h3>
                  <p className="text-xs text-amber-400 font-semibold">
                    Poziom {c.level} • {c.race} • {c.class}
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                  <Eye className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-semibold text-slate-300">
                    Pasywna Percepcja: <span className="text-amber-400 font-mono">{c.passivePerception}</span>
                  </span>
                </div>
              </div>

              {/* Core Sheet Badges */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Klasa Pancerza</div>
                  <div className="text-base font-bold text-slate-200 font-mono">{c.ac} AC</div>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Punkty Życia</div>
                  <div className="text-base font-bold text-red-400 font-mono">
                    {c.hp} / {c.maxHp} HP
                  </div>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Modyfikator Biegłości</div>
                  <div className="text-base font-bold text-indigo-400 font-mono">+{Math.ceil(c.level / 4) + 1}</div>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-6 gap-1 bg-slate-950/80 p-2 rounded-xl border border-slate-800 text-center font-mono text-xs">
                {Object.entries(c.stats).map(([k, v]) => {
                  const m = getMod(v);
                  return (
                    <div key={k}>
                      <span className="text-[9px] text-slate-500 uppercase block">{k}</span>
                      <span className="font-bold text-slate-200">{v}</span>
                      <span className="text-[10px] text-amber-400 block">{m >= 0 ? `+${m}` : m}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Multi-Step Character Creator Wizard */}
      <div className="glass-panel rounded-2xl p-6 border border-indigo-500/30 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              Kreator Wielokrokowy Postaci (Wizard)
            </h3>
            <p className="text-xs text-slate-400">Wygeneruj czystą kartę postaci w 4 szybkich krokach.</p>
          </div>

          {/* Steps Indicator */}
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs font-mono transition ${
                  step === s
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : step > s
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                    : 'bg-slate-900 text-slate-500 border border-slate-800'
                }`}
              >
                {step > s ? '✓' : s}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Race & Class */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <h4 className="font-bold text-amber-400 text-sm uppercase tracking-wider">Krok 1: Wybierz Rasę i Klasę Postaci</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Race selection */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-300 block">Wybór Rasy</label>
                <div className="space-y-2">
                  {RACES.map((r) => (
                    <div
                      key={r.name}
                      onClick={() => setSelectedRace(r.name)}
                      className={`p-3 rounded-xl border cursor-pointer transition ${
                        selectedRace === r.name
                          ? 'bg-indigo-950/60 border-indigo-500 text-slate-100'
                          : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="font-bold text-sm">{r.name}</div>
                      <div className="text-xs text-amber-400">{r.bonus}</div>
                      <div className="text-xs text-slate-400 mt-1">{r.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Class selection */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-300 block">Wybór Klasy</label>
                <div className="space-y-2">
                  {CLASSES.map((c) => (
                    <div
                      key={c.name}
                      onClick={() => setSelectedClass(c.name)}
                      className={`p-3 rounded-xl border cursor-pointer transition ${
                        selectedClass === c.name
                          ? 'bg-indigo-950/60 border-indigo-500 text-slate-100'
                          : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-sm">{c.name}</div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300">
                          d{c.hitDie} HP
                        </span>
                      </div>
                      <div className="text-xs text-indigo-300">Główny atrybut: {c.primary}</div>
                      <div className="text-xs text-slate-400 mt-1">{c.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition"
              >
                <span>Dalej: Przypisanie Atrybutów</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Stats Assignment */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-amber-400 text-sm uppercase tracking-wider">Krok 2: Statystyki i Cechy Bazowe</h4>
              <button
                onClick={handleRandomizeStats}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-semibold hover:bg-amber-500/30 transition"
              >
                <Dices className="w-4 h-4" />
                <span>Rzuć 4d6 (Drop Lowest)</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {[
                { key: 'str', label: 'Siła (STR)' },
                { key: 'dex', label: 'Zręczność (DEX)' },
                { key: 'con', label: 'Kondycja (CON)' },
                { key: 'int', label: 'Inteligencja (INT)' },
                { key: 'wis', label: 'Mądrość (WIS)' },
                { key: 'cha', label: 'Charyzma (CHA)' },
              ].map((item) => {
                const val = stats[item.key as keyof typeof stats];
                const mod = getMod(val);
                return (
                  <div key={item.key} className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center space-y-2">
                    <label className="text-xs font-bold text-slate-300 block">{item.label}</label>
                    <input
                      type="number"
                      min={3}
                      max={20}
                      value={val}
                      onChange={(e) => setStats({ ...stats, [item.key]: parseInt(e.target.value) || 10 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 text-center font-mono font-bold text-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                    <div className="text-xs font-mono font-bold text-amber-400">
                      Modyfikator: {mod >= 0 ? `+${mod}` : mod}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-800">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Wstecz</span>
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition"
              >
                <span>Dalej: Nazwa i Poziom</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Identity & Level */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <h4 className="font-bold text-amber-400 text-sm uppercase tracking-wider">Krok 3: Tożsamość i Poziom Postaci</h4>

            <div className="space-y-4 max-w-md">
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">Imię i Tytuł Postaci</label>
                <input
                  type="text"
                  placeholder="np. Thorin Dębowa Tarcza"
                  value={charName}
                  onChange={(e) => setCharName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">Poziom Postaci (1 - 20)</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={level}
                  onChange={(e) => setLevel(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-800">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Wstecz</span>
              </button>
              <button
                disabled={!charName}
                onClick={() => setStep(4)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm transition"
              >
                <span>Podsumowanie Karty</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Summary & Generate */}
        {step === 4 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <h4 className="font-bold text-emerald-400 text-sm uppercase tracking-wider">Krok 4: Podsumowanie Wygenerowanej Karty</h4>

            <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-slate-100">{charName}</h3>
                  <p className="text-sm text-amber-400 font-medium">
                    Poziom {level} • {selectedRace} • {selectedClass}
                  </p>
                </div>
                <div className="bg-emerald-950/80 border border-emerald-600 px-3 py-1.5 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Karta Gotowa
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
                  <span className="text-xs text-slate-500 font-semibold block uppercase">Przeliczone HP</span>
                  <span className="text-xl font-bold text-red-400 font-mono">{calculateHp()} HP</span>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
                  <span className="text-xs text-slate-500 font-semibold block uppercase">Klasa Pancerza (AC)</span>
                  <span className="text-xl font-bold text-indigo-400 font-mono">{calculateAc()} AC</span>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
                  <span className="text-xs text-slate-500 font-semibold block uppercase">Pasywna Percepcja</span>
                  <span className="text-xl font-bold text-amber-400 font-mono">{calculatePassivePerception()}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-800">
              <button
                onClick={() => setStep(3)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Wstecz</span>
              </button>
              <button
                onClick={handleFinishWizard}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/20 transition transform active:scale-95"
              >
                <Sparkles className="w-5 h-5" />
                <span>Zapisz Kartę Postaci</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
