import fs from 'fs';
import path from 'path';
import { prisma } from './prisma';

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
  try {
    const dbMonsters = await prisma.monster.findMany({
      orderBy: { name: 'asc' },
    });
    if (dbMonsters.length > 0) {
      return dbMonsters as unknown as MonsterData[];
    }
  } catch {
    // Database connection fallback to seed file
  }

  try {
    const seedPath = path.join(process.cwd(), 'prisma', 'monsters_seed.json');
    if (fs.existsSync(seedPath)) {
      const content = fs.readFileSync(seedPath, 'utf8');
      return JSON.parse(content) as MonsterData[];
    }
  } catch (err) {
    console.error('Failed to read monsters seed JSON:', err);
  }

  // Built-in emergency fallback monsters
  return [
    {
      index: 'goblin',
      name: 'Goblin',
      size: 'Small',
      type: 'humanoid',
      alignment: 'neutral evil',
      armorClass: 15,
      hitPoints: 7,
      hitDice: '2d6',
      challengeRating: 0.25,
      xp: 50,
      stats: { str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8 },
      actions: [{ name: 'Scimitar', desc: 'Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) slashing damage.' }],
    },
    {
      index: 'skeleton',
      name: 'Skeleton',
      size: 'Medium',
      type: 'undead',
      alignment: 'lawful evil',
      armorClass: 13,
      hitPoints: 13,
      hitDice: '2d8+4',
      challengeRating: 0.25,
      xp: 50,
      stats: { str: 10, dex: 14, con: 15, int: 6, wis: 8, cha: 5 },
      actions: [{ name: 'Shortsword', desc: 'Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) piercing damage.' }],
    },
    {
      index: 'owlbear',
      name: 'Owlbear',
      size: 'Large',
      type: 'monstrosity',
      alignment: 'unaligned',
      armorClass: 13,
      hitPoints: 59,
      hitDice: '7d10+21',
      challengeRating: 3,
      xp: 700,
      stats: { str: 20, dex: 12, con: 17, int: 3, wis: 12, cha: 7 },
      actions: [
        { name: 'Multiattack', desc: 'The owlbear makes two attacks: one with its beak and one with its claws.' },
        { name: 'Claws', desc: 'Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 14 (2d8 + 5) slashing damage.' }
      ],
    }
  ];
}
