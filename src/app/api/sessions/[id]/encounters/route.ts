import { NextResponse } from 'next/server';
import { createEncounter, getEncountersBySession, validateEncounterInput } from '@/lib/encounters';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const encounters = await getEncountersBySession(id);
    return NextResponse.json({ success: true, encounters });
  } catch (error) {
    console.error('Error fetching session encounters:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch session encounters' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
    }

    const validation = validateEncounterInput({
      ...body,
      sessionId: id,
    });

    if (!validation.valid) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
    }

    const encounter = await createEncounter(validation.data);
    return NextResponse.json({ success: true, encounter }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create encounter';
    if (message.includes('Session not found')) {
      return NextResponse.json({ success: false, error: message }, { status: 404 });
    }
    console.error('Error creating encounter in session:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
