import fs from 'node:fs';
import path from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { type Prisma, PrismaClient } from '@prisma/client';

const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath) && typeof process.loadEnvFile === 'function') {
  process.loadEnvFile(envLocalPath);
}

const connectionString =
  process.env.DATABASE_URL ||
  process.env.DIRECT_URL ||
  'postgresql://postgres:postgres@127.0.0.1:5432/tableops?schema=public';
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const BASE_GITHUB_SRD_URL =
  'https://raw.githubusercontent.com/5e-bits/5e-database/main/src/2014/en';

interface RawSrdMonster {
  index: string;
  name: string;
  size?: string;
  type?: string;
  alignment?: string;
  armor_class?: number | Array<{ type?: string; value?: number }>;
  hit_points?: number;
  hit_dice?: string;
  challenge_rating?: number;
  xp?: number;
  strength?: number;
  dexterity?: number;
  constitution?: number;
  intelligence?: number;
  wisdom?: number;
  charisma?: number;
  speed?: Record<string, string | number>;
  actions?: Array<{ name: string; desc: string }>;
  special_abilities?: Array<{ name: string; desc: string }>;
  [key: string]: unknown;
}

interface RawSrdSpell {
  index: string;
  name: string;
  level: number;
  school?: { index?: string; name?: string };
  casting_time?: string;
  range?: string;
  duration?: string;
  components?: string[];
  material?: string;
  ritual?: boolean;
  concentration?: boolean;
  classes?: Array<{ index?: string; name?: string }>;
  desc?: string | string[];
  higher_level?: string | string[];
  [key: string]: unknown;
}

interface RawSrdEquipment {
  index: string;
  name: string;
  equipment_category?: { index?: string; name?: string };
  cost?: { quantity?: number; unit?: string };
  weight?: number;
  properties?: Array<{ index?: string; name?: string }>;
  damage?: { damage_dice?: string; damage_type?: { name?: string } };
  armor_class?: { base?: number; dex_bonus?: boolean; max_bonus?: number };
  desc?: string | string[];
  [key: string]: unknown;
}

interface RawSrdMagicItem {
  index: string;
  name: string;
  equipment_category?: { index?: string; name?: string };
  rarity?: { index?: string; name?: string };
  desc?: string | string[];
  [key: string]: unknown;
}

