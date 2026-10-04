'use client';

import React, { useState } from 'react';
import { Dices } from 'lucide-react';
import { RollLog } from './types';
import { ActiveRollDisplay } from './ActiveRollDisplay';
import { DiceSelector } from './DiceSelector';
import { RollHistory } from './RollHistory';
import { WebSocketCard } from './WebSocketCard';

export function DiceRoller() {
  const [selectedModifier, setSelectedModifier] = useState(0);
  const [rollLogs, setRollLogs] = useState<RollLog[]>([
    {
      id: 'roll-1',
      dice: 'D20',
      result: 20,
      modifier: 5,
      total: 25,
      timestamp: '14:22:05',
      isCrit: true,
      isFumble: false,
    },
    {
      id: 'roll-2',
      dice: 'D6',
      result: 4,
      modifier: 0,
      total: 4,
      timestamp: '14:21:40',
      isCrit: false,
      isFumble: false,
    },
  ]);

  const [isRolling, setIsRolling] = useState(false);
  const [activeRollResult, setActiveRollResult] = useState<number | null>(25);

  const handleRollDice = (sides: number, diceName: string) => {
    setIsRolling(true);

    let counter = 0;
    const interval = setInterval(() => {
      setActiveRollResult(Math.floor(Math.random() * sides) + 1 + selectedModifier);
      counter++;
      if (counter > 10) {
        clearInterval(interval);
        const finalResult = Math.floor(Math.random() * sides) + 1;
        const total = finalResult + selectedModifier;

        const isCrit = sides === 20 && finalResult === 20;
        const isFumble = sides === 20 && finalResult === 1;

        const newLog: RollLog = {
          id: `r-${Date.now()}`,
          dice: diceName,
          result: finalResult,
          modifier: selectedModifier,
          total,
          timestamp: new Date().toLocaleTimeString(),
          isCrit,
          isFumble,
        };

        setActiveRollResult(total);
        setRollLogs((prev) => [newLog, ...prev]);
        setIsRolling(false);
      }
    }, 50);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-5 border border-indigo-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Dices className="w-6 h-6 text-amber-400" />
            Wirtualny Symulator Rzutów Kośćmi & Architektura Real-Time
          </h2>
          <p className="text-xs text-slate-400">
            Rzucaj kośćmi z fizyką i podglądem wyników krytycznych dla całej drużyny.
          </p>
        </div>

        {/* Modifier input */}
        <div className="flex items-center gap-3 bg-slate-900 px-4 py-2 rounded-xl border border-slate-800">
          <span className="text-xs font-bold text-slate-400 uppercase">Modyfikator:</span>
          <div className="flex items-center gap-1 font-mono font-bold text-amber-400">
            <button
              onClick={() => setSelectedModifier((m) => m - 1)}
              type="button"
              className="w-6 h-6 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center justify-center text-sm"
            >
              -
            </button>
            <span className="w-8 text-center">
              {selectedModifier >= 0 ? `+${selectedModifier}` : selectedModifier}
            </span>
            <button
              onClick={() => setSelectedModifier((m) => m + 1)}
              type="button"
              className="w-6 h-6 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center justify-center text-sm"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dice Buttons Grid & Active Result Display */}
        <div className="lg:col-span-2 space-y-6">
          <ActiveRollDisplay
            isRolling={isRolling}
            activeRollResult={activeRollResult}
            lastLog={rollLogs[0]}
          />

          <DiceSelector onRollDice={handleRollDice} isRolling={isRolling} />
        </div>

        {/* Right Sidebar: Roll History & WebSocket Architecture Status */}
        <div className="space-y-6">
          <RollHistory logs={rollLogs} onClear={() => setRollLogs([])} />
          <WebSocketCard />
        </div>
      </div>
    </div>
  );
}
