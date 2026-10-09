import { type NextRequest, NextResponse } from 'next/server';
import { getPaginatedCompendiumItems } from '@/lib/compendium';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const type = searchParams.get('type') || undefined;
    const rarity = searchParams.get('rarity') || undefined;

    const limitParam = searchParams.get('limit');
    const limit = limitParam !== null ? Math.min(600, Math.max(1, Number(limitParam))) : 20;
    const offsetParam = searchParams.get('offset');
    const offset = offsetParam !== null ? Math.max(0, Number(offsetParam)) : 0;

    const {
      data: items,
      total,
      hasMore,
    } = await getPaginatedCompendiumItems({
      search,
      type,
      rarity,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      count: items.length,
      total,
      limit,
      offset,
      hasMore,
      items,
      data: items,
    });
  } catch (error) {
    console.error('Error fetching compendium items:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
