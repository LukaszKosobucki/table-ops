import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DashboardCharacter } from '../dashboard/types';
import { LevelUpModal } from './LevelUpModal';

describe('LevelUpModal Component (Chunk 8.4)', () => {
  const mockFighter: DashboardCharacter = {
    id: 'char-fighter-1',
    sessionId: 'session-1',
    name: 'Gimli Syn Gloina',
    type: 'HERO',
    race: 'Krasnolud',
    class: 'Wojownik (Fighter)',
    level: 3,
    currentHp: 28,
    maxHp: 28,
    ac: 14,
    passivePerception: 10,
    stats: {
      str: 16,
      dex: 12,
      con: 14, // +2 mod
      int: 10,
      wis: 10,
      cha: 8,
      xp: 2800,
    },
    inventory: ['Długi miecz (Longsword)', 'Tarcza (Shield)'],
  };

  const mockWizard: DashboardCharacter = {
    id: 'char-wizard-1',
    sessionId: 'session-1',
    name: 'Raistlin Majere',
    type: 'HERO',
    race: 'Człowiek',
    class: 'Czarodziej (Wizard)',
    level: 2,
    currentHp: 12,
    maxHp: 12,
    ac: 12,
    passivePerception: 11,
    stats: {
      str: 8,
      dex: 14,
      con: 12, // +1 mod
      int: 16,
      wis: 12,
      cha: 10,
      xp: 950,
    },
    spells: {
      slots: { 1: { max: 3, used: 0 } },
      known: ['Magiczny Pocisk'],
    },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders modal with target level and HP calculation choices', () => {
    render(
      <LevelUpModal
        character={mockFighter}
        isOpen={true}
        onClose={vi.fn()}
        onApplyLevelUp={vi.fn()}
      />
    );

    // Awans z 3 na 4
    expect(screen.getAllByText(/Awans na Poziom 4/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Gimli Syn Gloina/i)).toBeInTheDocument();

    // Wybór HP: Fighter d10 (avg 6) + CON mod 2 = +8 HP
    expect(screen.getAllByText(/\+8 HP/i).length).toBeGreaterThan(0);
  });

  it('displays ASI step on level 4 and allows assigning ability points up to 2', async () => {
    const handleApply = vi.fn();
    render(
      <LevelUpModal
        character={mockFighter}
        isOpen={true}
        onClose={vi.fn()}
        onApplyLevelUp={handleApply}
      />
    );

    // Poziom 4 jest poziomem ASI
    expect(screen.getByText(/Zwiększenie Wartości Cech \(ASI\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Pozostało punktów: 2/i)).toBeInTheDocument();

    // Dodajemy +1 do Siły (STR: 16 -> 17)
    const plusStr = screen.getByTestId('asi-plus-str');
    fireEvent.click(plusStr);
    expect(screen.getByText(/Pozostało punktów: 1/i)).toBeInTheDocument();

    // Dodajemy +1 do Zręczności (DEX: 12 -> 13)
    const plusDex = screen.getByTestId('asi-plus-dex');
    fireEvent.click(plusDex);
    expect(screen.getByText(/Pozostało punktów: 0/i)).toBeInTheDocument();

    // Zatwierdzamy awans
    const confirmBtn = screen.getByTestId('level-up-confirm-btn');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(handleApply).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 4,
          maxHp: 36, // 28 + 8
          stats: expect.objectContaining({
            str: 17,
            dex: 13,
          }),
        })
      );
    });
  });

  it('allows rolling for Hit Die HP gain instead of taking the average', async () => {
    const handleApply = vi.fn();
    render(
      <LevelUpModal
        character={mockFighter}
        isOpen={true}
        onClose={vi.fn()}
        onApplyLevelUp={handleApply}
      />
    );

    // Wybieramy opcję rzutu kością
    const rollOptionBtn = screen.getByTestId('level-up-hp-roll-mode-btn');
    fireEvent.click(rollOptionBtn);

    // Klikamy przycisk rzutu
    const doRollBtn = screen.getByTestId('level-up-roll-dice-btn');
    fireEvent.click(doRollBtn);

    // Powinna pojawić się wylosowana wartość
    expect(screen.getByTestId('level-up-new-hp-preview')).toBeInTheDocument();
  });

  it('allows spellcasters to choose newly available spells upon leveling up', async () => {
    const handleApply = vi.fn();

    // Mock fetch for compendium spells
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        spells: [
          {
            index: 'scorching-ray',
            name: 'Płonące Promienie',
            level: 2,
            school: 'Evocation',
            classes: ['Wizard'],
          },
        ],
      }),
    } as Response);

    render(
      <LevelUpModal
        character={mockWizard}
        isOpen={true}
        onClose={vi.fn()}
        onApplyLevelUp={handleApply}
      />
    );

    // Awans na poziom 3 (Wizard odblokowuje 2. krąg)
    expect(screen.getAllByText(/Awans na Poziom 3/i)[0]).toBeInTheDocument();

    // Poziom 3 nie jest ASI
    expect(screen.queryByText(/Pozostało punktów: 2/i)).not.toBeInTheDocument();

    // Dodanie własnego zaklęcia
    const customSpellInput = screen.getByTestId('level-up-custom-spell-input');
    fireEvent.change(customSpellInput, { target: { value: 'Lustrzane Odbicia' } });
    fireEvent.click(screen.getByTestId('level-up-add-spell-btn'));

    expect(screen.getByText('Lustrzane Odbicia')).toBeInTheDocument();

    // Zatwierdzamy awans
    const confirmBtn = screen.getByTestId('level-up-confirm-btn');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(handleApply).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 3,
          spells: expect.objectContaining({
            known: expect.arrayContaining(['Magiczny Pocisk', 'Lustrzane Odbicia']),
            slots: expect.objectContaining({
              1: { max: 4, used: 0 },
              2: { max: 2, used: 0 },
            }),
          }),
        })
      );
    });
  });

  it('enforces spell limit of 2 for wizard, disables extra spell selection, and allows GM unlimited toggle', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        spells: [
          { index: 'spell-1', name: 'Ciemność', level: 2, school: 'Illusion', classes: ['Wizard'] },
          {
            index: 'spell-2',
            name: 'Kula Ognia',
            level: 2,
            school: 'Evocation',
            classes: ['Wizard'],
          },
          {
            index: 'spell-3',
            name: 'Pajęczyna',
            level: 2,
            school: 'Conjuration',
            classes: ['Wizard'],
          },
        ],
      }),
    } as Response);

    render(
      <LevelUpModal
        character={mockWizard}
        isOpen={true}
        onClose={vi.fn()}
        onApplyLevelUp={vi.fn()}
      />
    );

    // Initial counter: 0 / 2
    expect(screen.getByTestId('level-up-spell-counter')).toHaveTextContent('Wybrano: 0 / 2');

    // Wait for spells to render
    await waitFor(() => {
      expect(screen.getByTestId('level-up-select-spell-Ciemność')).toBeInTheDocument();
      expect(screen.getByTestId('level-up-select-spell-Pajęczyna')).toBeInTheDocument();
    });

    // Select Spell 1
    fireEvent.click(screen.getByTestId('level-up-select-spell-Ciemność'));
    expect(screen.getByTestId('level-up-spell-counter')).toHaveTextContent('Wybrano: 1 / 2');

    // Select Spell 2
    fireEvent.click(screen.getByTestId('level-up-select-spell-Pajęczyna'));
    expect(screen.getByTestId('level-up-spell-counter')).toHaveTextContent('Wybrano: 2 / 2');

    // 3rd spell button should be disabled
    const thirdSpellBtn = screen.getByTestId('level-up-select-spell-Kula Ognia');
    expect(thirdSpellBtn).toBeDisabled();

    // Custom spell input should be disabled
    const customInput = screen.getByTestId('level-up-custom-spell-input');
    expect(customInput).toBeDisabled();

    // Toggle GM unlimited mode
    const toggleBtn = screen.getByTestId('toggle-unlimited-spells-btn');
    fireEvent.click(toggleBtn);

    // Badge changes to unlimited mode
    expect(screen.getByTestId('level-up-unlimited-badge')).toHaveTextContent(
      'Tryb swobodny GM (2)'
    );
    expect(thirdSpellBtn).not.toBeDisabled();

    // Now 3rd spell can be selected
    fireEvent.click(screen.getByTestId('level-up-select-spell-Kula Ognia'));
    expect(screen.getByTestId('level-up-unlimited-badge')).toHaveTextContent(
      'Tryb swobodny GM (3)'
    );
  });

  it('displays prepared caster badge and info for Cleric without locking', async () => {
    const mockCleric: DashboardCharacter = {
      id: 'char-cleric-1',
      sessionId: 'session-1',
      name: 'Brat Cadfael',
      type: 'HERO',
      race: 'Człowiek',
      class: 'Kleryk (Cleric)',
      level: 1,
      currentHp: 10,
      maxHp: 10,
      ac: 16,
      passivePerception: 13,
      stats: { str: 14, dex: 10, con: 12, int: 10, wis: 16, cha: 12 },
    };

    render(
      <LevelUpModal
        character={mockCleric}
        isOpen={true}
        onClose={vi.fn()}
        onApplyLevelUp={vi.fn()}
      />
    );

    // Displays prepared caster badge
    expect(screen.getByTestId('level-up-prepared-caster-badge')).toHaveTextContent(
      'Klasa przygotowująca'
    );
    expect(screen.getByText(/Kleryk, Druid i Paladyn znają wszystkie czary/i)).toBeInTheDocument();
  });

  it('opens SpellDetailModal when clicking spell info button during level up', async () => {
    const mockSpells = [
      {
        index: 'shield',
        name: 'Tarcza',
        level: 1,
        school: 'Abjuration',
        castingTime: '1 Reakcja',
        range: 'Własny',
        duration: '1 runda',
        components: ['V', 'S'],
        classes: ['Wizard'],
        description:
          'Niewidzialna bariera magicznej siły chroni cię, dodając +5 do Klasy Pancerza.',
      },
    ];

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      if (String(url).includes('/api/compendium/spells')) {
        return { ok: true, json: async () => ({ success: true, spells: mockSpells }) } as Response;
      }
      return { ok: true, json: async () => ({ success: true }) } as Response;
    });

    render(
      <LevelUpModal
        character={mockWizard}
        isOpen={true}
        onClose={vi.fn()}
        onApplyLevelUp={vi.fn()}
      />
    );

    // Wait for spells to load
    await waitFor(() => {
      expect(screen.getByTestId('level-up-spell-info-Tarcza')).toBeInTheDocument();
    });

    // Click the info button
    fireEvent.click(screen.getByTestId('level-up-spell-info-Tarcza'));

    // Verify modal is open and shows description
    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(
        within(dialog).getByText(/Niewidzialna bariera magicznej siły chroni cię/i)
      ).toBeInTheDocument();
      expect(within(dialog).getByText('1 Reakcja')).toBeInTheDocument();
    });
  });
});
