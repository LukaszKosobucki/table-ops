import { NextResponse } from 'next/server';
import { applyStatusToCombatant } from '@/lib/combat';

interface RouteContext {
  params: Promise<{
    id: string;
    combatantId: string;
  }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { combatantId } = await context.params;
    if (!combatantId) {
      return NextResponse.json(
        { success: false, error: 'Combatant ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
    }

    if (!body.statusName || typeof body.statusName !== 'string') {
      return NextResponse.json(
        { success: false, error: 'statusName is required' },
        { status: 400 }
      );
    }

    const durationTurns = typeof body.durationTurns === 'number' ? body.durationTurns : 1;

    const status = await applyStatusToCombatant({
      combatantId,
      statusName: body.statusName,
      durationTurns,
    });

    return NextResponse.json({ success: true, status }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to apply status';
    if (message.includes('Combatant not found')) {
      return NextResponse.json({ success: false, error: message }, { status: 404 });
    }
    console.error('Error applying status:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
