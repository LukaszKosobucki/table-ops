import type { PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from './prisma';

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

/**
 * Returns all sessions sorted by updatedAt DESC with aggregated counts of characters and logs.
 */
export async function getSessions(client: SessionPrismaClient = defaultPrisma) {
  return client.session.findMany({
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
 */
export async function createSession(
  data: { name: string },
  client: SessionPrismaClient = defaultPrisma
) {
  const validation = validateSessionName(data.name);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  return client.session.create({
    data: {
      name: validation.name,
    },
  });
}

/**
 * Updates a session's name after validating input. Returns null if not found.
 */
export async function updateSession(
  id: string,
  data: { name: string },
  client: SessionPrismaClient = defaultPrisma
) {
  const validation = validateSessionName(data.name);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const existing = await client.session.findUnique({
    where: { id },
  });

  if (!existing) {
    return null;
  }

  return client.session.update({
    where: { id },
    data: {
      name: validation.name,
    },
  });
}

/**
 * Deletes a session and cascading children. Returns null if not found.
 */
export async function deleteSession(id: string, client: SessionPrismaClient = defaultPrisma) {
  const existing = await client.session.findUnique({
    where: { id },
  });

  if (!existing) {
    return null;
  }

  return client.session.delete({
    where: { id },
  });
}
