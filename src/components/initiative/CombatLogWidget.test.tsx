import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CombatLogWidget } from './CombatLogWidget';
import type { CombatLogEntry } from './types';

describe('CombatLogWidget Component', () => {
  const mockEntries: CombatLogEntry[] = [
    {
      id: 'log-1',
      timestamp: '12:00:00',
      type: 'turn',
      actorName: 'Valeros',
      text: 'Runda 1: Rozpoczęto turę Valeros.',
    },
    {
      id: 'log-2',
      timestamp: '12:01:15',
      type: 'damage',
      actorName: 'Valeros',
      targetName: 'Goblin',
      text: 'Valeros ➔ Goblin: 5 pkt obrażeń (2/7 HP).',
    },
    {
      id: 'log-3',
      timestamp: '12:02:00',
      type: 'spell',
      actorName: 'Eldrin',
      text: 'Eldrin rzuca zaklęcie (1. krąg): Magiczny Pocisk',
    },
    {
      id: 'log-4',
      timestamp: '12:03:00',
      type: 'action',
      actorName: 'Valeros',
      text: 'Valeros wykonuje akcję: Szarża z tarczą na wodza',
    },
  ];

  it('renders combat entries with badges, actor names and arrows correctly', () => {
    render(<CombatLogWidget entries={mockEntries} />);

    expect(screen.getByText(/Kronika Walki \(4\)/i)).toBeInTheDocument();
    expect(screen.getByText('Valeros ➔ Goblin: 5 pkt obrażeń (2/7 HP).')).toBeInTheDocument();
    expect(screen.getByText('Obrażenia')).toBeInTheDocument();
    expect(screen.getByText('Zaklęcie')).toBeInTheDocument();
    expect(screen.getByText('Akcja')).toBeInTheDocument();
    expect(screen.getByText('Tura')).toBeInTheDocument();

    // Check actor badge
    expect(screen.getByTestId('log-actor-Eldrin')).toBeInTheDocument();
    // Check target arrow
    expect(screen.getByText('Goblin')).toBeInTheDocument();
  });

  it('displays empty state when no entries are present', () => {
    render(<CombatLogWidget entries={[]} />);
    expect(
      screen.getByText(/Brak wpisów w kronice. Akcje walki pojawią się tutaj./i)
    ).toBeInTheDocument();
  });

  it('allows submitting custom action for active combatant turn', () => {
    const onAddAction = vi.fn();
    render(
      <CombatLogWidget
        entries={mockEntries}
        activeCombatantName="Valeros"
        onAddCustomAction={onAddAction}
      />
    );

    expect(screen.getByTestId('active-turn-indicator')).toHaveTextContent('Tura: Valeros');
    const input = screen.getByTestId('custom-action-input');
    fireEvent.change(input, { target: { value: 'Zasłania sojusznika tarczą' } });
    fireEvent.click(screen.getByTestId('submit-custom-action-btn'));

    expect(onAddAction).toHaveBeenCalledWith('Zasłania sojusznika tarczą');
  });

  it('calls onClear when clear button is clicked', () => {
    const onClear = vi.fn();
    render(<CombatLogWidget entries={mockEntries} onClear={onClear} />);

    const clearBtn = screen.getByTitle('Wyczyść wpisy kroniki');
    fireEvent.click(clearBtn);
    expect(onClear).toHaveBeenCalled();
  });
});
