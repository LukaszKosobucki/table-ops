import { type NextRequest, NextResponse } from 'next/server';
import { getCompendiumSpells } from '@/lib/compendium';

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

    const spells = await getCompendiumSpells({
      search,
      level,
      school,
      class: targetClass,
      concentration,
      ritual,
    });

    return NextResponse.json({
      success: true,
      count: spells.length,
      spells,
    });
  } catch (error) {
    console.error('Error fetching compendium spells:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
