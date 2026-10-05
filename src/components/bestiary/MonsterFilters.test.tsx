import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MonsterFilters } from './MonsterFilters';

describe('MonsterFilters Component', () => {
  it('renders search input and responds to user typing', () => {
    const handleSearchChange = vi.fn();
    render(
      <MonsterFilters
        searchQuery=""
        onSearchChange={handleSearchChange}
        selectedCr="ALL"
        onCrChange={vi.fn()}
        selectedType="ALL"
        onTypeChange={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText('Szukaj potwora...');
    expect(input).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'Goblin' } });
    expect(handleSearchChange).toHaveBeenCalledWith('Goblin');
  });

  it('triggers onCrChange when CR select is updated', () => {
    const handleCrChange = vi.fn();
    render(
      <MonsterFilters
        searchQuery=""
        onSearchChange={vi.fn()}
        selectedCr="ALL"
        onCrChange={handleCrChange}
        selectedType="ALL"
        onTypeChange={vi.fn()}
      />
    );

    const selects = screen.getAllByRole('combobox');
    const crSelect = selects[0]; // First select is CR

    fireEvent.change(crSelect, { target: { value: '2' } });
    expect(handleCrChange).toHaveBeenCalledWith('2');
  });

  it('triggers onTypeChange when Type select is updated', () => {
    const handleTypeChange = vi.fn();
    render(
      <MonsterFilters
        searchQuery=""
        onSearchChange={vi.fn()}
        selectedCr="ALL"
        onCrChange={vi.fn()}
        selectedType="ALL"
        onTypeChange={handleTypeChange}
      />
    );

    const selects = screen.getAllByRole('combobox');
    const typeSelect = selects[1]; // Second select is Type

    fireEvent.change(typeSelect, { target: { value: 'undead' } });
    expect(handleTypeChange).toHaveBeenCalledWith('undead');
  });
});
