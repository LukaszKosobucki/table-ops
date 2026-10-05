import fs from 'fs';
import path from 'path';
import { MonsterData } from './monsters';

export const FALLBACK_MOCK_MONSTERS: MonsterData[] = [
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
    actions: [
      {
        name: 'Scimitar',
        desc: 'Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) slashing damage.',
      },
      {
        name: 'Shortbow',
        desc: 'Ranged Weapon Attack: +4 to hit, range 80/320 ft., one target. Hit: 5 (1d6 + 2) piercing damage.',
      },
    ],
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
    actions: [
      {
        name: 'Shortsword',
        desc: 'Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) piercing damage.',
      },
    ],
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
      {
        name: 'Multiattack',
        desc: 'The owlbear makes two attacks: one with its beak and one with its claws.',
      },
      {
        name: 'Beak',
        desc: 'Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 10 (1d10 + 5) piercing damage.',
      },
      {
        name: 'Claws',
        desc: 'Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 14 (2d8 + 5) slashing damage.',
      },
    ],
  },
  {
    index: 'red-dragon-wyrmling',
    name: 'Red Dragon Wyrmling',
    size: 'Medium',
    type: 'dragon',
    alignment: 'chaotic evil',
    armorClass: 17,
    hitPoints: 75,
    hitDice: '10d8+30',
    challengeRating: 4,
    xp: 1100,
    stats: { str: 19, dex: 10, con: 17, int: 12, wis: 11, cha: 15 },
    actions: [
      {
        name: 'Bite',
        desc: 'Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 9 (1d10 + 4) piercing damage plus 3 (1d6) fire damage.',
      },
      {
        name: 'Fire Breath (Recharge 5-6)',
        desc: 'The dragon exhales fire in a 15-foot cone. Each creature in that area must make a DC 13 Dexterity saving throw, taking 24 (7d6) fire damage on a failed save, or half as much damage on a successful one.',
      },
    ],
  },
];

/**
 * Checks whether the application is running in demo mode (GitHub Pages, NEXT_PUBLIC_DEMO_MODE, or GITHUB_PAGES).
 */
export function isDemoMode(): boolean {
  return (
    process.env.NEXT_PUBLIC_DEMO_MODE === 'true' ||
    process.env.GITHUB_PAGES === 'true' ||
    Boolean(process.env.NEXT_PUBLIC_BASE_PATH)
  );
}

/**
 * Returns mock monsters without ever calling external APIs or databases.
 */
export function getMockMonsters(): MonsterData[] {
  try {
    const seedPath = path.join(process.cwd(), 'prisma', 'monsters_seed.json');
    if (fs.existsSync(seedPath)) {
      const content = fs.readFileSync(seedPath, 'utf8');
      const parsed = JSON.parse(content) as MonsterData[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // If running in an environment without direct filesystem access to prisma, use fallback
  }

  return FALLBACK_MOCK_MONSTERS;
}
