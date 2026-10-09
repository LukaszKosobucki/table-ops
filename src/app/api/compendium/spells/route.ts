import { type NextRequest, NextResponse } from 'next/server';
import { getPaginatedCompendiumSpells } from '@/lib/compendium';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const levelParam = searchParams.get('level');
    const level = levelParam !== null && levelParam !== '' ? levelParam : undefined;
    const school = searchParams.get('school') || undefined;
    const targetClass = searchParams.get('class') || undefined;
    const concentration = searchParams.has('concentration')
      ? searchParams.get('concentration') === 'true'
      : undefined;
    const ritual = searchParams.has('ritual') ? searchParams.get('ritual') === 'true' : undefined;

    const limitParam = searchParams.get('limit');
    const limit = limitParam !== null ? Math.min(100, Math.max(1, Number(limitParam))) : 20;
    const offsetParam = searchParams.get('offset');
    const offset = offsetParam !== null ? Math.max(0, Number(offsetParam)) : 0;

    const {
      data: spells,
      total,
      hasMore,
    } = await getPaginatedCompendiumSpells({
      search,
      level,
      school,
      class: targetClass,
      concentration,
      ritual,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      count: spells.length,
      total,
      limit,
      offset,
      hasMore,
      spells,
    });
  } catch (error) {
    console.error('Error fetching compendium spells:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
