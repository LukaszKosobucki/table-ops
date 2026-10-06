import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DashboardCharacter } from '@/components/dashboard/types';
import type { MonsterData } from '@/lib/monsters';
import { EncounterBuilder } from './EncounterBuilder';

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

const mockCharacters: DashboardCharacter[] = [
  {
    id: 'char-1',
    name: 'Valerius',
    type: 'HERO',
    level: 3,
    currentHp: 28,
    maxHp: 28,
    ac: 18,
    passivePerception: 13,
  },
  {
    id: 'char-2',
    name: 'Eldrin',
    type: 'HERO',
    level: 3,
    currentHp: 16,
    maxHp: 16,
    ac: 12,
    passivePerception: 14,
  },
];

const mockSavedEncounters = [
  {
    id: 'enc-1',
    sessionId: 'sess-test',
    name: 'Zasadzka Goblinów',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    members: [
      {
        id: 'mem-1',
        groupId: 'enc-1',
        characterId: null,
        monsterId: null,
        apiMonsterId: 'goblin',
        count: 4,
        monster: mockMonsters[0],
      },
    ],
  },
];

describe('EncounterBuilder Component (Chunk 4.2)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/sessions/sess-test/encounters')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            encounters: mockSavedEncounters,
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true }),
      });
    });
  });

  it('renders encounter builder with party summary and saved encounters list', async () => {
    render(
      <EncounterBuilder
        sessionId="sess-test"
        monsters={mockMonsters}
        characters={mockCharacters}
        onBackToCombat={vi.fn()}
        onLoadCombatants={vi.fn()}
      />
    );

    expect(screen.getByText(/Kreator Potyczek \(Encounter Builder\)/i)).toBeInTheDocument();
    // Party summary
    expect(screen.getByText(/Aktywna drużyna:/i)).toBeInTheDocument();
    expect(screen.getByText(/2 bohaterów/i)).toBeInTheDocument();

    // Wait for saved encounters to load
    await waitFor(() => {
      expect(screen.getByText('Zasadzka Goblinów')).toBeInTheDocument();
      expect(screen.getByText('x4')).toBeInTheDocument();
    });

    // Difficulty badge for 4 goblins (4 * 50 = 200 base XP, 2.5x mult for party < 3 = 500 adjusted XP)
    // Party of two lvl 3 heroes: Easy 150, Medium 300, Hard 450, Deadly 800
    // 500 is >= Hard (450) and < Deadly (800) => Hard encounter
    expect(screen.getByTestId('difficulty-badge-hard')).toBeInTheDocument();
  });

  it('loads saved encounter into combat with generated combatants', async () => {
    const user = userEvent.setup();
    const handleLoadCombatants = vi.fn();
    const handleBackToCombat = vi.fn();

    render(
      <EncounterBuilder
        sessionId="sess-test"
        monsters={mockMonsters}
        characters={mockCharacters}
        onBackToCombat={handleBackToCombat}
        onLoadCombatants={handleLoadCombatants}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Zasadzka Goblinów')).toBeInTheDocument();
    });

    const loadBtn = screen.getByTestId('load-encounter-btn');
    await user.click(loadBtn);

    expect(handleLoadCombatants).toHaveBeenCalledTimes(1);
    const passedCombatants = handleLoadCombatants.mock.calls[0][0];
    expect(passedCombatants).toHaveLength(4);
    expect(passedCombatants[0].name).toBe('Goblin #1');
    expect(passedCombatants[3].name).toBe('Goblin #4');
    expect(handleBackToCombat).toHaveBeenCalledTimes(1);
  });

  it('allows building a new encounter with live difficulty evaluation and saving it', async () => {
    const user = userEvent.setup();

    global.fetch = vi.fn().mockImplementation((url: string, options?: RequestInit) => {
      if (url.includes('/api/sessions/sess-test/encounters')) {
        if (options?.method === 'POST') {
          const body = JSON.parse(options.body as string);
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              encounter: {
                id: 'enc-new-1',
                sessionId: 'sess-test',
                name: body.name,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                members: body.members.map(
                  (m: { apiMonsterId: string; count: number }, idx: number) => ({
                    id: `mem-new-${idx}`,
                    apiMonsterId: m.apiMonsterId,
                    count: m.count,
                    monster: mockMonsters.find((mon) => mon.index === m.apiMonsterId),
                  })
                ),
              },
            }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            encounters: [],
          }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({ success: true }) });
    });

    render(
      <EncounterBuilder
        sessionId="sess-test"
        monsters={mockMonsters}
        characters={mockCharacters}
        onBackToCombat={vi.fn()}
        onLoadCombatants={vi.fn()}
      />
    );

    // Click "Nowa Potyczka"
    const newBtn = screen.getByTestId('new-encounter-btn');
    await user.click(newBtn);

    // Form inputs should appear
    const nameInput = screen.getByTestId('encounter-name-input');
    await user.type(nameInput, 'Legowisko Ogra');

    // Select monster and add
    const select = screen.getByTestId('monster-select');
    await user.selectOptions(select, 'ogre');

    const addBtn = screen.getByTestId('add-monster-btn');
    await user.click(addBtn);

    // Ogre should be added to draft list
    expect(screen.getByText('Ogr')).toBeInTheDocument();
    // 1 Ogre = 450 XP (adjusted XP for party of two lvl 3 heroes: multiplier 1.5x for party < 3 -> 675 adjusted XP => Hard encounter)
    expect(screen.getByTestId('difficulty-badge-hard')).toBeInTheDocument();

    // Save encounter
    const saveBtn = screen.getByTestId('save-encounter-btn');
    await user.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText('Legowisko Ogra')).toBeInTheDocument();
    });
  });
});
