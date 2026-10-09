import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { GET as getItemsRoute } from './items/route';
import { GET as getMonstersRoute } from './monsters/route';
import { GET as getSpellsRoute } from './spells/route';

describe('/api/compendium REST Endpoints (Chunk 8.1)', () => {
  describe('GET /api/compendium/spells', () => {
    it('returns 200 with paginated list of spells', async () => {
      const req = new NextRequest('http://localhost:3000/api/compendium/spells');
      const res = await getSpellsRoute(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.count).toBe(20);
      expect(data.total).toBeGreaterThan(20);
      expect(data.hasMore).toBe(true);
      expect(Array.isArray(data.spells)).toBe(true);
    });

    it('respects limit and offset query parameters', async () => {
      const req = new NextRequest('http://localhost:3000/api/compendium/spells?limit=5&offset=10');
      const res = await getSpellsRoute(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.count).toBe(5);
      expect(data.offset).toBe(10);
      expect(data.limit).toBe(5);
    });

    it('filters spells by level and school query params', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/compendium/spells?level=3&school=Evocation'
      );
      const res = await getSpellsRoute(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.spells.length).toBeGreaterThan(0);
      expect(data.spells.every((s: { level: number }) => s.level === 3)).toBe(true);
      expect(
        data.spells.every((s: { school: string }) => s.school.toLowerCase() === 'evocation')
      ).toBe(true);
    });

    it('filters spells by search query', async () => {
      const req = new NextRequest('http://localhost:3000/api/compendium/spells?search=cure');
      const res = await getSpellsRoute(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.spells.some((s: { name: string }) => s.name.includes('Cure'))).toBe(true);
    });
  });

  describe('GET /api/compendium/items', () => {
    it('returns 200 with paginated list of items', async () => {
      const req = new NextRequest('http://localhost:3000/api/compendium/items');
      const res = await getItemsRoute(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.count).toBe(20);
      expect(data.total).toBeGreaterThan(20);
      expect(data.hasMore).toBe(true);
      expect(Array.isArray(data.items)).toBe(true);
    });

    it('respects limit and offset query parameters', async () => {
      const req = new NextRequest('http://localhost:3000/api/compendium/items?limit=8&offset=16');
      const res = await getItemsRoute(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.count).toBe(8);
      expect(data.offset).toBe(16);
      expect(data.limit).toBe(8);
    });

    it('filters items by type', async () => {
      const req = new NextRequest('http://localhost:3000/api/compendium/items?type=Weapon');
      const res = await getItemsRoute(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.items.length).toBeGreaterThan(0);
      expect(
        data.items.every((i: { type: string }) => i.type.toLowerCase().includes('weapon'))
      ).toBe(true);
    });
  });

  describe('GET /api/compendium/monsters', () => {
    it('returns 200 with paginated list of monsters', async () => {
      const req = new NextRequest('http://localhost:3000/api/compendium/monsters');
      const res = await getMonstersRoute(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.count).toBe(20);
      expect(data.total).toBeGreaterThan(20);
      expect(data.hasMore).toBe(true);
      expect(Array.isArray(data.monsters)).toBe(true);
    });

    it('respects limit and offset query parameters', async () => {
      const req = new NextRequest('http://localhost:3000/api/compendium/monsters?limit=5&offset=5');
      const res = await getMonstersRoute(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.count).toBe(5);
      expect(data.offset).toBe(5);
      expect(data.limit).toBe(5);
    });

    it('filters monsters by cr query param', async () => {
      const req = new NextRequest('http://localhost:3000/api/compendium/monsters?cr=0.25');
      const res = await getMonstersRoute(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.monsters.length).toBeGreaterThan(0);
      expect(
        data.monsters.every((m: { challengeRating: number }) => m.challengeRating === 0.25)
      ).toBe(true);
    });
  });
});
