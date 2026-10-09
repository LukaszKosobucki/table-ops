import { type Prisma, type PrismaClient, SessionLogType } from '@prisma/client';
import { prisma as defaultPrisma } from './prisma';

export interface HealAdjustment {
  characterId: string;
  hpHealed: number;
  hitDiceSpent?: number;
}

export interface CreateSessionLogInput {
  sessionId: string;
  combatId?: string | null;
  logType: SessionLogType;
  description?: string;
  metadata?: Record<string, unknown> | null;
  heals?: HealAdjustment[];
}

export interface GetSessionLogsOptions {
  type?: SessionLogType;
  limit?: number;
  offset?: number;
  userId?: string | null;
}

export interface GetCombatLogsOptions {
  limit?: number;
  offset?: number;
  userId?: string | null;
}

export type LogsPrismaClient = Pick<PrismaClient, 'session' | 'character' | 'sessionLog'>;

export interface ValidationSuccess {
  valid: true;
  data: {
    sessionId: string;
    combatId?: string | null;
    logType: SessionLogType;
    description: string;
    metadata?: Record<string, unknown> | null;
    heals?: HealAdjustment[];
  };
}

export interface ValidationError {
  valid: false;
  error: string;
}

export type LogValidationResult = ValidationSuccess | ValidationError;

const VALID_LOG_TYPES = new Set<SessionLogType>([
  SessionLogType.REST_SHORT,
  SessionLogType.REST_LONG,
  SessionLogType.COMBAT_END,
  SessionLogType.SPELL_CAST,
  SessionLogType.COMBAT_ACTION,
  SessionLogType.CUSTOM_NOTE,
  SessionLogType.DICE_ROLL,
]);

/**
 * Validates session log creation input.
 */
export function validateSessionLogInput(input: unknown): LogValidationResult {
  if (!input || typeof input !== 'object') {
    return { valid: false, error: 'Payload must be an object' };
  }

  const raw = input as Record<string, unknown>;

  if (!raw.sessionId || typeof raw.sessionId !== 'string' || !raw.sessionId.trim()) {
    return { valid: false, error: 'sessionId is required and cannot be empty' };
  }

  const sessionId = raw.sessionId.trim();

  if (
    !raw.logType ||
    typeof raw.logType !== 'string' ||
    !VALID_LOG_TYPES.has(raw.logType as SessionLogType)
  ) {
    return {
      valid: false,
      error: `Invalid logType. Allowed values: ${Array.from(VALID_LOG_TYPES).join(', ')}`,
    };
  }

  const logType = raw.logType as SessionLogType;
  let description = typeof raw.description === 'string' ? raw.description.trim() : '';

  if (!description) {
    if (logType === SessionLogType.REST_LONG) {
      description =
        'Drużyna ukończyła Długi Odpoczynek (8h). Wszyscy bohaterowie odzyskali pełnię sił i sloty czarów.';
    } else if (logType === SessionLogType.REST_SHORT) {
      description = 'Drużyna ukończyła Krótki Odpoczynek (1h).';
    } else if (logType === SessionLogType.DICE_ROLL) {
      description = 'Rzut kośćmi.';
    } else {
      description = 'Wpis w kronice sesji.';
    }
  }

  const combatId =
    typeof raw.combatId === 'string' && raw.combatId.trim() ? raw.combatId.trim() : null;

  const metadata =
    raw.metadata && typeof raw.metadata === 'object'
      ? (raw.metadata as Record<string, unknown>)
      : null;

  const heals = Array.isArray(raw.heals)
    ? (raw.heals as HealAdjustment[]).filter(
        (h) => h && typeof h.characterId === 'string' && typeof h.hpHealed === 'number'
      )
    : undefined;

  return {
    valid: true,
    data: {
      sessionId,
      combatId,
      logType,
      description,
      metadata,
      heals,
    },
  };
}

/**
 * Helper to verify that a session exists and belongs to the given user (if specified).
 */
async function verifySessionAccess(
  sessionId: string,
  userId?: string | null,
  client: LogsPrismaClient = defaultPrisma
) {
  if (userId !== undefined && userId !== null) {
    return client.session.findFirst({
      where: { id: sessionId, userId },
    });
  }

  return client.session.findUnique({
    where: { id: sessionId },
  });
}

