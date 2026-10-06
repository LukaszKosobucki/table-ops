import { NextResponse } from 'next/server';
import { createCharacter, validateCharacterInput } from '@/lib/characters';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
    }

    const validation = validateCharacterInput(body);
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
    console.error('Error creating character:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
