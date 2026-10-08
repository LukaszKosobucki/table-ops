import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TimelineSidebar } from './TimelineSidebar';
import type { DashboardCharacter, DashboardLog } from './types';

const mockLogs: DashboardLog[] = [
  {
    id: 'log-1',
    sessionId: 'sess-1',
    logType: 'REST_LONG',
    description: 'Długi Odpoczynek drużyny.',
    createdAt: new Date('2026-03-01T20:00:00Z'),
  },
  {
    id: 'log-2',
    sessionId: 'sess-1',
    logType: 'COMBAT_ACTION',
    description: 'Valeros atakuje mieczem.',
    createdAt: new Date('2026-03-01T20:15:00Z'),
  },
  {
    id: 'log-3',
    sessionId: 'sess-1',
    logType: 'CUSTOM_NOTE',
    description: 'Drużyna rozbiła obóz pod gwiazdami.',
    createdAt: new Date('2026-03-01T20:30:00Z'),
  },
];

const mockHeroes: DashboardCharacter[] = [
  {
    id: 'hero-1',
    name: 'Valeros',
    type: 'HERO',
    currentHp: 10,
    maxHp: 25,
    ac: 16,
    passivePerception: 12,
  },
];

describe('TimelineSidebar (Chunk 7.2)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders all logs initially and filters by category', () => {
    const handleSelectLog = vi.fn();

    render(
      <TimelineSidebar
        logs={mockLogs}
        selectedLogId={null}
        onSelectLog={handleSelectLog}
        gmNotes=""
        onChangeGmNotes={vi.fn()}
        sessionId="sess-1"
        heroes={mockHeroes}
      />
    );

    // Initial view: all 3 logs rendered
    expect(screen.getByText('Długi Odpoczynek drużyny.')).toBeInTheDocument();
    expect(screen.getByText('Valeros atakuje mieczem.')).toBeInTheDocument();
    expect(screen.getByText('Drużyna rozbiła obóz pod gwiazdami.')).toBeInTheDocument();

    // Click "Odpoczynki" filter
    const restFilterBtn = screen.getByRole('button', { name: 'Odpoczynki' });
    fireEvent.click(restFilterBtn);

    expect(screen.getByText('Długi Odpoczynek drużyny.')).toBeInTheDocument();
    expect(screen.queryByText('Valeros atakuje mieczem.')).not.toBeInTheDocument();
    expect(screen.queryByText('Drużyna rozbiła obóz pod gwiazdami.')).not.toBeInTheDocument();

    // Click "Walki" filter
    const combatFilterBtn = screen.getByRole('button', { name: 'Walki' });
    fireEvent.click(combatFilterBtn);

    expect(screen.queryByText('Długi Odpoczynek drużyny.')).not.toBeInTheDocument();
    expect(screen.getByText('Valeros atakuje mieczem.')).toBeInTheDocument();

    // Click "Notatki" filter
    const notesFilterBtn = screen.getByRole('button', { name: 'Notatki' });
    fireEvent.click(notesFilterBtn);

    expect(screen.getByText('Drużyna rozbiła obóz pod gwiazdami.')).toBeInTheDocument();

    // Return to "Wszystkie"
    const allFilterBtn = screen.getByRole('button', { name: 'Wszystkie' });
    fireEvent.click(allFilterBtn);

    expect(screen.getByText('Długi Odpoczynek drużyny.')).toBeInTheDocument();
    expect(screen.getByText('Valeros atakuje mieczem.')).toBeInTheDocument();
  });

  it('opens rest and note modals on trigger click', () => {
    render(
      <TimelineSidebar
        logs={mockLogs}
        selectedLogId={null}
        onSelectLog={vi.fn()}
        gmNotes=""
        onChangeGmNotes={vi.fn()}
        sessionId="sess-1"
        heroes={mockHeroes}
      />
    );

    // Open Short Rest Modal
    const shortRestBtn = screen.getByTestId('open-short-rest-btn');
    fireEvent.click(shortRestBtn);
    expect(screen.getByRole('heading', { name: /Krótki Odpoczynek/i })).toBeInTheDocument();

    // Close it
    const cancelBtns = screen.getAllByRole('button', { name: /Anuluj/i });
    fireEvent.click(cancelBtns[0]);
    expect(screen.queryByRole('heading', { name: /Krótki Odpoczynek/i })).not.toBeInTheDocument();

    // Open Long Rest Modal
    const longRestBtn = screen.getByTestId('open-long-rest-btn');
    fireEvent.click(longRestBtn);
    expect(screen.getByRole('heading', { name: /Długi Odpoczynek/i })).toBeInTheDocument();

    // Close it
    const cancelBtns2 = screen.getAllByRole('button', { name: /Anuluj/i });
    fireEvent.click(cancelBtns2[0]);

    // Open Add Note Modal
    const addNoteBtn = screen.getByTestId('open-add-note-btn');
    fireEvent.click(addNoteBtn);
    expect(screen.getByRole('heading', { name: /Wpis na Osi Czasu/i })).toBeInTheDocument();
  });

  it('calls onSelectLog when a log item is clicked', () => {
    const handleSelectLog = vi.fn();

    render(
      <TimelineSidebar
        logs={mockLogs}
        selectedLogId={null}
        onSelectLog={handleSelectLog}
        gmNotes=""
        onChangeGmNotes={vi.fn()}
        sessionId="sess-1"
        heroes={mockHeroes}
      />
    );

    const logItem = screen.getByText('Valeros atakuje mieczem.').closest('button');
    expect(logItem).toBeInTheDocument();
    if (logItem) {
      fireEvent.click(logItem);
      expect(handleSelectLog).toHaveBeenCalledWith(mockLogs[1]);
    }
  });

  it('switches between timeline and tactics tabs without all tab or quick dice', () => {
    render(
      <TimelineSidebar
        logs={mockLogs}
        selectedLogId={null}
        onSelectLog={vi.fn()}
        gmNotes=""
        onChangeGmNotes={vi.fn()}
        sessionId="sess-1"
        heroes={mockHeroes}
        activeWorkspace="combat"
        onAddCombatant={vi.fn()}
        monsters={[]}
      />
    );

    // Initial view is 'timeline': timeline and notes are present, tab 'all' and dice are gone
    expect(screen.getByTestId('sidebar-tab-timeline')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-tab-tactics')).toBeInTheDocument();
    expect(screen.queryByTestId('sidebar-tab-all')).not.toBeInTheDocument();
    expect(screen.getByText('Oś Czasu Sesji')).toBeInTheDocument();
    expect(screen.getByText('Podręczne Notatki GM-a')).toBeInTheDocument();
    expect(screen.queryByText('Szybkie Rzuty Kośćmi')).not.toBeInTheDocument();

    // Switch to 'tactics' tab: timeline and notes are hidden, add combatant panel is present
    fireEvent.click(screen.getByTestId('sidebar-tab-tactics'));
    expect(screen.queryByText('Oś Czasu Sesji')).not.toBeInTheDocument();
    expect(screen.queryByText('Podręczne Notatki GM-a')).not.toBeInTheDocument();
    expect(screen.getByText(/Dodaj z Bestiariusza/i)).toBeInTheDocument();

    // Switch back to 'timeline' tab: timeline is visible again
    fireEvent.click(screen.getByTestId('sidebar-tab-timeline'));
    expect(screen.getByText('Oś Czasu Sesji')).toBeInTheDocument();
    expect(screen.getByText('Podręczne Notatki GM-a')).toBeInTheDocument();
  });
});
