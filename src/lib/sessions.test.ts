import { describe, expect, it, vi } from 'vitest';
import {
  createSession,
  deleteSession,
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
});
