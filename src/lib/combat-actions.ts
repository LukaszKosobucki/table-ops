export type TurnActionType = 'action' | 'bonus_action' | 'reaction' | 'extra_action';

export interface MultiattackSegment {
  id: string;
  name: string;
  used: boolean;
}

export interface CombatantTurnResources {
  actionUsed: boolean;
  bonusActionUsed: boolean;
  reactionUsed: boolean;
  extraActions: number;
  extraActionsUsed: number;
  attacksRemaining: number;
  totalAttacks: number;
  attacks: MultiattackSegment[];
}

export interface ExtractMultiattackInput {
  actions?: Array<{
    name: string;
    desc?: string;
    multiattack_type?: string;
    actions?: Array<{
      action_name?: string;
      name?: string;
      count?: number;
      type?: string;
    }>;
  }>;
  className?: string;
  level?: number;
}

const ACTION_TRANSLATIONS: Record<string, string> = {
  Bite: 'Ugryzienie',
  Claw: 'Pazur',
  Tentacle: 'Macka',
  Tail: 'Ogon',
  Fist: 'Pięść',
  Slam: 'Uderzenie',
  Beak: 'Dziób',
  Gore: 'Rogi',
  Hooves: 'Kopyta',
  Constrict: 'Uścisk',
  Sting: 'Żądło',
  Club: 'Maczuga',
  Dagger: 'Sztylet',
  Longsword: 'Długi miecz',
  Shortsword: 'Krótki miecz',
  Greataxe: 'Wielki topór',
  Greatsword: 'Wielki miecz',
  Bow: 'Łuk',
  Crossbow: 'Kusza',
};

function translateActionName(name: string): string {
  const trimmed = name.trim();
  if (ACTION_TRANSLATIONS[trimmed]) {
    return ACTION_TRANSLATIONS[trimmed];
  }
  for (const [en, pl] of Object.entries(ACTION_TRANSLATIONS)) {
    if (trimmed.toLowerCase().includes(en.toLowerCase())) {
      return trimmed.replace(new RegExp(en, 'i'), pl);
    }
  }
  return trimmed;
}

/**
 * Extracts individual attack segments for multiattack or extra attack.
 */
export function extractMultiattackDetails(input: ExtractMultiattackInput): MultiattackSegment[] {
  const segments: MultiattackSegment[] = [];

  // 1. Check for monster Multiattack action
  if (input.actions && Array.isArray(input.actions)) {
    const multiAction = input.actions.find(
      (a) => a.name.toLowerCase() === 'multiattack' || a.name.toLowerCase() === 'wieloatak'
    );

    if (multiAction) {
      // 1a. If structured sub-actions are provided (SRD schema)
      if (multiAction.actions && Array.isArray(multiAction.actions)) {
        for (const sub of multiAction.actions) {
          // ignore non-damaging abilities like Frightful Presence in the attack pipeline
          if (sub.type === 'ability' && sub.action_name?.toLowerCase().includes('presence')) {
            continue;
          }
          const baseName = translateActionName(sub.action_name || sub.name || 'Atak');
          const count = sub.count || 1;
          for (let i = 0; i < count; i++) {
            const displayName = count > 1 ? `${baseName} ${i + 1}` : baseName;
            segments.push({
              id: `atk-${segments.length + 1}`,
              name: displayName,
              used: false,
            });
          }
        }
      }

      // 1b. If no structured sub-actions array, parse from description text
      if (segments.length === 0 && multiAction.desc) {
        const desc = multiAction.desc.toLowerCase();
        let attackCount = 0;

        if (desc.includes('two') || desc.includes(' 2 ')) attackCount = 2;
        else if (desc.includes('three') || desc.includes(' 3 ')) attackCount = 3;
        else if (desc.includes('four') || desc.includes(' 4 ')) attackCount = 4;
        else if (desc.includes('five') || desc.includes(' 5 ')) attackCount = 5;

        if (attackCount > 0) {
          for (let i = 1; i <= attackCount; i++) {
            segments.push({
              id: `atk-${i}`,
              name: `Atak ${i}`,
              used: false,
            });
          }
        }
      }

      if (segments.length > 0) {
        return segments;
      }
    }
  }

  // 2. Check for player Extra Attack (Fighter, Barbarian, Paladin, Ranger, Monk at lvl 5+)
  if (input.className && input.level && input.level >= 5) {
    const cName = input.className.toLowerCase();
    const isMartial =
      cName.includes('wojownik') ||
      cName.includes('fighter') ||
      cName.includes('barbarzyńca') ||
      cName.includes('barbarian') ||
      cName.includes('paladyn') ||
      cName.includes('paladin') ||
      cName.includes('łowca') ||
      cName.includes('ranger') ||
      cName.includes('mnich') ||
      cName.includes('monk');

    if (isMartial) {
      let extraCount = 2;
      const isFighter = cName.includes('wojownik') || cName.includes('fighter');
      if (isFighter) {
        if (input.level >= 20) extraCount = 4;
        else if (input.level >= 11) extraCount = 3;
      }

      for (let i = 1; i <= extraCount; i++) {
        segments.push({
          id: `atk-${i}`,
          name: `Atak ${i}`,
          used: false,
        });
      }
    }
  }

  return segments;
}

