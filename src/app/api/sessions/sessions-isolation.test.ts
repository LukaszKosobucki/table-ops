import type { Session } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as authHelper from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GET as getFullState } from './[id]/full-state/route';
import { DELETE, PUT } from './[id]/route';
import { GET, POST } from './route';

describe('Multi-Tenant Session Isolation Integration (Chunk 6.1)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('strictly isolates sessions between User A, User B, and Guest', async () => {
    // 1. User A creates a session
    vi.spyOn(authHelper, 'getUserIdFromRequest').mockResolvedValue('user-alice-uuid');

    const aliceSession = {
      id: 'session-alice-1',
      name: 'Prywatna Kampania Alice',
      userId: 'user-alice-uuid',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.spyOn(prisma.session, 'create').mockResolvedValue(aliceSession as unknown as Session);

    const createReq = new Request('http://localhost/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Prywatna Kampania Alice' }),
    });

    const createRes = await POST(createReq);
    const createData = await createRes.json();

    expect(createRes.status).toBe(201);
    expect(createData.success).toBe(true);
    expect(createData.session.userId).toBe('user-alice-uuid');

    // 2. User B queries sessions - should not see User A's session
    vi.spyOn(authHelper, 'getUserIdFromRequest').mockResolvedValue('user-bob-uuid');
    const findManySpy = vi.spyOn(prisma.session, 'findMany').mockResolvedValue([]);

    const bobGetReq = new Request('http://localhost/api/sessions');
    const bobGetRes = await GET(bobGetReq);
    const bobGetData = await bobGetRes.json();

    expect(bobGetRes.status).toBe(200);
    expect(bobGetData.sessions).toHaveLength(0);
    expect(findManySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-bob-uuid' },
      })
    );

    // 3. User B tries to update User A's session - rejected 404
    vi.spyOn(prisma.session, 'findUnique').mockResolvedValue(aliceSession as unknown as Session);
    const updateSpy = vi.spyOn(prisma.session, 'update');

    const bobPutReq = new Request('http://localhost/api/sessions/session-alice-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Wrogie Przejęcie' }),
    });

    const bobPutRes = await PUT(bobPutReq, {
      params: Promise.resolve({ id: 'session-alice-1' }),
    });

    expect(bobPutRes.status).toBe(404);
    expect(updateSpy).not.toHaveBeenCalled();

    // 4. User B tries to delete User A's session - rejected 404
    const deleteSpy = vi.spyOn(prisma.session, 'delete');

    const bobDelReq = new Request('http://localhost/api/sessions/session-alice-1', {
      method: 'DELETE',
    });

    const bobDelRes = await DELETE(bobDelReq, {
      params: Promise.resolve({ id: 'session-alice-1' }),
    });

    expect(bobDelRes.status).toBe(404);
    expect(deleteSpy).not.toHaveBeenCalled();

    // 5. User B tries to get full state of User A's session - rejected 404
    const bobFullReq = new Request('http://localhost/api/sessions/session-alice-1/full-state');
    const bobFullRes = await getFullState(bobFullReq, {
      params: Promise.resolve({ id: 'session-alice-1' }),
    });

    expect(bobFullRes.status).toBe(404);

    // 6. User A updates their own session - successful 200
    vi.spyOn(authHelper, 'getUserIdFromRequest').mockResolvedValue('user-alice-uuid');
    const updatedAliceSession = { ...aliceSession, name: 'Nowa Nazwa Alice' };
    updateSpy.mockResolvedValue(updatedAliceSession as unknown as Session);

    const alicePutReq = new Request('http://localhost/api/sessions/session-alice-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Nowa Nazwa Alice' }),
    });

    const alicePutRes = await PUT(alicePutReq, {
      params: Promise.resolve({ id: 'session-alice-1' }),
    });

    expect(alicePutRes.status).toBe(200);
    const alicePutData = await alicePutRes.json();
    expect(alicePutData.session.name).toBe('Nowa Nazwa Alice');
  });

  it('isolates guest device sessions and automatically migrates them upon login (Option A)', async () => {
    // 1. Guest Device 1 creates a session
    const guest1Session = {
      id: 'session-guest1-1',
      name: 'Sesja Gościa 1',
      userId: 'guest_device_1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const createSpy = vi
      .spyOn(prisma.session, 'create')
      .mockResolvedValue(guest1Session as unknown as Session);

    const guest1CreateReq = new Request('http://localhost/api/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-guest-id': 'guest_device_1',
      },
      body: JSON.stringify({ name: 'Sesja Gościa 1' }),
    });

    const guest1CreateRes = await POST(guest1CreateReq);
    const guest1CreateData = await guest1CreateRes.json();

    expect(guest1CreateRes.status).toBe(201);
    expect(guest1CreateData.session.userId).toBe('guest_device_1');
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: 'guest_device_1' }),
      })
    );

    // 2. Guest Device 2 queries sessions - queries only guest_device_2
    const findManySpy = vi.spyOn(prisma.session, 'findMany').mockResolvedValue([]);

    const guest2GetReq = new Request('http://localhost/api/sessions', {
      headers: {
        'x-guest-id': 'guest_device_2',
      },
    });

    const guest2GetRes = await GET(guest2GetReq);
    expect(guest2GetRes.status).toBe(200);
    expect(findManySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'guest_device_2' },
      })
    );

    // 3. User logs in on Device 1 with their Supabase account
    const mockUser = { id: 'registered-user-uuid', email: 'gm@tableops.app' };
    vi.spyOn(authHelper, 'getUserFromRequest').mockResolvedValue(
      mockUser as unknown as import('@supabase/supabase-js').User
    );
    const updateManySpy = vi.spyOn(prisma.session, 'updateMany').mockResolvedValue({ count: 1 });

    const userGetReq = new Request('http://localhost/api/sessions', {
      headers: {
        Authorization: 'Bearer valid-jwt',
        Cookie: 'tableops_guest_id=guest_device_1',
      },
    });

    const userGetRes = await GET(userGetReq);
    expect(userGetRes.status).toBe(200);

    // Verify claim occurred: guest_device_1 sessions migrated to registered-user-uuid
    expect(updateManySpy).toHaveBeenCalledWith({
      where: { userId: 'guest_device_1' },
      data: { userId: 'registered-user-uuid' },
    });

    // Verify sessions queried for registered-user-uuid
    expect(findManySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'registered-user-uuid' },
      })
    );
  });
});
