import { CharacterType, CombatStatusEnum, type Prisma, SessionLogType } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { prisma } from './prisma';

describe('Prisma Schema and Generated Client (Chunk 0.1)', () => {
  it('exports required enums with correct values', () => {
    expect(CharacterType.HERO).toBe('HERO');
    expect(CharacterType.NPC).toBe('NPC');

    expect(CombatStatusEnum.PREPARING).toBe('PREPARING');
    expect(CombatStatusEnum.ACTIVE).toBe('ACTIVE');
    expect(CombatStatusEnum.FINISHED).toBe('FINISHED');

    expect(SessionLogType.REST_SHORT).toBe('REST_SHORT');
    expect(SessionLogType.REST_LONG).toBe('REST_LONG');
    expect(SessionLogType.COMBAT_END).toBe('COMBAT_END');
    expect(SessionLogType.SPELL_CAST).toBe('SPELL_CAST');
    expect(SessionLogType.COMBAT_ACTION).toBe('COMBAT_ACTION');
    expect(SessionLogType.CUSTOM_NOTE).toBe('CUSTOM_NOTE');
    expect(SessionLogType.DICE_ROLL).toBe('DICE_ROLL');
  });

  it('exposes all expected model delegates on the prisma client', () => {
    expect(prisma.session).toBeDefined();
    expect(prisma.character).toBeDefined();
    expect(prisma.encounterGroup).toBeDefined();
    expect(prisma.encounterMember).toBeDefined();
    expect(prisma.combat).toBeDefined();
    expect(prisma.combatant).toBeDefined();
    expect(prisma.combatStatus).toBeDefined();
    expect(prisma.sessionLog).toBeDefined();
    expect(prisma.monster).toBeDefined();
    expect(prisma.spell).toBeDefined();
    expect(prisma.item).toBeDefined();
  });

  it('supports strong typing for session creation input', () => {
    const sessionInput: Prisma.SessionCreateInput = {
      name: 'Wyprawa do Podmroku',
      userId: 'user-uuid-123',
      googleDocUrl: 'https://docs.google.com/document/d/123/edit',
    };
    expect(sessionInput.name).toBe('Wyprawa do Podmroku');
    expect(sessionInput.userId).toBe('user-uuid-123');
    expect(sessionInput.googleDocUrl).toBe('https://docs.google.com/document/d/123/edit');

    const characterInput: Prisma.CharacterCreateWithoutSessionInput = {
      name: 'Aelar',
      type: CharacterType.HERO,
      class: 'Wizard',
      level: 5,
      maxHp: 28,
      currentHp: 28,
      ac: 12,
      passivePerception: 14,
      stats: { str: 8, dex: 14, con: 12, int: 18, wis: 13, cha: 10 },
      spells: { slots: { '1': { total: 4, used: 0 } } },
    };
    expect(characterInput.type).toBe('HERO');
    expect(characterInput.level).toBe(5);
  });
});
