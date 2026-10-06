import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as combatService from '@/lib/combat';
import { PATCH as PATCH_COMBATANT } from './[id]/combatants/[combatantId]/route';
import { DELETE as DELETE_STATUS } from './[id]/combatants/[combatantId]/status/[statusId]/route';
import { POST as POST_STATUS } from './[id]/combatants/[combatantId]/status/route';
import { POST as POST_COMBATANTS } from './[id]/combatants/route';
import { POST as POST_END } from './[id]/end/route';
import { POST as POST_NEXT_TURN } from './[id]/next-turn/route';
import { GET as GET_COMBAT } from './[id]/route';
import { POST as POST_START } from './start/route';

describe('/api/combat Endpoints (Chunk 5.1)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/combat/start', () => {
    it('starts combat and returns 201', async () => {
      const mockCombat = {
        id: 'comb-1',
        sessionId: 'sess-1',
        status: 'ACTIVE',
        combatants: [],
      };

      vi.spyOn(combatService, 'startCombat').mockResolvedValue(
        mockCombat as unknown as Awaited<ReturnType<typeof combatService.startCombat>>
      );

      const request = new Request('http://localhost/api/combat/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'sess-1',
          combatants: [{ nameOverride: 'Goblin', initiative: 12 }],
        }),
      });

      const response = await POST_START(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.combat.id).toBe('comb-1');
    });

    it('returns 400 if sessionId is missing', async () => {
      const request = new Request('http://localhost/api/combat/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ combatants: [] }),
      });

      const response = await POST_START(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('sessionId is required');
    });
  });

  describe('GET /api/combat/[id]', () => {
    it('returns combat if found', async () => {
      const mockCombat = { id: 'comb-1', status: 'ACTIVE', combatants: [] };
      vi.spyOn(combatService, 'getCombatById').mockResolvedValue(
        mockCombat as unknown as Awaited<ReturnType<typeof combatService.getCombatById>>
      );

      const request = new Request('http://localhost/api/combat/comb-1');
      const response = await GET_COMBAT(request, { params: Promise.resolve({ id: 'comb-1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.combat.id).toBe('comb-1');
    });

    it('returns 404 if combat not found', async () => {
      vi.spyOn(combatService, 'getCombatById').mockResolvedValue(null);

      const request = new Request('http://localhost/api/combat/nonexistent');
      const response = await GET_COMBAT(request, {
        params: Promise.resolve({ id: 'nonexistent' }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });
  });

  describe('POST /api/combat/[id]/next-turn', () => {
    it('advances turn and returns updated combat', async () => {
      const mockCombat = { id: 'comb-1', currentRound: 1, currentTurnIndex: 1 };
      vi.spyOn(combatService, 'nextTurn').mockResolvedValue(
        mockCombat as unknown as Awaited<ReturnType<typeof combatService.nextTurn>>
      );

      const request = new Request('http://localhost/api/combat/comb-1/next-turn', {
        method: 'POST',
      });
      const response = await POST_NEXT_TURN(request, {
        params: Promise.resolve({ id: 'comb-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.combat.currentTurnIndex).toBe(1);
    });
  });

  describe('POST /api/combat/[id]/combatants', () => {
    it('adds combatant and returns 201', async () => {
      const mockCombatant = { id: 'cb-new', nameOverride: 'Wilk', order: 2 };
      vi.spyOn(combatService, 'addCombatantToCombat').mockResolvedValue(
        mockCombatant as unknown as Awaited<ReturnType<typeof combatService.addCombatantToCombat>>
      );

      const request = new Request('http://localhost/api/combat/comb-1/combatants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nameOverride: 'Wilk', initiative: 14 }),
      });
      const response = await POST_COMBATANTS(request, {
        params: Promise.resolve({ id: 'comb-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.combatant.nameOverride).toBe('Wilk');
    });
  });

  describe('PATCH /api/combat/[id]/combatants/[combatantId]', () => {
    it('updates combatant hp and returns 200', async () => {
      const mockCombatant = { id: 'cb-1', currentHp: 15 };
      vi.spyOn(combatService, 'updateCombatantHp').mockResolvedValue(
        mockCombatant as unknown as Awaited<ReturnType<typeof combatService.updateCombatantHp>>
      );

      const request = new Request('http://localhost/api/combat/comb-1/combatants/cb-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta: -5 }),
      });
      const response = await PATCH_COMBATANT(request, {
        params: Promise.resolve({ id: 'comb-1', combatantId: 'cb-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.combatant.currentHp).toBe(15);
    });
  });

  describe('POST /api/combat/[id]/combatants/[combatantId]/status', () => {
    it('applies status and returns 201', async () => {
      const mockStatus = { id: 'st-1', statusName: 'Poisoned', durationTurns: 2 };
      vi.spyOn(combatService, 'applyStatusToCombatant').mockResolvedValue(
        mockStatus as unknown as Awaited<ReturnType<typeof combatService.applyStatusToCombatant>>
      );

      const request = new Request('http://localhost/api/combat/comb-1/combatants/cb-1/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusName: 'Poisoned', durationTurns: 2 }),
      });
      const response = await POST_STATUS(request, {
        params: Promise.resolve({ id: 'comb-1', combatantId: 'cb-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.status.statusName).toBe('Poisoned');
    });
  });

  describe('DELETE /api/combat/[id]/combatants/[combatantId]/status/[statusId]', () => {
    it('removes status and returns 200', async () => {
      vi.spyOn(combatService, 'removeStatusFromCombatant').mockResolvedValue(true);

      const request = new Request(
        'http://localhost/api/combat/comb-1/combatants/cb-1/status/st-1',
        {
          method: 'DELETE',
        }
      );
      const response = await DELETE_STATUS(request, {
        params: Promise.resolve({ id: 'comb-1', combatantId: 'cb-1', statusId: 'st-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('Status removed');
    });
  });

  describe('POST /api/combat/[id]/end', () => {
    it('ends combat and returns 200', async () => {
      const mockCombat = { id: 'comb-1', status: 'FINISHED' };
      vi.spyOn(combatService, 'endCombat').mockResolvedValue(
        mockCombat as unknown as Awaited<ReturnType<typeof combatService.endCombat>>
      );

      const request = new Request('http://localhost/api/combat/comb-1/end', { method: 'POST' });
      const response = await POST_END(request, { params: Promise.resolve({ id: 'comb-1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.combat.status).toBe('FINISHED');
    });
  });
});
