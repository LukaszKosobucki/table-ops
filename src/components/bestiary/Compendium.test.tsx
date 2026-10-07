import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CharacterInspectionCard } from '@/components/dashboard/CharacterInspectionCard';
import type { DashboardCharacter } from '@/components/dashboard/types';
import type { CompendiumItem, CompendiumSpell } from '@/lib/compendium';
import type { MonsterData } from '@/lib/monsters';
import { Bestiary } from './Bestiary';

const mockMonsters: MonsterData[] = [
  {
    index: 'goblin',
    name: 'Goblin',
    armorClass: 15,
    hitPoints: 7,
    challengeRating: 0.25,
    xp: 50,
    stats: { str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8 },
  },
  {
    index: 'ogre',
    name: 'Ogr',
    armorClass: 11,
    hitPoints: 59,
    challengeRating: 2,
    xp: 450,
    stats: { str: 19, dex: 8, con: 16, int: 5, wis: 7, cha: 7 },
  },
];

const mockSpells: CompendiumSpell[] = [
  {
    index: 'cure-wounds',
    name: 'Cure Wounds',
    level: 1,
    school: 'Evocation',
    castingTime: '1 akcja',
    range: 'Dotyk',
    duration: 'Natychmiastowy',
    components: ['V', 'S'],
    ritual: false,
    concentration: false,
    classes: ['Cleric', 'Druid', 'Paladin'],
    description:
      'Stworzenie dotknięte przez ciebie odzyskuje punkty życia równe 1k8 + modyfikator.',
  },
  {
    index: 'fireball',
    name: 'Fireball',
    level: 3,
    school: 'Evocation',
    castingTime: '1 akcja',
    range: '150 stóp',
    duration: 'Natychmiastowy',
    components: ['V', 'S', 'M'],
    material: 'Kula guana i siarka',
    ritual: false,
    concentration: false,
    classes: ['Sorcerer', 'Wizard'],
    description: 'Jasny promień wystrzeliwuje z twojego palca...',
  },
];

const mockItems: CompendiumItem[] = [
  {
    index: 'longsword',
    name: 'Longsword',
    type: 'Weapon',
    rarity: 'Common',
    cost: '15 gp',
    weight: 3,
    properties: ['Versatile'],
    damage: { dice: '1d8', type: 'slashing' },
    description: 'Klasyczny miecz jednoręczny o stalowym obosiecznym ostrzu.',
  },
  {
    index: 'potion-of-healing',
    name: 'Potion of Healing',
    type: 'Potion',
    rarity: 'Common',
    cost: '50 gp',
    weight: 0.5,
    description: 'Magiczny czerwony płyn przywracający 2k4 + 2 punkty życia.',
  },
];

const mockCharacters: DashboardCharacter[] = [
  {
    id: 'hero-cleric',
    sessionId: 'sess-1',
    name: 'Brat Jan',
    type: 'HERO',
    class: 'Cleric',
    level: 2,
    currentHp: 18,
    maxHp: 18,
    ac: 16,
    passivePerception: 14,
    spells: {
      slots: { 1: { max: 3, used: 0 } },
      known: [],
    },
    inventory: ['Tarcza', 'Święty Symbol'],
  },
];

