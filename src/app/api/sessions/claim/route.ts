import { NextResponse } from 'next/server';
import { getGuestIdFromRequest, getUserFromRequest } from '@/lib/auth';
import { claimGuestSessions } from '@/lib/sessions';

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: only authenticated users can claim sessions' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const guestId = body?.guestId || getGuestIdFromRequest(request);

    if (!guestId) {
      return NextResponse.json(
        { success: false, error: 'Missing guest identifier to claim' },
        { status: 400 }
      );
    }

    const count = await claimGuestSessions(user.id, guestId);
    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error('Error claiming guest sessions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to claim guest sessions' },
      { status: 500 }
    );
  }
}
