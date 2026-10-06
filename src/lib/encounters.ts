import type { Prisma, PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from './prisma';

export interface EncounterMemberInput {
  characterId?: string | null;
  monsterId?: string | null;
  apiMonsterId?: string | null;
  count?: number;
}

export interface CreateEncounterInput {
  sessionId: string;
  name: string;
  members?: EncounterMemberInput[];
}

export interface UpdateEncounterInput {
  name?: string;
  members?: EncounterMemberInput[];
}

export interface EncounterValidationSuccess {
  valid: true;
  data: CreateEncounterInput;
}

export interface EncounterValidationError {
  valid: false;
  error: string;
}

export type EncounterValidationResult = EncounterValidationSuccess | EncounterValidationError;

/**
 * Validates encounter creation or input payloads.
 */
export function validateEncounterInput(input: unknown): EncounterValidationResult {
  if (!input || typeof input !== 'object') {
    return { valid: false, error: 'Encounter payload must be an object' };
  }

  const raw = input as Record<string, unknown>;

  if (!raw.sessionId || typeof raw.sessionId !== 'string' || raw.sessionId.trim().length === 0) {
    return { valid: false, error: 'sessionId is required and must be a valid string' };
  }

  if (!raw.name || typeof raw.name !== 'string' || raw.name.trim().length === 0) {
    return { valid: false, error: 'Encounter name is required and cannot be empty' };
  }

  const name = raw.name.trim();
  if (name.length > 100) {
    return { valid: false, error: 'Encounter name cannot exceed 100 characters' };
  }

  const validatedMembers: EncounterMemberInput[] = [];

  if (raw.members !== undefined) {
    if (!Array.isArray(raw.members)) {
      return { valid: false, error: 'members must be an array' };
    }

    for (let i = 0; i < raw.members.length; i++) {
      const member = raw.members[i];
      if (!member || typeof member !== 'object') {
        return { valid: false, error: `Member at index ${i} must be an object` };
      }

      const m = member as Record<string, unknown>;
      const count = m.count !== undefined ? m.count : 1;

      if (typeof count !== 'number' || !Number.isInteger(count) || count < 1) {
        return { valid: false, error: `Member at index ${i} count must be an integer >= 1` };
      }

      const characterId =
        typeof m.characterId === 'string' && m.characterId.trim().length > 0
          ? m.characterId.trim()
          : null;
      const monsterId =
        typeof m.monsterId === 'string' && m.monsterId.trim().length > 0
          ? m.monsterId.trim()
          : null;
      const apiMonsterId =
        typeof m.apiMonsterId === 'string' && m.apiMonsterId.trim().length > 0
          ? m.apiMonsterId.trim()
          : null;

      if (!characterId && !monsterId && !apiMonsterId) {
        return {
          valid: false,
          error: `Member at index ${i} must specify at least one reference (characterId, monsterId, or apiMonsterId)`,
        };
      }

      validatedMembers.push({
        characterId,
        monsterId,
        apiMonsterId,
        count,
      });
    }
  }

  return {
    valid: true,
    data: {
      sessionId: (raw.sessionId as string).trim(),
      name,
      members: validatedMembers,
    },
  };
}

export type EncounterPrismaClient = Pick<
  PrismaClient,
  'encounterGroup' | 'encounterMember' | 'session' | '$transaction'
>;

const encounterInclude = {
  members: {
    include: {
      character: true,
      monster: true,
    },
  },
} as const;

/**
 * Returns all encounter groups for a session.
 */
export async function getEncountersBySession(
  sessionId: string,
  client: EncounterPrismaClient = defaultPrisma
) {
  return client.encounterGroup.findMany({
    where: { sessionId },
    include: encounterInclude,
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Finds a single encounter group by id. Returns null if not found.
 */
export async function getEncounterById(id: string, client: EncounterPrismaClient = defaultPrisma) {
  return client.encounterGroup.findUnique({
    where: { id },
    include: encounterInclude,
  });
}

/**
 * Creates a new encounter group with members for a given session.
 */
export async function createEncounter(
  input: CreateEncounterInput,
  client: EncounterPrismaClient = defaultPrisma
) {
  const validation = validateEncounterInput(input);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const { data } = validation;

  const session = await client.session.findUnique({
    where: { id: data.sessionId },
  });

  if (!session) {
    throw new Error('Session not found');
  }

  const memberCreateData = (data.members || []).map((m) => ({
    characterId: m.characterId ?? null,
    monsterId: m.monsterId ?? null,
    apiMonsterId: m.apiMonsterId ?? null,
    count: m.count ?? 1,
  }));

  return client.encounterGroup.create({
    data: {
      sessionId: data.sessionId,
      name: data.name,
      members: {
        create: memberCreateData,
      },
    },
    include: encounterInclude,
  });
}

/**
 * Updates encounter group name and atomically replaces its members.
 * Returns null if encounter not found.
 */
export async function updateEncounter(
  id: string,
  input: UpdateEncounterInput,
  client: EncounterPrismaClient = defaultPrisma
) {
  const existing = await client.encounterGroup.findUnique({
    where: { id },
  });

  if (!existing) {
    return null;
  }

  const updateData: Prisma.EncounterGroupUpdateInput = {};

  if (input.name !== undefined) {
    const trimmed = input.name.trim();
    if (trimmed.length === 0) {
      throw new Error('Encounter name cannot be empty');
    }
    if (trimmed.length > 100) {
      throw new Error('Encounter name cannot exceed 100 characters');
    }
    updateData.name = trimmed;
  }

  if (input.members !== undefined) {
    const memberCreateData = input.members.map((m, index) => {
      const count = m.count !== undefined ? m.count : 1;
      if (typeof count !== 'number' || !Number.isInteger(count) || count < 1) {
        throw new Error(`Member at index ${index} count must be an integer >= 1`);
      }
      if (!m.characterId && !m.monsterId && !m.apiMonsterId) {
        throw new Error(
          `Member at index ${index} must specify at least one reference (characterId, monsterId, or apiMonsterId)`
        );
      }
      return {
        characterId: m.characterId ?? null,
        monsterId: m.monsterId ?? null,
        apiMonsterId: m.apiMonsterId ?? null,
        count,
      };
    });

    return client.$transaction(async (tx) => {
      // Delete old members
      await (tx as unknown as EncounterPrismaClient).encounterMember.deleteMany({
        where: { groupId: id },
      });

      return (tx as unknown as EncounterPrismaClient).encounterGroup.update({
        where: { id },
        data: {
          ...updateData,
          members: {
            create: memberCreateData,
          },
        },
        include: encounterInclude,
      });
    });
  }

  return client.encounterGroup.update({
    where: { id },
    data: updateData,
    include: encounterInclude,
  });
}

/**
 * Deletes encounter group by id. Returns deleted record or null if not found.
 */
export async function deleteEncounter(id: string, client: EncounterPrismaClient = defaultPrisma) {
  const existing = await client.encounterGroup.findUnique({
    where: { id },
  });

  if (!existing) {
    return null;
  }

  return client.encounterGroup.delete({
    where: { id },
  });
}
