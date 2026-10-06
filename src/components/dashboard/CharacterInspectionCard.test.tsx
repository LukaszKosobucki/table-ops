import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CharacterInspectionCard } from './CharacterInspectionCard';
import type { DashboardCharacter } from './types';

describe('CharacterInspectionCard Component (Chunk 3.2)', () => {
  const mockCharacter: DashboardCharacter = {
    id: 'char-test-1',
    name: 'Eldrin Srebrny Liść',
    type: 'HERO',
    class: 'Czarodziej',
    race: 'Elf Wysoki',
    level: 3,
    currentHp: 16,
    maxHp: 20,
    ac: 12,
    passivePerception: 14,
    stats: {
      str: 8,
      dex: 14,
      con: 12,
      int: 18,
      wis: 13,
      cha: 10,
      tempHp: 5,
    },
    traits: ['Ciekawski i analityczny', 'Szuka zaginionej biblioteki'],
    inventory: ['Księga zaklęć', 'Różdżka magicznych pocisków'],
    spells: {
      slots: {
        1: { max: 4, used: 1 },
        2: { max: 2, used: 0 },
      },
    },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders character details and vitals correctly', () => {
    render(<CharacterInspectionCard character={mockCharacter} onBackToCombat={vi.fn()} />);

    expect(screen.getByText('Eldrin Srebrny Liść')).toBeInTheDocument();
    expect(screen.getByText(/Elf Wysoki • Czarodziej • Poziom 3/i)).toBeInTheDocument();
    expect(screen.getByText('12 AC')).toBeInTheDocument();
    expect(screen.getByText('14 PP')).toBeInTheDocument();
    expect(screen.getByText('+5 temp')).toBeInTheDocument();
  });

  it('applies damage and updates health bar interactively', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    const onUpdate = vi.fn();
    render(
      <CharacterInspectionCard
        character={mockCharacter}
        onBackToCombat={vi.fn()}
        onCharacterUpdate={onUpdate}
      />
    );

    // Initial state: 16 HP, 5 temp HP
    // Klikamy przycisk ran "-5" -> 5 temp HP pochłania całe 5 obrażeń, currentHp pozostaje 16, tempHp spada do 0
    const dmg5Btn = screen.getByText('-5');
    fireEvent.click(dmg5Btn);

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          currentHp: 16,
          stats: expect.objectContaining({ tempHp: 0 }),
        })
      );
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/characters/char-test-1/hp',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ action: 'damage', amount: 5 }),
      })
    );
  });

  it('applies healing and caps at maxHp', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    const onUpdate = vi.fn();
    render(
      <CharacterInspectionCard
        character={mockCharacter}
        onBackToCombat={vi.fn()}
        onCharacterUpdate={onUpdate}
      />
    );

    // 16/20 HP -> klikamy "+10" leczenia -> powinno ograniczyć się do 20/20 HP
    const heal10Btn = screen.getByText('+10');
    fireEvent.click(heal10Btn);

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          currentHp: 20,
        })
      );
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/characters/char-test-1/hp',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ action: 'heal', amount: 10 }),
      })
    );
  });

  it('renders interactive spell slot dots and toggles usage', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    const onUpdate = vi.fn();
    render(
      <CharacterInspectionCard
        character={mockCharacter}
        onBackToCombat={vi.fn()}
        onCharacterUpdate={onUpdate}
      />
    );

    // Krąg 1: 4 sloty, 1 użyty (więc 3 wolne). Sprawdzamy czy renderuje Krąg 1
    expect(screen.getByText('Krąg 1')).toBeInTheDocument();
    expect(screen.getByText('3/4 wolne')).toBeInTheDocument();

    // Klikamy dostępną kropkę (●) w Kręgu 1
    const availableDots = screen.getAllByTitle(/Dostępny/i);
    fireEvent.click(availableDots[0]);

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalled();
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/characters/char-test-1/slots',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ slotLevel: 1, action: 'use' }),
      })
    );
  });

  it('rolls d20 attribute test and saving throw on button click', () => {
    render(<CharacterInspectionCard character={mockCharacter} onBackToCombat={vi.fn()} />);

    // Klikamy "Test" dla Inteligencji (INT 18, modyfikator +4)
    const testButtons = screen.getAllByRole('button', { name: /Test/i });
    fireEvent.click(testButtons[3]); // INT is 4th in order

    // Powinien pojawić się banner wyniku
    expect(screen.getByText(/Rzut na Atrybut: Inteligencja/i)).toBeInTheDocument();

    // Zamknięcie bannera
    fireEvent.click(screen.getByText('Zamknij'));
    expect(screen.queryByText(/Rzut na Atrybut:/i)).not.toBeInTheDocument();

    // Kliknięcie "Obrona"
    const saveButtons = screen.getAllByRole('button', { name: /Obrona/i });
    fireEvent.click(saveButtons[0]);
    expect(screen.getByText(/Rzut Obronny:/i)).toBeInTheDocument();
  });
});
