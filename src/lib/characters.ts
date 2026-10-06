import type { CharacterType, Prisma, PrismaClient } from '@prisma/client';
import {
  applyDamage,
  applyHealing,
  applyTempHp,
  type CharacterSpellSlots,
  calculateMaxHp,
  calculatePassivePerception,
  calculateSpellSlots,
  calculateUnarmoredAc,
  getClassHitDie,
  modifySpellSlot,
} from './dnd-rules';
import { prisma as defaultPrisma } from './prisma';

export interface CharacterStats {
  str?: number;
  dex?: number;
  con?: number;
  int?: number;
  wis?: number;
  cha?: number;
  tempHp?: number;
}

export interface CharacterSpells {
  slots?: CharacterSpellSlots;
  known?: string[];
  prepared?: string[];
}

export interface CreateCharacterInput {
  sessionId: string;
  name: string;
  type?: 'HERO' | 'NPC';
  race?: string | null;
  class?: string | null;
  level?: number;
  maxHp?: number;
  currentHp?: number;
  ac?: number;
  passivePerception?: number;
  stats?: CharacterStats | null;
  proficiencies?: string[] | Record<string, unknown> | null;
  traits?: string[] | null;
  inventory?: string[] | null;
  spells?: CharacterSpells | null;
}

export interface UpdateCharacterInput {
  name?: string;
  type?: 'HERO' | 'NPC';
  race?: string | null;
  class?: string | null;
  level?: number;
  maxHp?: number;
  currentHp?: number;
  ac?: number;
  passivePerception?: number;
  stats?: CharacterStats | null;
  proficiencies?: string[] | Record<string, unknown> | null;
  traits?: string[] | null;
  inventory?: string[] | null;
  spells?: CharacterSpells | null;
}

export interface UpdateCharacterHpPayload {
  action?: 'damage' | 'heal' | 'set_temp' | 'set_current';
  amount?: number;
  currentHp?: number;
  tempHp?: number;
  delta?: number;
  isTempHp?: boolean;
}

export interface UpdateCharacterSlotsPayload {
  slotLevel: number;
  action?: 'use' | 'recover' | 'set';
  value?: number;
  used?: number;
}

export interface CharacterValidationSuccess {
  valid: true;
  data: CreateCharacterInput;
}

export interface CharacterValidationError {
  valid: false;
  error: string;
}

export type CharacterValidationResult = CharacterValidationSuccess | CharacterValidationError;

/**
 * Validates character creation/update input according to D&D 5e domain rules.
 */
export function validateCharacterInput(input: unknown): CharacterValidationResult {
  if (!input || typeof input !== 'object') {
    return { valid: false, error: 'Character payload must be an object' };
  }

  const raw = input as Record<string, unknown>;

  if (!raw.sessionId || typeof raw.sessionId !== 'string' || raw.sessionId.trim().length === 0) {
    return { valid: false, error: 'sessionId is required and must be a valid string' };
  }

  if (!raw.name || typeof raw.name !== 'string' || raw.name.trim().length === 0) {
    return { valid: false, error: 'Character name is required and cannot be empty' };
  }

  const name = raw.name.trim();
  if (name.length > 100) {
    return { valid: false, error: 'Character name cannot exceed 100 characters' };
  }

  let type: 'HERO' | 'NPC' = 'HERO';
  if (raw.type !== undefined) {
    if (raw.type !== 'HERO' && raw.type !== 'NPC') {
      return { valid: false, error: "Character type must be either 'HERO' or 'NPC'" };
    }
    type = raw.type;
  }

  let level = 1;
  if (raw.level !== undefined) {
    if (
      typeof raw.level !== 'number' ||
      !Number.isInteger(raw.level) ||
      raw.level < 1 ||
      raw.level > 20
    ) {
      return { valid: false, error: 'Character level must be an integer between 1 and 20' };
    }
    level = raw.level;
  }

  if (raw.maxHp !== undefined) {
    if (typeof raw.maxHp !== 'number' || raw.maxHp < 1) {
      return { valid: false, error: 'maxHp must be a positive integer' };
    }
  }

  return {
    valid: true,
    data: {
      sessionId: (raw.sessionId as string).trim(),
      name,
      type,
      race: typeof raw.race === 'string' ? raw.race.trim() : null,
      class: typeof raw.class === 'string' ? raw.class.trim() : null,
      level,
      maxHp: typeof raw.maxHp === 'number' ? Math.floor(raw.maxHp) : undefined,
      currentHp: typeof raw.currentHp === 'number' ? Math.floor(raw.currentHp) : undefined,
      ac: typeof raw.ac === 'number' ? Math.floor(raw.ac) : undefined,
      passivePerception:
        typeof raw.passivePerception === 'number' ? Math.floor(raw.passivePerception) : undefined,
      stats: (raw.stats as CharacterStats) || null,
      proficiencies: (raw.proficiencies as string[]) || null,
      traits: (raw.traits as string[]) || null,
      inventory: (raw.inventory as string[]) || null,
      spells: (raw.spells as CharacterSpells) || null,
    },
  };
}

