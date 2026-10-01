'use client';

import React, { useState } from 'react';
import { Dices, Sparkles, Wifi, Activity, RotateCcw, Zap, Volume2 } from 'lucide-react';

interface RollLog {
  id: string;
  dice: string;
  result: number;
  modifier: number;
  total: number;
  timestamp: string;
  isCrit: boolean;
  isFumble: boolean;
}

const DICE_TYPES = [
  { name: 'D20', sides: 20, color: 'from-amber-600 to-amber-400', desc: 'Ataki, Rzuty obronne, Testy cech' },
  { name: 'D12', sides: 12, color: 'from-purple-600 to-indigo-500', desc: 'Obrażenia Barbarzyńcy, Topory dwuręczne' },
  { name: 'D10', sides: 10, color: 'from-blue-600 to-cyan-500', desc: 'Obrażenia Eldritch Blast, Miecz bękart' },
  { name: 'D8', sides: 8, color: 'from-emerald-600 to-teal-500', desc: 'Obrażenia broni jednoręcznych, Rapier' },
  { name: 'D6', sides: 6, color: 'from-rose-600 to-pink-500', desc: 'Kula ognia (Fireball), Atak z zaskoczenia' },
  { name: 'D4', sides: 4, color: 'from-orange-600 to-amber-500', desc: 'Zaklęcie Magiczny Pocisk (Magic Missile)' },
];

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
          <p className="text-xs text-slate-400">Rzucaj kośćmi z fizyką i podglądem wyników krytycznych dla całej drużyny.</p>
        </div>

        {/* Modifier input */}
        <div className="flex items-center gap-3 bg-slate-900 px-4 py-2 rounded-xl border border-slate-800">
          <span className="text-xs font-bold text-slate-400 uppercase">Modyfikator:</span>
          <div className="flex items-center gap-1 font-mono font-bold text-amber-400">
            <button
              onClick={() => setSelectedModifier((m) => m - 1)}
              className="w-6 h-6 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center justify-center text-sm"
            >
              -
            </button>
            <span className="w-8 text-center">{selectedModifier >= 0 ? `+${selectedModifier}` : selectedModifier}</span>
            <button
              onClick={() => setSelectedModifier((m) => m + 1)}
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
          {/* Main Active Roll Stage */}
          <div className="glass-card rounded-2xl p-8 border border-indigo-500/30 text-center relative overflow-hidden bg-gradient-to-b from-indigo-950/40 via-slate-900 to-slate-950">
            <div className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
              Wynik Ostatniego Rzutu
            </div>

            <div
              className={`text-6xl sm:text-7xl font-mono font-black my-4 transition-all duration-200 ${
                isRolling
                  ? 'scale-110 blur-[1px] text-amber-300'
                  : activeRollResult === 20
                  ? 'text-amber-400 drop-shadow-[0_0_25px_rgba(251,191,36,0.8)] animate-bounce'
                  : 'text-slate-100'
              }`}
            >
              {activeRollResult !== null ? activeRollResult : '--'}
            </div>

            {rollLogs[0]?.isCrit && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 text-xs font-bold uppercase tracking-wider animate-pulse">
                <Sparkles className="w-4 h-4" /> NATURAL 20 CRITICAL HIT!
              </div>
            )}

            {rollLogs[0]?.isFumble && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950 border border-red-600 text-red-300 text-xs font-bold uppercase tracking-wider">
                NATURAL 1 CRITICAL FUMBLE!
              </div>
            )}
          </div>

          {/* Dice Selector Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {DICE_TYPES.map((dice) => (
              <button
                key={dice.name}
                onClick={() => handleRollDice(dice.sides, dice.name)}
                disabled={isRolling}
                className="glass-card p-4 rounded-2xl border border-slate-800 hover:border-amber-500/50 transition-all text-left group hover:scale-[1.02] active:scale-95"
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${dice.color} flex items-center justify-center font-black font-mono text-white text-lg shadow-lg`}
                  >
                    {dice.name}
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-500 group-hover:text-amber-400 transition">
                    d{dice.sides}
                  </span>
                </div>
                <div className="font-bold text-sm text-slate-200 group-hover:text-amber-300 transition">
                  Rzuć {dice.name}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">{dice.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Sidebar: Roll History & WebSocket Architecture Status */}
        <div className="space-y-6">
          {/* Roll History Feed */}
          <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
            <h3 className="font-bold text-slate-100 flex items-center justify-between">
              <span>Dziennik Rzutów</span>
              <button
                onClick={() => setRollLogs([])}
                className="text-xs text-slate-500 hover:text-slate-300 transition"
              >
                Wyczyść
              </button>
            </h3>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {rollLogs.map((log) => (
                <div
                  key={log.id}
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                    log.isCrit
                      ? 'bg-amber-950/40 border-amber-500/60 text-amber-200'
                      : log.isFumble
                      ? 'bg-red-950/40 border-red-800/60 text-red-300'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-mono px-1.5 py-0.5 rounded bg-slate-950 text-slate-400">
                      {log.dice}
                    </span>
                    <span>
                      Kość: <strong className="font-mono">{log.result}</strong> {log.modifier !== 0 && `(${log.modifier >= 0 ? '+' : ''}${log.modifier})`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm font-mono text-slate-100">{log.total}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{log.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* WebSocket / Socket.io Prepared Architecture Card */}
          <div className="glass-card rounded-2xl p-5 border border-indigo-500/20 bg-gradient-to-b from-slate-900 to-indigo-950/30 space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
              <Wifi className="w-4 h-4 animate-pulse text-emerald-400" />
              <span>Gotowość do WebSockets / Socket.io</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Struktura aplikacji została zorganizowana pod kątem natychmiastowej integracji Pusher/Socket.io dla trybu multiplayer graczy.
            </p>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-indigo-300 space-y-1">
              <div>// Emisja zdarzenia rzutu kością:</div>
              <div className="text-emerald-400">socket.emit(&apos;roll:broadcast&apos;, &#123; player, total &#125;)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
