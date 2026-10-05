import { prisma } from './prisma';
import { isDemoMode, getMockMonsters } from './mock-data';

export interface MonsterData {
  id?: string;
  index: string;
  name: string;
  size?: string;
  type?: string;
  alignment?: string;
  armorClass: number;
  hitPoints: number;
  hitDice?: string;
  challengeRating: number;
  xp?: number;
  stats?: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
  speed?: Record<string, string | number>;
  actions?: Array<{ name: string; desc: string }>;
  specialAbilities?: Array<{ name: string; desc: string }>;
}

export async function getMonsters(): Promise<MonsterData[]> {
  // Demo mode / GitHub Pages / CI static export: ALWAYS use mocked data and NEVER query database or real API addresses
  if (isDemoMode()) {
    return getMockMonsters();
  }

  // Query PostgreSQL if DATABASE_URL is configured in full server mode
  if (process.env.DATABASE_URL) {
    try {
      const dbMonsters = await prisma.monster.findMany({
        orderBy: { name: 'asc' },
      });
      if (dbMonsters.length > 0) {
        return dbMonsters as unknown as MonsterData[];
      }
    } catch {
      // Database connection fallback to mock data
    }
  }

  return getMockMonsters();
}
