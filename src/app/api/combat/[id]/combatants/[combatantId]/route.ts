import { NextResponse } from 'next/server';
import { updateCombatantHp } from '@/lib/combat';

interface RouteContext {
  params: Promise<{
    id: string;
    combatantId: string;
  }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id, combatantId } = await context.params;
    if (!id || !combatantId) {
      return NextResponse.json(
        { success: false, error: 'Combat ID and Combatant ID are required' },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
    }

    const updated = await updateCombatantHp(id, combatantId, body);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Combatant not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, combatant: updated });
  } catch (error) {
    console.error('Error updating combatant:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update combatant' },
      { status: 500 }
    );
  }
}
