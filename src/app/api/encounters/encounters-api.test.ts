import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as encountersService from '@/lib/encounters';
import {
  GET as GET_SESSION_ENCOUNTERS,
  POST as POST_SESSION_ENCOUNTERS,
} from '../sessions/[id]/encounters/route';
import { DELETE, GET as GET_ONE, PUT } from './[id]/route';
import { POST as POST_TOP_LEVEL } from './route';

describe('/api/encounters Endpoints (Chunk 4.1)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/sessions/[id]/encounters', () => {
    it('returns encounters for valid session id', async () => {
      const mockEncounters = [
        { id: 'enc-1', sessionId: 'sess-1', name: 'Goblin Ambush', members: [] },
      ];

      vi.spyOn(encountersService, 'getEncountersBySession').mockResolvedValue(
        mockEncounters as unknown as Awaited<
          ReturnType<typeof encountersService.getEncountersBySession>
        >
      );

      const request = new Request('http://localhost/api/sessions/sess-1/encounters');
      const response = await GET_SESSION_ENCOUNTERS(request, {
        params: Promise.resolve({ id: 'sess-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.encounters).toHaveLength(1);
      expect(data.encounters[0].name).toBe('Goblin Ambush');
    });
  });

  describe('POST /api/sessions/[id]/encounters', () => {
    it('creates encounter in session and returns 201', async () => {
      const mockCreated = {
        id: 'enc-1',
        sessionId: 'sess-1',
        name: 'Skeleton Crypt',
        members: [{ id: 'mem-1', count: 4 }],
      };

      vi.spyOn(encountersService, 'createEncounter').mockResolvedValue(
        mockCreated as unknown as Awaited<ReturnType<typeof encountersService.createEncounter>>
      );

      const request = new Request('http://localhost/api/sessions/sess-1/encounters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Skeleton Crypt',
          members: [{ monsterId: 'mon-skel', count: 4 }],
        }),
      });

      const response = await POST_SESSION_ENCOUNTERS(request, {
        params: Promise.resolve({ id: 'sess-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.encounter.name).toBe('Skeleton Crypt');
    });

    it('returns 400 on validation failure', async () => {
      const request = new Request('http://localhost/api/sessions/sess-1/encounters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '', // Empty name
        }),
      });

      const response = await POST_SESSION_ENCOUNTERS(request, {
        params: Promise.resolve({ id: 'sess-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('name is required');
    });
  });

  describe('POST /api/encounters (top-level)', () => {
    it('creates encounter and returns 201', async () => {
      const mockCreated = {
        id: 'enc-2',
        sessionId: 'sess-1',
        name: 'Dragon Lair',
        members: [],
      };

      vi.spyOn(encountersService, 'createEncounter').mockResolvedValue(
        mockCreated as unknown as Awaited<ReturnType<typeof encountersService.createEncounter>>
      );

      const request = new Request('http://localhost/api/encounters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'sess-1',
          name: 'Dragon Lair',
        }),
      });

      const response = await POST_TOP_LEVEL(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.encounter.name).toBe('Dragon Lair');
    });
  });

  describe('GET /api/encounters/[id]', () => {
    it('returns 200 with encounter data when found', async () => {
      const mockEncounter = { id: 'enc-1', name: 'Orc Camp', members: [] };

      vi.spyOn(encountersService, 'getEncounterById').mockResolvedValue(
        mockEncounter as unknown as Awaited<ReturnType<typeof encountersService.getEncounterById>>
      );

      const request = new Request('http://localhost/api/encounters/enc-1');
      const response = await GET_ONE(request, { params: Promise.resolve({ id: 'enc-1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.encounter.name).toBe('Orc Camp');
    });

    it('returns 404 if encounter not found', async () => {
      vi.spyOn(encountersService, 'getEncounterById').mockResolvedValue(null);

      const request = new Request('http://localhost/api/encounters/nonexistent');
      const response = await GET_ONE(request, { params: Promise.resolve({ id: 'nonexistent' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Encounter not found');
    });
  });

  describe('PUT /api/encounters/[id]', () => {
    it('updates encounter name and members', async () => {
      const mockUpdated = {
        id: 'enc-1',
        name: 'Orc Warband',
        members: [{ id: 'mem-1', count: 5 }],
      };

      vi.spyOn(encountersService, 'updateEncounter').mockResolvedValue(
        mockUpdated as unknown as Awaited<ReturnType<typeof encountersService.updateEncounter>>
      );

      const request = new Request('http://localhost/api/encounters/enc-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Orc Warband',
          members: [{ monsterId: 'mon-orc', count: 5 }],
        }),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: 'enc-1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.encounter.name).toBe('Orc Warband');
    });

    it('returns 404 when encounter to update does not exist', async () => {
      vi.spyOn(encountersService, 'updateEncounter').mockResolvedValue(null);

      const request = new Request('http://localhost/api/encounters/nonexistent', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Bandits' }),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: 'nonexistent' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });
  });

  describe('DELETE /api/encounters/[id]', () => {
    it('deletes encounter and returns success', async () => {
      const mockDeleted = { id: 'enc-1', name: 'To Delete' };

      vi.spyOn(encountersService, 'deleteEncounter').mockResolvedValue(
        mockDeleted as unknown as Awaited<ReturnType<typeof encountersService.deleteEncounter>>
      );

      const request = new Request('http://localhost/api/encounters/enc-1', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: 'enc-1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('deleted successfully');
    });

    it('returns 404 if encounter does not exist', async () => {
      vi.spyOn(encountersService, 'deleteEncounter').mockResolvedValue(null);

      const request = new Request('http://localhost/api/encounters/nonexistent', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: 'nonexistent' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });
  });
});
