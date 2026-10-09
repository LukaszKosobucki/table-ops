import { describe, expect, it } from 'vitest';
import {
  addExtraAction,
  consumeNextAttack,
  extractMultiattackDetails,
  initCombatantTurnResources,
  resetTurnResourcesForNewTurn,
  toggleAttackSegment,
  toggleTurnAction,
} from './combat-actions';

describe('Combat Action Economy & Multiattack Domain Logic (Chunk 11.1)', () => {
  describe('extractMultiattackDetails', () => {
    it('returns empty list for combatants without multiattack', () => {
      const actions = [{ name: 'Club', desc: 'Melee attack' }];
      const result = extractMultiattackDetails({ actions });
      expect(result).toEqual([]);
    });

    it('extracts multiattack segments from SRD action sub-items (e.g. Dragon: Bite + 2x Claw)', () => {
      const actions = [
        {
          name: 'Multiattack',
          desc: 'The dragon makes three attacks: one with its bite and two with its claws.',
          actions: [
            { action_name: 'Bite', count: 1 },
            { action_name: 'Claw', count: 2 },
          ],
        },
      ];

      const result = extractMultiattackDetails({ actions });
      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('Ugryzienie');
      expect(result[1].name).toBe('Pazur 1');
      expect(result[2].name).toBe('Pazur 2');
      expect(result.every((a) => a.used === false)).toBe(true);
    });

    it('extracts multiattack segments from description text when sub-actions array is absent', () => {
      const actions = [
        {
          name: 'Multiattack',
          desc: 'The aboleth makes three tentacle attacks.',
        },
      ];

      const result = extractMultiattackDetails({ actions });
      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('Atak 1');
      expect(result[1].name).toBe('Atak 2');
      expect(result[2].name).toBe('Atak 3');
    });

    it('supports Extra Attack for high level fighter characters', () => {
      const fighter = {
        className: 'Wojownik',
        level: 5,
      };
      const result = extractMultiattackDetails(fighter);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Atak 1');
      expect(result[1].name).toBe('Atak 2');
    });
  });

  describe('initCombatantTurnResources', () => {
    it('initializes default active resources with multiattack segments', () => {
      const combatant = {
        name: 'Adult Red Dragon',
        actions: [
          {
            name: 'Multiattack',
            actions: [
              { action_name: 'Bite', count: 1 },
              { action_name: 'Claw', count: 2 },
            ],
          },
        ],
      };

      const resources = initCombatantTurnResources(combatant);
      expect(resources.actionUsed).toBe(false);
      expect(resources.bonusActionUsed).toBe(false);
      expect(resources.reactionUsed).toBe(false);
      expect(resources.extraActions).toBe(0);
      expect(resources.totalAttacks).toBe(3);
      expect(resources.attacksRemaining).toBe(3);
      expect(resources.attacks).toHaveLength(3);
    });
  });

  describe('toggleTurnAction', () => {
    it('toggles actionUsed state', () => {
      const res = initCombatantTurnResources({});
      expect(res.actionUsed).toBe(false);

      const toggled = toggleTurnAction(res, 'action');
      expect(toggled.actionUsed).toBe(true);

      const untoggled = toggleTurnAction(toggled, 'action');
      expect(untoggled.actionUsed).toBe(false);
    });

    it('toggles bonusActionUsed state', () => {
      const res = initCombatantTurnResources({});
      const toggled = toggleTurnAction(res, 'bonus_action');
      expect(toggled.bonusActionUsed).toBe(true);
    });

    it('toggles reactionUsed state', () => {
      const res = initCombatantTurnResources({});
      const toggled = toggleTurnAction(res, 'reaction');
      expect(toggled.reactionUsed).toBe(true);
    });

    it('toggles extraActionUsed state for a specific extra action index', () => {
      let res = initCombatantTurnResources({});
      res = addExtraAction(res);
      expect(res.extraActions).toBe(1);
      expect(res.extraActionsUsed).toBe(0);

      const toggled = toggleTurnAction(res, 'extra_action', 0);
      expect(toggled.extraActionsUsed).toBe(1);

      const untoggled = toggleTurnAction(toggled, 'extra_action', 0);
      expect(untoggled.extraActionsUsed).toBe(0);
    });
  });

  describe('addExtraAction', () => {
    it('increments extraActions count', () => {
      const res = initCombatantTurnResources({});
      const updated = addExtraAction(res);
      expect(updated.extraActions).toBe(1);
      expect(updated.extraActionsUsed).toBe(0);
    });
  });

  describe('toggleAttackSegment & consumeNextAttack', () => {
    it('marks a specific segment as used and updates attacksRemaining', () => {
      const res = initCombatantTurnResources({
        actions: [
          {
            name: 'Multiattack',
            actions: [
              { action_name: 'Bite', count: 1 },
              { action_name: 'Claw', count: 2 },
            ],
          },
        ],
      });

      const firstId = res.attacks[0].id;
      const toggled = toggleAttackSegment(res, firstId);
      expect(toggled.attacks[0].used).toBe(true);
      expect(toggled.attacksRemaining).toBe(2);

      const untoggled = toggleAttackSegment(toggled, firstId);
      expect(untoggled.attacks[0].used).toBe(false);
      expect(untoggled.attacksRemaining).toBe(3);
    });

    it('consumes next available attack segment', () => {
      const res = initCombatantTurnResources({
        actions: [
          {
            name: 'Multiattack',
            actions: [
              { action_name: 'Bite', count: 1 },
              { action_name: 'Claw', count: 2 },
            ],
          },
        ],
      });

      const after1 = consumeNextAttack(res);
      expect(after1.attacks[0].used).toBe(true);
      expect(after1.attacksRemaining).toBe(2);

      const after2 = consumeNextAttack(after1);
      expect(after2.attacks[1].used).toBe(true);
      expect(after2.attacksRemaining).toBe(1);
    });
  });

  describe('resetTurnResourcesForNewTurn', () => {
    it('refreshes action, bonus action, extra actions and attacks when starting own turn', () => {
      let res = initCombatantTurnResources({
        actions: [
          {
            name: 'Multiattack',
            actions: [{ action_name: 'Bite', count: 2 }],
          },
        ],
      });
      res = toggleTurnAction(res, 'action');
      res = toggleTurnAction(res, 'bonus_action');
      res = toggleTurnAction(res, 'reaction');
      res = addExtraAction(res);
      res = consumeNextAttack(res);

      expect(res.actionUsed).toBe(true);
      expect(res.bonusActionUsed).toBe(true);
      expect(res.reactionUsed).toBe(true);
      expect(res.attacksRemaining).toBe(1);

      const reset = resetTurnResourcesForNewTurn(res, true);
      expect(reset.actionUsed).toBe(false);
      expect(reset.bonusActionUsed).toBe(false);
      expect(reset.reactionUsed).toBe(false); // reaction resets on own turn start
      expect(reset.extraActions).toBe(0);
      expect(reset.extraActionsUsed).toBe(0);
      expect(reset.attacksRemaining).toBe(2);
      expect(reset.attacks.every((a) => !a.used)).toBe(true);
    });

    it('preserves reactionUsed when turn advances to someone else (not own turn)', () => {
      let res = initCombatantTurnResources({});
      res = toggleTurnAction(res, 'reaction');
      expect(res.reactionUsed).toBe(true);

      const afterOthersTurn = resetTurnResourcesForNewTurn(res, false);
      expect(afterOthersTurn.reactionUsed).toBe(true); // reaction NOT reset yet!
      expect(afterOthersTurn.extraActions).toBe(0);
    });
  });
});
