import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CombatantDefensesBadge } from './CombatantDefensesBadge';

describe('CombatantDefensesBadge Component', () => {
  it('does not render anything if there are no resistances, immunities, or senses', () => {
    const { container } = render(
      <CombatantDefensesBadge
        combatantId="c1"
        defenses={{
          resistances: [],
          damageImmunities: [],
          conditionImmunities: [],
          senses: [],
        }}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders a shield button when combatant has resistances or immunities', () => {
    render(
      <CombatantDefensesBadge
        combatantId="c1"
        defenses={{
          resistances: ['Ogień (Fire)'],
          damageImmunities: ['Trucizna (Poison)'],
          conditionImmunities: ['Przerażenie (Frightened)'],
          senses: ['Darkvision: 60 ft.'],
        }}
      />
    );

    const badgeBtn = screen.getByTestId('defenses-badge-btn-c1');
    expect(badgeBtn).toBeInTheDocument();
  });

  it('toggles the defenses popover when clicked', () => {
    render(
      <CombatantDefensesBadge
        combatantId="c1"
        defenses={{
          resistances: ['Ogień (Fire)'],
          damageImmunities: ['Trucizna (Poison)'],
          conditionImmunities: ['Przerażenie (Frightened)'],
          senses: ['Darkvision: 60 ft.'],
        }}
      />
    );

    const badgeBtn = screen.getByTestId('defenses-badge-btn-c1');
    fireEvent.click(badgeBtn);

    const popover = screen.getByTestId('defenses-popover-c1');
    expect(popover).toBeInTheDocument();
    expect(screen.getByText(/Ogień \(Fire\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Trucizna \(Poison\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Przerażenie \(Frightened\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Darkvision: 60 ft\./i)).toBeInTheDocument();
  });
});
