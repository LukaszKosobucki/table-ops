import { NextResponse } from 'next/server';
import { endCombat } from '@/lib/combat';

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
    const combat = await endCombat(id, body || undefined);
    return NextResponse.json({ success: true, combat });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to end combat';
    if (message.includes('Combat not found')) {
      return NextResponse.json({ success: false, error: message }, { status: 404 });
    }
    console.error('Error ending combat:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
