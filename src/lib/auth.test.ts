import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type AuthClient,
  getGuestIdFromRequest,
  getUserFromRequest,
  getUserIdFromRequest,
} from './auth';

describe('Auth Helper (Chunk 6.1)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns null user and null id when no auth token or session exists', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    };

    const user = await getUserFromRequest(undefined, mockSupabase as unknown as AuthClient);
    const userId = await getUserIdFromRequest(undefined, mockSupabase as unknown as AuthClient);

    expect(user).toBeNull();
    expect(userId).toBeNull();
  });

  it('extracts user from Bearer token in Authorization header', async () => {
    const mockUser = {
      id: 'user-uuid-1',
      email: 'gm@tableops.app',
      user_metadata: { name: 'Mistrz Gry' },
    };

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockImplementation((token?: string) => {
          if (token === 'valid-jwt-token') {
            return Promise.resolve({ data: { user: mockUser }, error: null });
          }
          return Promise.resolve({ data: { user: null }, error: new Error('Invalid token') });
        }),
      },
    };

    const req = new Request('http://localhost/api/sessions', {
      headers: {
        Authorization: 'Bearer valid-jwt-token',
      },
    });

    const user = await getUserFromRequest(req, mockSupabase as unknown as AuthClient);
    const userId = await getUserIdFromRequest(req, mockSupabase as unknown as AuthClient);

    expect(mockSupabase.auth.getUser).toHaveBeenCalledWith('valid-jwt-token');
    expect(user).toEqual(mockUser);
    expect(userId).toBe('user-uuid-1');
  });

  it('extracts user from cookie session when Authorization header is not present', async () => {
    const mockUser = {
      id: 'cookie-user-2',
      email: 'player@tableops.app',
    };

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
    };

    const req = new Request('http://localhost/api/sessions');

    const user = await getUserFromRequest(req, mockSupabase as unknown as AuthClient);
    const userId = await getUserIdFromRequest(req, mockSupabase as unknown as AuthClient);

    expect(mockSupabase.auth.getUser).toHaveBeenCalledWith();
    expect(user).toEqual(mockUser);
    expect(userId).toBe('cookie-user-2');
  });

  it('handles auth errors gracefully and returns null user', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockRejectedValue(new Error('Network error')),
      },
    };

    const user = await getUserFromRequest(undefined, mockSupabase as unknown as AuthClient);
    const userId = await getUserIdFromRequest(undefined, mockSupabase as unknown as AuthClient);

    expect(user).toBeNull();
    expect(userId).toBeNull();
  });

  describe('Guest ID handling & Anonymous Isolation', () => {
    it('extracts guest ID from x-guest-id header', () => {
      const req = new Request('http://localhost/api/sessions', {
        headers: { 'x-guest-id': 'guest_alice_123' },
      });
      expect(getGuestIdFromRequest(req)).toBe('guest_alice_123');
    });

    it('extracts guest ID from tableops_guest_id cookie', () => {
      const req = new Request('http://localhost/api/sessions', {
        headers: { Cookie: 'some_cookie=abc; tableops_guest_id=guest_bob_456; other=1' },
      });
      expect(getGuestIdFromRequest(req)).toBe('guest_bob_456');
    });

    it('returns guestId from getUserIdFromRequest when not authenticated', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        },
      };

      const req = new Request('http://localhost/api/sessions', {
        headers: { Cookie: 'tableops_guest_id=guest_device_789' },
      });

      const userId = await getUserIdFromRequest(req, mockSupabase as unknown as AuthClient);
      expect(userId).toBe('guest_device_789');
    });

    it('prefers authenticated user id over guest id cookie', async () => {
      const mockUser = { id: 'real-user-uuid', email: 'registered@tableops.app' };
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
        },
      };

      const req = new Request('http://localhost/api/sessions', {
        headers: { Cookie: 'tableops_guest_id=guest_device_789' },
      });

      const userId = await getUserIdFromRequest(req, mockSupabase as unknown as AuthClient);
      expect(userId).toBe('real-user-uuid');
    });
  });
});