describe('Compendium (Bestiary, Spells, Items)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders default Bestiary sub-tab with monsters', () => {
    render(
      <Bestiary
        initialMonsters={mockMonsters}
        initialSpells={mockSpells}
        initialItems={mockItems}
        characters={mockCharacters}
      />
    );

    expect(screen.getByText('Kompendium Bestiariusza (D&D 5e SRD)')).toBeInTheDocument();
    expect(screen.getByText('Goblin')).toBeInTheDocument();
    expect(screen.getByText('Ogr')).toBeInTheDocument();
  });

  it('switches to spells subtab, filters by name, and opens detail modal', async () => {
    const user = userEvent.setup();

    render(
      <Bestiary
        initialMonsters={mockMonsters}
        initialSpells={mockSpells}
        initialItems={mockItems}
        characters={mockCharacters}
      />
    );

    // Switch to Spells tab
    const spellsTabBtn = screen.getByTestId('compendium-spells-tab');
    await user.click(spellsTabBtn);

    expect(screen.getByText('Księga Zaklęć (D&D 5e SRD)')).toBeInTheDocument();
    expect(screen.getByText('Cure Wounds')).toBeInTheDocument();
    expect(screen.getByText('Fireball')).toBeInTheDocument();

    // Filter spells
    const searchInput = screen.getByPlaceholderText(/Szukaj zaklęcia/i);
    await user.type(searchInput, 'Cure');

    expect(screen.getByText('Cure Wounds')).toBeInTheDocument();
    expect(screen.queryByText('Fireball')).not.toBeInTheDocument();

    // Click "Szczegóły"
    const detailsBtns = screen.getAllByRole('button', { name: /Szczegóły/i });
    await user.click(detailsBtns[0]);

    // Modal should be open
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(
      within(dialog).getByText(/Stworzenie dotknięte przez ciebie odzyskuje punkty życia/i)
    ).toBeInTheDocument();
  });

  it('switches to items subtab and filters items by search query', async () => {
    const user = userEvent.setup();

    render(
      <Bestiary
        initialMonsters={mockMonsters}
        initialSpells={mockSpells}
        initialItems={mockItems}
        characters={mockCharacters}
      />
    );

    // Switch to Items tab
    const itemsTabBtn = screen.getByTestId('compendium-items-tab');
    await user.click(itemsTabBtn);

    expect(screen.getByText('Ekwipunek i Przedmioty Magiczne (D&D 5e SRD)')).toBeInTheDocument();
    expect(screen.getByText('Longsword')).toBeInTheDocument();
    expect(screen.getByText('Potion of Healing')).toBeInTheDocument();

    // Filter by search
    const itemSearchInput = screen.getByPlaceholderText(/Szukaj przedmiotu/i);
    await user.type(itemSearchInput, 'Longsword');

    expect(screen.getByText('Longsword')).toBeInTheDocument();
    expect(screen.queryByText('Potion of Healing')).not.toBeInTheDocument();
  });

  it('assigns a spell to a hero character via AssignToCharacterModal', async () => {
    const user = userEvent.setup();
    const handleCharacterUpdate = vi.fn();

    // Mock fetch for PUT /api/characters/hero-cleric
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'hero-cleric' }),
    });

    render(
      <Bestiary
        initialMonsters={mockMonsters}
        initialSpells={mockSpells}
        initialItems={mockItems}
        characters={mockCharacters}
        onCharacterUpdate={handleCharacterUpdate}
      />
    );

    // Switch to spells
    await user.click(screen.getByTestId('compendium-spells-tab'));

    // Click "+ Dodaj" on Cure Wounds
    const addBtn = screen.getByTestId('assign-spell-btn-cure-wounds');
    await user.click(addBtn);

    // Modal opens
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText(/Przypisz do Postaci/i)).toBeInTheDocument();
    expect(within(dialog).getByText('Cure Wounds')).toBeInTheDocument();

    // Click "Zatwierdź i Przypisz"
    const confirmBtn = screen.getByTestId('confirm-assign-btn');
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(handleCharacterUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'hero-cleric',
          spells: expect.objectContaining({
            known: ['Cure Wounds'],
          }),
        })
      );
    });
  });

  it('assigns an item to a hero character and updates inventory', async () => {
    const user = userEvent.setup();
    const handleCharacterUpdate = vi.fn();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'hero-cleric' }),
    });

    render(
      <Bestiary
        initialMonsters={mockMonsters}
        initialSpells={mockSpells}
        initialItems={mockItems}
        characters={mockCharacters}
        onCharacterUpdate={handleCharacterUpdate}
      />
    );

    // Switch to items
    await user.click(screen.getByTestId('compendium-items-tab'));

    // Click "+ Dodaj" on Longsword
    const addBtn = screen.getByTestId('assign-item-btn-longsword');
    await user.click(addBtn);

    // Click confirm
    const confirmBtn = screen.getByTestId('confirm-assign-btn');
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(handleCharacterUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'hero-cleric',
          inventory: ['Tarcza', 'Święty Symbol', 'Longsword'],
        })
      );
    });
  });

  it('verifies CharacterInspectionCard displays known spells and inventory correctly', () => {
    const clericWithSpell: DashboardCharacter = {
      ...mockCharacters[0],
      spells: {
        slots: { 1: { max: 3, used: 1 } },
        known: ['Cure Wounds', 'Bless'],
      },
      inventory: ['Tarcza', 'Święty Symbol', 'Longsword'],
    };

    render(<CharacterInspectionCard character={clericWithSpell} onBackToCombat={() => {}} />);

    // Known spells section should be rendered
    expect(screen.getByTestId('known-spells-section')).toBeInTheDocument();
    expect(screen.getByText('Cure Wounds')).toBeInTheDocument();
    expect(screen.getByText('Bless')).toBeInTheDocument();

    // Inventory items should be rendered
    expect(screen.getByText('Longsword')).toBeInTheDocument();
    expect(screen.getByText('Święty Symbol')).toBeInTheDocument();
  });
});