export type CharacterPrismaClient = Pick<PrismaClient, 'character' | 'session'>;

/**
 * Returns all characters for a specific session ordered by HERO then NPC, then name.
 */
export async function getCharactersBySession(
  sessionId: string,
  client: CharacterPrismaClient = defaultPrisma
) {
  return client.character.findMany({
    where: { sessionId },
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
  });
}

/**
 * Finds a single character by id. Returns null if not found.
 */
export async function getCharacterById(id: string, client: CharacterPrismaClient = defaultPrisma) {
  return client.character.findUnique({
    where: { id },
  });
}

/**
 * Creates a new character linked to sessionId with automatic D&D 5e calculation fallbacks.
 */
export async function createCharacter(
  input: CreateCharacterInput,
  client: CharacterPrismaClient = defaultPrisma
) {
  const validation = validateCharacterInput(input);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const { data } = validation;

  // Verify session exists
  const session = await client.session.findUnique({
    where: { id: data.sessionId },
  });

  if (!session) {
    throw new Error('Session not found');
  }

  const conScore = data.stats?.con ?? 10;
  const dexScore = data.stats?.dex ?? 10;
  const wisScore = data.stats?.wis ?? 10;

  const hitDie = getClassHitDie(data.class ?? undefined);
  const maxHp = data.maxHp ?? calculateMaxHp(hitDie, conScore, data.level ?? 1);
  const currentHp = data.currentHp ?? maxHp;
  const ac = data.ac ?? calculateUnarmoredAc(dexScore);
  const passivePerception = data.passivePerception ?? calculatePassivePerception(wisScore);

  const initialStats: CharacterStats = {
    str: 10,
    dex: 10,
    con: 10,
    int: 10,
    wis: 10,
    cha: 10,
    tempHp: 0,
    ...(data.stats || {}),
  };

  let spellsPayload: CharacterSpells | null = data.spells || null;
  if (!spellsPayload && data.class) {
    const slots = calculateSpellSlots(data.class, data.level ?? 1);
    if (Object.keys(slots).length > 0) {
      spellsPayload = { slots, known: [], prepared: [] };
    }
  }

  return client.character.create({
    data: {
      sessionId: data.sessionId,
      name: data.name,
      type: data.type as CharacterType,
      race: data.race,
      class: data.class,
      level: data.level ?? 1,
      maxHp,
      currentHp,
      ac,
      passivePerception,
      stats: initialStats as unknown as Prisma.InputJsonValue,
      proficiencies: (data.proficiencies || []) as unknown as Prisma.InputJsonValue,
      traits: (data.traits || []) as unknown as Prisma.InputJsonValue,
      inventory: (data.inventory || []) as unknown as Prisma.InputJsonValue,
      spells: (spellsPayload || {}) as unknown as Prisma.InputJsonValue,
    },
  });
}

/**
 * Updates a character's properties. Returns null if not found.
 */
export async function updateCharacter(
  id: string,
  data: UpdateCharacterInput,
  client: CharacterPrismaClient = defaultPrisma
) {
  const existing = await client.character.findUnique({
    where: { id },
  });

  if (!existing) {
    return null;
  }

  const updateData: Prisma.CharacterUpdateInput = {};

  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.type !== undefined) updateData.type = data.type as CharacterType;
  if (data.race !== undefined) updateData.race = data.race;
  if (data.class !== undefined) updateData.class = data.class;
  if (data.level !== undefined) updateData.level = data.level;
  if (data.maxHp !== undefined) updateData.maxHp = data.maxHp;
  if (data.currentHp !== undefined) updateData.currentHp = data.currentHp;
  if (data.ac !== undefined) updateData.ac = data.ac;
  if (data.passivePerception !== undefined) updateData.passivePerception = data.passivePerception;

  if (data.stats !== undefined) {
    const currentStats = (existing.stats as CharacterStats) || {};
    updateData.stats = { ...currentStats, ...data.stats } as unknown as Prisma.InputJsonValue;
  }

  if (data.proficiencies !== undefined) {
    updateData.proficiencies = data.proficiencies as unknown as Prisma.InputJsonValue;
  }

  if (data.traits !== undefined) {
    updateData.traits = data.traits as unknown as Prisma.InputJsonValue;
  }

  if (data.inventory !== undefined) {
    updateData.inventory = data.inventory as unknown as Prisma.InputJsonValue;
  }

  if (data.spells !== undefined) {
    updateData.spells = data.spells as unknown as Prisma.InputJsonValue;
  }

  return client.character.update({
    where: { id },
    data: updateData,
  });
}

