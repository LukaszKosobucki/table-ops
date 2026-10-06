'use client';

import {
  ChevronRight,
  Clock,
  Edit3,
  FolderPlus,
  Plus,
  ScrollText,
  Search,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { CreateSessionModal } from './CreateSessionModal';
import { EditSessionModal } from './EditSessionModal';
import type { SessionItem } from './types';

interface SessionSelectionProps {
  sessions: SessionItem[];
  isLoading?: boolean;
  onSelectSession: (session: SessionItem) => void;
  onCreateSession: (name: string) => Promise<boolean | undefined>;
  onUpdateSession?: (id: string, name: string) => Promise<boolean | undefined>;
  onDeleteSession?: (id: string) => Promise<boolean | undefined>;
}

export function SessionSelection({
  sessions,
  isLoading = false,
  onSelectSession,
  onCreateSession,
  onUpdateSession,
  onDeleteSession,
}: SessionSelectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<SessionItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    return sessions.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase().trim()));
  }, [sessions, searchQuery]);

  const formatDate = (dateVal: string | Date) => {
    try {
      const d = typeof dateVal === 'string' ? new Date(dateVal) : dateVal;
      return new Intl.DateTimeFormat('pl-PL', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    } catch {
      return String(dateVal);
    }
  };

  const handleDelete = async (session: SessionItem) => {
    if (!onDeleteSession) return;
    const confirmed = window.confirm(
      `Czy na pewno chcesz usunąć sesję "${session.name}" wraz ze wszystkimi bohaterami, potyczkami i logami? Tej operacji nie można cofnąć.`
    );
    if (!confirmed) return;

    try {
      setDeletingId(session.id);
      await onDeleteSession(session.id);
    } catch (err) {
      console.error('Failed to delete session:', err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto">
      {/* Top Banner & Actions */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800/80 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Moduł Kampanii & Prowadzenia Gry</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-indigo-200 bg-clip-text text-transparent">
              Wybierz lub stwórz Sesję RPG
            </h2>
            <p className="text-sm text-slate-400 max-w-xl">
              Każda sesja to wyizolowane środowisko z własną drużyną bohaterów, potyczkami,
              statusami i chronologicznym dziennikiem wydarzeń Mistrza Gry.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="self-start md:self-center px-5 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 shadow-lg shadow-indigo-600/30 border border-indigo-400/30 transition-all flex items-center gap-2.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <FolderPlus className="w-5 h-5 text-amber-300" />
            <span>+ Nowa Sesja</span>
          </button>
        </div>

        {/* Search Bar if sessions exist */}
        {sessions.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-800/80 flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtruj sesje po nazwie..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div className="text-xs text-slate-400 font-mono">Łącznie: {sessions.length}</div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="glass-card rounded-2xl p-6 border border-slate-800 animate-pulse space-y-4"
            >
              <div className="h-6 w-3/4 bg-slate-800 rounded" />
              <div className="h-4 w-1/2 bg-slate-900 rounded" />
              <div className="flex gap-2 pt-4">
                <div className="h-8 w-24 bg-slate-800 rounded-lg" />
                <div className="h-8 w-24 bg-slate-800 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && sessions.length === 0 && (
        <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800 max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-900/80 border border-slate-800 mx-auto flex items-center justify-center text-amber-400 shadow-inner">
            <FolderPlus className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-200">Brak aktywnych sesji</h3>
            <p className="text-sm text-slate-400">
              Stwórz swoją pierwszą sesję, aby rozpocząć prowadzenie kampanii D&D 5e.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="mt-4 px-6 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 shadow-md shadow-indigo-600/30 border border-indigo-400/30 transition-all inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-amber-300" />
            <span>Stwórz pierwszą sesję</span>
          </button>
        </div>
      )}

      {/* Filtered Empty State */}
      {!isLoading && sessions.length > 0 && filteredSessions.length === 0 && (
        <div className="text-center py-12 glass-panel rounded-2xl border border-slate-800">
          <p className="text-slate-400 text-sm">
            Nie znaleziono sesji pasującej do &quot;{searchQuery}&quot;.
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="mt-2 text-xs text-indigo-400 hover:underline"
          >
            Wyczyść filtr
          </button>
        </div>
      )}

      {/* Sessions Grid */}
      {!isLoading && filteredSessions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSessions.map((session) => {
            const charCount = session._count?.characters ?? 0;
            const logCount = session._count?.sessionLogs ?? 0;

            return (
              <div
                key={session.id}
                className="glass-card rounded-2xl p-6 border border-slate-800/80 hover:border-indigo-500/40 hover:shadow-xl hover:shadow-indigo-950/20 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Card Top Row: Name & Action Icons */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="font-bold text-lg text-slate-100 group-hover:text-indigo-200 transition-colors line-clamp-1">
                      {session.name}
                    </h3>
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      {onUpdateSession && (
                        <button
                          type="button"
                          onClick={() => setEditingSession(session)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800/80 transition-colors"
                          aria-label={`Edytuj sesję ${session.name}`}
                          title="Zmień nazwę"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}
                      {onDeleteSession && (
                        <button
                          type="button"
                          onClick={() => handleDelete(session)}
                          disabled={deletingId === session.id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition-colors disabled:opacity-50"
                          aria-label={`Usuń sesję ${session.name}`}
                          title="Usuń sesję"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Metadata Date */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Zaktualizowano: {formatDate(session.updatedAt)}</span>
                  </div>

                  {/* Stats Badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-6">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-300 font-medium">
                      <Users className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{charCount} bohaterów</span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-300 font-medium">
                      <ScrollText className="w-3.5 h-3.5 text-amber-400" />
                      <span>{logCount} wpisów</span>
                    </div>
                  </div>
                </div>

                {/* Card CTA */}
                <button
                  type="button"
                  onClick={() => onSelectSession(session)}
                  className="w-full py-2.5 px-4 rounded-xl font-medium text-sm text-slate-200 bg-slate-900/90 hover:bg-gradient-to-r hover:from-indigo-600 hover:to-indigo-700 hover:text-white border border-slate-800 hover:border-indigo-400/30 transition-all flex items-center justify-center gap-2 shadow-sm group-hover:shadow-indigo-600/20"
                >
                  <span>Wejdź do sesji</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <CreateSessionModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={onCreateSession}
      />

      <EditSessionModal
        isOpen={editingSession !== null}
        session={editingSession}
        onClose={() => setEditingSession(null)}
        onUpdate={async (id, newName) => {
          if (onUpdateSession) {
            await onUpdateSession(id, newName);
          }
        }}
      />
    </div>
  );
}
