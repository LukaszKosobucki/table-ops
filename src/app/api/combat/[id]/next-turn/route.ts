import { NextResponse } from 'next/server';
import { nextTurn } from '@/lib/combat';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Combat ID is required' }, { status: 400 });
    }

    const combat = await nextTurn(id);
    return NextResponse.json({ success: true, combat });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to advance turn';
    if (message.includes('Combat not found')) {
      return NextResponse.json({ success: false, error: message }, { status: 404 });
    }
    console.error('Error advancing combat turn:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