/**
 * Creates initial turn resources state for a combatant.
 */
export function initCombatantTurnResources(
  input: ExtractMultiattackInput & { existingResources?: Partial<CombatantTurnResources> }
): CombatantTurnResources {
  const attacks = extractMultiattackDetails(input);
  const totalAttacks = attacks.length > 0 ? attacks.length : 1;

  return {
    actionUsed: input.existingResources?.actionUsed ?? false,
    bonusActionUsed: input.existingResources?.bonusActionUsed ?? false,
    reactionUsed: input.existingResources?.reactionUsed ?? false,
    extraActions: input.existingResources?.extraActions ?? 0,
    extraActionsUsed: input.existingResources?.extraActionsUsed ?? 0,
    totalAttacks,
    attacksRemaining: input.existingResources?.attacksRemaining ?? totalAttacks,
    attacks:
      input.existingResources?.attacks && input.existingResources.attacks.length > 0
        ? input.existingResources.attacks
        : attacks,
  };
}

/**
 * Toggles an action resource between available and used.
 */
export function toggleTurnAction(
  resources: CombatantTurnResources,
  type: TurnActionType,
  extraIndex?: number
): CombatantTurnResources {
  switch (type) {
    case 'action':
      return { ...resources, actionUsed: !resources.actionUsed };
    case 'bonus_action':
      return { ...resources, bonusActionUsed: !resources.bonusActionUsed };
    case 'reaction':
      return { ...resources, reactionUsed: !resources.reactionUsed };
    case 'extra_action': {
      if (resources.extraActions <= 0) return resources;
      const currentlyUsed = resources.extraActionsUsed;
      const targetUsed =
        extraIndex !== undefined
          ? extraIndex < currentlyUsed
            ? currentlyUsed - 1
            : currentlyUsed + 1
          : currentlyUsed >= resources.extraActions
            ? 0
            : currentlyUsed + 1;
      return {
        ...resources,
        extraActionsUsed: Math.max(0, Math.min(resources.extraActions, targetUsed)),
      };
    }
    default:
      return resources;
  }
}

/**
 * Adds a temporary extra action pip (e.g. Action Surge, Haste).
 */
export function addExtraAction(resources: CombatantTurnResources): CombatantTurnResources {
  return {
    ...resources,
    extraActions: resources.extraActions + 1,
  };
}

/**
 * Toggles a specific attack segment between used and unused.
 */
export function toggleAttackSegment(
  resources: CombatantTurnResources,
  attackId: string
): CombatantTurnResources {
  const updatedAttacks = resources.attacks.map((a) =>
    a.id === attackId ? { ...a, used: !a.used } : a
  );
  const remaining = updatedAttacks.filter((a) => !a.used).length;

  return {
    ...resources,
    attacks: updatedAttacks,
    attacksRemaining: remaining,
  };
}

/**
 * Consumes the next available attack segment (used upon clicking roll).
 */
export function consumeNextAttack(resources: CombatantTurnResources): CombatantTurnResources {
  if (resources.attacks.length === 0) return resources;

  const firstUnusedIndex = resources.attacks.findIndex((a) => !a.used);
  if (firstUnusedIndex === -1) return resources;

  const updatedAttacks = [...resources.attacks];
  updatedAttacks[firstUnusedIndex] = { ...updatedAttacks[firstUnusedIndex], used: true };
  const remaining = updatedAttacks.filter((a) => !a.used).length;

  return {
    ...resources,
    attacks: updatedAttacks,
    attacksRemaining: remaining,
  };
}

/**
 * Resets turn resources on turn transition:
 * - If starting OWN turn: resets action, bonus action, reaction, extra actions, and attacks.
 * - If turn ended or passing to another combatant: preserves reaction!
 */
export function resetTurnResourcesForNewTurn(
  resources: CombatantTurnResources,
  isOwnTurnStarting: boolean
): CombatantTurnResources {
  if (isOwnTurnStarting) {
    const refreshedAttacks = resources.attacks.map((a) => ({ ...a, used: false }));
    return {
      ...resources,
      actionUsed: false,
      bonusActionUsed: false,
      reactionUsed: false, // Refreshes at the start of own turn!
      extraActions: 0,
      extraActionsUsed: 0,
      attacksRemaining: refreshedAttacks.length > 0 ? refreshedAttacks.length : 1,
      attacks: refreshedAttacks,
    };
  }

  // Not own turn (e.g. someone else's turn): preserve reaction!
  return {
    ...resources,
    extraActions: 0,
    extraActionsUsed: 0,
  };
}
