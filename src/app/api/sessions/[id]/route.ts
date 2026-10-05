import { NextResponse } from 'next/server';
import { deleteSession, updateSession, validateSessionName } from '@/lib/sessions';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function PUT(request: Request, context: RouteContext) {
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

    const validation = validateSessionName(body.name);
    if (!validation.valid) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
    }

    const updated = await updateSession(id, { name: validation.name });
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, session: updated });
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update session' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const deleted = await deleteSession(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Session deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}
