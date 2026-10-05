import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActiveRollDisplay } from './ActiveRollDisplay';

describe('ActiveRollDisplay Component', () => {
  it('renders default placeholder when activeRollResult is null', () => {
    render(
      <ActiveRollDisplay
        isRolling={false}
        activeRollResult={null}
      />
    );

    expect(screen.getByText('Wynik Ostatniego Rzutu')).toBeInTheDocument();
    expect(screen.getByText('--')).toBeInTheDocument();
  });

  it('renders the active roll result number', () => {
    render(
      <ActiveRollDisplay
        isRolling={false}
        activeRollResult={18}
      />
    );

    expect(screen.getByText('18')).toBeInTheDocument();
  });

  it('renders Natural 20 Critical Hit badge when lastLog is crit', () => {
    render(
      <ActiveRollDisplay
        isRolling={false}
        activeRollResult={25}
        lastLog={{
          id: '1',
          dice: 'D20',
          result: 20,
          modifier: 5,
          total: 25,
          timestamp: '12:00:00',
          isCrit: true,
          isFumble: false,
        }}
      />
    );

    expect(screen.getByText(/NATURAL 20 CRITICAL HIT!/i)).toBeInTheDocument();
  });

  it('renders Natural 1 Critical Fumble badge when lastLog is fumble', () => {
    render(
      <ActiveRollDisplay
        isRolling={false}
        activeRollResult={3}
        lastLog={{
          id: '2',
          dice: 'D20',
          result: 1,
          modifier: 2,
          total: 3,
          timestamp: '12:00:01',
          isCrit: false,
          isFumble: true,
        }}
      />
    );

    expect(screen.getByText(/NATURAL 1 CRITICAL FUMBLE!/i)).toBeInTheDocument();
  });

  it('applies blur/animation class while isRolling is true', () => {
    render(
      <ActiveRollDisplay
        isRolling={true}
        activeRollResult={15}
      />
    );

    const resultElement = screen.getByText('15');
    expect(resultElement.className).toContain('blur-[1px]');
  });
});
