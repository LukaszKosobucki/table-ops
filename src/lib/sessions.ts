import type { PrismaClient } from '@prisma/client';
import {
  type ExternalNotesUrlValidationError,
  type ExternalNotesUrlValidationResult,
  type ExternalNotesUrlValidationSuccess,
  toEmbeddableNotesUrl,
  validateExternalNotesUrl,
} from './external-notes';
import { prisma as defaultPrisma } from './prisma';

export {
  type ExternalNotesUrlValidationError,
  type ExternalNotesUrlValidationResult,
  type ExternalNotesUrlValidationSuccess,
  toEmbeddableNotesUrl,
  validateExternalNotesUrl,
};

export interface SessionValidationSuccess {
  valid: true;
  name: string;
}

export interface SessionValidationError {
  valid: false;
  error: string;
}

export type SessionValidationResult = SessionValidationSuccess | SessionValidationError;

/**
 * Validates session name according to specification:
 * - Must be a string
 * - Non-empty after trimming
 * - Min 2 characters, max 60 characters
 */
export function validateSessionName(name: unknown): SessionValidationResult {
  if (name === null || name === undefined || name === '') {
    return { valid: false, error: 'Session name is required' };
  }

  if (typeof name !== 'string') {
    return { valid: false, error: 'Session name must be a string' };
  }

  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return {
      valid: false,
      error: 'Session name must be at least 2 characters long',
    };
  }

  if (trimmed.length > 60) {
    return {
      valid: false,
      error: 'Session name cannot exceed 60 characters',
    };
  }

  return { valid: true, name: trimmed };
}

export type SessionPrismaClient = Pick<PrismaClient, 'session'>;

export interface GetSessionsOptions {
  userId?: string | null;
}

export interface SessionOwnershipOptions {
  userId?: string | null;
}

export interface CreateSessionData {
  name: string;
  googleDocUrl?: string | null;
  userId?: string | null;
}

export interface UpdateSessionData {
  name?: string;
  googleDocUrl?: string | null;
  userId?: string | null;
}

function isSessionPrismaClient(value: unknown): value is SessionPrismaClient {
  return typeof value === 'object' && value !== null && 'session' in value;
}

/**
 * Returns all sessions sorted by updatedAt DESC with aggregated counts of characters and logs.
 * Supports filtering by userId or guest sessions (userId: null).
 */
export async function getSessions(
  optionsOrClient?: GetSessionsOptions | SessionPrismaClient,
  client: SessionPrismaClient = defaultPrisma
) {
  let options: GetSessionsOptions = {};
  let prismaClient = client;

  if (isSessionPrismaClient(optionsOrClient)) {
    prismaClient = optionsOrClient;
  } else if (optionsOrClient) {
    options = optionsOrClient;
  }

  const where = options.userId !== undefined ? { userId: options.userId } : undefined;

  return prismaClient.session.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: {
        select: {
          characters: true,
          sessionLogs: true,
        },
      },
    },
  });
}

/**
 * Creates a new session after validating input.
 * Supports associating with a userId (or null for guest) and optional googleDocUrl.
 */
export async function createSession(
  data: CreateSessionData,
  client: SessionPrismaClient = defaultPrisma
) {
  const validation = validateSessionName(data.name);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  let validatedGoogleDocUrl: string | null = null;
  if (data.googleDocUrl !== undefined) {
    const urlValidation = validateExternalNotesUrl(data.googleDocUrl);
    if (!urlValidation.valid) {
      throw new Error(urlValidation.error);
    }
    validatedGoogleDocUrl = urlValidation.url;
  }

  const sessionData: { name: string; googleDocUrl?: string | null; userId?: string | null } = {
    name: validation.name,
  };
  if (validatedGoogleDocUrl !== null) {
    sessionData.googleDocUrl = validatedGoogleDocUrl;
  }
  if (data.userId !== undefined) {
    sessionData.userId = data.userId;
  }

  return client.session.create({
    data: sessionData,
  });
}

/**
 * Updates a session's name and/or googleDocUrl after validating input.
 * Ensures the requester has permission if userId is specified. Returns null if not found or unauthorized.
 */
