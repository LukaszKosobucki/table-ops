'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Navbar } from './layout/Navbar';
import { Footer } from './layout/Footer';
import { InitiativeTracker } from './initiative/InitiativeTracker';
import { MonsterData } from '@/lib/monsters';

// Vercel React Best Practices: bundle-dynamic-imports
const Bestiary = dynamic(
  () => import('./bestiary/Bestiary').then((mod) => mod.Bestiary),
  {
    loading: () => <TabLoadingSkeleton title="Bestiariusz D&D 5e" />,
  }
);

const CharacterWizard = dynamic(
  () => import('./characters/CharacterWizard').then((mod) => mod.CharacterWizard),
  {
    loading: () => <TabLoadingSkeleton title="Kreator Postaci" />,
  }
);

const DiceRoller = dynamic(
  () => import('./dice/DiceRoller').then((mod) => mod.DiceRoller),
  {
    loading: () => <TabLoadingSkeleton title="Symulator Kości" />,
  }
);

function TabLoadingSkeleton({ title }: { title: string }) {
  return (
    <div className="glass-panel rounded-2xl p-8 text-center animate-pulse space-y-3 border border-slate-800">
      <div className="h-6 w-48 bg-slate-800 rounded mx-auto" />
      <div className="h-4 w-72 bg-slate-900 rounded mx-auto" />
      <p className="text-xs text-slate-400 font-mono pt-4">Ładowanie modułu: {title}...</p>
    </div>
  );
}

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
      <Footer />
    </div>
  );
}
