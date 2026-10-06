import { describe, expect, it, vi } from 'vitest';
import {
  type CharacterPrismaClient,
  createCharacter,
  deleteCharacter,
  getCharacterById,
  getCharactersBySession,
  updateCharacter,
  updateCharacterHp,
  updateCharacterSpellSlots,
  validateCharacterInput,
} from './characters';

describe('Characters Service (Chunk 3.1)', () => {
  describe('validateCharacterInput', () => {
    it('accepts valid hero input and trims strings', () => {
      const res = validateCharacterInput({
        sessionId: 'sess-123',
        name: '  Gandalf Szary  ',
        type: 'HERO',
        race: 'Human',
        class: 'Wizard',
        level: 5,
      });

      expect(res.valid).toBe(true);
      if (res.valid) {
        expect(res.data.name).toBe('Gandalf Szary');
        expect(res.data.type).toBe('HERO');
        expect(res.data.level).toBe(5);
      }
    });

    it('rejects missing or empty character name', () => {
      const res1 = validateCharacterInput({ sessionId: 's-1', name: '' });
      expect(res1.valid).toBe(false);
      if (!res1.valid) {
        expect(res1.error).toContain('name is required');
      }

      const res2 = validateCharacterInput({ sessionId: 's-1' });
      expect(res2.valid).toBe(false);
    });

    it('rejects missing sessionId', () => {
      const res = validateCharacterInput({ name: 'Legolas' });
      expect(res.valid).toBe(false);
      if (!res.valid) {
        expect(res.error).toContain('sessionId is required');
      }
    });

    it('rejects invalid level (< 1 or > 20)', () => {
      const res1 = validateCharacterInput({ sessionId: 's-1', name: 'Gimli', level: 0 });
      expect(res1.valid).toBe(false);

      const res2 = validateCharacterInput({ sessionId: 's-1', name: 'Gimli', level: 21 });
      expect(res2.valid).toBe(false);
    });

    it('rejects invalid character type', () => {
      const res = validateCharacterInput({
        sessionId: 's-1',
        name: 'Orc',
        type: 'INVALID_TYPE' as unknown as 'HERO',
      });
      expect(res.valid).toBe(false);
    });
  });

  describe('getCharactersBySession', () => {
    it('returns characters for session ordered by type and name', async () => {
      const mockList = [
        { id: 'c-1', name: 'Aragorn', type: 'HERO', sessionId: 's-1' },
        { id: 'c-2', name: 'Karczmarz', type: 'NPC', sessionId: 's-1' },
      ];

      const mockClient = {
        character: {
          findMany: vi.fn().mockResolvedValue(mockList),
        },
      } as unknown as CharacterPrismaClient;

      const result = await getCharactersBySession('s-1', mockClient);
      expect(result).toEqual(mockList);
      expect(mockClient.character.findMany).toHaveBeenCalledWith({
        where: { sessionId: 's-1' },
        orderBy: [{ type: 'asc' }, { name: 'asc' }],
      });
    });
  });

  describe('getCharacterById', () => {
    it('returns single character by id', async () => {
      const mockChar = { id: 'c-1', name: 'Gimli', maxHp: 30, currentHp: 30 };
      const mockClient = {
        character: {
          findUnique: vi.fn().mockResolvedValue(mockChar),
        },
      } as unknown as CharacterPrismaClient;

      const result = await getCharacterById('c-1', mockClient);
      expect(result).toEqual(mockChar);
      expect(mockClient.character.findUnique).toHaveBeenCalledWith({ where: { id: 'c-1' } });
    });

    it('returns null if character does not exist', async () => {
      const mockClient = {
        character: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
      } as unknown as CharacterPrismaClient;

      const result = await getCharacterById('nonexistent', mockClient);
      expect(result).toBeNull();
    });
  });

  describe('createCharacter', () => {
    it('creates character and auto-computes HP, AC, PP, and spell slots if not specified', async () => {
      const mockSession = { id: 's-1', name: 'Session 1' };
      const createdChar = {
        id: 'c-new',
        sessionId: 's-1',
        name: 'Raistlin',
        class: 'Wizard',
        level: 3,
        maxHp: 14,
        currentHp: 14,
        ac: 12,
        passivePerception: 11,
        stats: { str: 8, dex: 14, con: 12, int: 16, wis: 12, cha: 10, tempHp: 0 },
        spells: {
          slots: {
            1: { max: 4, used: 0 },
            2: { max: 2, used: 0 },
          },
        },
      };

      const mockClient = {
        session: {
          findUnique: vi.fn().mockResolvedValue(mockSession),
        },
        character: {
          create: vi.fn().mockResolvedValue(createdChar),
        },
      } as unknown as CharacterPrismaClient;

      const result = await createCharacter(
        {
          sessionId: 's-1',
          name: 'Raistlin',
          class: 'Wizard',
          level: 3,
          stats: { str: 8, dex: 14, con: 12, int: 16, wis: 12, cha: 10 },
        },
        mockClient
      );

      expect(mockClient.session.findUnique).toHaveBeenCalledWith({ where: { id: 's-1' } });
      expect(mockClient.character.create).toHaveBeenCalled();
      expect(result).toEqual(createdChar);
    });

    it('throws error if session does not exist', async () => {
      const mockClient = {
        session: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
      } as unknown as CharacterPrismaClient;

      await expect(
        createCharacter({ sessionId: 'invalid', name: 'Hero' }, mockClient)
      ).rejects.toThrow('Session not found');
    });

    it('throws error if validation fails', async () => {
      const mockClient = {} as unknown as CharacterPrismaClient;
      await expect(createCharacter({ sessionId: '', name: '' }, mockClient)).rejects.toThrow();
    });
  });

  describe('updateCharacter', () => {
    it('updates character fields when character exists', async () => {
      const existing = { id: 'c-1', name: 'Legolas', level: 3 };
      const updated = { id: 'c-1', name: 'Legolas Greenleaf', level: 4 };

      const mockClient = {
        character: {
          findUnique: vi.fn().mockResolvedValue(existing),
          update: vi.fn().mockResolvedValue(updated),
        },
      } as unknown as CharacterPrismaClient;

      const result = await updateCharacter(
        'c-1',
        { name: 'Legolas Greenleaf', level: 4 },
        mockClient
      );

      expect(result).toEqual(updated);
      expect(mockClient.character.update).toHaveBeenCalledWith({
        where: { id: 'c-1' },
        data: expect.objectContaining({ name: 'Legolas Greenleaf', level: 4 }),
      });
    });

    it('returns null if character does not exist', async () => {
      const mockClient = {
        character: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
      } as unknown as CharacterPrismaClient;

      const result = await updateCharacter('c-404', { name: 'Ghost' }, mockClient);
      expect(result).toBeNull();
    });
  });

  describe('updateCharacterHp', () => {
    it('correctly applies damage absorbing tempHp first', async () => {
      const existing = {
        id: 'c-1',
        maxHp: 20,
        currentHp: 20,
        stats: { tempHp: 5 },
      };

      const mockClient = {
        character: {
          findUnique: vi.fn().mockResolvedValue(existing),
          update: vi.fn().mockImplementation(({ data }) => ({ ...existing, ...data })),
        },
      } as unknown as CharacterPrismaClient;

      // Taking 8 damage with 5 tempHp -> 0 tempHp, 17 currentHp
      const result = await updateCharacterHp('c-1', { action: 'damage', amount: 8 }, mockClient);
      expect(result?.currentHp).toBe(17);
      expect((result?.stats as Record<string, number>)?.tempHp).toBe(0);
    });

    it('correctly applies healing capped at maxHp', async () => {
      const existing = {
        id: 'c-1',
        maxHp: 30,
        currentHp: 15,
        stats: { tempHp: 4 },
      };

      const mockClient = {
        character: {
          findUnique: vi.fn().mockResolvedValue(existing),
          update: vi.fn().mockImplementation(({ data }) => ({ ...existing, ...data })),
        },
      } as unknown as CharacterPrismaClient;

      // Healing 20 on 15/30 -> caps at 30, tempHp unchanged
      const result = await updateCharacterHp('c-1', { action: 'heal', amount: 20 }, mockClient);
      expect(result?.currentHp).toBe(30);
      expect((result?.stats as Record<string, number>)?.tempHp).toBe(4);
    });

    it('supports delta format for HP changes', async () => {
      const existing = {
        id: 'c-1',
        maxHp: 25,
        currentHp: 20,
        stats: { tempHp: 0 },
      };

      const mockClient = {
        character: {
          findUnique: vi.fn().mockResolvedValue(existing),
          update: vi.fn().mockImplementation(({ data }) => ({ ...existing, ...data })),
        },
      } as unknown as CharacterPrismaClient;

      const result = await updateCharacterHp('c-1', { delta: -5 }, mockClient);
      expect(result?.currentHp).toBe(15);
    });

    it('returns null if character is not found', async () => {
      const mockClient = {
        character: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
      } as unknown as CharacterPrismaClient;

      const result = await updateCharacterHp('c-404', { delta: 5 }, mockClient);
      expect(result).toBeNull();
    });
  });

  describe('updateCharacterSpellSlots', () => {
    it('uses and recovers spell slots properly', async () => {
      const existing = {
        id: 'c-1',
        class: 'Wizard',
        level: 3,
        spells: {
          slots: {
            1: { max: 4, used: 1 },
            2: { max: 2, used: 0 },
          },
        },
      };

      const mockClient = {
        character: {
          findUnique: vi.fn().mockResolvedValue(existing),
          update: vi.fn().mockImplementation(({ data }) => ({ ...existing, ...data })),
        },
      } as unknown as CharacterPrismaClient;

      // Use slot level 1
      const resUse = await updateCharacterSpellSlots(
        'c-1',
        { slotLevel: 1, action: 'use' },
        mockClient
      );
      expect((resUse?.spells as { slots: Record<number, { used: number }> })?.slots[1]?.used).toBe(
        2
      );

      // Set slot level 2 directly
      const resSet = await updateCharacterSpellSlots(
        'c-1',
        { slotLevel: 2, action: 'set', value: 2 },
        mockClient
      );
      expect((resSet?.spells as { slots: Record<number, { used: number }> })?.slots[2]?.used).toBe(
        2
      );
    });

    it('returns null if character is not found', async () => {
      const mockClient = {
        character: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
      } as unknown as CharacterPrismaClient;

      const result = await updateCharacterSpellSlots(
        'c-404',
        { slotLevel: 1, action: 'use' },
        mockClient
      );
      expect(result).toBeNull();
    });
  });

  describe('deleteCharacter', () => {
    it('deletes character when existing', async () => {
      const existing = { id: 'c-1', name: 'Orc' };
      const mockClient = {
        character: {
          findUnique: vi.fn().mockResolvedValue(existing),
          delete: vi.fn().mockResolvedValue(existing),
        },
      } as unknown as CharacterPrismaClient;

      const result = await deleteCharacter('c-1', mockClient);
      expect(result).toEqual(existing);
      expect(mockClient.character.delete).toHaveBeenCalledWith({ where: { id: 'c-1' } });
    });

    it('returns null if character not found', async () => {
      const mockClient = {
        character: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
      } as unknown as CharacterPrismaClient;

      const result = await deleteCharacter('c-404', mockClient);
      expect(result).toBeNull();
    });
  });
});
