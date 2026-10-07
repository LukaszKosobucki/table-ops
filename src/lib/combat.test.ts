import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  addCombatantToCombat,
  applyStatusToCombatant,
  type CombatPrismaClient,
  endCombat,
  getCombatById,
  nextTurn,
  removeStatusFromCombatant,
  startCombat,
  updateCombatantHp,
} from './combat';

describe('Combat Service & State Machine (Chunk 5.1)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('getCombatById', () => {
    it('returns combat record by id with relations', async () => {
      const mockCombat = { id: 'comb-1', status: 'ACTIVE', combatants: [] };
      const mockPrisma = {
        combat: {
          findUnique: vi.fn().mockResolvedValue(mockCombat),
        },
      } as unknown as CombatPrismaClient;

      const result = await getCombatById('comb-1', mockPrisma);
      expect(result).toEqual(mockCombat);
    });
  });

  describe('startCombat', () => {
    it('throws if session does not exist', async () => {
      const mockPrisma = {
        session: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
      } as unknown as CombatPrismaClient;

      await expect(
        startCombat(
          {
            sessionId: 'nonexistent',
            combatants: [],
          },
          mockPrisma
        )
      ).rejects.toThrow('Session not found');
    });

    it('creates active combat with combatants sorted by initiative descending', async () => {
      const mockSession = { id: 'sess-1' };
      const mockCreatedCombat = {
        id: 'combat-1',
        sessionId: 'sess-1',
        status: 'ACTIVE',
        currentRound: 1,
        currentTurnIndex: 0,
        combatants: [
          { id: 'cb-1', nameOverride: 'Valerius', initiative: 18, order: 0 },
          { id: 'cb-2', nameOverride: 'Goblin 1', initiative: 12, order: 1 },
          { id: 'cb-3', nameOverride: 'Goblin 2', initiative: 9, order: 2 },
        ],
      };

      const mockCreate = vi.fn().mockResolvedValue(mockCreatedCombat);
      const mockLogCreate = vi.fn().mockResolvedValue({ id: 'log-1' });

      const mockPrisma = {
        session: {
          findUnique: vi.fn().mockResolvedValue(mockSession),
        },
        combat: {
          create: mockCreate,
        },
        sessionLog: {
          create: mockLogCreate,
        },
      } as unknown as CombatPrismaClient;

      const result = await startCombat(
        {
          sessionId: 'sess-1',
          combatants: [
            { nameOverride: 'Goblin 2', initiative: 9, currentHp: 7, maxHp: 7, ac: 15 },
            { nameOverride: 'Valerius', initiative: 18, currentHp: 28, maxHp: 28, ac: 18 },
            { nameOverride: 'Goblin 1', initiative: 12, currentHp: 7, maxHp: 7, ac: 15 },
          ],
        },
        mockPrisma
      );

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            sessionId: 'sess-1',
            status: 'ACTIVE',
            currentRound: 1,
            currentTurnIndex: 0,
            combatants: {
              create: [
                expect.objectContaining({ nameOverride: 'Valerius', initiative: 18, order: 0 }),
                expect.objectContaining({ nameOverride: 'Goblin 1', initiative: 12, order: 1 }),
                expect.objectContaining({ nameOverride: 'Goblin 2', initiative: 9, order: 2 }),
              ],
            },
          }),
        })
      );
      expect(mockLogCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            sessionId: 'sess-1',
            logType: 'COMBAT_ACTION',
          }),
        })
      );
      expect(result.id).toBe('combat-1');
      expect(result.status).toBe('ACTIVE');
    });
  });

  describe('nextTurn', () => {
    it('advances currentTurnIndex within the same round', async () => {
      const mockCombat = {
        id: 'comb-1',
        sessionId: 'sess-1',
        status: 'ACTIVE',
        currentRound: 1,
        currentTurnIndex: 0,
        combatants: [
          { id: 'c-1', nameOverride: 'Hero', order: 0, statuses: [] },
          { id: 'c-2', nameOverride: 'Goblin', order: 1, statuses: [] },
        ],
      };

      const mockUpdate = vi.fn().mockResolvedValue({
        ...mockCombat,
        currentTurnIndex: 1,
      });

      const mockPrisma = {
        combat: {
          findUnique: vi.fn().mockResolvedValue(mockCombat),
          update: mockUpdate,
        },
        combatStatus: {
          update: vi.fn(),
          delete: vi.fn(),
        },
        sessionLog: {
          create: vi.fn().mockResolvedValue({ id: 'log-1' }),
        },
      } as unknown as CombatPrismaClient;

      const result = await nextTurn('comb-1', mockPrisma);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'comb-1' },
          data: {
            currentRound: 1,
            currentTurnIndex: 1,
          },
        })
      );
      expect(result.currentTurnIndex).toBe(1);
    });

    it('advances round to 2 and resets turn index to 0 at cycle completion', async () => {
      const mockCombat = {
        id: 'comb-1',
        sessionId: 'sess-1',
        status: 'ACTIVE',
        currentRound: 1,
        currentTurnIndex: 1,
        combatants: [
          { id: 'c-1', nameOverride: 'Hero', order: 0, statuses: [] },
          { id: 'c-2', nameOverride: 'Goblin', order: 1, statuses: [] },
        ],
      };

      const mockUpdate = vi.fn().mockResolvedValue({
        ...mockCombat,
        currentRound: 2,
        currentTurnIndex: 0,
      });

      const mockPrisma = {
        combat: {
          findUnique: vi.fn().mockResolvedValue(mockCombat),
          update: mockUpdate,
        },
        combatStatus: {
          update: vi.fn(),
          delete: vi.fn(),
        },
        sessionLog: {
          create: vi.fn().mockResolvedValue({ id: 'log-1' }),
        },
      } as unknown as CombatPrismaClient;

      const result = await nextTurn('comb-1', mockPrisma);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'comb-1' },
          data: {
            currentRound: 2,
            currentTurnIndex: 0,
          },
        })
      );
      expect(result.currentRound).toBe(2);
      expect(result.currentTurnIndex).toBe(0);
    });

    it('decrements active status duration and deletes expired statuses on turn start', async () => {
      const mockCombat = {
        id: 'comb-1',
        sessionId: 'sess-1',
        status: 'ACTIVE',
        currentRound: 1,
        currentTurnIndex: 0, // Next is turn 1 -> Goblin
        combatants: [
          { id: 'c-1', nameOverride: 'Hero', order: 0, statuses: [] },
          {
            id: 'c-2',
            nameOverride: 'Goblin',
            order: 1,
            statuses: [
              { id: 'st-1', statusName: 'Poisoned', durationTurns: 2 },
              { id: 'st-2', statusName: 'Stunned', durationTurns: 1 }, // Will expire (1 - 1 = 0)
            ],
          },
        ],
      };

      const mockStatusUpdate = vi.fn().mockResolvedValue({ id: 'st-1', durationTurns: 1 });
      const mockStatusDelete = vi.fn().mockResolvedValue({ id: 'st-2' });
      const mockCombatUpdate = vi.fn().mockResolvedValue({
        ...mockCombat,
        currentTurnIndex: 1,
      });

      const mockPrisma = {
        combat: {
          findUnique: vi.fn().mockResolvedValue(mockCombat),
          update: mockCombatUpdate,
        },
        combatStatus: {
          update: mockStatusUpdate,
          delete: mockStatusDelete,
        },
        sessionLog: {
          create: vi.fn().mockResolvedValue({ id: 'log-1' }),
        },
      } as unknown as CombatPrismaClient;

      await nextTurn('comb-1', mockPrisma);

      // st-1 should be updated from 2 to 1
      expect(mockStatusUpdate).toHaveBeenCalledWith({
        where: { id: 'st-1' },
        data: { durationTurns: 1 },
      });
      // st-2 should be deleted because duration <= 0
      expect(mockStatusDelete).toHaveBeenCalledWith({
        where: { id: 'st-2' },
      });
    });
  });

  describe('addCombatantToCombat', () => {
    it('appends a combatant with computed order and logs event', async () => {
      const mockCombat = {
        id: 'comb-1',
        sessionId: 'sess-1',
        status: 'ACTIVE',
        combatants: [
          { id: 'c-1', order: 0, initiative: 15 },
          { id: 'c-2', order: 1, initiative: 10 },
        ],
      };

      const mockCreated = {
        id: 'c-new',
        combatId: 'comb-1',
        nameOverride: 'Posiłki (Wilk)',
        initiative: 12,
        order: 2,
      };

      const mockPrisma = {
        combat: {
          findUnique: vi.fn().mockResolvedValue(mockCombat),
        },
        combatant: {
          create: vi.fn().mockResolvedValue(mockCreated),
        },
        sessionLog: {
          create: vi.fn().mockResolvedValue({ id: 'log-1' }),
        },
      } as unknown as CombatPrismaClient;

      const result = await addCombatantToCombat(
        'comb-1',
        {
          nameOverride: 'Posiłki (Wilk)',
          initiative: 12,
          currentHp: 11,
          maxHp: 11,
          ac: 13,
        },
        mockPrisma
      );

      expect(result.id).toBe('c-new');
      expect(result.order).toBe(2);
    });
  });

  describe('applyStatusToCombatant & removeStatusFromCombatant', () => {
    it('creates a status for a combatant and logs action', async () => {
      const mockCombatant = {
        id: 'cb-1',
        combatId: 'comb-1',
        nameOverride: 'Goblin',
        combat: { sessionId: 'sess-1' },
      };

      const mockStatus = {
        id: 'st-new',
        combatantId: 'cb-1',
        statusName: 'Blinded',
        durationTurns: 3,
      };

      const mockPrisma = {
        combatant: {
          findUnique: vi.fn().mockResolvedValue(mockCombatant),
        },
        combatStatus: {
          create: vi.fn().mockResolvedValue(mockStatus),
        },
        sessionLog: {
          create: vi.fn().mockResolvedValue({ id: 'log-1' }),
        },
      } as unknown as CombatPrismaClient;

      const result = await applyStatusToCombatant(
        {
          combatantId: 'cb-1',
          statusName: 'Blinded',
          durationTurns: 3,
        },
        mockPrisma
      );

      expect(result.statusName).toBe('Blinded');
      expect(result.durationTurns).toBe(3);
    });

    it('deletes status on remove', async () => {
      const mockPrisma = {
        combatStatus: {
          findUnique: vi.fn().mockResolvedValue({ id: 'st-1' }),
          delete: vi.fn().mockResolvedValue({ id: 'st-1' }),
        },
      } as unknown as CombatPrismaClient;

      const result = await removeStatusFromCombatant('st-1', mockPrisma);
      expect(result).toBe(true);
    });
  });

  describe('updateCombatantHp', () => {
    it('modifies combatant currentHp and clamps between 0 and maxHp', async () => {
      const mockCombatant = {
        id: 'cb-1',
        combatId: 'comb-1',
        nameOverride: 'Valerius',
        currentHp: 20,
        maxHp: 28,
        combat: { sessionId: 'sess-1' },
      };

      const mockUpdate = vi.fn().mockResolvedValue({
        ...mockCombatant,
        currentHp: 15,
      });

      const mockPrisma = {
        combatant: {
          findUnique: vi.fn().mockResolvedValue(mockCombatant),
          update: mockUpdate,
        },
        sessionLog: {
          create: vi.fn().mockResolvedValue({ id: 'log-1' }),
        },
      } as unknown as CombatPrismaClient;

      const result = await updateCombatantHp('comb-1', 'cb-1', { delta: -5 }, mockPrisma);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'cb-1' },
          data: { currentHp: 15 },
        })
      );
      expect(result?.currentHp).toBe(15);
    });
  });

  describe('endCombat', () => {
    it('sets status to FINISHED, syncs player hero character HP, and logs COMBAT_END', async () => {
      const mockCombat = {
        id: 'comb-1',
        sessionId: 'sess-1',
        status: 'ACTIVE',
        combatants: [
          {
            id: 'cb-hero',
            characterId: 'char-hero-1',
            currentHp: 14, // took 14 damage during combat
            nameOverride: 'Valerius',
          },
          {
            id: 'cb-monster',
            characterId: null,
            monsterId: 'mon-goblin',
            currentHp: 0,
            nameOverride: 'Goblin 1',
          },
        ],
      };

      const mockCharUpdate = vi.fn().mockResolvedValue({ id: 'char-hero-1', currentHp: 14 });
      const mockCombatUpdate = vi.fn().mockResolvedValue({
        ...mockCombat,
        status: 'FINISHED',
        endedAt: new Date(),
      });
      const mockLogCreate = vi.fn().mockResolvedValue({ id: 'log-1' });

      const mockPrisma = {
        combat: {
          findUnique: vi.fn().mockResolvedValue(mockCombat),
          update: mockCombatUpdate,
        },
        character: {
          update: mockCharUpdate,
        },
        sessionLog: {
          create: mockLogCreate,
        },
      } as unknown as CombatPrismaClient;

      const result = await endCombat('comb-1', mockPrisma);

      expect(mockCharUpdate).toHaveBeenCalledWith({
        where: { id: 'char-hero-1' },
        data: { currentHp: 14 },
      });
      expect(mockCombatUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'comb-1' },
          data: expect.objectContaining({
            status: 'FINISHED',
          }),
        })
      );
      expect(mockLogCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            sessionId: 'sess-1',
            combatId: 'comb-1',
            logType: 'COMBAT_END',
          }),
        })
      );
      expect(result.status).toBe('FINISHED');
    });

    it('synchronizes authoritative heroUpdates passed from client on combat end', async () => {
      const mockCombat = {
        id: 'comb-2',
        sessionId: 'sess-1',
        status: 'ACTIVE',
        combatants: [
          {
            id: 'cb-hero-1',
            characterId: 'char-hero-1',
            currentHp: 20, // DB had 20
            nameOverride: 'Valerius',
          },
        ],
      };

      const mockCharUpdate = vi.fn().mockResolvedValue({ id: 'char-hero-1', currentHp: 5 });
      const mockCombatantUpdate = vi.fn().mockResolvedValue({ id: 'cb-hero-1', currentHp: 5 });
      const mockCombatUpdate = vi.fn().mockResolvedValue({
        ...mockCombat,
        status: 'FINISHED',
        endedAt: new Date(),
      });
      const mockLogCreate = vi.fn().mockResolvedValue({ id: 'log-1' });

      const mockPrisma = {
        combat: {
          findUnique: vi.fn().mockResolvedValue(mockCombat),
          update: mockCombatUpdate,
        },
        combatant: {
          update: mockCombatantUpdate,
        },
        character: {
          update: mockCharUpdate,
        },
        sessionLog: {
          create: mockLogCreate,
        },
      } as unknown as CombatPrismaClient;

      // Client says final HP is 5 (e.g. after rapid clicks)
      const result = await endCombat(
        'comb-2',
        { heroUpdates: [{ characterId: 'char-hero-1', hp: 5 }] },
        mockPrisma
      );

      expect(mockCharUpdate).toHaveBeenCalledWith({
        where: { id: 'char-hero-1' },
        data: { currentHp: 5 },
      });
      expect(mockCombatantUpdate).toHaveBeenCalledWith({
        where: { id: 'cb-hero-1' },
        data: { currentHp: 5 },
      });
      expect(result.status).toBe('FINISHED');
    });
  });
});
