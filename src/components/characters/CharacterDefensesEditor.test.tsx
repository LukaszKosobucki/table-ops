import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CharacterDefensesEditor } from './CharacterDefensesEditor';

describe('CharacterDefensesEditor Component', () => {
  it('renders existing resistances, immunities, and senses', () => {
    render(
      <CharacterDefensesEditor
        defenses={{
          resistances: ['Ogień (Fire)'],
          damageImmunities: ['Trucizna (Poison)'],
          conditionImmunities: ['Przerażenie (Frightened)'],
          senses: ['Widzenie w ciemności 18m'],
        }}
      />
    );

    expect(screen.getByText(/Ogień \(Fire\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Trucizna \(Poison\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Przerażenie \(Frightened\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Widzenie w ciemności 18m/i)).toBeInTheDocument();
  });

  it('allows adding a resistance from damage types list', () => {
    const handleChange = vi.fn();
    render(
      <CharacterDefensesEditor
        defenses={{
          resistances: [],
          damageImmunities: [],
          conditionImmunities: [],
          senses: [],
        }}
        onChange={handleChange}
      />
    );

    // Click toggle to open damage types picker
    const addResBtn = screen.getByTestId('add-resistance-btn');
    fireEvent.click(addResBtn);

    // Click on "Zimno" (Cold)
    const coldBtn = screen.getByTestId('select-damage-type-cold');
    fireEvent.click(coldBtn);

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        resistances: expect.arrayContaining(['Zimno (Cold)']),
      })
    );
  });

  it('allows removing an existing resistance tag', () => {
    const handleChange = vi.fn();
    render(
      <CharacterDefensesEditor
        defenses={{
          resistances: ['Ogień (Fire)'],
          damageImmunities: [],
          conditionImmunities: [],
          senses: [],
        }}
        onChange={handleChange}
      />
    );

    const removeBtn = screen.getByTestId('remove-resistance-Ogień (Fire)');
    fireEvent.click(removeBtn);

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        resistances: [],
      })
    );
  });
});
