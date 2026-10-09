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

  it('renders "Dodaj do Walki" button and triggers onAddToCombat when clicked', () => {
    const handleAddToCombat = vi.fn();
    render(
      <CharacterInspectionCard
        character={mockCharacter}
        onBackToCombat={vi.fn()}
        onAddToCombat={handleAddToCombat}
        isInCombat={false}
      />
    );

    const addBtn = screen.getByTestId('inspect-add-to-combat-btn');
    expect(addBtn).toBeInTheDocument();
    fireEvent.click(addBtn);
    expect(handleAddToCombat).toHaveBeenCalledWith(mockCharacter);
  });

  it('renders "W Walce" badge when character is already in combat', () => {
    render(
      <CharacterInspectionCard
        character={mockCharacter}
        onBackToCombat={vi.fn()}
        onAddToCombat={vi.fn()}
        isInCombat={true}
      />
    );

    expect(screen.getByTestId('inspect-in-combat-badge')).toBeInTheDocument();
    expect(screen.queryByTestId('inspect-add-to-combat-btn')).not.toBeInTheDocument();
  });

  it('allows adding and removing inventory items with optimistic update and API synchronization', async () => {
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

    // Initial items present
    expect(screen.getByText('Księga zaklęć')).toBeInTheDocument();

    // Open add item input
    fireEvent.click(screen.getByTestId('open-add-item-btn'));
    const itemInput = screen.getByTestId('new-item-input');
    fireEvent.change(itemInput, { target: { value: 'Mikstura Niewidzialności' } });
    fireEvent.click(screen.getByTestId('confirm-add-item-btn'));

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          inventory: expect.arrayContaining(['Mikstura Niewidzialności']),
        })
      );
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/characters/char-test-1',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({
          inventory: ['Księga zaklęć', 'Różdżka magicznych pocisków', 'Mikstura Niewidzialności'],
        }),
      })
    );

    // Remove item
    const removeBtn = screen.getByTestId('remove-item-Księga zaklęć');
    fireEvent.click(removeBtn);

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          inventory: ['Różdżka magicznych pocisków'],
        })
      );
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/characters/char-test-1',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({
          inventory: ['Różdżka magicznych pocisków'],
        }),
      })
    );
  });

  it('allows adding a custom spell and removing a known spell', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, spells: [] }),
    } as Response);

    const charWithSpells: DashboardCharacter = {
      ...mockCharacter,
      spells: {
        slots: { 1: { max: 4, used: 0 } },
        known: ['Promień Mrozu'],
      },
    };

    const onUpdate = vi.fn();
    render(
      <CharacterInspectionCard
        character={charWithSpells}
        onBackToCombat={vi.fn()}
        onCharacterUpdate={onUpdate}
      />
    );

    // Initial known spell
    expect(screen.getByText('Promień Mrozu')).toBeInTheDocument();

    // Open spell form
    fireEvent.click(screen.getByTestId('open-add-spell-btn'));
    const customSpellInput = screen.getByTestId('custom-spell-input');
    fireEvent.change(customSpellInput, { target: { value: 'Tarcza Magiczna' } });
    fireEvent.click(screen.getByTestId('confirm-add-custom-spell-btn'));

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          spells: expect.objectContaining({
            known: ['Promień Mrozu', 'Tarcza Magiczna'],
          }),
        })
      );
    });

    // Remove spell
    const removeSpellBtn = screen.getByTestId('remove-spell-Promień Mrozu');
    fireEvent.click(removeSpellBtn);

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          spells: expect.objectContaining({
            known: [],
          }),
        })
      );
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/characters/char-test-1',
      expect.objectContaining({
        method: 'PUT',
        body: expect.stringContaining('Tarcza Magiczna'),
      })
    );
  });

  it('renders EXP progress and allows adding XP with API synchronization', async () => {
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

    // Initial XP progress is visible (level 3: 900 to 2,700)
    expect(screen.getByTestId('xp-progress-text')).toHaveTextContent(/900 \/ 2,700 XP/i);

    // Open add XP input
    fireEvent.click(screen.getByTestId('open-add-xp-btn'));
    const xpInput = screen.getByTestId('add-xp-input');
    fireEvent.change(xpInput, { target: { value: '500' } });
    fireEvent.click(screen.getByTestId('confirm-add-xp-btn'));

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          stats: expect.objectContaining({ xp: 1400 }),
        })
      );
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/characters/char-test-1',
      expect.objectContaining({
        method: 'PUT',
        body: expect.stringContaining('1400'),
      })
    );
  });

  it('opens LevelUpModal on milestone button click and handles level up flow', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
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

    // Click milestone level up button
    fireEvent.click(screen.getByTestId('milestone-level-up-btn'));

    // Modal opens
    expect(screen.getByTestId('level-up-modal')).toBeInTheDocument();
    expect(screen.getAllByText(/Awans na Poziom 4/i).length).toBeGreaterThan(0);

    // Allocate 2 ASI points to enable confirmation
    const plusStr = screen.getByTestId('asi-plus-str');
    fireEvent.click(plusStr);
    fireEvent.click(plusStr);

    // Confirm level up
    fireEvent.click(screen.getByTestId('level-up-confirm-btn'));

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 4,
          maxHp: 25, // 20 + 5 (avg 4 + CON 1)
          stats: expect.objectContaining({
            str: 10, // 8 + 2
          }),
        })
      );
    });
  });

  it('renders avatar image if avatarUrl is provided, or fallback letter when missing', () => {
    const charWithAvatar: DashboardCharacter = {
      ...mockCharacter,
      avatarUrl: 'https://images.unsplash.com/photo-wizard.jpg',
    };

    const { rerender } = render(
      <CharacterInspectionCard character={charWithAvatar} onBackToCombat={vi.fn()} />
    );

    const img = screen.getByTestId('inspection-card-avatar');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://images.unsplash.com/photo-wizard.jpg');

    // Rerender with character without avatar
    rerender(<CharacterInspectionCard character={mockCharacter} onBackToCombat={vi.fn()} />);
    expect(screen.getByTestId('inspection-card-avatar-fallback')).toBeInTheDocument();
    expect(screen.getByTestId('inspection-card-avatar-fallback')).toHaveTextContent('E');
  });

  it('casts a cantrip without consuming spell slots and triggers onCastSpell', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        spells: [
          {
            index: 'fire-bolt',
            name: 'Ognisty Pocisk',
            level: 0,
            school: 'Evocation',
            classes: ['Czarodziej'],
          },
        ],
      }),
    } as Response);

    const onCast = vi.fn();
    const onUpdate = vi.fn();
    const charWithCantrip: DashboardCharacter = {
      ...mockCharacter,
      sessionId: 'sess-123',
      spells: {
        slots: { 1: { max: 4, used: 0 } },
        known: ['Ognisty Pocisk'],
      },
    };

    render(
      <CharacterInspectionCard
        character={charWithCantrip}
        onBackToCombat={vi.fn()}
        onCharacterUpdate={onUpdate}
        onCastSpell={onCast}
      />
    );

    // Wait for compendium spells to load and update button text
    await waitFor(() => {
      expect(screen.getByTestId('cast-spell-Ognisty Pocisk')).toHaveTextContent('✨ Rzuć');
    });

    const castBtn = screen.getByTestId('cast-spell-Ognisty Pocisk');
    fireEvent.click(castBtn);

    await waitFor(() => {
      expect(onCast).toHaveBeenCalledWith('Ognisty Pocisk', 0, 'Eldrin Srebrny Liść');
    });

    // Slots should NOT be consumed for cantrips
    expect(onUpdate).not.toHaveBeenCalled();
    expect(screen.getByTestId('spell-cast-feedback')).toHaveTextContent(
      /Rzucono sztuczkę: Ognisty Pocisk/i
    );
  });

  it('casts a leveled spell, consumes slot and triggers onCastSpell', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        spells: [
          {
            index: 'magic-missile',
            name: 'Magiczny Pocisk',
            level: 1,
            school: 'Evocation',
            classes: ['Czarodziej'],
          },
        ],
      }),
    } as Response);

    const onCast = vi.fn();
    const onUpdate = vi.fn();
    const charWithSpell: DashboardCharacter = {
      ...mockCharacter,
      sessionId: 'sess-123',
      spells: {
        slots: { 1: { max: 4, used: 1 } },
        known: ['Magiczny Pocisk'],
      },
    };

    render(
      <CharacterInspectionCard
        character={charWithSpell}
        onBackToCombat={vi.fn()}
        onCharacterUpdate={onUpdate}
        onCastSpell={onCast}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('cast-spell-Magiczny Pocisk')).toHaveTextContent('⚡ Rzuć (K.1)');
    });

    const castBtn = screen.getByTestId('cast-spell-Magiczny Pocisk');
    fireEvent.click(castBtn);

    await waitFor(() => {
      expect(onCast).toHaveBeenCalledWith('Magiczny Pocisk', 1, 'Eldrin Srebrny Liść');
      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          spells: expect.objectContaining({
            slots: expect.objectContaining({
              1: { max: 4, used: 2 },
            }),
          }),
        })
      );
    });

    expect(screen.getByTestId('spell-cast-feedback')).toHaveTextContent(
      /Rzucono zaklęcie: Magiczny Pocisk \(1\. krąg\)/i
    );
  });

  it('upcasts a spell using next available higher slot when base slot is exhausted', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        spells: [
          {
            index: 'magic-missile',
            name: 'Magiczny Pocisk',
            level: 1,
            school: 'Evocation',
            classes: ['Czarodziej'],
          },
        ],
      }),
    } as Response);

    const onCast = vi.fn();
    const onUpdate = vi.fn();
    const charWithExhaustedSlot1: DashboardCharacter = {
      ...mockCharacter,
      sessionId: 'sess-123',
      spells: {
        slots: {
          1: { max: 4, used: 4 }, // Level 1 is completely exhausted!
          2: { max: 2, used: 0 }, // Level 2 has 2 available slots!
        },
        known: ['Magiczny Pocisk'],
      },
    };

    render(
      <CharacterInspectionCard
        character={charWithExhaustedSlot1}
        onBackToCombat={vi.fn()}
        onCharacterUpdate={onUpdate}
        onCastSpell={onCast}
      />
    );

    // Button should automatically adapt to use Level 2 slot
    await waitFor(() => {
      expect(screen.getByTestId('cast-spell-Magiczny Pocisk')).toHaveTextContent('⚡ Rzuć (K.2)');
    });

    const castBtn = screen.getByTestId('cast-spell-Magiczny Pocisk');
    fireEvent.click(castBtn);

    await waitFor(() => {
      expect(onCast).toHaveBeenCalledWith('Magiczny Pocisk', 2, 'Eldrin Srebrny Liść');
      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          spells: expect.objectContaining({
            slots: expect.objectContaining({
              1: { max: 4, used: 4 },
              2: { max: 2, used: 1 }, // Consumed Level 2 slot!
            }),
          }),
        })
      );
    });

    expect(screen.getByTestId('spell-cast-feedback')).toHaveTextContent(
      /Rzucono zaklęcie: Magiczny Pocisk \(używając wyższego 2\. kręgu\)/i
    );
  });

  it('renders skills list and toggles proficiency level (Chunk 11.2)', async () => {
    const onUpdate = vi.fn();
    render(
      <CharacterInspectionCard
        character={mockCharacter}
        onBackToCombat={vi.fn()}
        onCharacterUpdate={onUpdate}
      />
    );

    expect(screen.getByText('Biegłości w Umiejętnościach')).toBeInTheDocument();
    expect(screen.getByTestId('skill-row-arcana')).toBeInTheDocument();

    const toggleBtn = screen.getByTestId('skill-toggle-arcana');
    fireEvent.click(toggleBtn);

    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        proficiencies: expect.objectContaining({
          skills: expect.objectContaining({
            arcana: 'proficient',
          }),
        }),
      })
    );
  });

  it('triggers skill roll and displays banner and forwards to onRequestDiceRoll (Chunk 11.2)', () => {
    const handleDiceRoll = vi.fn();
    render(
      <CharacterInspectionCard
        character={mockCharacter}
        onBackToCombat={vi.fn()}
        onRequestDiceRoll={handleDiceRoll}
      />
    );

    const rollBtn = screen.getByTestId('skill-roll-stealth');
    fireEvent.click(rollBtn);

    expect(handleDiceRoll).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ type: 'd20', count: 1 })]),
      expect.any(Number),
      expect.objectContaining({
        characterId: mockCharacter.id,
        actionName: 'Test: Skradanie',
      })
    );

    expect(screen.getByText(/Test Umiejętności: Skradanie/i)).toBeInTheDocument();
  });

  it('renders defenses editor and allows adding resistance tag (Chunk 11.2)', () => {
    const onUpdate = vi.fn();
    render(
      <CharacterInspectionCard
        character={mockCharacter}
        onBackToCombat={vi.fn()}
        onCharacterUpdate={onUpdate}
      />
    );

    expect(screen.getByText('Odporności, Niewrażliwości i Zmysły')).toBeInTheDocument();
    const addResBtn = screen.getByTestId('add-resistance-btn');
    fireEvent.click(addResBtn);

    const fireBtn = screen.getByTestId('select-damage-type-fire');
    fireEvent.click(fireBtn);

    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        defenses: expect.objectContaining({
          resistances: expect.arrayContaining(['Ogień (Fire)']),
        }),
      })
    );
  });
});
