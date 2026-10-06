import { NextResponse } from 'next/server';
import { getCombatById } from '@/lib/combat';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Combat ID is required' }, { status: 400 });
    }

    const combat = await getCombatById(id);
    if (!combat) {
      return NextResponse.json({ success: false, error: 'Combat not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, combat });
  } catch (error) {
    console.error('Error fetching combat:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch combat' }, { status: 500 });
  }
}
