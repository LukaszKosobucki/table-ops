import { NextResponse } from 'next/server';
import { createCharacter, getCharactersBySession, validateCharacterInput } from '@/lib/characters';

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

    const characters = await getCharactersBySession(id);
    return NextResponse.json({ success: true, characters });
  } catch (error) {
    console.error('Error fetching session characters:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch session characters' },
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

    const validation = validateCharacterInput({
      ...body,
      sessionId: id,
    });

    if (!validation.valid) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
    }

    const character = await createCharacter(validation.data);
    return NextResponse.json({ success: true, character }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create character';
    if (message.includes('Session not found')) {
      return NextResponse.json({ success: false, error: message }, { status: 404 });
    }
    console.error('Error creating character in session:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
