import { describe, expect, it, vi } from 'vitest';
import {
  claimGuestSessions,
  createSession,
  deleteSession,
  getSessionFullState,
  getSessions,
  type SessionPrismaClient,
  updateSession,
  validateSessionName,
} from './sessions';

describe('Sessions Service (Chunk 1.1)', () => {
  describe('validateSessionName', () => {
    it('accepts valid session names and trims whitespace', () => {
      const result = validateSessionName('  Klątwa Strahda  ');
      expect(result).toEqual({ valid: true, name: 'Klątwa Strahda' });
    });

    it('rejects names shorter than 2 characters', () => {
      const result = validateSessionName(' A ');
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toContain('at least 2 characters');
      }
    });

    it('rejects names longer than 60 characters', () => {
      const longName = 'A'.repeat(61);
      const result = validateSessionName(longName);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toContain('cannot exceed 60 characters');
      }
    });

    it('rejects empty or non-string inputs', () => {
      expect(validateSessionName('')).toEqual({
        valid: false,
        error: 'Session name is required',
      });
      expect(validateSessionName(null)).toEqual({
        valid: false,
        error: 'Session name is required',
      });
      expect(validateSessionName(123)).toEqual({
        valid: false,
        error: 'Session name must be a string',
      });
    });
  });

  describe('getSessions', () => {
    it('queries sessions ordered by updatedAt descending with counts', async () => {
      const mockSessions = [
        {
          id: 's-1',
          name: 'Sesja 1',
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-02'),
          _count: { characters: 4, sessionLogs: 12 },
        },
      ];

      const mockPrisma = {
        session: {
          findMany: vi.fn().mockResolvedValue(mockSessions),
        },
      };

      const result = await getSessions(mockPrisma as unknown as SessionPrismaClient);
      expect(mockPrisma.session.findMany).toHaveBeenCalledWith({
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: {
            select: { characters: true, sessionLogs: true },
          },
        },
      });
      expect(result).toEqual(mockSessions);
    });
  });

  describe('createSession', () => {
    it('creates a new session when name is valid', async () => {
      const created = {
        id: 's-new',
        name: 'Wyprawa do Podmroku',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockPrisma = {
        session: {
          create: vi.fn().mockResolvedValue(created),
        },
      };

      const result = await createSession(
        { name: '  Wyprawa do Podmroku  ' },
        mockPrisma as unknown as SessionPrismaClient
      );

      expect(mockPrisma.session.create).toHaveBeenCalledWith({
        data: { name: 'Wyprawa do Podmroku' },
      });
      expect(result).toEqual(created);
    });

    it('throws validation error if name is invalid', async () => {
      const mockPrisma = {
        session: {
          create: vi.fn(),
        },
      };

      await expect(
        createSession({ name: 'x' }, mockPrisma as unknown as SessionPrismaClient)
      ).rejects.toThrow('at least 2 characters');
      expect(mockPrisma.session.create).not.toHaveBeenCalled();
    });
  });

  describe('updateSession', () => {
    it('updates session name when session exists', async () => {
      const updated = {
        id: 's-1',
        name: 'Nowa Nazwa Sesji',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockPrisma = {
        session: {
          findUnique: vi.fn().mockResolvedValue({ id: 's-1', name: 'Stara' }),
          update: vi.fn().mockResolvedValue(updated),
        },
      };

      const result = await updateSession(
        's-1',
        { name: 'Nowa Nazwa Sesji' },
        mockPrisma as unknown as SessionPrismaClient
      );

      expect(mockPrisma.session.findUnique).toHaveBeenCalledWith({
        where: { id: 's-1' },
      });
      expect(mockPrisma.session.update).toHaveBeenCalledWith({
        where: { id: 's-1' },
        data: { name: 'Nowa Nazwa Sesji' },
      });
      expect(result).toEqual(updated);
    });

    it('returns null if session to update does not exist', async () => {
      const mockPrisma = {
        session: {
          findUnique: vi.fn().mockResolvedValue(null),
          update: vi.fn(),
        },
      };

      const result = await updateSession(
        's-nonexistent',
        { name: 'Sesja' },
        mockPrisma as unknown as SessionPrismaClient
      );

      expect(result).toBeNull();
      expect(mockPrisma.session.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteSession', () => {
    it('deletes session when session exists', async () => {
      const deleted = {
        id: 's-1',
        name: 'Do usunięcia',
      };

      const mockPrisma = {
        session: {
          findUnique: vi.fn().mockResolvedValue(deleted),
          delete: vi.fn().mockResolvedValue(deleted),
        },
      };

      const result = await deleteSession('s-1', mockPrisma as unknown as SessionPrismaClient);

      expect(mockPrisma.session.findUnique).toHaveBeenCalledWith({
        where: { id: 's-1' },
      });
      expect(mockPrisma.session.delete).toHaveBeenCalledWith({
        where: { id: 's-1' },
      });
      expect(result).toEqual(deleted);
    });

    it('returns null if session to delete does not exist', async () => {
      const mockPrisma = {
        session: {
          findUnique: vi.fn().mockResolvedValue(null),
          delete: vi.fn(),
        },
      };

      const result = await deleteSession(
        's-nonexistent',
        mockPrisma as unknown as SessionPrismaClient
      );

      expect(result).toBeNull();
      expect(mockPrisma.session.delete).not.toHaveBeenCalled();
    });
  });

  describe('getSessionFullState (Chunk 2.1)', () => {
    it('returns null if session is not found', async () => {
      const mockPrisma = {
        session: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
      };

      const result = await getSessionFullState(
        'missing-session',
        mockPrisma as unknown as SessionPrismaClient
      );

      expect(result).toBeNull();
      expect(mockPrisma.session.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'missing-session' },
        })
      );
    });

    it('returns aggregated state with active combat and sorted items', async () => {
      const mockDbSession = {
        id: 'ses-1',
        name: 'Kampania Ravenloft',
        createdAt: new Date('2026-03-01T12:00:00Z'),
        updatedAt: new Date('2026-03-01T14:00:00Z'),
        characters: [
          {
            id: 'char-1',
            sessionId: 'ses-1',
            name: 'Gimli',
            type: 'HERO',
            currentHp: 24,
            maxHp: 24,
            ac: 16,
            passivePerception: 12,
          },
        ],
        encounterGroups: [
          {
            id: 'grp-1',
            sessionId: 'ses-1',
            name: 'Wilcza Wataha',
            members: [
              {
                id: 'mem-1',
                groupId: 'grp-1',
                monsterId: 'mon-1',
                count: 3,
                monster: { id: 'mon-1', name: 'Wolf', hitPoints: 11 },
                character: null,
              },
            ],
          },
        ],
        combats: [
          {
            id: 'comb-1',
            sessionId: 'ses-1',
            status: 'ACTIVE',
            currentRound: 2,
            currentTurnIndex: 1,
            combatants: [
              {
                id: 'cbt-1',
                combatId: 'comb-1',
                nameOverride: null,
                initiative: 18,
                currentHp: 24,
                maxHp: 24,
                ac: 16,
                order: 0,
                statuses: [
                  {
                    id: 'st-1',
                    combatantId: 'cbt-1',
                    statusName: 'Blessed',
                    durationTurns: 5,
                  },
                ],
                monster: null,
                character: { id: 'char-1', name: 'Gimli' },
              },
            ],
          },
        ],
        sessionLogs: [
          {
            id: 'log-1',
            sessionId: 'ses-1',
            logType: 'COMBAT_ACTION',
            description: 'Gimli zaatakował Wilka toporem.',
            createdAt: new Date('2026-03-01T13:45:00Z'),
          },
        ],
      };

      const mockPrisma = {
        session: {
          findUnique: vi.fn().mockResolvedValue(mockDbSession),
        },
      };

      const result = await getSessionFullState(
        'ses-1',
        mockPrisma as unknown as SessionPrismaClient
      );

      expect(result).not.toBeNull();
      expect(result).toEqual({
        session: {
          id: 'ses-1',
          name: 'Kampania Ravenloft',
          createdAt: mockDbSession.createdAt,
          updatedAt: mockDbSession.updatedAt,
        },
        characters: mockDbSession.characters,
        encounterGroups: mockDbSession.encounterGroups,
        activeCombat: mockDbSession.combats[0],
        sessionLogs: mockDbSession.sessionLogs,
      });

      expect(mockPrisma.session.findUnique).toHaveBeenCalledWith({
        where: { id: 'ses-1' },
        include: {
          characters: {
            orderBy: { createdAt: 'asc' },
          },
          encounterGroups: {
            orderBy: { createdAt: 'asc' },
            include: {
              members: {
                include: {
                  monster: true,
                  character: true,
                },
              },
            },
          },
          combats: {
            where: {
              status: { in: ['PREPARING', 'ACTIVE'] },
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              combatants: {
                orderBy: { order: 'asc' },
                include: {
                  statuses: true,
                  monster: true,
                  character: true,
                },
              },
            },
          },
          sessionLogs: {
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
        },
      });
    });

    it('sets activeCombat to null if no combat is active or preparing', async () => {
      const mockDbSession = {
        id: 'ses-1',
        name: 'Spokojna Sesja',
        createdAt: new Date(),
        updatedAt: new Date(),
        characters: [],
        encounterGroups: [],
        combats: [],
        sessionLogs: [],
      };

      const mockPrisma = {
        session: {
          findUnique: vi.fn().mockResolvedValue(mockDbSession),
        },
      };

      const result = await getSessionFullState(
        'ses-1',
        mockPrisma as unknown as SessionPrismaClient
      );

      expect(result?.activeCombat).toBeNull();
    });

    it('executes in under 100ms when querying full state structure', async () => {
      const mockDbSession = {
        id: 'ses-1',
        name: 'Szybka Sesja',
        createdAt: new Date(),
        updatedAt: new Date(),
        characters: [],
        encounterGroups: [],
        combats: [],
        sessionLogs: [],
      };

      const mockPrisma = {
        session: {
          findUnique: vi.fn().mockResolvedValue(mockDbSession),
        },
      };

      const startTime = performance.now();
      await getSessionFullState('ses-1', mockPrisma as unknown as SessionPrismaClient);
      const executionDuration = performance.now() - startTime;

      expect(executionDuration).toBeLessThan(100);
    });
  });

  describe('Multi-Tenancy & User Isolation (Chunk 6.1)', () => {
    it('filters sessions by userId for authenticated users', async () => {
      const mockPrisma = {
        session: {
          findMany: vi.fn().mockResolvedValue([]),
        },
      };

      await getSessions({ userId: 'user-gm-1' }, mockPrisma as unknown as SessionPrismaClient);

      expect(mockPrisma.session.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-gm-1' },
        })
      );
    });

    it('filters sessions by null userId for guest users', async () => {
      const mockPrisma = {
        session: {
          findMany: vi.fn().mockResolvedValue([]),
        },
      };

      await getSessions({ userId: null }, mockPrisma as unknown as SessionPrismaClient);

      expect(mockPrisma.session.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: null },
        })
      );
    });

    it('assigns userId to newly created session when provided', async () => {
      const mockPrisma = {
        session: {
          create: vi.fn().mockResolvedValue({ id: 's-1', name: 'Kampania', userId: 'user-gm-1' }),
        },
      };

      await createSession(
        { name: 'Kampania', userId: 'user-gm-1' },
        mockPrisma as unknown as SessionPrismaClient
      );

      expect(mockPrisma.session.create).toHaveBeenCalledWith({
        data: { name: 'Kampania', userId: 'user-gm-1' },
      });
    });

    it('prevents updating session owned by a different user', async () => {
      const mockPrisma = {
        session: {
          findUnique: vi
            .fn()
            .mockResolvedValue({ id: 's-1', name: 'Kampania', userId: 'user-owner' }),
          update: vi.fn(),
        },
      };

      const result = await updateSession(
        's-1',
        { name: 'Nowa Nazwa', userId: 'user-attacker' },
        mockPrisma as unknown as SessionPrismaClient
      );

      expect(result).toBeNull();
      expect(mockPrisma.session.update).not.toHaveBeenCalled();
    });

    it('prevents deleting session owned by a different user', async () => {
      const mockPrisma = {
        session: {
          findUnique: vi
            .fn()
            .mockResolvedValue({ id: 's-1', name: 'Kampania', userId: 'user-owner' }),
          delete: vi.fn(),
        },
      };

      const result = await deleteSession(
        's-1',
        { userId: 'user-attacker' },
        mockPrisma as unknown as SessionPrismaClient
      );

      expect(result).toBeNull();
      expect(mockPrisma.session.delete).not.toHaveBeenCalled();
    });

    it('prevents viewing full state of session owned by a different user', async () => {
      const mockPrisma = {
        session: {
          findUnique: vi.fn().mockResolvedValue({
            id: 's-1',
            userId: 'user-owner',
            name: 'Prywatna',
            characters: [],
            encounterGroups: [],
            combats: [],
            sessionLogs: [],
          }),
        },
      };

      const result = await getSessionFullState(
        's-1',
        { userId: 'user-attacker' },
        mockPrisma as unknown as SessionPrismaClient
      );

      expect(result).toBeNull();
    });
  });

  describe('claimGuestSessions (Option A: Anonymous Device Migration)', () => {
    it('migrates all sessions owned by guestId to targetUserId and returns count', async () => {
      const mockPrisma = {
        session: {
          updateMany: vi.fn().mockResolvedValue({ count: 3 }),
        },
      };

      const count = await claimGuestSessions(
        'registered-user-uuid',
        'guest_device_123',
        mockPrisma as unknown as SessionPrismaClient
      );

      expect(count).toBe(3);
      expect(mockPrisma.session.updateMany).toHaveBeenCalledWith({
        where: { userId: 'guest_device_123' },
        data: { userId: 'registered-user-uuid' },
      });
    });

    it('returns 0 and does not perform update if targetUserId is identical to guestId', async () => {
      const mockPrisma = {
        session: {
          updateMany: vi.fn(),
        },
      };

      const count = await claimGuestSessions(
        'guest_device_123',
        'guest_device_123',
        mockPrisma as unknown as SessionPrismaClient
      );

      expect(count).toBe(0);
      expect(mockPrisma.session.updateMany).not.toHaveBeenCalled();
    });

    it('returns 0 if targetUserId or guestId is empty', async () => {
      const mockPrisma = {
        session: {
          updateMany: vi.fn(),
        },
      };

      const count1 = await claimGuestSessions(
        '',
        'guest_device_123',
        mockPrisma as unknown as SessionPrismaClient
      );
      const count2 = await claimGuestSessions(
        'registered-user-uuid',
        '',
        mockPrisma as unknown as SessionPrismaClient
      );

      expect(count1).toBe(0);
      expect(count2).toBe(0);
      expect(mockPrisma.session.updateMany).not.toHaveBeenCalled();
    });
  });
});
