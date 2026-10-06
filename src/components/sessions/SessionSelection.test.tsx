import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SessionSelection } from './SessionSelection';
import type { SessionItem } from './types';

describe('SessionSelection Component (Chunk 1.2)', () => {
  const mockSessions: SessionItem[] = [
    {
      id: 's-1',
      name: 'Wyprawa do Podmroku',
      createdAt: '2026-02-10T12:00:00Z',
      updatedAt: '2026-02-15T15:30:00Z',
      _count: { characters: 4, sessionLogs: 12 },
    },
    {
      id: 's-2',
      name: 'Klątwa Strahda',
      createdAt: '2026-03-01T10:00:00Z',
      updatedAt: '2026-03-05T20:00:00Z',
      _count: { characters: 5, sessionLogs: 28 },
    },
  ];

  it('renders empty state when there are no sessions', () => {
    const handleSelect = vi.fn();
    const handleCreate = vi.fn();

    render(
      <SessionSelection
        sessions={[]}
        onSelectSession={handleSelect}
        onCreateSession={handleCreate}
      />
    );

    expect(screen.getByText(/brak aktywnych sesji/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /stwórz pierwszą sesję/i })).toBeInTheDocument();
  });

  it('renders session cards with names and counts', () => {
    const handleSelect = vi.fn();
    const handleCreate = vi.fn();

    render(
      <SessionSelection
        sessions={mockSessions}
        onSelectSession={handleSelect}
        onCreateSession={handleCreate}
      />
    );

    expect(screen.getByText('Wyprawa do Podmroku')).toBeInTheDocument();
    expect(screen.getByText('Klątwa Strahda')).toBeInTheDocument();
    expect(screen.getByText(/4 bohaterów/i)).toBeInTheDocument();
    expect(screen.getByText(/12 wpisów/i)).toBeInTheDocument();
  });

  it('opens create modal when clicking "+ Nowa Sesja"', async () => {
    const handleSelect = vi.fn();
    const handleCreate = vi.fn();
    const user = userEvent.setup();

    render(
      <SessionSelection
        sessions={mockSessions}
        onSelectSession={handleSelect}
        onCreateSession={handleCreate}
      />
    );

    const newSessionButton = screen.getByRole('button', { name: /\+ nowa sesja/i });
    await user.click(newSessionButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/stwórz nową sesję/i)).toBeInTheDocument();
  });

  it('submits new session name and calls onCreateSession', async () => {
    const handleSelect = vi.fn();
    const handleCreate = vi.fn().mockResolvedValue(true);
    const user = userEvent.setup();

    render(
      <SessionSelection
        sessions={[]}
        onSelectSession={handleSelect}
        onCreateSession={handleCreate}
      />
    );

    // Open modal from empty state button
    await user.click(screen.getByRole('button', { name: /stwórz pierwszą sesję/i }));

    const input = screen.getByPlaceholderText(/np\. wyprawa do podmroku/i);
    await user.type(input, 'Grobowiec Anihilacji');

    const submitBtn = screen.getByRole('button', { name: /utwórz i rozpocznij/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(handleCreate).toHaveBeenCalledWith('Grobowiec Anihilacji');
    });
  });

  it('triggers onSelectSession when clicking "Wejdź do sesji"', async () => {
    const handleSelect = vi.fn();
    const handleCreate = vi.fn();
    const user = userEvent.setup();

    render(
      <SessionSelection
        sessions={mockSessions}
        onSelectSession={handleSelect}
        onCreateSession={handleCreate}
      />
    );

    const enterButtons = screen.getAllByRole('button', { name: /wejdź do sesji/i });
    await user.click(enterButtons[0]);

    expect(handleSelect).toHaveBeenCalledWith(mockSessions[0]);
  });
});
