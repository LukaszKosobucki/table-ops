import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as sessionsService from '@/lib/sessions';
import { DELETE, PUT } from './[id]/route';
import { GET, POST } from './route';

describe('/api/sessions Endpoints (Chunk 1.1)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/sessions', () => {
    it('returns a list of sessions with status 200', async () => {
      const mockList = [
        {
          id: 'ses-1',
          name: 'Wyprawa do Podmroku',
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { characters: 4, sessionLogs: 10 },
        },
      ];

      vi.spyOn(sessionsService, 'getSessions').mockResolvedValue(
        mockList as unknown as Awaited<ReturnType<typeof sessionsService.getSessions>>
      );

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.sessions).toHaveLength(1);
      expect(data.sessions[0].name).toBe('Wyprawa do Podmroku');
    });

    it('returns 500 if fetching fails', async () => {
      vi.spyOn(sessionsService, 'getSessions').mockRejectedValue(new Error('DB failure'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch sessions');
    });
  });

  describe('POST /api/sessions', () => {
    it('returns 400 if request body is invalid', async () => {
      const request = new Request('http://localhost/api/sessions', {
        method: 'POST',
        body: 'invalid-json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid request body');
    });

    it('returns 400 if session name fails validation', async () => {
      const request = new Request('http://localhost/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'A' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('at least 2 characters');
    });

    it('creates session and returns 201', async () => {
      const createdSession = {
        id: 'new-id',
        name: 'Klątwa Strahda',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(sessionsService, 'createSession').mockResolvedValue(
        createdSession as unknown as Awaited<ReturnType<typeof sessionsService.createSession>>
      );

      const request = new Request('http://localhost/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Klątwa Strahda' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.session.name).toBe('Klątwa Strahda');
    });
  });

  describe('PUT /api/sessions/[id]', () => {
    it('returns 400 on invalid body name', async () => {
      const request = new Request('http://localhost/api/sessions/s-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '' }),
      });

      const response = await PUT(request, {
        params: Promise.resolve({ id: 's-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('returns 404 if session is not found', async () => {
      vi.spyOn(sessionsService, 'updateSession').mockResolvedValue(null);

      const request = new Request('http://localhost/api/sessions/s-404', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Aktualizacja' }),
      });

      const response = await PUT(request, {
        params: Promise.resolve({ id: 's-404' }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Session not found');
    });

    it('returns 200 with updated session', async () => {
      const updated = {
        id: 's-1',
        name: 'Zaktualizowana Sesja',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(sessionsService, 'updateSession').mockResolvedValue(
        updated as unknown as Awaited<ReturnType<typeof sessionsService.updateSession>>
      );

      const request = new Request('http://localhost/api/sessions/s-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Zaktualizowana Sesja' }),
      });

      const response = await PUT(request, {
        params: Promise.resolve({ id: 's-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.session.name).toBe('Zaktualizowana Sesja');
    });
  });

  describe('DELETE /api/sessions/[id]', () => {
    it('returns 404 if session is not found', async () => {
      vi.spyOn(sessionsService, 'deleteSession').mockResolvedValue(null);

      const request = new Request('http://localhost/api/sessions/s-404', {
        method: 'DELETE',
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ id: 's-404' }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Session not found');
    });

    it('returns 200 on successful deletion', async () => {
      vi.spyOn(sessionsService, 'deleteSession').mockResolvedValue({
        id: 's-1',
        name: 'Usunięta',
      } as unknown as Awaited<ReturnType<typeof sessionsService.deleteSession>>);

      const request = new Request('http://localhost/api/sessions/s-1', {
        method: 'DELETE',
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ id: 's-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Session deleted successfully');
    });
  });
});
