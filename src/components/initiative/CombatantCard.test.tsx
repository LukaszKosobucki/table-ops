import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CombatantCard } from './CombatantCard';
import type { Combatant } from './types';

describe('CombatantCard Component', () => {
  const mockHero: Combatant = {
    id: 'char-1',
    name: 'Valerius (Paladyn)',
    initiative: 18,
    currentHp: 20,
    maxHp: 28,
    ac: 18,
    isMonster: false,
    conditions: ['Poisoned'],
    statuses: [{ id: 'st-1', statusName: 'Poisoned', durationTurns: 2 }],
  };

  it('renders combatant details, AC, HP and conditions', () => {
    render(
      <CombatantCard
        combatant={mockHero}
        isActiveTurn={false}
        onHpChange={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    expect(screen.getByText('Valerius (Paladyn)')).toBeInTheDocument();
    expect(screen.getByText('AC 18')).toBeInTheDocument();
    expect(screen.getByText('20 / 28 HP')).toBeInTheDocument();
    expect(screen.getByText('Poisoned')).toBeInTheDocument();
    expect(screen.getByText('2 tury')).toBeInTheDocument();
  });

  it('displays TERAZ TURA badge when isActiveTurn is true', () => {
    render(
      <CombatantCard
        combatant={mockHero}
        isActiveTurn={true}
        onHpChange={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    expect(screen.getByTestId('active-turn-badge')).toBeInTheDocument();
    expect(screen.getByText(/TERAZ TURA/i)).toBeInTheDocument();
  });

  it('calls onHpChange with quick adjustment buttons', () => {
    const handleHp = vi.fn();
    render(
      <CombatantCard
        combatant={mockHero}
        isActiveTurn={false}
        onHpChange={handleHp}
        onRemove={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTitle('-5 HP'));
    expect(handleHp).toHaveBeenCalledWith(-5);

    fireEvent.click(screen.getByTitle('+5 HP'));
    expect(handleHp).toHaveBeenCalledWith(5);
  });

  it('applies custom damage and healing from input', () => {
    const handleHp = vi.fn();
    render(
      <CombatantCard
        combatant={mockHero}
        isActiveTurn={false}
        onHpChange={handleHp}
        onRemove={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText('Wartość');
    fireEvent.change(input, { target: { value: '12' } });

    fireEvent.click(screen.getByTitle('Zadaj podane obrażenia'));
    expect(handleHp).toHaveBeenCalledWith(-12);

    fireEvent.change(input, { target: { value: '8' } });
    fireEvent.click(screen.getByTitle('Wylecz podane HP'));
    expect(handleHp).toHaveBeenCalledWith(8);
  });

  it('allows adding a timed status with duration selector', () => {
    const handleAddStatus = vi.fn();
    render(
      <CombatantCard
        combatant={mockHero}
        isActiveTurn={false}
        onHpChange={vi.fn()}
        onAddStatus={handleAddStatus}
        onRemove={vi.fn()}
      />
    );

    // Open status adder popover
    fireEvent.click(screen.getByText('+ Status czasowy'));
    expect(screen.getByText('Nakładanie statusu:')).toBeInTheDocument();

    // Select duration 3 tury
    fireEvent.click(screen.getByRole('button', { name: '3 tury' }));

    // Click Zastosuj
    fireEvent.click(screen.getByRole('button', { name: 'Zastosuj' }));
    expect(handleAddStatus).toHaveBeenCalledWith(expect.any(String), 3);
  });

  it('calls onRemoveStatus when clicking the remove button on a status badge', () => {
    const handleRemoveStatus = vi.fn();
    render(
      <CombatantCard
        combatant={mockHero}
        isActiveTurn={false}
        onHpChange={vi.fn()}
        onRemoveStatus={handleRemoveStatus}
        onRemove={vi.fn()}
      />
    );

    const removeBtn = screen.getByTitle('Zdejmij status: Poisoned');
    fireEvent.click(removeBtn);
    expect(handleRemoveStatus).toHaveBeenCalledWith('st-1');
  });

  it('allows editing initiative during PREPARING phase', () => {
    const handleInitChange = vi.fn();
    render(
      <CombatantCard
        combatant={mockHero}
        phase="PREPARING"
        isActiveTurn={false}
        onHpChange={vi.fn()}
        onInitiativeChange={handleInitChange}
        onRemove={vi.fn()}
      />
    );

    const initInput = screen.getByLabelText('Inicjatywa Valerius (Paladyn)');
    expect(initInput).toBeInTheDocument();

    fireEvent.change(initInput, { target: { value: '22' } });
    expect(handleInitChange).toHaveBeenCalledWith(22);
  });
});
