import { NextResponse } from 'next/server';
import { startCombat } from '@/lib/combat';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
    }

    if (!body.sessionId || typeof body.sessionId !== 'string') {
      return NextResponse.json({ success: false, error: 'sessionId is required' }, { status: 400 });
    }

    const combat = await startCombat({
      sessionId: body.sessionId,
      combatants: body.combatants || [],
    });

    return NextResponse.json({ success: true, combat }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to start combat';
    if (message.includes('Session not found')) {
      return NextResponse.json({ success: false, error: message }, { status: 404 });
    }
    console.error('Error starting combat:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
