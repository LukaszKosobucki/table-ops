import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CharacterInspectionCard } from '@/components/dashboard/CharacterInspectionCard';
import { LogInspectionCard } from '@/components/dashboard/LogInspectionCard';
import { TimelineSidebar } from '@/components/dashboard/TimelineSidebar';
import type { DashboardCharacter, DashboardLog } from '@/components/dashboard/types';
import { CombatantCard } from '@/components/initiative/CombatantCard';
import type { Combatant } from '@/components/initiative/types';

describe('Dice Integration (Chunk 10.4)', () => {
  const sampleCharacter: DashboardCharacter = {
    id: 'hero-kaelen',
    name: 'Kaelen',
    type: 'HERO',
    class: 'Paladyn',
    level: 3,
    currentHp: 28,
    maxHp: 28,
    ac: 18,
    passivePerception: 12,
    stats: {
      str: 16, // modifier +3
      dex: 10, // modifier 0
      con: 14, // modifier +2
      int: 8, // modifier -1
      wis: 12, // modifier +1
      cha: 14, // modifier +2
    },
  };

  const sampleCombatant: Combatant = {
    id: 'comb-1',
    name: 'Goblin Wojownik',
    initiative: 14,
    currentHp: 7,
    maxHp: 7,
    ac: 15,
    isMonster: true,
    conditions: [],
  };

  describe('CharacterInspectionCard quick rolls', () => {
    it('calls onRequestDiceRoll with 1k20 and STR modifier when Test button is clicked', () => {
      const onRequestDiceRoll = vi.fn();
      render(
        <CharacterInspectionCard
          character={sampleCharacter}
          onBackToCombat={() => {}}
          onRequestDiceRoll={onRequestDiceRoll}
        />
      );

      const strTestBtn = screen.getByTestId('roll-test-str');
      fireEvent.click(strTestBtn);

      expect(onRequestDiceRoll).toHaveBeenCalledTimes(1);
      expect(onRequestDiceRoll).toHaveBeenCalledWith(
        [{ type: 'd20', count: 1 }],
        3,
        expect.objectContaining({
          characterId: 'hero-kaelen',
          characterName: 'Kaelen',
          actionName: 'Test: Siła (STR)',
        })
      );
    });

    it('calls onRequestDiceRoll with 1k20 and INT modifier for saving throw', () => {
      const onRequestDiceRoll = vi.fn();
      render(
        <CharacterInspectionCard
          character={sampleCharacter}
          onBackToCombat={() => {}}
          onRequestDiceRoll={onRequestDiceRoll}
        />
      );

      const intSaveBtn = screen.getByTestId('roll-save-int');
      fireEvent.click(intSaveBtn);

      expect(onRequestDiceRoll).toHaveBeenCalledTimes(1);
      expect(onRequestDiceRoll).toHaveBeenCalledWith(
        [{ type: 'd20', count: 1 }],
        -1,
        expect.objectContaining({
          characterId: 'hero-kaelen',
          characterName: 'Kaelen',
          actionName: 'Rzut Obronny: Inteligencja (INT)',
        })
      );
    });
  });

  describe('CombatantCard quick rolls', () => {
    it('renders quick dice roll button and calls onRequestDiceRoll', () => {
      const onRequestDiceRoll = vi.fn();
      render(
        <CombatantCard
          combatant={sampleCombatant}
          isActiveTurn={true}
          onHpChange={() => {}}
          onRemove={() => {}}
          onRequestDiceRoll={onRequestDiceRoll}
        />
      );

      const rollBtn = screen.getByTestId('combatant-roll-btn-comb-1');
      expect(rollBtn).toBeDefined();
      fireEvent.click(rollBtn);

      expect(onRequestDiceRoll).toHaveBeenCalledTimes(1);
      expect(onRequestDiceRoll).toHaveBeenCalledWith(
        [{ type: 'd20', count: 1 }],
        0,
        expect.objectContaining({
          combatantId: 'comb-1',
          characterName: 'Goblin Wojownik',
          actionName: 'Rzut: Goblin Wojownik',
        })
      );
    });
  });

  describe('TimelineSidebar DICE_ROLL display & filtering', () => {
    const mockLogs: DashboardLog[] = [
      {
        id: 'log-1',
        sessionId: 'session-1',
        logType: 'DICE_ROLL',
        description: '🎲 Rzut (Kaelen): 1k20 (17) + 3 = 20',
        metadata: {
          formula: '1d20 + 3',
          total: 20,
          isSecret: false,
          actorName: 'Kaelen',
        },
        createdAt: new Date().toISOString(),
      },
      {
        id: 'log-2',
        sessionId: 'session-1',
        logType: 'DICE_ROLL',
        description: '🎲 Rzut (Mistrz Gry): 2k6 (3, 5) + 2 = 10 (Tylko dla GM)',
        metadata: {
          formula: '2d6 + 2',
          total: 10,
          isSecret: true,
          actorName: 'Mistrz Gry',
        },
        createdAt: new Date().toISOString(),
      },
      {
        id: 'log-3',
        sessionId: 'session-1',
        logType: 'CUSTOM_NOTE',
        description: 'Drużyna rozbiła obóz pod murami twierdzy.',
        createdAt: new Date().toISOString(),
      },
    ];

    it('renders DICE_ROLL badge and secret badge for GM secret rolls', () => {
      render(
        <TimelineSidebar
          logs={mockLogs}
          selectedLogId={null}
          onSelectLog={() => {}}
          gmNotes=""
          onChangeGmNotes={() => {}}
        />
      );

      expect(screen.getAllByText('Rzut Kośćmi').length).toBe(2);
      expect(screen.getByTestId('secret-roll-badge')).toBeDefined();
      expect(screen.getByText('Tylko dla GM')).toBeDefined();
    });

    it('filters logs by Rzuty filter', () => {
      render(
        <TimelineSidebar
          logs={mockLogs}
          selectedLogId={null}
          onSelectLog={() => {}}
          gmNotes=""
          onChangeGmNotes={() => {}}
        />
      );

      const diceFilterBtn = screen.getByRole('button', { name: 'Rzuty' });
      fireEvent.click(diceFilterBtn);

      expect(screen.queryByText('Drużyna rozbiła obóz pod murami twierdzy.')).toBeNull();
      expect(screen.getByText('🎲 Rzut (Kaelen): 1k20 (17) + 3 = 20')).toBeDefined();
      expect(
        screen.getByText('🎲 Rzut (Mistrz Gry): 2k6 (3, 5) + 2 = 10 (Tylko dla GM)')
      ).toBeDefined();
    });
  });

  describe('LogInspectionCard DICE_ROLL details', () => {
    it('displays rich breakdown of dice results and GM secret status', () => {
      const diceLog: DashboardLog = {
        id: 'log-dice-secret',
        sessionId: 'session-1',
        logType: 'DICE_ROLL',
        description: '🎲 Rzut (Mistrz Gry): 1k20 (19) + 4 = 23 (Tylko dla GM)',
        metadata: {
          id: 'roll-123',
          formula: '1d20 + 4',
          total: 23,
          modifier: 4,
          actorName: 'Mistrz Gry',
          isSecret: true,
          diceResults: [{ type: 'd20', value: 19 }],
        },
        createdAt: new Date().toISOString(),
      };

      render(<LogInspectionCard log={diceLog} onBackToCombat={() => {}} />);

      expect(screen.getByTestId('dice-roll-inspection')).toBeDefined();
      expect(screen.getByTestId('inspect-dice-total').textContent).toBe('23');
      expect(screen.getByText('Mistrz Gry')).toBeDefined();
      expect(screen.getByText('Tylko GM')).toBeDefined();
      expect(screen.getByText('d20: 19')).toBeDefined();
    });
  });
});
