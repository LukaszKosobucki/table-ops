import { describe, expect, it } from 'vitest';
import {
  COMMON_CONDITIONS,
  calculateSkillModifier,
  DAMAGE_TYPES,
  DND_SKILLS,
  extractCharacterDefenses,
  extractMonsterDefenses,
} from './skills-and-traits';

describe('skills-and-traits domain logic', () => {
  describe('DND_SKILLS definitions', () => {
    it('defines exactly 18 official D&D 5e skills', () => {
      expect(DND_SKILLS).toHaveLength(18);
    });

    it('correctly maps skills to governing abilities', () => {
      const athletics = DND_SKILLS.find((s) => s.key === 'athletics');
      expect(athletics).toBeDefined();
      expect(athletics?.ability).toBe('str');
      expect(athletics?.name).toBe('Atletyka');

      const stealth = DND_SKILLS.find((s) => s.key === 'stealth');
      expect(stealth?.ability).toBe('dex');

      const arcana = DND_SKILLS.find((s) => s.key === 'arcana');
      expect(arcana?.ability).toBe('int');

      const perception = DND_SKILLS.find((s) => s.key === 'perception');
      expect(perception?.ability).toBe('wis');

      const deception = DND_SKILLS.find((s) => s.key === 'deception');
      expect(deception?.ability).toBe('cha');
    });
  });

  describe('calculateSkillModifier', () => {
    it('returns ability modifier when proficiency is "none"', () => {
      // Score 14 => mod +2, PB +2
      expect(calculateSkillModifier(14, 'none', 2)).toBe(2);
      // Score 8 => mod -1, PB +3
      expect(calculateSkillModifier(8, 'none', 3)).toBe(-1);
    });

    it('returns ability modifier + PB when proficiency is "proficient"', () => {
      // Score 14 (+2) + PB 2 = 4
      expect(calculateSkillModifier(14, 'proficient', 2)).toBe(4);
      // Score 8 (-1) + PB 3 = 2
      expect(calculateSkillModifier(8, 'proficient', 3)).toBe(2);
      // Score 10 (0) + PB 5 = 5
      expect(calculateSkillModifier(10, 'proficient', 5)).toBe(5);
    });

    it('returns ability modifier + 2*PB when proficiency is "expertise"', () => {
      // Score 14 (+2) + 2*2 = 6
      expect(calculateSkillModifier(14, 'expertise', 2)).toBe(6);
      // Score 8 (-1) + 2*3 = 5
      expect(calculateSkillModifier(8, 'expertise', 3)).toBe(5);
      // Score 18 (+4) + 2*4 = 12
      expect(calculateSkillModifier(18, 'expertise', 4)).toBe(12);
    });
  });

  describe('DAMAGE_TYPES & COMMON_CONDITIONS', () => {
    it('contains all standard D&D 5e damage types', () => {
      const keys = DAMAGE_TYPES.map((d) => d.key);
      expect(keys).toContain('fire');
      expect(keys).toContain('cold');
      expect(keys).toContain('acid');
      expect(keys).toContain('lightning');
      expect(keys).toContain('poison');
      expect(keys).toContain('necrotic');
      expect(keys).toContain('radiant');
      expect(keys).toContain('psychic');
      expect(keys).toContain('slashing');
      expect(keys).toContain('piercing');
      expect(keys).toContain('bludgeoning');
    });

    it('contains standard conditions', () => {
      const names = COMMON_CONDITIONS.map((c) => c.name);
      expect(names).toContain('Przerażenie');
      expect(names).toContain('Paraliż');
      expect(names).toContain('Powalenie');
    });
  });

  describe('extractMonsterDefenses', () => {
    it('extracts defenses and senses from monster rawData', () => {
      const mockMonster = {
        name: 'Air Elemental',
        rawData: {
          damage_resistances: ['lightning', 'thunder'],
          damage_immunities: ['poison'],
          condition_immunities: [
            { name: 'Exhaustion' },
            { name: 'Grappled' },
            { name: 'Paralyzed' },
          ],
          senses: {
            darkvision: '60 ft.',
            passive_perception: 10,
          },
        },
      };

      const defenses = extractMonsterDefenses(mockMonster);
      expect(defenses.resistances).toContain('Błyskawice (Lightning)');
      expect(defenses.resistances).toContain('Grzmot (Thunder)');
      expect(defenses.damageImmunities).toContain('Trucizna (Poison)');
      expect(defenses.conditionImmunities).toContain('Wyczerpanie (Exhaustion)');
      expect(defenses.conditionImmunities).toContain('Paraliż (Paralyzed)');
      expect(defenses.senses).toContain('Darkvision: 60 ft.');
    });

    it('handles empty or missing monster data gracefully', () => {
      const defenses = extractMonsterDefenses({});
      expect(defenses.resistances).toEqual([]);
      expect(defenses.damageImmunities).toEqual([]);
      expect(defenses.conditionImmunities).toEqual([]);
      expect(defenses.senses).toEqual([]);
    });
  });

  describe('extractCharacterDefenses', () => {
    it('extracts defenses from character.defenses or character.proficiencies', () => {
      const mockCharacter = {
        defenses: {
          resistances: ['Ogień'],
          damageImmunities: ['Trucizna'],
          conditionImmunities: ['Uśpienie'],
          senses: ['Widzenie w ciemności 18m'],
        },
      };

      const defenses = extractCharacterDefenses(mockCharacter);
      expect(defenses.resistances).toEqual(['Ogień']);
      expect(defenses.damageImmunities).toEqual(['Trucizna']);
      expect(defenses.conditionImmunities).toEqual(['Uśpienie']);
      expect(defenses.senses).toEqual(['Widzenie w ciemności 18m']);
    });

    it('falls back to empty arrays if character has no defenses configured', () => {
      const defenses = extractCharacterDefenses({});
      expect(defenses.resistances).toEqual([]);
      expect(defenses.damageImmunities).toEqual([]);
      expect(defenses.conditionImmunities).toEqual([]);
      expect(defenses.senses).toEqual([]);
    });
  });
});
