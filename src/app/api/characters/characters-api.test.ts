import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as charactersService from '@/lib/characters';
import {
  GET as GET_SESSION_CHARS,
  POST as POST_SESSION_CHARS,
} from '../sessions/[id]/characters/route';
import { PATCH as PATCH_HP } from './[id]/hp/route';
import { DELETE, GET as GET_ONE, PUT } from './[id]/route';
import { PATCH as PATCH_SLOTS } from './[id]/slots/route';
import { POST } from './route';

describe('/api/characters Endpoints (Chunk 3.1)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/characters', () => {
    it('creates a character and returns 201', async () => {
      const mockCreated = {
        id: 'char-1',
        sessionId: 'sess-1',
        name: 'Gimli',
        type: 'HERO',
        level: 1,
        maxHp: 14,
        currentHp: 14,
        ac: 10,
        passivePerception: 10,
      };

      vi.spyOn(charactersService, 'createCharacter').mockResolvedValue(
        mockCreated as unknown as Awaited<ReturnType<typeof charactersService.createCharacter>>
      );

      const request = new Request('http://localhost/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'sess-1',
          name: 'Gimli',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.character.name).toBe('Gimli');
    });

    it('returns 400 on invalid body JSON', async () => {
      const request = new Request('http://localhost/api/characters', {
        method: 'POST',
        body: 'invalid-json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid request body');
    });

    it('returns 404 if session is not found', async () => {
      vi.spyOn(charactersService, 'createCharacter').mockRejectedValue(
        new Error('Session not found')
      );

      const request = new Request('http://localhost/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'nonexistent',
          name: 'Gimli',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Session not found');
    });
  });

  describe('GET /api/characters/[id]', () => {
    it('returns 200 with character when found', async () => {
      const mockChar = { id: 'char-1', name: 'Aragorn' };
      vi.spyOn(charactersService, 'getCharacterById').mockResolvedValue(
        mockChar as unknown as Awaited<ReturnType<typeof charactersService.getCharacterById>>
      );

      const request = new Request('http://localhost/api/characters/char-1');
      const response = await GET_ONE(request, {
        params: Promise.resolve({ id: 'char-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.character.name).toBe('Aragorn');
    });

    it('returns 404 when character not found', async () => {
      vi.spyOn(charactersService, 'getCharacterById').mockResolvedValue(null);

      const request = new Request('http://localhost/api/characters/char-404');
      const response = await GET_ONE(request, {
        params: Promise.resolve({ id: 'char-404' }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });
  });

  describe('PUT /api/characters/[id]', () => {
    it('updates character and returns 200', async () => {
      const updated = { id: 'char-1', name: 'Aragorn II Elessar', level: 10 };
      vi.spyOn(charactersService, 'updateCharacter').mockResolvedValue(
        updated as unknown as Awaited<ReturnType<typeof charactersService.updateCharacter>>
      );

      const request = new Request('http://localhost/api/characters/char-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Aragorn II Elessar', level: 10 }),
      });

      const response = await PUT(request, {
        params: Promise.resolve({ id: 'char-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.character.name).toBe('Aragorn II Elessar');
    });

    it('returns 404 if character does not exist', async () => {
      vi.spyOn(charactersService, 'updateCharacter').mockResolvedValue(null);

      const request = new Request('http://localhost/api/characters/char-404', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Ghost' }),
      });

      const response = await PUT(request, {
        params: Promise.resolve({ id: 'char-404' }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/characters/[id]', () => {
    it('deletes character and returns 200', async () => {
      const deleted = { id: 'char-1', name: 'Orc' };
      vi.spyOn(charactersService, 'deleteCharacter').mockResolvedValue(
        deleted as unknown as Awaited<ReturnType<typeof charactersService.deleteCharacter>>
      );

      const request = new Request('http://localhost/api/characters/char-1', {
        method: 'DELETE',
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ id: 'char-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('returns 404 if character not found', async () => {
      vi.spyOn(charactersService, 'deleteCharacter').mockResolvedValue(null);

      const request = new Request('http://localhost/api/characters/char-404', {
        method: 'DELETE',
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ id: 'char-404' }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/characters/[id]/hp', () => {
    it('updates HP and returns 200', async () => {
      const updated = { id: 'char-1', currentHp: 15, maxHp: 20 };
      vi.spyOn(charactersService, 'updateCharacterHp').mockResolvedValue(
        updated as unknown as Awaited<ReturnType<typeof charactersService.updateCharacterHp>>
      );

      const request = new Request('http://localhost/api/characters/char-1/hp', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'damage', amount: 5 }),
      });

      const response = await PATCH_HP(request, {
        params: Promise.resolve({ id: 'char-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.character.currentHp).toBe(15);
    });

    it('returns 404 if character is not found', async () => {
      vi.spyOn(charactersService, 'updateCharacterHp').mockResolvedValue(null);

      const request = new Request('http://localhost/api/characters/char-404/hp', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta: -5 }),
      });

      const response = await PATCH_HP(request, {
        params: Promise.resolve({ id: 'char-404' }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/characters/[id]/slots', () => {
    it('updates spell slots and returns 200', async () => {
      const updated = {
        id: 'char-1',
        spells: { slots: { 1: { max: 4, used: 1 } } },
      };
      vi.spyOn(charactersService, 'updateCharacterSpellSlots').mockResolvedValue(
        updated as unknown as Awaited<
          ReturnType<typeof charactersService.updateCharacterSpellSlots>
        >
      );

      const request = new Request('http://localhost/api/characters/char-1/slots', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotLevel: 1, action: 'use' }),
      });

      const response = await PATCH_SLOTS(request, {
        params: Promise.resolve({ id: 'char-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.character.spells.slots[1].used).toBe(1);
    });

    it('returns 404 if character not found', async () => {
      vi.spyOn(charactersService, 'updateCharacterSpellSlots').mockResolvedValue(null);

      const request = new Request('http://localhost/api/characters/char-404/slots', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotLevel: 1, action: 'use' }),
      });

      const response = await PATCH_SLOTS(request, {
        params: Promise.resolve({ id: 'char-404' }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe('GET & POST /api/sessions/[id]/characters', () => {
    it('returns session characters with 200', async () => {
      const mockList = [{ id: 'char-1', name: 'Boromir' }];
      vi.spyOn(charactersService, 'getCharactersBySession').mockResolvedValue(
        mockList as unknown as Awaited<ReturnType<typeof charactersService.getCharactersBySession>>
      );

      const request = new Request('http://localhost/api/sessions/sess-1/characters');
      const response = await GET_SESSION_CHARS(request, {
        params: Promise.resolve({ id: 'sess-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.characters).toHaveLength(1);
    });

    it('creates character scoped to session with 201', async () => {
      const created = { id: 'char-2', sessionId: 'sess-1', name: 'Faramir' };
      vi.spyOn(charactersService, 'createCharacter').mockResolvedValue(
        created as unknown as Awaited<ReturnType<typeof charactersService.createCharacter>>
      );

      const request = new Request('http://localhost/api/sessions/sess-1/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Faramir' }),
      });

      const response = await POST_SESSION_CHARS(request, {
        params: Promise.resolve({ id: 'sess-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.character.name).toBe('Faramir');
      expect(charactersService.createCharacter).toHaveBeenCalledWith(
        expect.objectContaining({ sessionId: 'sess-1', name: 'Faramir' })
      );
    });
  });
});
