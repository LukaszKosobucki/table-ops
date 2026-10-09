import type { Session } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as authHelper from '@/lib/auth';
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

    it('returns 400 when neither name nor googleDocUrl is provided', async () => {
      const request = new Request('http://localhost/api/sessions/s-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await PUT(request, {
        params: Promise.resolve({ id: 's-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('At least one field');
    });

    it('returns 400 on invalid googleDocUrl format', async () => {
      const request = new Request('http://localhost/api/sessions/s-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ googleDocUrl: 'ftp://invalid-protocol.com' }),
      });

      const response = await PUT(request, {
        params: Promise.resolve({ id: 's-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('protocol');
    });

    it('updates googleDocUrl successfully and returns 200', async () => {
      const updated = {
        id: 's-1',
        name: 'Sesja 1',
        googleDocUrl: 'https://docs.google.com/document/d/123/edit',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(sessionsService, 'updateSession').mockResolvedValue(
        updated as unknown as Awaited<ReturnType<typeof sessionsService.updateSession>>
      );

      const request = new Request('http://localhost/api/sessions/s-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ googleDocUrl: 'https://docs.google.com/document/d/123/edit' }),
      });

      const response = await PUT(request, {
        params: Promise.resolve({ id: 's-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.session.googleDocUrl).toBe('https://docs.google.com/document/d/123/edit');
    });

    it('clears googleDocUrl when passed null and returns 200', async () => {
      const updated = {
        id: 's-1',
        name: 'Sesja 1',
        googleDocUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(sessionsService, 'updateSession').mockResolvedValue(
        updated as unknown as Awaited<ReturnType<typeof sessionsService.updateSession>>
      );

      const request = new Request('http://localhost/api/sessions/s-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ googleDocUrl: null }),
      });

      const response = await PUT(request, {
        params: Promise.resolve({ id: 's-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.session.googleDocUrl).toBeNull();
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

  describe('Multi-Tenancy & Auth scoping (Chunk 6.1)', () => {
    it('scopes GET /api/sessions to authenticated userId when present', async () => {
      vi.spyOn(authHelper, 'getUserIdFromRequest').mockResolvedValue('user-gm-123');
      const getSpy = vi.spyOn(sessionsService, 'getSessions').mockResolvedValue([]);

      const request = new Request('http://localhost/api/sessions');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(getSpy).toHaveBeenCalledWith({ userId: 'user-gm-123' });
    });

    it('scopes POST /api/sessions to authenticated userId when present', async () => {
      vi.spyOn(authHelper, 'getUserIdFromRequest').mockResolvedValue('user-gm-123');
      const createSpy = vi.spyOn(sessionsService, 'createSession').mockResolvedValue({
        id: 'new-id',
        name: 'Kampania Strahda',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as Session);

      const request = new Request('http://localhost/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Kampania Strahda' }),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(createSpy).toHaveBeenCalledWith({
        name: 'Kampania Strahda',
        userId: 'user-gm-123',
      });
    });

    it('scopes PUT /api/sessions/[id] to authenticated userId when present', async () => {
      vi.spyOn(authHelper, 'getUserIdFromRequest').mockResolvedValue('user-gm-123');
      const updateSpy = vi.spyOn(sessionsService, 'updateSession').mockResolvedValue({
        id: 's-1',
        name: 'Nowa Nazwa',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as Session);

      const request = new Request('http://localhost/api/sessions/s-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Nowa Nazwa' }),
      });

      const response = await PUT(request, {
        params: Promise.resolve({ id: 's-1' }),
      });

      expect(response.status).toBe(200);
      expect(updateSpy).toHaveBeenCalledWith('s-1', {
        name: 'Nowa Nazwa',
        userId: 'user-gm-123',
      });
    });

    it('scopes DELETE /api/sessions/[id] to authenticated userId when present', async () => {
      vi.spyOn(authHelper, 'getUserIdFromRequest').mockResolvedValue('user-gm-123');
      const deleteSpy = vi.spyOn(sessionsService, 'deleteSession').mockResolvedValue({
        id: 's-1',
        name: 'Usunięta',
      } as unknown as Session);

      const request = new Request('http://localhost/api/sessions/s-1', {
        method: 'DELETE',
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ id: 's-1' }),
      });

      expect(response.status).toBe(200);
      expect(deleteSpy).toHaveBeenCalledWith('s-1', {
        userId: 'user-gm-123',
      });
    });
  });
});
