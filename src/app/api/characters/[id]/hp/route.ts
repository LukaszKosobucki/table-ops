import { NextResponse } from 'next/server';
import { updateCharacterHp } from '@/lib/characters';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Character ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
    }

    const updated = await updateCharacterHp(id, body);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Character not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, character: updated });
  } catch (error) {
    console.error('Error updating character HP:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update character HP' },
      { status: 500 }
    );
  }
}
