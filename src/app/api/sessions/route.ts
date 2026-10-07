import { NextResponse } from 'next/server';
import { getGuestIdFromRequest, getUserFromRequest, getUserIdFromRequest } from '@/lib/auth';
import {
  claimGuestSessions,
  createSession,
  getSessions,
  validateSessionName,
} from '@/lib/sessions';

export async function GET(request?: Request) {
  try {
    const user = await getUserFromRequest(request);
    const guestId = getGuestIdFromRequest(request);

    // Option A: Automatically claim any guest sessions from this device for the authenticated user
    if (user?.id && guestId) {
      await claimGuestSessions(user.id, guestId);
    }

    const resolvedUserId = await getUserIdFromRequest(request);
    const userId = user?.id ?? resolvedUserId ?? guestId;
    const sessions = await getSessions({ userId });
    return NextResponse.json({ success: true, sessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
    }

    const validation = validateSessionName(body.name);
    if (!validation.valid) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
    }

    const userId = await getUserIdFromRequest(request);
    const session = await createSession({ name: validation.name, userId });
    return NextResponse.json({ success: true, session }, { status: 201 });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
