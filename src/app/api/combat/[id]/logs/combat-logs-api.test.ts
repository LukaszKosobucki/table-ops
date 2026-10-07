import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as authService from '@/lib/auth';
import * as logsService from '@/lib/logs';
import { GET } from './route';

describe('/api/combat/[id]/logs Endpoints (Chunk 7.1)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(authService, 'getUserIdFromRequest').mockResolvedValue('user-123');
  });

  describe('GET /api/combat/[id]/logs', () => {
    it('returns 400 if combat id is missing', async () => {
      const request = new Request('http://localhost/api/combat//logs');
      const response = await GET(request, {
        params: Promise.resolve({ id: '' }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Combat ID is required');
    });

    it('returns 200 with combat logs ordered chronologically', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          combatId: 'combat-1',
          sessionId: 'sess-1',
          logType: 'COMBAT_ACTION',
          description: 'Runda 1: Tura Valeros',
          createdAt: new Date(),
        },
      ];

      vi.spyOn(logsService, 'getCombatLogs').mockResolvedValue(
        mockLogs as unknown as Awaited<ReturnType<typeof logsService.getCombatLogs>>
      );

      const request = new Request('http://localhost/api/combat/combat-1/logs?limit=20&offset=0');
      const response = await GET(request, {
        params: Promise.resolve({ id: 'combat-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.logs).toHaveLength(1);
      expect(logsService.getCombatLogs).toHaveBeenCalledWith('combat-1', {
        limit: 20,
        offset: 0,
        userId: 'user-123',
      });
    });

    it('returns 500 when getCombatLogs throws an error', async () => {
      vi.spyOn(logsService, 'getCombatLogs').mockRejectedValue(new Error('Database error'));

      const request = new Request('http://localhost/api/combat/combat-1/logs');
      const response = await GET(request, {
        params: Promise.resolve({ id: 'combat-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });
});
