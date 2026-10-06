import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as sessionsService from '@/lib/sessions';
import { GET } from './route';

describe('GET /api/sessions/[id]/full-state (Chunk 2.1)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 200 with full session state when session exists', async () => {
    const mockFullState = {
      session: {
        id: 'session-123',
        name: 'Wrota Baldura',
        createdAt: new Date('2026-03-01'),
        updatedAt: new Date('2026-03-02'),
      },
      characters: [
        {
          id: 'char-1',
          sessionId: 'session-123',
          name: 'Astarion',
          type: 'HERO',
          currentHp: 18,
          maxHp: 18,
          ac: 14,
          passivePerception: 13,
        },
      ],
      encounterGroups: [],
      activeCombat: {
        id: 'combat-1',
        sessionId: 'session-123',
        status: 'ACTIVE',
        currentRound: 1,
        currentTurnIndex: 0,
        combatants: [],
      },
      sessionLogs: [
        {
          id: 'log-1',
          sessionId: 'session-123',
          logType: 'COMBAT_ACTION',
          description: 'Astarion ukrył się w cieniu.',
          createdAt: new Date(),
        },
      ],
    };

    vi.spyOn(sessionsService, 'getSessionFullState').mockResolvedValue(
      mockFullState as unknown as Awaited<ReturnType<typeof sessionsService.getSessionFullState>>
    );

    const request = new Request('http://localhost/api/sessions/session-123/full-state');
    const response = await GET(request, {
      params: Promise.resolve({ id: 'session-123' }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.session.name).toBe('Wrota Baldura');
    expect(data.characters).toHaveLength(1);
    expect(data.activeCombat?.id).toBe('combat-1');
    expect(data.sessionLogs).toHaveLength(1);
  });

  it('returns 400 when session ID is missing or invalid', async () => {
    const request = new Request('http://localhost/api/sessions//full-state');
    const response = await GET(request, {
      params: Promise.resolve({ id: '' }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Session ID is required');
  });

  it('returns 404 when session is not found', async () => {
    vi.spyOn(sessionsService, 'getSessionFullState').mockResolvedValue(null);

    const request = new Request('http://localhost/api/sessions/missing-id/full-state');
    const response = await GET(request, {
      params: Promise.resolve({ id: 'missing-id' }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Session not found');
  });

  it('returns 500 when fetching full state throws an exception', async () => {
    vi.spyOn(sessionsService, 'getSessionFullState').mockRejectedValue(
      new Error('Database connection timed out')
    );

    const request = new Request('http://localhost/api/sessions/session-123/full-state');
    const response = await GET(request, {
      params: Promise.resolve({ id: 'session-123' }),
    });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Failed to fetch full session state');
  });
});