/**
 * Retrieves session logs for the timeline with optional filtering and pagination.
 */
export async function getSessionLogs(
  sessionId: string,
  options?: GetSessionLogsOptions,
  client: LogsPrismaClient = defaultPrisma
) {
  const session = await verifySessionAccess(sessionId, options?.userId, client);
  if (!session) {
    return { logs: [], total: 0 };
  }

  const where: Prisma.SessionLogWhereInput = {
    sessionId,
    ...(options?.type ? { logType: options.type } : {}),
  };

  const take = options?.limit ?? 50;
  const skip = options?.offset ?? 0;

  const [logs, total] = await Promise.all([
    client.sessionLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    }),
    client.sessionLog.count({ where }),
  ]);

  return { logs, total };
}

/**
 * Retrieves logs for a specific combat instance ordered chronologically.
 */
export async function getCombatLogs(
  combatId: string,
  options?: GetCombatLogsOptions,
  client: LogsPrismaClient = defaultPrisma
) {
  const take = options?.limit;
  const skip = options?.offset;

  return client.sessionLog.findMany({
    where: { combatId },
    orderBy: { createdAt: 'asc' },
    ...(take ? { take } : {}),
    ...(skip ? { skip } : {}),
  });
}

/**
 * Creates a session log entry and executes D&D 5e rest automations (Long/Short rest).
 */
export async function createSessionLog(
  input: CreateSessionLogInput,
  options?: { userId?: string | null },
  client: LogsPrismaClient = defaultPrisma
) {
  const validation = validateSessionLogInput(input);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const { sessionId, combatId, logType, description, metadata, heals } = validation.data;

  const session = await verifySessionAccess(sessionId, options?.userId, client);
  if (!session) {
    throw new Error('Session not found or access denied');
  }

  const updatedCharacters: unknown[] = [];

  // 1. Long Rest Automation (REST_LONG)
  if (logType === SessionLogType.REST_LONG) {
    const heroes = await client.character.findMany({
      where: { sessionId, type: 'HERO' },
    });

    for (const hero of heroes) {
      const stats = (hero.stats as Record<string, unknown>) || {};
      const updatedStats = {
        ...stats,
        tempHp: 0,
      };

      const spells = (hero.spells as Record<string, unknown>) || {};
      let updatedSpells = spells;

      if (spells.slots && typeof spells.slots === 'object') {
        const slotsObj = spells.slots as Record<string, { max: number; used: number }>;
        const restoredSlots: Record<string, { max: number; used: number }> = {};
        for (const [lvl, slot] of Object.entries(slotsObj)) {
          restoredSlots[lvl] = {
            ...slot,
            used: 0,
          };
        }
        updatedSpells = {
          ...spells,
          slots: restoredSlots,
        };
      }

      const updated = await client.character.update({
        where: { id: hero.id },
        data: {
          currentHp: hero.maxHp,
          stats: updatedStats as unknown as Prisma.InputJsonValue,
          spells: updatedSpells as unknown as Prisma.InputJsonValue,
        },
      });

      updatedCharacters.push(updated);
    }
  }

  // 2. Short Rest Automation (REST_SHORT)
  if (logType === SessionLogType.REST_SHORT && heals && heals.length > 0) {
    for (const heal of heals) {
      const char = await client.character.findUnique({
        where: { id: heal.characterId },
      });

      if (char && char.sessionId === sessionId) {
        const nextHp = Math.min(char.maxHp, char.currentHp + Math.max(0, heal.hpHealed));
        const updated = await client.character.update({
          where: { id: char.id },
          data: {
            currentHp: nextHp,
          },
        });
        updatedCharacters.push(updated);
      }
    }
  }

  // 3. Create the Session Log entry
  const log = await client.sessionLog.create({
    data: {
      sessionId,
      combatId,
      logType,
      description,
      metadata: (metadata || undefined) as unknown as Prisma.InputJsonValue | undefined,
    },
  });

  return {
    log,
    updatedCharacters,
  };
}
