import type { CombatStatusEnum, PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from './prisma';

export interface CreateCombatantInput {
  characterId?: string | null;
  apiMonsterId?: string | null;
  monsterId?: string | null;
  nameOverride?: string | null;
  initiative?: number;
  currentHp?: number;
  maxHp?: number;
  ac?: number;
  order?: number;
}

export interface StartCombatInput {
  sessionId: string;
  combatants?: CreateCombatantInput[];
}

export interface UpdateCombatantStatusInput {
  combatantId: string;
  statusName: string;
  durationTurns: number;
}

export interface UpdateCombatantHpInput {
  delta?: number;
  amount?: number;
  currentHp?: number;
}

export type CombatPrismaClient = Pick<
  PrismaClient,
  'combat' | 'combatant' | 'combatStatus' | 'session' | 'character' | 'sessionLog'
>;

const combatInclude = {
  combatants: {
    orderBy: { order: 'asc' as const },
    include: {
      statuses: true,
      monster: true,
      character: true,
    },
  },
};

/**
 * Returns full combat by ID including combatants, monsters, characters, and statuses.
 */
export async function getCombatById(combatId: string, client: CombatPrismaClient = defaultPrisma) {
  return client.combat.findUnique({
    where: { id: combatId },
    include: combatInclude,
  });
}

/**
 * Finds the currently active combat instance for a session.
 */
export async function getActiveCombatForSession(
  sessionId: string,
  client: CombatPrismaClient = defaultPrisma
) {
  const combats = await client.combat.findMany({
    where: {
      sessionId,
      status: { in: ['PREPARING', 'ACTIVE'] },
    },
    orderBy: { createdAt: 'desc' },
    take: 1,
    include: combatInclude,
  });

  return combats[0] || null;
}

/**
 * Creates and starts a new active combat instance for a session:
 * - Sorts combatants by initiative descending.
 * - Freezes turn queue and sets currentRound = 1, currentTurnIndex = 0.
 * - Logs combat initiation to session history.
 */
export async function startCombat(
  input: StartCombatInput,
  client: CombatPrismaClient = defaultPrisma
) {
  if (!input.sessionId || typeof input.sessionId !== 'string') {
    throw new Error('sessionId is required');
  }

  const session = await client.session.findUnique({
    where: { id: input.sessionId },
    include: { characters: true },
  });

  if (!session) {
    throw new Error('Session not found');
  }

  const rawCombatants = input.combatants || [];

  // Sort combatants by initiative DESC
  const sortedCombatants = [...rawCombatants].sort((a, b) => {
    const initA = a.initiative ?? 0;
    const initB = b.initiative ?? 0;
    return initB - initA;
  });

  const sessionChars = (session as { characters?: { id: string }[] }).characters;
  const validCharIds = Array.isArray(sessionChars) ? new Set(sessionChars.map((c) => c.id)) : null;

  const combatantsCreateData = sortedCombatants.map((c, index) => ({
    characterId:
      c.characterId && (!validCharIds || validCharIds.has(c.characterId)) ? c.characterId : null,
    apiMonsterId: c.apiMonsterId ?? null,
    monsterId: c.monsterId ?? null,
    nameOverride: c.nameOverride ?? null,
    initiative: c.initiative ?? 10,
    currentHp: c.currentHp ?? c.maxHp ?? 10,
    maxHp: c.maxHp ?? c.currentHp ?? 10,
    ac: c.ac ?? 10,
    order: index,
  }));

  const combat = await client.combat.create({
    data: {
      sessionId: input.sessionId,
      status: 'ACTIVE' as CombatStatusEnum,
      currentRound: 1,
      currentTurnIndex: 0,
      combatants: {
        create: combatantsCreateData,
      },
    },
    include: combatInclude,
  });

  await client.sessionLog.create({
    data: {
      sessionId: input.sessionId,
      combatId: combat.id,
      logType: 'COMBAT_ACTION',
      description: `Walka rozpoczęta. Do walki stanęło ${combat.combatants.length} uczestników.`,
    },
  });

  return combat;
}

/**
 * Advances the turn cycle in active combat:
 * - Increases currentTurnIndex.
 * - When end of queue is reached, increments currentRound and resets currentTurnIndex to 0.
 * - Decrements active status durations on the new active combatant and removes expired statuses.
 * - Creates a turn transition log entry.
 */
export async function nextTurn(combatId: string, client: CombatPrismaClient = defaultPrisma) {
  const combat = await client.combat.findUnique({
    where: { id: combatId },
    include: combatInclude,
  });

  if (!combat) {
    throw new Error('Combat not found');
  }

  if (combat.status !== 'ACTIVE') {
    throw new Error('Combat is not active');
  }

  const combatants = combat.combatants;
  if (combatants.length === 0) {
    return combat;
  }

  let nextRound = combat.currentRound;
  let nextTurnIndex = combat.currentTurnIndex + 1;

  if (nextTurnIndex >= combatants.length) {
    nextRound += 1;
    nextTurnIndex = 0;
  }

  // Active combatant whose turn is starting
  const currentCombatant = combatants[nextTurnIndex];

  // Decrement statuses on active combatant
  if (currentCombatant?.statuses) {
    for (const status of currentCombatant.statuses) {
      const nextDuration = status.durationTurns - 1;
      if (nextDuration <= 0) {
        await client.combatStatus.delete({
          where: { id: status.id },
        });
      } else {
        await client.combatStatus.update({
          where: { id: status.id },
          data: { durationTurns: nextDuration },
        });
      }
    }
  }

  const updatedCombat = await client.combat.update({
    where: { id: combatId },
    data: {
      currentRound: nextRound,
      currentTurnIndex: nextTurnIndex,
    },
    include: combatInclude,
  });

  const combatantName =
    currentCombatant?.nameOverride ||
    currentCombatant?.character?.name ||
    currentCombatant?.monster?.name ||
    'Uczestnik';

  await client.sessionLog.create({
    data: {
      sessionId: combat.sessionId,
      combatId: combat.id,
      logType: 'COMBAT_ACTION',
      description: `Runda ${nextRound}: Rozpoczęto turę ${combatantName}.`,
    },
  });

  return updatedCombat;
}

/**
 * Adds a new combatant to an active combat (e.g. reinforcements joining battle).
 */
export async function addCombatantToCombat(
  combatId: string,
  input: CreateCombatantInput,
  client: CombatPrismaClient = defaultPrisma
) {
  const combat = await client.combat.findUnique({
    where: { id: combatId },
    include: {
      combatants: true,
      session: {
        include: { characters: true },
      },
    },
  });

  if (!combat) {
    throw new Error('Combat not found');
  }

  const sessionChars = (combat as { session?: { characters?: { id: string }[] } }).session
    ?.characters;
  const validCharIds = Array.isArray(sessionChars) ? new Set(sessionChars.map((c) => c.id)) : null;
  const characterId =
    input.characterId && (!validCharIds || validCharIds.has(input.characterId))
      ? input.characterId
      : null;

  const maxOrder = combat.combatants.reduce((max, c) => Math.max(max, c.order), -1);
  const nextOrder = input.order !== undefined ? input.order : maxOrder + 1;

  const combatant = await client.combatant.create({
    data: {
      combatId,
      characterId,
      apiMonsterId: input.apiMonsterId ?? null,
      monsterId: input.monsterId ?? null,
      nameOverride: input.nameOverride ?? null,
      initiative: input.initiative ?? 10,
      currentHp: input.currentHp ?? input.maxHp ?? 10,
      maxHp: input.maxHp ?? input.currentHp ?? 10,
      ac: input.ac ?? 10,
      order: nextOrder,
    },
    include: {
      statuses: true,
      monster: true,
      character: true,
    },
  });

  const name = combatant.nameOverride || 'Nowy uczestnik';
  await client.sessionLog.create({
    data: {
      sessionId: combat.sessionId,
      combatId,
      logType: 'COMBAT_ACTION',
      description: `Do walki dołączył: ${name} (Inicjatywa: ${combatant.initiative}).`,
    },
  });

  return combatant;
}

/**
 * Applies a timed status condition to a combatant.
 */
export async function applyStatusToCombatant(
  input: UpdateCombatantStatusInput,
  client: CombatPrismaClient = defaultPrisma
) {
  const combatant = await client.combatant.findUnique({
    where: { id: input.combatantId },
    include: { combat: true },
  });

  if (!combatant) {
    throw new Error('Combatant not found');
  }

  const status = await client.combatStatus.create({
    data: {
      combatantId: input.combatantId,
      statusName: input.statusName.trim(),
      durationTurns: Math.max(1, Math.floor(input.durationTurns)),
    },
  });

  await client.sessionLog.create({
    data: {
      sessionId: combatant.combat.sessionId,
      combatId: combatant.combatId,
      logType: 'COMBAT_ACTION',
      description: `Nałożono status "${status.statusName}" na ${combatant.nameOverride || 'postać'} (${status.durationTurns} tur).`,
    },
  });

  return status;
}

/**
 * Removes a status condition from a combatant.
 */
export async function removeStatusFromCombatant(
  statusId: string,
  client: CombatPrismaClient = defaultPrisma
) {
  const existing = await client.combatStatus.findUnique({
    where: { id: statusId },
  });

  if (!existing) {
    return false;
  }

  await client.combatStatus.delete({
    where: { id: statusId },
  });

  return true;
}

/**
 * Modifies combatant HP (delta or direct set) clamped between 0 and maxHp.
 */
export async function updateCombatantHp(
  combatId: string,
  combatantId: string,
  payload: UpdateCombatantHpInput,
  client: CombatPrismaClient = defaultPrisma
) {
  const combatant = await client.combatant.findUnique({
    where: { id: combatantId },
    include: { combat: true },
  });

  if (!combatant || combatant.combatId !== combatId) {
    return null;
  }

  let nextHp = combatant.currentHp;

  if (payload.delta !== undefined) {
    nextHp = Math.min(combatant.maxHp, Math.max(0, combatant.currentHp + payload.delta));
  } else if (payload.amount !== undefined) {
    nextHp = Math.min(combatant.maxHp, Math.max(0, payload.amount));
  } else if (payload.currentHp !== undefined) {
    nextHp = Math.min(combatant.maxHp, Math.max(0, payload.currentHp));
  }

  const updated = await client.combatant.update({
    where: { id: combatantId },
    data: { currentHp: nextHp },
    include: {
      statuses: true,
      monster: true,
      character: true,
    },
  });

  return updated;
}

export interface EndCombatInput {
  heroUpdates?: {
    characterId: string;
    hp: number;
  }[];
}

/**
 * Concludes active combat:
 * - Changes status to FINISHED and sets endedAt timestamp.
 * - Automatically synchronizes player hero current HP back to character sheet.
 * - Records COMBAT_END session log.
 */
export async function endCombat(
  combatId: string,
  inputOrClient?: EndCombatInput | CombatPrismaClient,
  client?: CombatPrismaClient
) {
  let input: EndCombatInput | undefined;
  let resolvedClient: CombatPrismaClient = defaultPrisma;

  if (inputOrClient && 'combat' in inputOrClient) {
    resolvedClient = inputOrClient as CombatPrismaClient;
  } else {
    input = inputOrClient as EndCombatInput | undefined;
    resolvedClient = client ?? defaultPrisma;
  }

  const combat = await resolvedClient.combat.findUnique({
    where: { id: combatId },
    include: {
      combatants: {
        include: {
          character: true,
        },
      },
    },
  });

  if (!combat) {
    throw new Error('Combat not found');
  }

  // Synchronize player character HP
  if (input?.heroUpdates && input.heroUpdates.length > 0) {
    for (const update of input.heroUpdates) {
      if (update.characterId) {
        try {
          await resolvedClient.character.update({
            where: { id: update.characterId },
            data: { currentHp: update.hp },
          });
        } catch {
          // Ignore if character does not exist in DB (e.g. temporary/mock id)
        }
        const matchingCombatant = combat.combatants.find(
          (c) => c.characterId === update.characterId || c.id === update.characterId
        );
        if (matchingCombatant) {
          await resolvedClient.combatant.update({
            where: { id: matchingCombatant.id },
            data: { currentHp: update.hp },
          });
        }
      }
    }
  } else {
    for (const combatant of combat.combatants) {
      if (combatant.characterId) {
        await resolvedClient.character.update({
          where: { id: combatant.characterId },
          data: { currentHp: combatant.currentHp },
        });
      }
    }
  }

  const updatedCombat = await resolvedClient.combat.update({
    where: { id: combatId },
    data: {
      status: 'FINISHED' as CombatStatusEnum,
      endedAt: new Date(),
    },
    include: combatInclude,
  });

  await resolvedClient.sessionLog.create({
    data: {
      sessionId: combat.sessionId,
      combatId: combat.id,
      logType: 'COMBAT_END',
      description: `Walka zakończona po ${combat.currentRound} rundach. Zsynchronizowano stan postaci.`,
    },
  });

  return updatedCombat;
}
