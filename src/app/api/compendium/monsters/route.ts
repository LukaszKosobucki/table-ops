import { type NextRequest, NextResponse } from 'next/server';
import { getCompendiumMonsters } from '@/lib/compendium';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const cr = searchParams.get('cr') || undefined;
    const type = searchParams.get('type') || undefined;

    const monsters = await getCompendiumMonsters({
      search,
      cr,
      type,
    });

    return NextResponse.json({
      success: true,
      count: monsters.length,
      monsters,
    });
  } catch (error) {
    console.error('Error fetching compendium monsters:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
