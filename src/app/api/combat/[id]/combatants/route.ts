import { NextResponse } from 'next/server';
import { addCombatantToCombat } from '@/lib/combat';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Combat ID is required' }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
    }

    const combatant = await addCombatantToCombat(id, body);
    return NextResponse.json({ success: true, combatant }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add combatant';
    if (message.includes('Combat not found')) {
      return NextResponse.json({ success: false, error: message }, { status: 404 });
    }
    console.error('Error adding combatant to combat:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
