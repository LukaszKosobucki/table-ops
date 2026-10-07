import { NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { getCombatLogs } from '@/lib/logs';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!id || typeof id !== 'string' || !id.trim()) {
      return NextResponse.json({ success: false, error: 'Combat ID is required' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');

    const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;
    const offset = offsetParam ? Number.parseInt(offsetParam, 10) : undefined;

    const userId = await getUserIdFromRequest(request);
    const logs = await getCombatLogs(id.trim(), {
      limit,
      offset,
      userId,
    });

    return NextResponse.json({
      success: true,
      logs,
    });
  } catch (error) {
    console.error('Error fetching combat logs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch combat logs' },
      { status: 500 }
    );
  }
}
