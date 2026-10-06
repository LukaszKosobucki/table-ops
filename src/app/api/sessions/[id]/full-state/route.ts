import { NextResponse } from 'next/server';
import { getSessionFullState } from '@/lib/sessions';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!id || typeof id !== 'string' || !id.trim()) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const fullState = await getSessionFullState(id.trim());
    if (!fullState) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      ...fullState,
    });
  } catch (error) {
    console.error('Error fetching full session state:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch full session state' },
      { status: 500 }
    );
  }
}
