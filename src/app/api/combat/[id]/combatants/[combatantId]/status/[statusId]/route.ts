import { NextResponse } from 'next/server';
import { removeStatusFromCombatant } from '@/lib/combat';

interface RouteContext {
  params: Promise<{
    id: string;
    combatantId: string;
    statusId: string;
  }>;
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { statusId } = await context.params;
    if (!statusId) {
      return NextResponse.json({ success: false, error: 'Status ID is required' }, { status: 400 });
    }

    const removed = await removeStatusFromCombatant(statusId);
    if (!removed) {
      return NextResponse.json({ success: false, error: 'Status not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Status removed successfully' });
  } catch (error) {
    console.error('Error removing status:', error);
    return NextResponse.json({ success: false, error: 'Failed to remove status' }, { status: 500 });
  }
}
