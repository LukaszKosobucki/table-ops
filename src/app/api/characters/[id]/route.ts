import { NextResponse } from 'next/server';
import { deleteCharacter, getCharacterById, updateCharacter } from '@/lib/characters';

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
        { success: false, error: 'Character ID is required' },
        { status: 400 }
      );
    }

    const character = await getCharacterById(id);
    if (!character) {
      return NextResponse.json({ success: false, error: 'Character not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, character });
  } catch (error) {
    console.error('Error fetching character:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch character' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
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

    const updated = await updateCharacter(id, body);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Character not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, character: updated });
  } catch (error) {
    console.error('Error updating character:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update character' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Character ID is required' },
        { status: 400 }
      );
    }

    const deleted = await deleteCharacter(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Character not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Character deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting character:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete character' },
      { status: 500 }
    );
  }
}
