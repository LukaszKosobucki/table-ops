import { NextResponse } from 'next/server';
import { createSession, getSessions, validateSessionName } from '@/lib/sessions';

export async function GET() {
  try {
    const sessions = await getSessions();
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

    const session = await createSession({ name: validation.name });
    return NextResponse.json({ success: true, session }, { status: 201 });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
