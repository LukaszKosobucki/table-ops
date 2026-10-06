import { NextResponse } from 'next/server';
import { deleteEncounter, getEncounterById, updateEncounter } from '@/lib/encounters';

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
        { success: false, error: 'Encounter ID is required' },
        { status: 400 }
      );
    }

    const encounter = await getEncounterById(id);
    if (!encounter) {
      return NextResponse.json({ success: false, error: 'Encounter not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, encounter });
  } catch (error) {
    console.error('Error fetching encounter:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch encounter' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Encounter ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
    }

    const updated = await updateEncounter(id, body);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Encounter not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, encounter: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update encounter';
    console.error('Error updating encounter:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Encounter ID is required' },
        { status: 400 }
      );
    }

    const deleted = await deleteEncounter(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Encounter not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Encounter deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting encounter:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete encounter' },
      { status: 500 }
    );
  }
}