export async function updateSession(
  id: string,
  data: UpdateSessionData,
  client: SessionPrismaClient = defaultPrisma
) {
  if (data.name === undefined && data.googleDocUrl === undefined) {
    throw new Error('At least one field (name or googleDocUrl) must be provided');
  }

  const updatePayload: { name?: string; googleDocUrl?: string | null } = {};

  if (data.name !== undefined) {
    const validation = validateSessionName(data.name);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    updatePayload.name = validation.name;
  }

  if (data.googleDocUrl !== undefined) {
    const urlValidation = validateExternalNotesUrl(data.googleDocUrl);
    if (!urlValidation.valid) {
      throw new Error(urlValidation.error);
    }
    updatePayload.googleDocUrl = urlValidation.url;
  }

  const existing = await client.session.findUnique({
    where: { id },
  });

  if (!existing) {
    return null;
  }

  if (existing.userId && data.userId !== undefined && existing.userId !== data.userId) {
    return null;
  }

  return client.session.update({
    where: { id },
    data: updatePayload,
  });
}

/**
 * Deletes a session and cascading children.
 * Ensures the requester has permission if userId is specified. Returns null if not found or unauthorized.
 */
export async function deleteSession(
  id: string,
  optionsOrClient?: SessionOwnershipOptions | SessionPrismaClient,
  client: SessionPrismaClient = defaultPrisma
) {
  let options: SessionOwnershipOptions = {};
  let prismaClient = client;

  if (isSessionPrismaClient(optionsOrClient)) {
    prismaClient = optionsOrClient;
  } else if (optionsOrClient) {
    options = optionsOrClient;
  }

  const existing = await prismaClient.session.findUnique({
    where: { id },
  });

  if (!existing) {
    return null;
  }

  if (existing.userId && options.userId !== undefined && existing.userId !== options.userId) {
    return null;
  }

  return prismaClient.session.delete({
    where: { id },
  });
}

/**
 * Returns full state of a session for dashboard initialization:
 * - Session details
 * - Characters and NPCs
 * - Encounter groups with member details
 * - Active combat (PREPARING or ACTIVE) with combatants and statuses
 * - Recent 20 session logs
 * Ensures the requester has permission if userId is specified.
 */
export async function getSessionFullState(
  id: string,
  optionsOrClient?: SessionOwnershipOptions | SessionPrismaClient,
  client: SessionPrismaClient = defaultPrisma
) {
  let options: SessionOwnershipOptions = {};
  let prismaClient = client;

  if (isSessionPrismaClient(optionsOrClient)) {
    prismaClient = optionsOrClient;
  } else if (optionsOrClient) {
    options = optionsOrClient;
  }

  const session = await prismaClient.session.findUnique({
    where: { id },
    include: {
      characters: {
        orderBy: { createdAt: 'asc' },
      },
      encounterGroups: {
        orderBy: { createdAt: 'asc' },
        include: {
          members: {
            include: {
              monster: true,
              character: true,
            },
          },
        },
      },
      combats: {
        where: {
          status: { in: ['PREPARING', 'ACTIVE'] },
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          combatants: {
            orderBy: { order: 'asc' },
            include: {
              statuses: true,
              monster: true,
              character: true,
            },
          },
        },
      },
      sessionLogs: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  });

  if (!session) {
    return null;
  }

  if (session.userId && options.userId !== undefined && session.userId !== options.userId) {
    return null;
  }

  const { combats, characters, encounterGroups, sessionLogs, ...sessionMeta } = session;

  return {
    session: sessionMeta,
    characters,
    encounterGroups,
    activeCombat: combats[0] ?? null,
    sessionLogs,
  };
}

/**
 * Migrates sessions owned by anonymous guestId to targetUserId (Option A: Anonymous Device Migration).
 * Returns the count of claimed sessions.
 */
export async function claimGuestSessions(
  targetUserId: string,
  guestId: string,
  client: SessionPrismaClient = defaultPrisma
): Promise<number> {
  if (!targetUserId || !guestId || targetUserId === guestId) {
    return 0;
  }

  const result = await client.session.updateMany({
    where: { userId: guestId },
    data: { userId: targetUserId },
  });

  return result.count;
}
