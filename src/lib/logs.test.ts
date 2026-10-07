import { describe, expect, it, vi } from 'vitest';
import {
  createSessionLog,
  getCombatLogs,
  getSessionLogs,
  type LogsPrismaClient,
  validateSessionLogInput,
} from './logs';

describe('Logs Service (Chunk 7.1)', () => {
  describe('validateSessionLogInput', () => {
    it('accepts valid input with full details', () => {
      const res = validateSessionLogInput({
        sessionId: 'sess-123',
        logType: 'CUSTOM_NOTE',
        description: 'Drużyna spotkała tajemniczego wędrowca.',
        metadata: { location: 'Bractwo Wilka' },
      });

      expect(res.valid).toBe(true);
      if (res.valid) {
        expect(res.data.sessionId).toBe('sess-123');
        expect(res.data.logType).toBe('CUSTOM_NOTE');
        expect(res.data.description).toBe('Drużyna spotkała tajemniczego wędrowca.');
        expect(res.data.metadata).toEqual({ location: 'Bractwo Wilka' });
      }
    });

    it('rejects missing or empty sessionId', () => {
      const res1 = validateSessionLogInput({
        sessionId: '',
        logType: 'CUSTOM_NOTE',
        description: 'Test',
      });
      expect(res1.valid).toBe(false);

      const res2 = validateSessionLogInput({
        logType: 'CUSTOM_NOTE',
        description: 'Test',
      });
      expect(res2.valid).toBe(false);
    });

    it('rejects invalid logType', () => {
      const res = validateSessionLogInput({
        sessionId: 'sess-123',
        logType: 'INVALID_TYPE',
        description: 'Test',
      });
      expect(res.valid).toBe(false);
      if (!res.valid) {
        expect(res.error).toContain('logType');
      }
    });

    it('fills default description for REST_LONG if omitted', () => {
      const res = validateSessionLogInput({
        sessionId: 'sess-123',
        logType: 'REST_LONG',
      });
      expect(res.valid).toBe(true);
      if (res.valid) {
        expect(res.data.description).toContain('Długi Odpoczynek');
      }
    });

    it('fills default description for REST_SHORT if omitted', () => {
      const res = validateSessionLogInput({
        sessionId: 'sess-123',
        logType: 'REST_SHORT',
      });
      expect(res.valid).toBe(true);
      if (res.valid) {
        expect(res.data.description).toContain('Krótki Odpoczynek');
      }
    });
  });

  describe('getSessionLogs', () => {
    it('queries logs with proper ordering, limits and type filters', async () => {
      const mockFindMany = vi
        .fn()
        .mockResolvedValue([
          { id: 'log-1', sessionId: 'sess-1', logType: 'REST_LONG', description: 'Rest' },
        ]);
      const mockCount = vi.fn().mockResolvedValue(1);
      const mockSession = { id: 'sess-1', userId: 'user-1' };
      const mockSessionFindFirst = vi.fn().mockResolvedValue(mockSession);

      const mockClient = {
        session: {
          findUnique: vi.fn().mockResolvedValue(mockSession),
          findFirst: mockSessionFindFirst,
        },
        sessionLog: { findMany: mockFindMany, count: mockCount },
      } as unknown as LogsPrismaClient;

      const res = await getSessionLogs(
        'sess-1',
        { type: 'REST_LONG', limit: 10, offset: 0, userId: 'user-1' },
        mockClient
      );

      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          sessionId: 'sess-1',
          logType: 'REST_LONG',
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 0,
      });
      expect(res.logs).toHaveLength(1);
      expect(res.total).toBe(1);
    });

    it('returns empty result if session is not found or not owned by user', async () => {
      const mockSessionFindUnique = vi.fn().mockResolvedValue(null);
      const mockClient = {
        session: { findUnique: mockSessionFindUnique, findFirst: vi.fn().mockResolvedValue(null) },
        sessionLog: { findMany: vi.fn(), count: vi.fn() },
      } as unknown as LogsPrismaClient;

      const res = await getSessionLogs('sess-unknown', { userId: 'user-1' }, mockClient);

      expect(res.logs).toEqual([]);
      expect(res.total).toBe(0);
    });
  });

  describe('getCombatLogs', () => {
    it('queries combat logs ordered chronologically by createdAt asc', async () => {
      const mockFindMany = vi.fn().mockResolvedValue([
        { id: 'log-c1', combatId: 'c-1', logType: 'COMBAT_ACTION', description: 'Atak' },
        { id: 'log-c2', combatId: 'c-1', logType: 'COMBAT_END', description: 'Koniec' },
      ]);

      const mockClient = {
        sessionLog: { findMany: mockFindMany },
      } as unknown as LogsPrismaClient;

      const res = await getCombatLogs('c-1', {}, mockClient);

      expect(mockFindMany).toHaveBeenCalledWith({
        where: { combatId: 'c-1' },
        orderBy: { createdAt: 'asc' },
      });
      expect(res).toHaveLength(2);
    });
  });

  describe('createSessionLog - Automations', () => {
    it('creates standard CUSTOM_NOTE log', async () => {
      const mockSessionFindUnique = vi.fn().mockResolvedValue({ id: 's-1', userId: null });
      const mockLogCreate = vi
        .fn()
        .mockImplementation(({ data }) => Promise.resolve({ id: 'log-1', ...data }));

      const mockClient = {
        session: { findUnique: mockSessionFindUnique, findFirst: vi.fn() },
        sessionLog: { create: mockLogCreate },
      } as unknown as LogsPrismaClient;

      const res = await createSessionLog(
        {
          sessionId: 's-1',
          logType: 'CUSTOM_NOTE',
          description: 'Notatka Mistrza Gry',
        },
        {},
        mockClient
      );

      expect(mockLogCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sessionId: 's-1',
          logType: 'CUSTOM_NOTE',
          description: 'Notatka Mistrza Gry',
        }),
      });
      expect(res.log.id).toBe('log-1');
      expect(res.updatedCharacters).toEqual([]);
    });

    it('REST_LONG: regenerates all HERO characters (full HP, 0 tempHp, restores spell slots)', async () => {
      const heroes = [
        {
          id: 'char-1',
          sessionId: 's-1',
          type: 'HERO',
          name: 'Valeros',
          currentHp: 4,
          maxHp: 24,
          stats: { tempHp: 5, str: 16 },
          spells: {
            slots: {
              1: { max: 4, used: 3 },
              2: { max: 2, used: 2 },
            },
          },
        },
        {
          id: 'char-2',
          sessionId: 's-1',
          type: 'HERO',
          name: 'Seoni',
          currentHp: 1,
          maxHp: 16,
          stats: { tempHp: 0 },
          spells: {
            slots: {
              1: { max: 4, used: 4 },
            },
          },
        },
      ];

      const mockSessionFindUnique = vi.fn().mockResolvedValue({ id: 's-1', userId: 'u-1' });
      const mockCharacterFindMany = vi.fn().mockResolvedValue(heroes);
      const mockCharacterUpdate = vi
        .fn()
        .mockImplementation(({ where, data }) => Promise.resolve({ id: where.id, ...data }));
      const mockLogCreate = vi
        .fn()
        .mockImplementation(({ data }) => Promise.resolve({ id: 'log-rest', ...data }));

      const mockClient = {
        session: {
          findUnique: mockSessionFindUnique,
          findFirst: vi.fn().mockResolvedValue({ id: 's-1', userId: 'u-1' }),
        },
        character: {
          findMany: mockCharacterFindMany,
          update: mockCharacterUpdate,
        },
        sessionLog: { create: mockLogCreate },
      } as unknown as LogsPrismaClient;

      const res = await createSessionLog(
        {
          sessionId: 's-1',
          logType: 'REST_LONG',
        },
        { userId: 'u-1' },
        mockClient
      );

      // Verify character findMany targeted only HERO characters
      expect(mockCharacterFindMany).toHaveBeenCalledWith({
        where: { sessionId: 's-1', type: 'HERO' },
      });

      // Verify each hero was updated to maxHp, 0 tempHp, and 0 used slots
      expect(mockCharacterUpdate).toHaveBeenCalledTimes(2);
      expect(mockCharacterUpdate).toHaveBeenCalledWith({
        where: { id: 'char-1' },
        data: {
          currentHp: 24,
          stats: { tempHp: 0, str: 16 },
          spells: {
            slots: {
              1: { max: 4, used: 0 },
              2: { max: 2, used: 0 },
            },
          },
        },
      });

      expect(res.updatedCharacters).toHaveLength(2);
      expect(res.log.logType).toBe('REST_LONG');
    });

    it('REST_SHORT: applies healing to specified characters', async () => {
      const char = {
        id: 'char-1',
        sessionId: 's-1',
        type: 'HERO',
        name: 'Valeros',
        currentHp: 10,
        maxHp: 25,
      };

      const mockSessionFindUnique = vi.fn().mockResolvedValue({ id: 's-1', userId: null });
      const mockCharacterFindUnique = vi.fn().mockResolvedValue(char);
      const mockCharacterUpdate = vi
        .fn()
        .mockImplementation(({ where, data }) =>
          Promise.resolve({ ...char, ...data, id: where.id })
        );
      const mockLogCreate = vi
        .fn()
        .mockImplementation(({ data }) => Promise.resolve({ id: 'log-short', ...data }));

      const mockClient = {
        session: { findUnique: mockSessionFindUnique, findFirst: vi.fn() },
        character: {
          findUnique: mockCharacterFindUnique,
          update: mockCharacterUpdate,
        },
        sessionLog: { create: mockLogCreate },
      } as unknown as LogsPrismaClient;

      const res = await createSessionLog(
        {
          sessionId: 's-1',
          logType: 'REST_SHORT',
          description: 'Valeros zużywa kość wytrzymałości k10.',
          heals: [{ characterId: 'char-1', hpHealed: 8, hitDiceSpent: 1 }],
        },
        {},
        mockClient
      );

      expect(mockCharacterUpdate).toHaveBeenCalledWith({
        where: { id: 'char-1' },
        data: {
          currentHp: 18, // 10 + 8 <= 25
        },
      });

      expect(res.updatedCharacters).toHaveLength(1);
      expect(res.log.logType).toBe('REST_SHORT');
    });

    it('throws or returns error if session is not found or unauthorized', async () => {
      const mockClient = {
        session: {
          findUnique: vi.fn().mockResolvedValue(null),
          findFirst: vi.fn().mockResolvedValue(null),
        },
        sessionLog: { create: vi.fn() },
      } as unknown as LogsPrismaClient;

      await expect(
        createSessionLog(
          { sessionId: 'unknown', logType: 'CUSTOM_NOTE', description: 'Test' },
          { userId: 'u-1' },
          mockClient
        )
      ).rejects.toThrow('Session not found or access denied');
    });
  });
});
