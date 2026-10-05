import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TurnControls } from './TurnControls';

describe('TurnControls Component', () => {
  it('displays the current round correctly', () => {
    render(
      <TurnControls
        round={3}
        onNextTurn={vi.fn()}
        onRollAllMonsterInitiative={vi.fn()}
      />
    );

    expect(screen.getByText('Runda 3')).toBeInTheDocument();
  });

  it('calls onNextTurn when clicking "Następna Tura"', () => {
    const handleNext = vi.fn();
    render(
      <TurnControls
        round={1}
        onNextTurn={handleNext}
        onRollAllMonsterInitiative={vi.fn()}
      />
    );

    const nextButton = screen.getByRole('button', { name: /Następna Tura/i });
    fireEvent.click(nextButton);

    expect(handleNext).toHaveBeenCalledTimes(1);
  });

  it('calls onRollAllMonsterInitiative when clicking "Losuj Inicjatywę Potworów"', () => {
    const handleRoll = vi.fn();
    render(
      <TurnControls
        round={1}
        onNextTurn={vi.fn()}
        onRollAllMonsterInitiative={handleRoll}
      />
    );

    const rollButton = screen.getByRole('button', { name: /Losuj Inicjatywę Potworów/i });
    fireEvent.click(rollButton);

    expect(handleRoll).toHaveBeenCalledTimes(1);
  });
});
