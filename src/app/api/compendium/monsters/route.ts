import { type NextRequest, NextResponse } from 'next/server';
import { getPaginatedCompendiumMonsters } from '@/lib/compendium';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const cr = searchParams.get('cr') || undefined;
    const type = searchParams.get('type') || undefined;

    const limitParam = searchParams.get('limit');
    const limit = limitParam !== null ? Math.min(100, Math.max(1, Number(limitParam))) : 20;
    const offsetParam = searchParams.get('offset');
    const offset = offsetParam !== null ? Math.max(0, Number(offsetParam)) : 0;

    const {
      data: monsters,
      total,
      hasMore,
    } = await getPaginatedCompendiumMonsters({
      search,
      cr,
      type,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      count: monsters.length,
      total,
      limit,
      offset,
      hasMore,
      monsters,
    });
  } catch (error) {
    console.error('Error fetching compendium monsters:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
