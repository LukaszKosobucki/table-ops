import type { SessionLogType } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { createSessionLog, getSessionLogs } from '@/lib/logs';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!id || typeof id !== 'string' || !id.trim()) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get('type') as SessionLogType | null;
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');

    const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;
    const offset = offsetParam ? Number.parseInt(offsetParam, 10) : undefined;

    const userId = await getUserIdFromRequest(request);
    const { logs, total } = await getSessionLogs(id.trim(), {
      type: typeParam || undefined,
      limit,
      offset,
      userId,
    });

    return NextResponse.json({
      success: true,
      logs,
      total,
    });
  } catch (error) {
    console.error('Error fetching session logs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch session logs' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!id || typeof id !== 'string' || !id.trim()) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
    }

    const userId = await getUserIdFromRequest(request);
    const result = await createSessionLog(
      {
        sessionId: id.trim(),
        combatId: body.combatId,
        logType: body.logType,
        description: body.description,
        metadata: body.metadata,
        heals: body.heals,
      },
      { userId }
    );

    return NextResponse.json(
      {
        success: true,
        log: result.log,
        updatedCharacters: result.updatedCharacters,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to create session log';
    if (msg.includes('Session not found or access denied')) {
      return NextResponse.json({ success: false, error: msg }, { status: 404 });
    }
    if (msg.includes('Invalid') || msg.includes('required')) {
      return NextResponse.json({ success: false, error: msg }, { status: 400 });
    }

    console.error('Error creating session log:', error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
