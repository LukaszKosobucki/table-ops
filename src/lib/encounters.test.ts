import { describe, expect, it, vi } from 'vitest';
import {
  createEncounter,
  deleteEncounter,
  type EncounterPrismaClient,
  getEncounterById,
  getEncountersBySession,
  updateEncounter,
  validateEncounterInput,
} from './encounters';

describe('Encounters Domain Service (Chunk 4.1)', () => {
  describe('validateEncounterInput', () => {
    it('accepts valid encounter input with trimmed name', () => {
      const res = validateEncounterInput({
        sessionId: 'sess-1',
        name: '  Goblin Ambush  ',
        members: [
          { monsterId: 'mon-1', count: 3 },
          { characterId: 'char-1', count: 1 },
        ],
      });

      expect(res.valid).toBe(true);
      if (res.valid) {
        expect(res.data.name).toBe('Goblin Ambush');
        expect(res.data.members).toHaveLength(2);
        expect(res.data.members?.[0].count).toBe(3);
      }
    });

    it('rejects missing or empty encounter name', () => {
      const res1 = validateEncounterInput({ sessionId: 'sess-1', name: '  ' });
      expect(res1.valid).toBe(false);
      if (!res1.valid) {
        expect(res1.error).toContain('name is required');
      }

      const res2 = validateEncounterInput({ sessionId: 'sess-1' });
      expect(res2.valid).toBe(false);
    });

    it('rejects name exceeding 100 characters', () => {
      const longName = 'a'.repeat(101);
      const res = validateEncounterInput({ sessionId: 'sess-1', name: longName });
      expect(res.valid).toBe(false);
      if (!res.valid) {
        expect(res.error).toContain('100 characters');
      }
    });

    it('rejects missing sessionId', () => {
      const res = validateEncounterInput({ name: 'Wolf Pack' });
      expect(res.valid).toBe(false);
      if (!res.valid) {
        expect(res.error).toContain('sessionId is required');
      }
    });

    it('rejects member with non-positive or non-integer count', () => {
      const res1 = validateEncounterInput({
        sessionId: 'sess-1',
        name: 'Wolf Pack',
        members: [{ monsterId: 'mon-1', count: 0 }],
      });
      expect(res1.valid).toBe(false);

      const res2 = validateEncounterInput({
        sessionId: 'sess-1',
        name: 'Wolf Pack',
        members: [{ monsterId: 'mon-1', count: 1.5 }],
      });
      expect(res2.valid).toBe(false);
    });

    it('rejects member without any reference id', () => {
      const res = validateEncounterInput({
        sessionId: 'sess-1',
        name: 'Empty Member',
        members: [{ count: 1 }],
      });
      expect(res.valid).toBe(false);
      if (!res.valid) {
        expect(res.error).toContain('at least one reference');
      }
    });
  });

  describe('getEncountersBySession', () => {
    it('queries prisma encounterGroup with sessionId and included relations', async () => {
      const mockFindMany = vi
        .fn()
        .mockResolvedValue([{ id: 'enc-1', name: 'Goblins', members: [] }]);

      const mockPrisma = {
        encounterGroup: {
          findMany: mockFindMany,
        },
      } as unknown as EncounterPrismaClient;

      const result = await getEncountersBySession('sess-1', mockPrisma);

      expect(mockFindMany).toHaveBeenCalledWith({
        where: { sessionId: 'sess-1' },
        include: {
          members: {
            include: {
              character: true,
              monster: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('getEncounterById', () => {
    it('queries prisma encounterGroup by id with included relations', async () => {
      const mockFindUnique = vi.fn().mockResolvedValue({ id: 'enc-1', name: 'Orc Patrol' });

      const mockPrisma = {
        encounterGroup: {
          findUnique: mockFindUnique,
        },
      } as unknown as EncounterPrismaClient;

      const result = await getEncounterById('enc-1', mockPrisma);

      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: 'enc-1' },
        include: {
          members: {
            include: {
              character: true,
              monster: true,
            },
          },
        },
      });
      expect(result).toEqual({ id: 'enc-1', name: 'Orc Patrol' });
    });
  });

  describe('createEncounter', () => {
    it('throws if session does not exist', async () => {
      const mockPrisma = {
        session: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
      } as unknown as EncounterPrismaClient;

      await expect(
        createEncounter(
          {
            sessionId: 'nonexistent',
            name: 'Bandits',
          },
          mockPrisma
        )
      ).rejects.toThrow('Session not found');
    });

    it('creates encounter group with nested members when valid', async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        id: 'enc-new',
        sessionId: 'sess-1',
        name: 'Bandits',
        members: [{ id: 'mem-1', count: 2 }],
      });

      const mockPrisma = {
        session: {
          findUnique: vi.fn().mockResolvedValue({ id: 'sess-1' }),
        },
        encounterGroup: {
          create: mockCreate,
        },
      } as unknown as EncounterPrismaClient;

      const result = await createEncounter(
        {
          sessionId: 'sess-1',
          name: 'Bandits',
          members: [{ monsterId: 'mon-bandit', count: 2 }],
        },
        mockPrisma
      );

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          sessionId: 'sess-1',
          name: 'Bandits',
          members: {
            create: [
              {
                monsterId: 'mon-bandit',
                characterId: null,
                apiMonsterId: null,
                count: 2,
              },
            ],
          },
        },
        include: {
          members: {
            include: {
              character: true,
              monster: true,
            },
          },
        },
      });
      expect(result.id).toBe('enc-new');
    });
  });

  describe('updateEncounter', () => {
    it('returns null if encounter group does not exist', async () => {
      const mockPrisma = {
        encounterGroup: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
      } as unknown as EncounterPrismaClient;

      const result = await updateEncounter('nonexistent', { name: 'New Name' }, mockPrisma);
      expect(result).toBeNull();
    });

    it('updates name and replaces members atomically in transaction', async () => {
      const mockExisting = { id: 'enc-1', name: 'Old Name' };
      const mockUpdated = { id: 'enc-1', name: 'Updated Name', members: [] };

      const mockDeleteMany = vi.fn().mockResolvedValue({ count: 1 });
      const mockUpdate = vi.fn().mockResolvedValue(mockUpdated);

      const mockTransaction = vi.fn().mockImplementation(async (callback) => {
        return callback({
          encounterMember: { deleteMany: mockDeleteMany },
          encounterGroup: { update: mockUpdate },
        });
      });

      const mockPrisma = {
        encounterGroup: {
          findUnique: vi.fn().mockResolvedValue(mockExisting),
        },
        $transaction: mockTransaction,
      } as unknown as EncounterPrismaClient;

      const result = await updateEncounter(
        'enc-1',
        {
          name: 'Updated Name',
          members: [{ monsterId: 'mon-2', count: 4 }],
        },
        mockPrisma
      );

      expect(mockDeleteMany).toHaveBeenCalledWith({
        where: { groupId: 'enc-1' },
      });
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'enc-1' },
        data: {
          name: 'Updated Name',
          members: {
            create: [
              {
                monsterId: 'mon-2',
                characterId: null,
                apiMonsterId: null,
                count: 4,
              },
            ],
          },
        },
        include: {
          members: {
            include: {
              character: true,
              monster: true,
            },
          },
        },
      });
      expect(result).toEqual(mockUpdated);
    });
  });

  describe('deleteEncounter', () => {
    it('returns null if encounter not found', async () => {
      const mockPrisma = {
        encounterGroup: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
      } as unknown as EncounterPrismaClient;

      const result = await deleteEncounter('nonexistent', mockPrisma);
      expect(result).toBeNull();
    });

    it('deletes encounter group if found', async () => {
      const mockExisting = { id: 'enc-1', name: 'To Delete' };
      const mockDelete = vi.fn().mockResolvedValue(mockExisting);

      const mockPrisma = {
        encounterGroup: {
          findUnique: vi.fn().mockResolvedValue(mockExisting),
          delete: mockDelete,
        },
      } as unknown as EncounterPrismaClient;

      const result = await deleteEncounter('enc-1', mockPrisma);
      expect(mockDelete).toHaveBeenCalledWith({ where: { id: 'enc-1' } });
      expect(result).toEqual(mockExisting);
    });
  });
});