async function seed() {
  console.log('🐉 ==============================================================');
  console.log('📦 TableOps D&D 5e SRD 5.1 Full Compendium Seeder');
  console.log('🐉 ==============================================================');

  try {
    console.log('\n📥 1. Fetching complete D&D 5e SRD dataset from official repository...');

    const [monstersRes, spellsRes, equipmentRes, magicItemsRes] = await Promise.all([
      fetch(`${BASE_GITHUB_SRD_URL}/5e-SRD-Monsters.json`),
      fetch(`${BASE_GITHUB_SRD_URL}/5e-SRD-Spells.json`),
      fetch(`${BASE_GITHUB_SRD_URL}/5e-SRD-Equipment.json`),
      fetch(`${BASE_GITHUB_SRD_URL}/5e-SRD-Magic-Items.json`),
    ]);

    if (!monstersRes.ok || !spellsRes.ok || !equipmentRes.ok || !magicItemsRes.ok) {
      throw new Error(
        `Failed to fetch SRD data: ${monstersRes.statusText} / ${spellsRes.statusText} / ${equipmentRes.statusText} / ${magicItemsRes.statusText}`
      );
    }

    const rawMonsters = (await monstersRes.json()) as RawSrdMonster[];
    const rawSpells = (await spellsRes.json()) as RawSrdSpell[];
    const rawEquipment = (await equipmentRes.json()) as RawSrdEquipment[];
    const rawMagicItems = (await magicItemsRes.json()) as RawSrdMagicItem[];

    console.log(` -> Fetched ${rawMonsters.length} monsters`);
    console.log(` -> Fetched ${rawSpells.length} spells`);
    console.log(` -> Fetched ${rawEquipment.length} equipment items`);
    console.log(` -> Fetched ${rawMagicItems.length} magic items`);

    // 2. Normalize Monsters
    console.log('\n⚙️  2. Normalizing monsters for TableOps...');
    const monsterRecords = rawMonsters.map((d) => {
      const acValue = Array.isArray(d.armor_class)
        ? (d.armor_class[0]?.value ?? 10)
        : typeof d.armor_class === 'number'
          ? d.armor_class
          : 10;

      return {
        index: d.index,
        name: d.name,
        size: d.size || 'Medium',
        type: d.type || 'humanoid',
        alignment: d.alignment || 'unaligned',
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
        speed: d.speed ?? { walk: '30 ft.' },
        actions: d.actions ?? [],
        specialAbilities: d.special_abilities ?? [],
        rawData: d as unknown as Prisma.InputJsonValue,
      };
    });

    // 3. Normalize Spells
    console.log('⚙️  3. Normalizing spells for TableOps...');
    const spellRecords = rawSpells.map((s) => ({
      index: s.index,
      name: s.name,
      level: s.level ?? 0,
      school: s.school?.name ?? 'Evocation',
      castingTime: s.casting_time ?? '1 action',
      range: s.range ?? 'Self',
      duration: s.duration ?? 'Instantaneous',
      components: s.components ?? [],
      material: s.material || undefined,
      ritual: Boolean(s.ritual),
      concentration: Boolean(s.concentration),
      classes: (s.classes || []).map((c) => c.name || '').filter(Boolean),
      description: Array.isArray(s.desc) ? s.desc.join('\n\n') : s.desc || '',
      higherLevels: Array.isArray(s.higher_level)
        ? s.higher_level.join('\n\n')
        : s.higher_level || undefined,
    }));

    // 4. Normalize Items (Equipment + Magic Items)
    console.log('⚙️  4. Normalizing equipment and magic items for TableOps...');
    const itemRecords = [
      ...rawEquipment.map((e) => ({
        index: e.index,
        name: e.name,
        type: e.equipment_category?.name ?? 'Przedmiot',
        rarity: 'Common',
        cost: e.cost ? `${e.cost.quantity} ${e.cost.unit}` : '0 gp',
        weight: e.weight ?? 0,
        properties: (e.properties || []).map((p) => p.name || '').filter(Boolean),
        damage: e.damage?.damage_dice
          ? { dice: e.damage.damage_dice, type: e.damage.damage_type?.name || 'slashing' }
          : undefined,
        armorClass: e.armor_class?.base
          ? {
              base: e.armor_class.base,
              dexBonus: Boolean(e.armor_class.dex_bonus),
              maxDex: e.armor_class.max_bonus,
            }
          : undefined,
        description: Array.isArray(e.desc) ? e.desc.join('\n\n') : e.desc || '',
      })),
      ...rawMagicItems.map((m) => ({
        index: m.index,
        name: m.name,
        type: m.equipment_category?.name ?? 'Przedmiot Magiczny',
        rarity: m.rarity?.name ?? 'Rare',
        cost: 'Zmienna',
        weight: 0,
        description: Array.isArray(m.desc) ? m.desc.join('\n\n') : m.desc || '',
      })),
    ];

    // 5. Save offline seed JSON files
    console.log('\n💾 5. Writing normalized seed files to prisma/...');
    const prismaDir = path.join(process.cwd(), 'prisma');
    fs.mkdirSync(prismaDir, { recursive: true });

    const monstersSeedPath = path.join(prismaDir, 'monsters_seed.json');
    const spellsSeedPath = path.join(prismaDir, 'spells_seed.json');
    const itemsSeedPath = path.join(prismaDir, 'items_seed.json');

    fs.writeFileSync(monstersSeedPath, JSON.stringify(monsterRecords, null, 2));
    fs.writeFileSync(spellsSeedPath, JSON.stringify(spellRecords, null, 2));
    fs.writeFileSync(itemsSeedPath, JSON.stringify(itemRecords, null, 2));

    console.log(`✅ Saved ${monsterRecords.length} monsters to: ${monstersSeedPath}`);
    console.log(`✅ Saved ${spellRecords.length} spells to: ${spellsSeedPath}`);
    console.log(`✅ Saved ${itemRecords.length} items to: ${itemsSeedPath}`);

    // 6. Seed PostgreSQL database if reachable
    console.log(
      '\n🗄️  6. Upserting complete compendium (monsters, spells, items) into PostgreSQL database...'
    );
    try {
      const BATCH_SIZE = 30;

      // Monsters
      let upsertedMonsters = 0;
      for (let i = 0; i < monsterRecords.length; i += BATCH_SIZE) {
        const batch = monsterRecords.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map((m) =>
            prisma.monster.upsert({
              where: { index: m.index },
              update: m,
              create: m,
            })
          )
        );
        upsertedMonsters += batch.length;
        process.stdout.write(
          ` -> Upserted ${upsertedMonsters} / ${monsterRecords.length} monsters\r`
        );
      }
      console.log(`\n🎉 Successfully seeded ${monsterRecords.length} monsters to PostgreSQL!`);

      // Spells
      let upsertedSpells = 0;
      for (let i = 0; i < spellRecords.length; i += BATCH_SIZE) {
        const batch = spellRecords.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map((s) =>
            prisma.spell.upsert({
              where: { index: s.index },
              update: s,
              create: s,
            })
          )
        );
        upsertedSpells += batch.length;
        process.stdout.write(` -> Upserted ${upsertedSpells} / ${spellRecords.length} spells\r`);
      }
      console.log(`\n🎉 Successfully seeded ${spellRecords.length} spells to PostgreSQL!`);

      // Items
      let upsertedItems = 0;
      for (let i = 0; i < itemRecords.length; i += BATCH_SIZE) {
        const batch = itemRecords.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map((item) =>
            prisma.item.upsert({
              where: { index: item.index },
              update: item,
              create: item,
            })
          )
        );
        upsertedItems += batch.length;
        process.stdout.write(` -> Upserted ${upsertedItems} / ${itemRecords.length} items\r`);
      }
      console.log(`\n🎉 Successfully seeded ${itemRecords.length} items to PostgreSQL!`);
    } catch (_dbErr) {
      console.warn(
        '\n⚠️  Could not seed PostgreSQL database directly (DB might be offline or DATABASE_URL not set).'
      );
      console.warn('   Seed JSON files are ready and will be used as the offline compendium.');
    }

    console.log('\n✨ Compendium seeding completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Error during D&D seed execution:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

seed();