/**
 * Rapid HP mutation: supports damage, healing, temporary HP, and explicit deltas.
 */
export async function updateCharacterHp(
  id: string,
  payload: UpdateCharacterHpPayload,
  client: CharacterPrismaClient = defaultPrisma
) {
  const existing = await client.character.findUnique({
    where: { id },
  });

  if (!existing) {
    return null;
  }

  const currentHp = existing.currentHp;
  const maxHp = existing.maxHp;
  const stats = (existing.stats as CharacterStats) || {};
  const currentTempHp = stats.tempHp || 0;

  let nextCurrentHp = currentHp;
  let nextTempHp = currentTempHp;

  if (payload.action) {
    const amount = payload.amount ?? 0;
    switch (payload.action) {
      case 'damage': {
        const result = applyDamage(currentHp, maxHp, currentTempHp, amount);
        nextCurrentHp = result.currentHp;
        nextTempHp = result.tempHp;
        break;
      }
      case 'heal': {
        const result = applyHealing(currentHp, maxHp, currentTempHp, amount);
        nextCurrentHp = result.currentHp;
        nextTempHp = result.tempHp;
        break;
      }
      case 'set_temp': {
        const result = applyTempHp(currentHp, maxHp, currentTempHp, amount);
        nextCurrentHp = result.currentHp;
        nextTempHp = result.tempHp;
        break;
      }
      case 'set_current': {
        nextCurrentHp = Math.min(maxHp, Math.max(0, amount));
        break;
      }
    }
  } else if (payload.delta !== undefined) {
    if (payload.isTempHp) {
      nextTempHp = Math.max(0, currentTempHp + payload.delta);
    } else if (payload.delta < 0) {
      const result = applyDamage(currentHp, maxHp, currentTempHp, -payload.delta);
      nextCurrentHp = result.currentHp;
      nextTempHp = result.tempHp;
    } else {
      const result = applyHealing(currentHp, maxHp, currentTempHp, payload.delta);
      nextCurrentHp = result.currentHp;
      nextTempHp = result.tempHp;
    }
  } else {
    if (payload.currentHp !== undefined) {
      nextCurrentHp = Math.min(maxHp, Math.max(0, payload.currentHp));
    }
    if (payload.tempHp !== undefined) {
      nextTempHp = Math.max(0, payload.tempHp);
    }
  }

  const updatedStats = {
    ...stats,
    tempHp: nextTempHp,
  };

  return client.character.update({
    where: { id },
    data: {
      currentHp: nextCurrentHp,
      stats: updatedStats as unknown as Prisma.InputJsonValue,
    },
  });
}

/**
 * Rapid Spell Slots mutation: supports using, recovering, or setting slots.
 */
export async function updateCharacterSpellSlots(
  id: string,
  payload: UpdateCharacterSlotsPayload,
  client: CharacterPrismaClient = defaultPrisma
) {
  const existing = await client.character.findUnique({
    where: { id },
  });

  if (!existing) {
    return null;
  }

  const spells = (existing.spells as CharacterSpells) || {};
  const currentSlots: CharacterSpellSlots =
    spells.slots || calculateSpellSlots(existing.class ?? undefined, existing.level);

  let updatedSlots = { ...currentSlots };

  if (payload.used !== undefined) {
    updatedSlots = modifySpellSlot(currentSlots, payload.slotLevel, 'set', payload.used);
  } else if (payload.action) {
    updatedSlots = modifySpellSlot(currentSlots, payload.slotLevel, payload.action, payload.value);
  }

  return client.character.update({
    where: { id },
    data: {
      spells: {
        ...spells,
        slots: updatedSlots,
      } as unknown as Prisma.InputJsonValue,
    },
  });
}

/**
 * Deletes a character by id. Returns deleted record or null if not found.
 */
export async function deleteCharacter(id: string, client: CharacterPrismaClient = defaultPrisma) {
  const existing = await client.character.findUnique({
    where: { id },
  });

  if (!existing) {
    return null;
  }

  return client.character.delete({
    where: { id },
  });
}
