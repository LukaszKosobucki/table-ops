import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as authService from '@/lib/auth';
import * as logsService from '@/lib/logs';
import { GET, POST } from './route';

describe('/api/sessions/[id]/logs Endpoints (Chunk 7.1)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(authService, 'getUserIdFromRequest').mockResolvedValue('user-123');
  });

  describe('GET /api/sessions/[id]/logs', () => {
    it('returns 400 if session id is missing', async () => {
      const request = new Request('http://localhost/api/sessions//logs');
      const response = await GET(request, {
        params: Promise.resolve({ id: '' }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Session ID is required');
    });

    it('returns 200 with logs and total count', async () => {
      const mockResult = {
        logs: [
          {
            id: 'log-1',
            sessionId: 'sess-1',
            logType: 'REST_LONG',
            description: 'Długi odpoczynek',
            createdAt: new Date(),
          },
        ],
        total: 1,
      };

      vi.spyOn(logsService, 'getSessionLogs').mockResolvedValue(
        mockResult as unknown as Awaited<ReturnType<typeof logsService.getSessionLogs>>
      );

      const request = new Request(
        'http://localhost/api/sessions/sess-1/logs?type=REST_LONG&limit=10&offset=0'
      );
      const response = await GET(request, {
        params: Promise.resolve({ id: 'sess-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.logs).toHaveLength(1);
      expect(data.total).toBe(1);
      expect(logsService.getSessionLogs).toHaveBeenCalledWith('sess-1', {
        type: 'REST_LONG',
        limit: 10,
        offset: 0,
        userId: 'user-123',
      });
    });

    it('returns 500 when getSessionLogs throws an error', async () => {
      vi.spyOn(logsService, 'getSessionLogs').mockRejectedValue(new Error('DB failure'));

      const request = new Request('http://localhost/api/sessions/sess-1/logs');
      const response = await GET(request, {
        params: Promise.resolve({ id: 'sess-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe('POST /api/sessions/[id]/logs', () => {
    it('returns 400 for empty or invalid body', async () => {
      const request = new Request('http://localhost/api/sessions/sess-1/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(''),
      });
      const response = await POST(request, {
        params: Promise.resolve({ id: 'sess-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('returns 201 with created log and updated characters', async () => {
      const mockResult = {
        log: {
          id: 'log-10',
          sessionId: 'sess-1',
          logType: 'REST_LONG',
          description: 'Długi Odpoczynek ukończony',
        },
        updatedCharacters: [{ id: 'char-1', name: 'Valeros', currentHp: 25, maxHp: 25 }],
      };

      vi.spyOn(logsService, 'createSessionLog').mockResolvedValue(
        mockResult as unknown as Awaited<ReturnType<typeof logsService.createSessionLog>>
      );

      const request = new Request('http://localhost/api/sessions/sess-1/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logType: 'REST_LONG',
        }),
      });
      const response = await POST(request, {
        params: Promise.resolve({ id: 'sess-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.log.id).toBe('log-10');
      expect(data.updatedCharacters).toHaveLength(1);
    });

    it('returns 400 when validation fails', async () => {
      vi.spyOn(logsService, 'createSessionLog').mockRejectedValue(
        new Error('Invalid logType. Allowed values: ...')
      );

      const request = new Request('http://localhost/api/sessions/sess-1/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logType: 'INVALID_TYPE',
        }),
      });
      const response = await POST(request, {
        params: Promise.resolve({ id: 'sess-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid logType');
    });

    it('returns 404 when session is not found or unauthorized', async () => {
      vi.spyOn(logsService, 'createSessionLog').mockRejectedValue(
        new Error('Session not found or access denied')
      );

      const request = new Request('http://localhost/api/sessions/sess-1/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logType: 'CUSTOM_NOTE',
          description: 'Notatka',
        }),
      });
      const response = await POST(request, {
        params: Promise.resolve({ id: 'sess-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Session not found or access denied');
    });
  });
});
