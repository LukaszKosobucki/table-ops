'use client';

import React, { useState } from 'react';
import { Navbar } from './Navbar';
import { InitiativeTracker } from './InitiativeTracker';
import { Bestiary } from './Bestiary';
import { CharacterWizard } from './CharacterWizard';
import { DiceRoller } from './DiceRoller';
import { MonsterData } from '@/lib/monsters';
import { Database, ShieldCheck, Sparkles } from 'lucide-react';

interface MainDashboardProps {
  initialMonsters: MonsterData[];
}

export function MainDashboard({ initialMonsters }: MainDashboardProps) {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* Navigation Header */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'dashboard' && <InitiativeTracker monsters={initialMonsters} />}
        {activeTab === 'bestiary' && <Bestiary initialMonsters={initialMonsters} />}
        {activeTab === 'characters' && <CharacterWizard />}
        {activeTab === 'dice' && <DiceRoller />}
      </main>

      {/* Footer Status Bar */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-4 px-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" /> System Ready
            </span>
            <span className="text-slate-700">•</span>
            <span className="flex items-center gap-1 text-slate-400">
              <Database className="w-3.5 h-3.5 text-indigo-400" /> PostgreSQL & Prisma 7.9.1
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
            <span>D&D 5e SRD API Synchronized</span>
            <Sparkles className="w-3 h-3 text-amber-500" />
          </div>
        </div>
      </footer>
    </div>
  );
}
