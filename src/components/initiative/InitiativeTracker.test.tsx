import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { InitiativeTracker } from './InitiativeTracker';
import type { Combatant } from './types';

describe('InitiativeTracker Component (Chunk 5.2)', () => {
  const mockMonsters = [
    {
      id: 'goblin-id',
      index: 'goblin',
      name: 'Goblin',
      type: 'Humanoid',
      challengeRating: 0.25,
      xp: 50,
      armorClass: 15,
      hitPoints: 7,
      stats: {
        str: 8,
        dex: 14,
        con: 10,
        int: 10,
        wis: 8,
        cha: 8,
      },
      actions: [],
    },
  ];

  const mockCombatants: Combatant[] = [
    {
      id: 'pc-1',
      characterId: 'char-1',
      name: 'Valerius (Paladyn)',
      initiative: 20,
      currentHp: 25,
      maxHp: 28,
      ac: 18,
      isMonster: false,
      conditions: [],
      statuses: [{ id: 'st-val-1', statusName: 'Stunned', durationTurns: 1 }],
    },
    {
      id: 'm-1',
      monsterId: 'goblin-id',
      name: 'Goblin Łucznik',
      initiative: 10,
      currentHp: 7,
      maxHp: 7,
      ac: 15,
      isMonster: true,
      conditions: [],
      statuses: [],
    },
  ];

  it('renders combatants in active combat by default', () => {
    render(<InitiativeTracker monsters={mockMonsters} combatants={mockCombatants} />);

    expect(screen.getAllByText('Valerius (Paladyn)')[0]).toBeInTheDocument();
    expect(screen.getByText('Goblin Łucznik')).toBeInTheDocument();
    expect(screen.getByText('Runda 1')).toBeInTheDocument();
    expect(screen.getByText(/Aktywna Potyczka/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Następna Tura/i })).toBeInTheDocument();
  });

  it('cycles turns across combatants and increments round counter', () => {
    render(<InitiativeTracker monsters={mockMonsters} combatants={mockCombatants} />);

    const nextTurnBtn = screen.getByRole('button', { name: /Następna Tura/i });

    // Turn 1 -> Turn 2 (Goblin's turn)
    fireEvent.click(nextTurnBtn);
    expect(screen.getByText('Runda 1')).toBeInTheDocument();

    // Turn 2 -> Round 2 (cycles back to Valerius)
    fireEvent.click(nextTurnBtn);
    expect(screen.getByText('Runda 2')).toBeInTheDocument();
  });

  it('decrements timed status on active combatant and removes expired status when duration reaches 0', () => {
    const combatantsWithStatus: Combatant[] = [
      {
        id: 'c-1',
        name: 'Bohater A',
        initiative: 20,
        currentHp: 20,
        maxHp: 20,
        ac: 14,
        isMonster: false,
        conditions: ['Poisoned'],
        statuses: [{ id: 'st-p1', statusName: 'Poisoned', durationTurns: 2 }],
      },
      {
        id: 'c-2',
        name: 'Bohater B',
        initiative: 10,
        currentHp: 20,
        maxHp: 20,
        ac: 14,
        isMonster: false,
        conditions: [],
        statuses: [],
      },
    ];

    render(<InitiativeTracker monsters={mockMonsters} combatants={combatantsWithStatus} />);

    // Initial status has 2 tury
    expect(screen.getByText('2 tury')).toBeInTheDocument();

    const nextTurnBtn = screen.getByRole('button', { name: /Następna Tura/i });

    // Turn advances to Bohater B
    fireEvent.click(nextTurnBtn);

    // Turn advances back to Bohater A (Round 2 starts -> duration decrements to 1)
    fireEvent.click(nextTurnBtn);
    expect(screen.getByText('1 tura')).toBeInTheDocument();

    // Turn advances to Bohater B
    fireEvent.click(nextTurnBtn);

    // Turn advances back to Bohater A (Round 3 starts -> duration reaches 0 and expires)
    fireEvent.click(nextTurnBtn);
    expect(screen.queryByText('1 tura')).not.toBeInTheDocument();
    expect(screen.queryByText('2 tury')).not.toBeInTheDocument();
  });

  it('handles PREPARING -> ACTIVE transition via "Rozpocznij Walkę"', () => {
    render(
      <InitiativeTracker
        monsters={mockMonsters}
        combatants={mockCombatants}
        initialPhase="PREPARING"
      />
    );

    expect(screen.getAllByText(/Faza Przygotowania/i)[0]).toBeInTheDocument();
    const startBtn = screen.getByTestId('start-combat-btn');
    expect(startBtn).toBeInTheDocument();

    fireEvent.click(startBtn);

    expect(screen.getByText(/Aktywna Potyczka/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Następna Tura/i })).toBeInTheDocument();
  });

  it('handles ACTIVE -> FINISHED transition via "Zakończ Walkę" and triggers onCombatEnd', () => {
    const handleCombatEnd = vi.fn();

    render(
      <InitiativeTracker
        monsters={mockMonsters}
        combatants={mockCombatants}
        onCombatEnd={handleCombatEnd}
      />
    );

    const endBtn = screen.getByTestId('end-combat-btn');
    fireEvent.click(endBtn);

    // Confirm ending combat since goblin is alive
    const confirmBtn = screen.getByTestId('confirm-end-combat-btn');
    fireEvent.click(confirmBtn);

    // Phase is now FINISHED
    expect(screen.getByRole('heading', { name: /Starcie Zakończone!/i })).toBeInTheDocument();
    expect(handleCombatEnd).toHaveBeenCalledWith(
      [{ characterId: 'char-1', hp: 25 }],
      expect.any(String),
      expect.any(Object)
    );

    // Queue is cleared: both monsters and heroes are removed from tracker
    expect(screen.getByText(/Brak postaci w walce/i)).toBeInTheDocument();
    expect(screen.queryByText('Wojownik Jan')).not.toBeInTheDocument();
    expect(screen.queryByText('Goblin Łucznik')).not.toBeInTheDocument();

    // Shows "Nowe Starcie" button
    const resetBtn = screen.getByTestId('reset-combat-summary-btn');
    expect(resetBtn).toBeInTheDocument();

    // Clicking reset takes back to PREPARING
    fireEvent.click(resetBtn);
    expect(screen.getAllByText(/Faza Przygotowania/i)[0]).toBeInTheDocument();
  });

  it('records actions in the Kronika Walki (Combat Log)', () => {
    render(<InitiativeTracker monsters={mockMonsters} combatants={mockCombatants} />);

    expect(screen.getByText(/Kronika Walki/i)).toBeInTheDocument();

    // Click next turn
    const nextTurnBtn = screen.getByRole('button', { name: /Następna Tura/i });
    fireEvent.click(nextTurnBtn);

    // Log should contain entry for Goblin's turn
    expect(screen.getByText(/Rozpoczęto turę Goblin Łucznik/i)).toBeInTheDocument();
  });

  it('records single action entry in Kronika Walki without duplicates on HP change', () => {
    const handleAddLog = vi.fn();
    render(
      <InitiativeTracker
        monsters={mockMonsters}
        combatants={mockCombatants}
        onAddLog={handleAddLog}
      />
    );

    // Click -5 HP on Goblin (second combatant)
    const minusFiveButtons = screen.getAllByTitle('-5 HP');
    const targetButton = minusFiveButtons[1];
    expect(targetButton).toBeDefined();
    if (targetButton) {
      fireEvent.click(targetButton);
    }

    // onAddLog should be called exactly once
    expect(handleAddLog).toHaveBeenCalledTimes(1);
    expect(handleAddLog).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'damage',
        text: expect.stringMatching(/Goblin Łucznik.*5 pkt obrażeń/),
      })
    );
  });

  it('renders "Załaduj Drużynę do Walki" button in empty state and calls onAddPartyToCombat', () => {
    const handleAddParty = vi.fn();
    render(
      <InitiativeTracker
        monsters={mockMonsters}
        combatants={[]}
        partyCount={3}
        onAddPartyToCombat={handleAddParty}
      />
    );

    const btn = screen.getByTestId('tracker-add-party-btn');
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveTextContent(/Załaduj Drużynę do Walki \(3\)/i);

    fireEvent.click(btn);
    expect(handleAddParty).toHaveBeenCalledTimes(1);
  });

  it('automatically skips dead and fled monsters during turn rotation, but keeps 0 HP heroes active', () => {
    const mixedCombatants: Combatant[] = [
      {
        id: 'hero-1',
        name: 'Wojownik Jan',
        initiative: 25,
        currentHp: 0, // downed but alive!
        maxHp: 30,
        ac: 16,
        isMonster: false,
        conditions: [],
        statuses: [],
      },
      {
        id: 'dead-goblin',
        name: 'Martwy Goblin',
        initiative: 20,
        currentHp: 0, // dead monster -> must be skipped
        maxHp: 10,
        ac: 12,
        isMonster: true,
        conditions: [],
        statuses: [],
      },
      {
        id: 'fled-orc',
        name: 'Zbiegły Ork',
        initiative: 15,
        currentHp: 15,
        maxHp: 15,
        ac: 13,
        isMonster: true,
        isFled: true, // fled monster -> must be skipped
        conditions: [],
        statuses: [],
      },
      {
        id: 'active-boss',
        name: 'Wódz Ogr',
        initiative: 10,
        currentHp: 50,
        maxHp: 50,
        ac: 14,
        isMonster: true,
        conditions: [],
        statuses: [],
      },
    ];

    render(
      <InitiativeTracker
        monsters={mockMonsters}
        combatants={mixedCombatants}
        initialPhase="ACTIVE"
      />
    );

    // Initial turn is on Wojownik Jan (hero at 0 HP is active!)
    expect(screen.getAllByText('Wojownik Jan')[0]).toBeInTheDocument();

    const nextTurnBtn = screen.getByRole('button', { name: /Następna Tura/i });

    // Click next turn -> should skip Martwy Goblin AND Zbiegły Ork and land straight on Wódz Ogr!
    fireEvent.click(nextTurnBtn);

    // Active badge should be on Wódz Ogr, not dead goblin or fled orc
    const ogreCards = screen.getAllByText('Wódz Ogr');
    expect(ogreCards.length).toBeGreaterThan(0);
    // Next click should wrap around back to Wojownik Jan
    fireEvent.click(nextTurnBtn);
    expect(screen.getByText('Runda 2')).toBeInTheDocument();
  });

  it('calculates 50% XP for fled enemies and generates detailed summary on combat end', () => {
    const handleCombatEnd = vi.fn();
    const endCombatants: Combatant[] = [
      {
        id: 'pc-1',
        characterId: 'char-1',
        name: 'Czarodziejka',
        initiative: 20,
        currentHp: 18,
        maxHp: 18,
        ac: 12,
        isMonster: false,
        conditions: [],
        statuses: [],
      },
      {
        id: 'm-dead',
        name: 'Goblin Poległy',
        initiative: 15,
        currentHp: 0,
        maxHp: 10,
        ac: 12,
        xp: 100, // Defeated -> 100 XP
        isMonster: true,
        conditions: [],
        statuses: [],
      },
      {
        id: 'm-fled',
        name: 'Goblin Zbieg',
        initiative: 10,
        currentHp: 8,
        maxHp: 10,
        ac: 12,
        xp: 100, // Fled -> 50 XP
        isFled: true,
        isMonster: true,
        conditions: [],
        statuses: [],
      },
    ];

    render(
      <InitiativeTracker
        monsters={mockMonsters}
        combatants={endCombatants}
        initialPhase="ACTIVE"
        onCombatEnd={handleCombatEnd}
      />
    );

    const endBtn = screen.getByTestId('end-combat-btn');
    fireEvent.click(endBtn);

    // Verify handleCombatEnd received full statistics
    expect(handleCombatEnd).toHaveBeenCalledWith(
      [{ characterId: 'char-1', hp: 18 }],
      expect.stringContaining('150 PD'), // 100 + 50 = 150 XP
      expect.objectContaining({
        totalXp: 150,
        defeatedEnemies: expect.arrayContaining([
          expect.objectContaining({ name: 'Goblin Poległy', xp: 100 }),
        ]),
        fledEnemies: expect.arrayContaining([
          expect.objectContaining({ name: 'Goblin Zbieg', xp: 50 }),
        ]),
      })
    );
  });

  it('shows warning modal when attempting to end combat with alive monsters and allows confirmation or cancellation', () => {
    const handleCombatEnd = vi.fn();
    const combatantsWithAliveMonster: Combatant[] = [
      {
        id: 'pc-1',
        characterId: 'char-1',
        name: 'Wojownik Jan',
        initiative: 18,
        currentHp: 20,
        maxHp: 20,
        ac: 16,
        isMonster: false,
        conditions: [],
        statuses: [],
      },
      {
        id: 'm-alive',
        name: 'Smok Czerwony',
        initiative: 12,
        currentHp: 150,
        maxHp: 150,
        ac: 19,
        isMonster: true,
        conditions: [],
        statuses: [],
      },
    ];

    render(
      <InitiativeTracker
        monsters={mockMonsters}
        combatants={combatantsWithAliveMonster}
        initialPhase="ACTIVE"
        onCombatEnd={handleCombatEnd}
      />
    );

    const endBtn = screen.getByTestId('end-combat-btn');
    fireEvent.click(endBtn);

    // Warning modal should be visible
    const modal = screen.getByTestId('end-combat-warning-modal');
    expect(modal).toBeInTheDocument();
    expect(screen.getByText(/Ostrzeżenie: Żywi przeciwnicy w starciu!/i)).toBeInTheDocument();
    expect(modal).toHaveTextContent('Smok Czerwony');
    expect(handleCombatEnd).not.toHaveBeenCalled();

    // Cancel ending combat
    const cancelBtn = screen.getByTestId('cancel-end-combat-btn');
    fireEvent.click(cancelBtn);

    expect(screen.queryByTestId('end-combat-warning-modal')).not.toBeInTheDocument();
    expect(handleCombatEnd).not.toHaveBeenCalled();

    // Click end combat again and confirm
    fireEvent.click(endBtn);
    expect(screen.getByTestId('end-combat-warning-modal')).toBeInTheDocument();

    const confirmBtn = screen.getByTestId('confirm-end-combat-btn');
    fireEvent.click(confirmBtn);

    expect(screen.queryByTestId('end-combat-warning-modal')).not.toBeInTheDocument();
    expect(handleCombatEnd).toHaveBeenCalledTimes(1);
  });
});
