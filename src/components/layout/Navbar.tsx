'use client';

import {
  BookOpen,
  FolderKanban,
  Lock,
  LogIn,
  LogOut,
  Shield,
  Sparkles,
  User,
  UserPlus,
} from 'lucide-react';
import Link from 'next/link';
import { SessionSwitcher } from '../sessions/SessionSwitcher';
import type { SessionItem } from '../sessions/types';

export interface NavbarUser {
  id?: string;
  email?: string | null;
  user_metadata?: {
    name?: string;
  };
}

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  sessions?: SessionItem[];
  activeSession?: SessionItem | null;
  onSelectSession?: (session: SessionItem) => void;
  onOpenCreateModal?: () => void;
  user?: NavbarUser | null;
  onSignOut?: () => void;
}

export function Navbar({
  activeTab,
  setActiveTab,
  sessions = [],
  activeSession = null,
  onSelectSession,
  onOpenCreateModal,
  user = null,
  onSignOut,
}: NavbarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Ekran Prowadzenia (GM)', icon: Shield },
    { id: 'characters', label: 'Kreator i Karty Postaci', icon: UserPlus },
    { id: 'bestiary', label: 'Bestiariusz', icon: BookOpen },
    { id: 'sessions', label: 'Sesje', icon: FolderKanban },
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 px-4 py-3">
      <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand logo & Session badge */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setActiveTab(activeSession ? 'dashboard' : 'sessions')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight bg-gradient-to-r from-amber-400 via-amber-200 to-indigo-300 bg-clip-text text-transparent">
                TableOps{' '}
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono">
                  D&D 5e
                </span>
              </h1>
              <p className="text-xs text-slate-400">Centrum Dowodzenia Mistrza Gry</p>
            </div>
          </div>

          {/* Session Switcher on mobile/compact */}
          <div className="md:hidden">
            <SessionSwitcher
              sessions={sessions}
              activeSession={activeSession}
              onSelectSession={(s) => {
                onSelectSession?.(s);
                setActiveTab('dashboard');
              }}
              onOpenSessionList={() => setActiveTab('sessions')}
              onOpenCreateModal={onOpenCreateModal}
            />
          </div>
        </div>

        {/* Right side: Session Switcher (Desktop) & Nav Tabs */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <div className="hidden md:block">
            <SessionSwitcher
              sessions={sessions}
              activeSession={activeSession}
              onSelectSession={(s) => {
                onSelectSession?.(s);
                setActiveTab('dashboard');
              }}
              onOpenSessionList={() => setActiveTab('sessions')}
              onOpenCreateModal={onOpenCreateModal}
            />
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-slate-900/70 p-1 rounded-xl border border-slate-800 overflow-x-auto max-w-full">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isLocked = !activeSession && item.id !== 'sessions';

              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={isLocked}
                  aria-disabled={isLocked}
                  title={isLocked ? 'Wymaga wyboru lub stworzenia sesji' : item.label}
                  onClick={() => {
                    if (!isLocked) {
                      setActiveTab(item.id);
                    }
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                    isLocked
                      ? 'opacity-40 cursor-not-allowed text-slate-500 border border-transparent'
                      : isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30 border border-indigo-400/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  {isLocked ? (
                    <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  ) : (
                    <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-slate-400'}`} />
                  )}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Profile / Auth Action */}
          {user ? (
            <div
              className="flex items-center gap-2 pl-2 sm:border-l border-slate-800"
              data-testid="user-profile-badge"
            >
              <div
                className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 via-indigo-600 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-sm border border-white/10 shrink-0"
                title={user.email ?? 'Mistrz Gry'}
              >
                {user.email ? user.email.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
              </div>
              <div className="hidden xl:block text-left max-w-[130px] truncate">
                <div className="text-xs font-medium text-slate-200 truncate">
                  {user.user_metadata?.name || user.email?.split('@')[0] || 'Mistrz Gry'}
                </div>
                <div className="text-[10px] text-slate-400 font-mono truncate">{user.email}</div>
              </div>
              <button
                type="button"
                data-testid="logout-btn"
                onClick={onSignOut}
                title="Wyloguj się"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              data-testid="login-link-btn"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 text-xs font-medium transition-all shadow-sm shrink-0"
            >
              <LogIn className="w-3.5 h-3.5 text-amber-400" />
              <span>Zaloguj się</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
