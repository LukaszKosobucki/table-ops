import { NextResponse } from 'next/server';
import { getMonsters } from '@/lib/monsters';

export async function GET() {
  try {
    const monsters = await getMonsters();
    return NextResponse.json({ success: true, count: monsters.length, monsters });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch monsters' },
      { status: 500 }
    );
  }
}
