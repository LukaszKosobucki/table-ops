import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { getHealthStatus, PartySidebar } from './PartySidebar';
import type { DashboardCharacter } from './types';

describe('PartySidebar Component (Chunk 2.2)', () => {
  it('correctly calculates health status spectrum according to STYLEGUIDE.md', () => {
    expect(getHealthStatus(0, 30)).toBe('dead');
    expect(getHealthStatus(-5, 30)).toBe('dead');
    expect(getHealthStatus(6, 30)).toBe('critical'); // 20%
    expect(getHealthStatus(5, 30)).toBe('critical'); // < 20%
    expect(getHealthStatus(15, 30)).toBe('bloodied'); // 50%
    expect(getHealthStatus(12, 30)).toBe('bloodied'); // 40%
    expect(getHealthStatus(16, 30)).toBe('healthy'); // > 50%
    expect(getHealthStatus(30, 30)).toBe('healthy'); // 100%
  });

  const mockCharacters: DashboardCharacter[] = [
    {
      id: 'char-1',
      name: 'Thorgal Aegirsson',
      type: 'HERO',
      class: 'Barbarzyńca',
      race: 'Człowiek',
      level: 4,
      currentHp: 42,
      maxHp: 42,
      ac: 15,
      passivePerception: 13,
    },
    {
      id: 'npc-1',
      name: 'Aurelia ze Słonecznej Przystani',
      type: 'NPC',
      class: 'Kapłanka',
      race: 'Aasimar',
      level: 2,
      currentHp: 0,
      maxHp: 18,
      ac: 16,
      passivePerception: 15,
    },
  ];

  it('renders hero and NPC cards with HP, AC, and passive perception', () => {
    render(
      <PartySidebar
        characters={mockCharacters}
        selectedCharacterId={null}
        onSelectCharacter={vi.fn()}
      />
    );

    expect(screen.getByText('Thorgal Aegirsson')).toBeInTheDocument();
    expect(screen.getByText('Aurelia ze Słonecznej Przystani')).toBeInTheDocument();
    expect(screen.getByText('AC 15')).toBeInTheDocument();
    expect(screen.getByText('PP 13')).toBeInTheDocument();
    expect(screen.getByText('42/42')).toBeInTheDocument();

    // Check skull icon / 0 HP indication for dead NPC
    expect(screen.getByTitle('Nieprzytomny / Martwy (0 HP)')).toBeInTheDocument();
  });

  it('triggers onSelectCharacter when a character card is clicked', async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();

    render(
      <PartySidebar
        characters={mockCharacters}
        selectedCharacterId={null}
        onSelectCharacter={handleSelect}
      />
    );

    const heroCard = screen.getByText('Thorgal Aegirsson').closest('button');
    expect(heroCard).not.toBeNull();
    if (heroCard) {
      await user.click(heroCard);
      expect(handleSelect).toHaveBeenCalledWith(mockCharacters[0]);
    }
  });

  it('renders empty state when characters array is empty', () => {
    render(<PartySidebar characters={[]} selectedCharacterId={null} onSelectCharacter={vi.fn()} />);

    expect(screen.getByText('Brak postaci w tej sesji.')).toBeInTheDocument();
  });

  it('renders "Załaduj Drużynę do Walki" and triggers onAddPartyToCombat when clicked', async () => {
    const user = userEvent.setup();
    const handleAddParty = vi.fn();

    render(
      <PartySidebar
        characters={mockCharacters}
        selectedCharacterId={null}
        onSelectCharacter={vi.fn()}
        onAddPartyToCombat={handleAddParty}
        isCharacterInCombat={() => false}
      />
    );

    const addPartyBtn = screen.getByTestId('add-party-to-combat-btn');
    expect(addPartyBtn).toBeInTheDocument();
    expect(addPartyBtn).toHaveTextContent(/Załaduj Drużynę do Walki/i);

    await user.click(addPartyBtn);
    expect(handleAddParty).toHaveBeenCalledTimes(1);
  });

  it('renders "Do walki" on character cards and calls onAddCharacterToCombat', async () => {
    const user = userEvent.setup();
    const handleAddChar = vi.fn();

    render(
      <PartySidebar
        characters={mockCharacters}
        selectedCharacterId={null}
        onSelectCharacter={vi.fn()}
        onAddCharacterToCombat={handleAddChar}
        isCharacterInCombat={() => false}
      />
    );

    const addBtn = screen.getByTestId('add-to-combat-char-1');
    expect(addBtn).toBeInTheDocument();

    await user.click(addBtn);
    expect(handleAddChar).toHaveBeenCalledWith(mockCharacters[0]);
  });

  it('renders "W walce" badge when character is already in combat', () => {
    render(
      <PartySidebar
        characters={mockCharacters}
        selectedCharacterId={null}
        onSelectCharacter={vi.fn()}
        isCharacterInCombat={(id) => id === 'char-1'}
      />
    );

    expect(screen.getByTestId('in-combat-badge-char-1')).toBeInTheDocument();
    expect(screen.queryByTestId('add-to-combat-char-1')).not.toBeInTheDocument();
  });

  it('allows toggling group EXP distribution and calls onDistributePartyXp', async () => {
    const user = userEvent.setup();
    const handleDistribute = vi.fn();

    render(
      <PartySidebar
        characters={mockCharacters}
        selectedCharacterId={null}
        onSelectCharacter={vi.fn()}
        onDistributePartyXp={handleDistribute}
      />
    );

    const toggleBtn = screen.getByTestId('distribute-party-xp-toggle-btn');
    expect(toggleBtn).toBeInTheDocument();
    await user.click(toggleBtn);

    const input = screen.getByTestId('party-xp-input');
    await user.type(input, '400');

    const submitBtn = screen.getByTestId('confirm-party-xp-btn');
    await user.click(submitBtn);

    expect(handleDistribute).toHaveBeenCalledWith(400);
  });
});
