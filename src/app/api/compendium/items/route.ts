import { type NextRequest, NextResponse } from 'next/server';
import { getCompendiumItems } from '@/lib/compendium';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const type = searchParams.get('type') || undefined;
    const rarity = searchParams.get('rarity') || undefined;

    const items = await getCompendiumItems({
      search,
      type,
      rarity,
    });

    return NextResponse.json({
      success: true,
      count: items.length,
      items,
    });
  } catch (error) {
    console.error('Error fetching compendium items:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
