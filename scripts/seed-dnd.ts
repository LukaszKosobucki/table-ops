import fs from 'node:fs';
import path from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/tableops?schema=public';
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const DND_API_BASE = 'https://www.dnd5eapi.co/api';

const FEATURED_MONSTERS = [
  'goblin',
  'skeleton',
  'zombie',
  'orc',
  'bugbear',
  'bandit',
  'owlbear',
  'beholder',
  'adult-red-dragon',
  'aboleth',
  'mimic',
  'gelatinous-cube',
  'mind-flayer',
  'lich',
];

async function seed() {
  console.log('🐉 Fetching D&D 5e monsters from dnd5eapi.co...');

  try {
    const listRes = await fetch(`${DND_API_BASE}/monsters`);
    if (!listRes.ok) {
      throw new Error(`Failed to fetch monster list: ${listRes.statusText}`);
    }
    const listData = (await listRes.json()) as {
      results: { index: string; name: string; url: string }[];
    };
    console.log(`Found ${listData.results.length} monsters in D&D 5e SRD.`);

    const targets = listData.results.filter((m) => FEATURED_MONSTERS.includes(m.index));
    const monsterRecords = [];

    for (const item of targets) {
      console.log(` -> Fetching details for ${item.name} (${item.index})...`);
      const detailRes = await fetch(`${DND_API_BASE}/monsters/${item.index}`);
      if (!detailRes.ok) continue;

      const d = await detailRes.json();

      const acValue = Array.isArray(d.armor_class)
        ? (d.armor_class[0]?.value ?? 10)
        : typeof d.armor_class === 'number'
          ? d.armor_class
          : 10;

      const record = {
        index: d.index,
        name: d.name,
        size: d.size,
        type: d.type,
        alignment: d.alignment,
        armorClass: acValue,
        hitPoints: d.hit_points ?? 10,
        hitDice: d.hit_dice ?? '2d6',
        challengeRating: d.challenge_rating ?? 0,
        xp: d.xp ?? 0,
        stats: {
          str: d.strength ?? 10,
          dex: d.dexterity ?? 10,
          con: d.constitution ?? 10,
          int: d.intelligence ?? 10,
          wis: d.wisdom ?? 10,
          cha: d.charisma ?? 10,
        },
        speed: d.speed ?? {},
        actions: d.actions ?? [],
        specialAbilities: d.special_abilities ?? [],
        rawData: d,
      };

      monsterRecords.push(record);
    }

    // Save fallback JSON
    const jsonPath = path.join(process.cwd(), 'prisma', 'monsters_seed.json');
    fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
    fs.writeFileSync(jsonPath, JSON.stringify(monsterRecords, null, 2));
    console.log(`✅ Saved ${monsterRecords.length} monsters to local seed file: ${jsonPath}`);

    // Try seeding to database if DB is reachable
    try {
      for (const m of monsterRecords) {
        await prisma.monster.upsert({
          where: { index: m.index },
          update: m,
          create: m,
        });
      }
      console.log(`🎉 Database successfully seeded with ${monsterRecords.length} monsters!`);
    } catch {
      console.warn(
        '⚠️  Could not seed PostgreSQL database directly (DB might be offline or DATABASE_URL not set). Seed JSON file is ready for offline fallback.'
      );
    }
  } catch (error) {
    console.error('❌ Error during D&D seed execution:', error);
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

seed();
