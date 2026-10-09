import { describe, expect, it } from 'vitest';
import type { CompendiumItem } from './compendium';
import {
  calculateCarryingCapacity,
  calculateTotalWeight,
  createCustomItem,
  createEquipmentSnapshot,
  type EquipmentItem,
  isEncumbered,
  normalizeInventory,
  toggleAttuned,
  toggleEquipped,
} from './inventory';

describe('inventory domain logic (Chunk 11.3)', () => {
  describe('normalizeInventory', () => {
    it('normalizes string[] to EquipmentItem[] with backward compatibility', () => {
      const raw = ['Lina konopna', 'Mikstura leczenia', 'Pochodnia'];
      const normalized = normalizeInventory(raw);

      expect(normalized).toHaveLength(3);
      expect(normalized[0].name).toBe('Lina konopna');
      expect(normalized[0].isEquipped).toBe(false);
      expect(normalized[0].isAttuned).toBe(false);
      expect(normalized[0].id).toBeDefined();
    });

    it('preserves existing EquipmentItem objects', () => {
      const existing: EquipmentItem[] = [
        {
          id: 'item-1',
          name: 'Miecz długi',
          category: 'Weapon',
          weight: 3,
          isEquipped: true,
          isAttuned: false,
          requiresAttunement: false,
        },
      ];

      const normalized = normalizeInventory(existing);
      expect(normalized).toHaveLength(1);
      expect(normalized[0].id).toBe('item-1');
      expect(normalized[0].isEquipped).toBe(true);
    });

    it('handles null or undefined inventory gracefully', () => {
      expect(normalizeInventory(null)).toEqual([]);
      expect(normalizeInventory(undefined)).toEqual([]);
    });
  });

  describe('createEquipmentSnapshot', () => {
    it('creates an independent snapshot from a compendium weapon', () => {
      const compendiumDagger: CompendiumItem = {
        index: 'dagger',
        name: 'Dagger',
        type: 'Weapon',
        rarity: 'Common',
        cost: '2 gp',
        weight: 1,
        properties: ['Finesse', 'Light', 'Thrown'],
        damage: { dice: '1d4', type: 'Piercing' },
        description: 'A sharp piercing blade.',
      };

      const snapshot = createEquipmentSnapshot(compendiumDagger);

      expect(snapshot.name).toBe('Dagger');
      expect(snapshot.category).toBe('Weapon');
      expect(snapshot.weight).toBe(1);
      expect(snapshot.cost).toBe('2 gp');
      expect(snapshot.weaponDetails).toEqual({
        damageDice: '1d4',
        damageType: 'Piercing',
        isFinesse: true,
        isRanged: false,
      });
      expect(snapshot.requiresAttunement).toBe(false);
      expect(snapshot.isCustom).toBe(false);
    });

    it('detects armor category, AC and attunement requirement from description', () => {
      const compendiumArmor: CompendiumItem = {
        index: 'arrow-catching-shield',
        name: 'Arrow-Catching Shield',
        type: 'Armor',
        rarity: 'Rare',
        cost: 'Zmienna',
        weight: 6,
        description: 'Armor (shield), rare (requires attunement)\nGrants +2 bonus to AC.',
        armorClass: { base: 2, dexBonus: false },
      };

      const snapshot = createEquipmentSnapshot(compendiumArmor);

      expect(snapshot.category).toBe('Shield');
      expect(snapshot.requiresAttunement).toBe(true);
      expect(snapshot.armorClass?.base).toBe(2);
    });
  });

  describe('createCustomItem', () => {
    it('creates a custom item marked as isCustom true', () => {
      const custom = createCustomItem({
        name: 'Topór Płonącej Gwiazdy',
        category: 'Weapon',
        weight: 7,
        weaponDetails: {
          damageDice: '1d12',
          damageType: 'Fire',
          isFinesse: false,
          isRanged: false,
        },
        requiresAttunement: true,
      });

      expect(custom.name).toBe('Topór Płonącej Gwiazdy');
      expect(custom.isCustom).toBe(true);
      expect(custom.isEquipped).toBe(false);
      expect(custom.isAttuned).toBe(false);
    });
  });

  describe('weight and carrying capacity', () => {
    it('calculates total weight of inventory items', () => {
      const items: EquipmentItem[] = [
        {
          id: '1',
          name: 'Pancerz',
          category: 'Armor',
          weight: 45,
          isEquipped: true,
          isAttuned: false,
          requiresAttunement: false,
        },
        {
          id: '2',
          name: 'Miecz',
          category: 'Weapon',
          weight: 3,
          isEquipped: true,
          isAttuned: false,
          requiresAttunement: false,
        },
        {
          id: '3',
          name: 'Plecak',
          category: 'Adventuring Gear',
          weight: 5,
          isEquipped: false,
          isAttuned: false,
          requiresAttunement: false,
        },
      ];

      expect(calculateTotalWeight(items)).toBe(53);
    });

    it('calculates carrying capacity as STR * 15 lbs', () => {
      expect(calculateCarryingCapacity(10)).toBe(150);
      expect(calculateCarryingCapacity(16)).toBe(240);
      expect(calculateCarryingCapacity(8)).toBe(120);
    });

    it('determines if character is encumbered', () => {
      // STR 10 capacity is 150 lbs
      expect(isEncumbered(140, 10)).toBe(false);
      expect(isEncumbered(150, 10)).toBe(false);
      expect(isEncumbered(151, 10)).toBe(true);
    });
  });

  describe('toggleEquipped & toggleAttuned rules', () => {
    it('equipping one armor automatically unequips previously equipped armor', () => {
      const armor1: EquipmentItem = {
        id: 'a1',
        name: 'Leather Armor',
        category: 'Armor',
        weight: 10,
        isEquipped: true,
        isAttuned: false,
        requiresAttunement: false,
      };
      const armor2: EquipmentItem = {
        id: 'a2',
        name: 'Plate Armor',
        category: 'Armor',
        weight: 65,
        isEquipped: false,
        isAttuned: false,
        requiresAttunement: false,
      };

      const result = toggleEquipped([armor1, armor2], 'a2');
      expect(result.items.find((i) => i.id === 'a2')?.isEquipped).toBe(true);
      expect(result.items.find((i) => i.id === 'a1')?.isEquipped).toBe(false);
    });

    it('equipping one shield automatically unequips previously equipped shield', () => {
      const s1: EquipmentItem = {
        id: 's1',
        name: 'Shield',
        category: 'Shield',
        weight: 6,
        isEquipped: true,
        isAttuned: false,
        requiresAttunement: false,
      };
      const s2: EquipmentItem = {
        id: 's2',
        name: 'Magic Shield',
        category: 'Shield',
        weight: 6,
        isEquipped: false,
        isAttuned: false,
        requiresAttunement: false,
      };

      const result = toggleEquipped([s1, s2], 's2');
      expect(result.items.find((i) => i.id === 's2')?.isEquipped).toBe(true);
      expect(result.items.find((i) => i.id === 's1')?.isEquipped).toBe(false);
    });

    it('prevents attuning more than 3 items at once', () => {
      const items: EquipmentItem[] = [
        {
          id: '1',
          name: 'Ring 1',
          category: 'Ring',
          weight: 0,
          isEquipped: false,
          isAttuned: true,
          requiresAttunement: true,
        },
        {
          id: '2',
          name: 'Ring 2',
          category: 'Ring',
          weight: 0,
          isEquipped: false,
          isAttuned: true,
          requiresAttunement: true,
        },
        {
          id: '3',
          name: 'Ring 3',
          category: 'Ring',
          weight: 0,
          isEquipped: false,
          isAttuned: true,
          requiresAttunement: true,
        },
        {
          id: '4',
          name: 'Ring 4',
          category: 'Ring',
          weight: 0,
          isEquipped: false,
          isAttuned: false,
          requiresAttunement: true,
        },
      ];

      const result = toggleAttuned(items, '4');
      expect(result.error).toMatch(/limit 3 dostrojonych przedmiotów/i);
      expect(result.items.find((i) => i.id === '4')?.isAttuned).toBe(false);
    });

    it('allows un-attuning an item', () => {
      const items: EquipmentItem[] = [
        {
          id: '1',
          name: 'Ring 1',
          category: 'Ring',
          weight: 0,
          isEquipped: false,
          isAttuned: true,
          requiresAttunement: true,
        },
      ];

      const result = toggleAttuned(items, '1');
      expect(result.error).toBeUndefined();
      expect(result.items.find((i) => i.id === '1')?.isAttuned).toBe(false);
    });
  });
});
