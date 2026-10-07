import { describe, expect, it } from 'vitest';
import { getCompendiumItems, getCompendiumMonsters, getCompendiumSpells } from './compendium';

describe('Compendium Domain Service (Chunk 8.1)', () => {
  describe('getCompendiumSpells', () => {
    it('returns all spells without filters', async () => {
      const spells = await getCompendiumSpells();
      expect(spells.length).toBeGreaterThan(20);
      const cureWounds = spells.find((s) => s.index === 'cure-wounds');
      expect(cureWounds).toBeDefined();
      expect(cureWounds?.name).toBe('Cure Wounds');
      expect(cureWounds?.level).toBe(1);
      expect(cureWounds?.school).toBe('Evocation');
      expect(cureWounds?.classes).toContain('Cleric');
    });

    it('filters spells by search query (case-insensitive name)', async () => {
      const spells = await getCompendiumSpells({ search: 'fire' });
      expect(spells.length).toBeGreaterThan(0);
      const names = spells.map((s) => s.name.toLowerCase());
      expect(names.some((n) => n.includes('fire'))).toBe(true);
    });

    it('filters spells by exact level (including cantrips level 0)', async () => {
      const cantrips = await getCompendiumSpells({ level: 0 });
      expect(cantrips.length).toBeGreaterThan(0);
      expect(cantrips.every((s) => s.level === 0)).toBe(true);

      const level3Spells = await getCompendiumSpells({ level: 3 });
      expect(level3Spells.length).toBeGreaterThan(0);
      expect(level3Spells.every((s) => s.level === 3)).toBe(true);
      expect(level3Spells.find((s) => s.index === 'fireball')).toBeDefined();
    });

    it('filters spells by magic school', async () => {
      const evocationSpells = await getCompendiumSpells({ school: 'Evocation' });
      expect(evocationSpells.length).toBeGreaterThan(0);
      expect(evocationSpells.every((s) => s.school.toLowerCase() === 'evocation')).toBe(true);
    });

    it('filters spells by class', async () => {
      const clericSpells = await getCompendiumSpells({ class: 'Cleric' });
      expect(clericSpells.length).toBeGreaterThan(0);
      expect(clericSpells.every((s) => s.classes.includes('Cleric'))).toBe(true);
      expect(clericSpells.find((s) => s.index === 'cure-wounds')).toBeDefined();
      expect(clericSpells.find((s) => s.index === 'eldritch-blast')).toBeUndefined();
    });

    it('filters spells by ritual and concentration', async () => {
      const rituals = await getCompendiumSpells({ ritual: true });
      expect(rituals.length).toBeGreaterThan(0);
      expect(rituals.every((s) => s.ritual === true)).toBe(true);

      const concentrationSpells = await getCompendiumSpells({ concentration: true });
      expect(concentrationSpells.length).toBeGreaterThan(0);
      expect(concentrationSpells.every((s) => s.concentration === true)).toBe(true);
    });
  });

  describe('getCompendiumItems', () => {
    it('returns all items without filters', async () => {
      const items = await getCompendiumItems();
      expect(items.length).toBeGreaterThan(15);
      const longsword = items.find((i) => i.index === 'longsword');
      expect(longsword).toBeDefined();
      expect(longsword?.name).toBe('Longsword');
      expect(longsword?.type).toBe('Weapon');
      expect(longsword?.damage?.dice).toBe('1d8');
    });

    it('filters items by search query', async () => {
      const items = await getCompendiumItems({ search: 'potion' });
      expect(items.length).toBeGreaterThan(0);
      expect(items.every((i) => i.name.toLowerCase().includes('potion'))).toBe(true);
    });

    it('filters items by item type', async () => {
      const weapons = await getCompendiumItems({ type: 'Weapon' });
      expect(weapons.length).toBeGreaterThan(0);
      expect(weapons.every((i) => i.type === 'Weapon')).toBe(true);

      const armors = await getCompendiumItems({ type: 'Armor' });
      expect(armors.length).toBeGreaterThan(0);
      expect(armors.every((i) => i.type === 'Armor')).toBe(true);
    });

    it('filters items by rarity', async () => {
      const uncommons = await getCompendiumItems({ rarity: 'Uncommon' });
      expect(uncommons.length).toBeGreaterThan(0);
      expect(uncommons.every((i) => i.rarity === 'Uncommon')).toBe(true);
      expect(uncommons.find((i) => i.index === 'bag-of-holding')).toBeDefined();
    });
  });

  describe('getCompendiumMonsters', () => {
    it('returns monsters filtered by query and challenge rating', async () => {
      const monsters = await getCompendiumMonsters({ search: 'goblin' });
      expect(monsters.length).toBeGreaterThan(0);
      expect(monsters.some((m) => m.name.toLowerCase().includes('goblin'))).toBe(true);

      const crZeroPointTwentyFive = await getCompendiumMonsters({ cr: '0.25' });
      expect(crZeroPointTwentyFive.length).toBeGreaterThan(0);
      expect(crZeroPointTwentyFive.every((m) => m.challengeRating === 0.25)).toBe(true);
    });
  });
});
