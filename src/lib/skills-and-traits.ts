import { getAbilityModifier } from './dnd-rules';

export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

export type SkillProficiencyLevel = 'none' | 'proficient' | 'expertise';

export type SkillKey =
  | 'athletics'
  | 'acrobatics'
  | 'sleight_of_hand'
  | 'stealth'
  | 'arcana'
  | 'history'
  | 'investigation'
  | 'nature'
  | 'religion'
  | 'animal_handling'
  | 'insight'
  | 'medicine'
  | 'perception'
  | 'survival'
  | 'deception'
  | 'intimidation'
  | 'performance'
  | 'persuasion';

export interface SkillDefinition {
  key: SkillKey;
  name: string;
  nameEn: string;
  ability: AbilityKey;
  abilityLabel: string;
}

export const DND_SKILLS: SkillDefinition[] = [
  // Siła (STR)
  { key: 'athletics', name: 'Atletyka', nameEn: 'Athletics', ability: 'str', abilityLabel: 'STR' },

  // Zręczność (DEX)
  {
    key: 'acrobatics',
    name: 'Akrobatyka',
    nameEn: 'Acrobatics',
    ability: 'dex',
    abilityLabel: 'DEX',
  },
  {
    key: 'sleight_of_hand',
    name: 'Zwinne dłonie',
    nameEn: 'Sleight of Hand',
    ability: 'dex',
    abilityLabel: 'DEX',
  },
  { key: 'stealth', name: 'Skradanie', nameEn: 'Stealth', ability: 'dex', abilityLabel: 'DEX' },

  // Inteligencja (INT)
  { key: 'arcana', name: 'Wiedza tajemna', nameEn: 'Arcana', ability: 'int', abilityLabel: 'INT' },
  { key: 'history', name: 'Historia', nameEn: 'History', ability: 'int', abilityLabel: 'INT' },
  {
    key: 'investigation',
    name: 'Śledztwo',
    nameEn: 'Investigation',
    ability: 'int',
    abilityLabel: 'INT',
  },
  { key: 'nature', name: 'Przyroda', nameEn: 'Nature', ability: 'int', abilityLabel: 'INT' },
  { key: 'religion', name: 'Religia', nameEn: 'Religion', ability: 'int', abilityLabel: 'INT' },

  // Mądrość (WIS)
  {
    key: 'animal_handling',
    name: 'Opieka nad zwierzętami',
    nameEn: 'Animal Handling',
    ability: 'wis',
    abilityLabel: 'WIS',
  },
  {
    key: 'insight',
    name: 'Wyczucie pobudek',
    nameEn: 'Insight',
    ability: 'wis',
    abilityLabel: 'WIS',
  },
  { key: 'medicine', name: 'Medycyna', nameEn: 'Medicine', ability: 'wis', abilityLabel: 'WIS' },
  {
    key: 'perception',
    name: 'Percepcja',
    nameEn: 'Perception',
    ability: 'wis',
    abilityLabel: 'WIS',
  },
  {
    key: 'survival',
    name: 'Sztuka przetrwania',
    nameEn: 'Survival',
    ability: 'wis',
    abilityLabel: 'WIS',
  },

  // Charyzma (CHA)
  { key: 'deception', name: 'Oszustwo', nameEn: 'Deception', ability: 'cha', abilityLabel: 'CHA' },
  {
    key: 'intimidation',
    name: 'Zastraszanie',
    nameEn: 'Intimidation',
    ability: 'cha',
    abilityLabel: 'CHA',
  },
  {
    key: 'performance',
    name: 'Występy',
    nameEn: 'Performance',
    ability: 'cha',
    abilityLabel: 'CHA',
  },
  {
    key: 'persuasion',
    name: 'Perswazja',
    nameEn: 'Persuasion',
    ability: 'cha',
    abilityLabel: 'CHA',
  },
];

/**
 * Calculates skill modifier based on ability score, proficiency level, and proficiency bonus.
 */
export function calculateSkillModifier(
  abilityScore: number,
  proficiencyLevel: SkillProficiencyLevel = 'none',
  proficiencyBonus: number = 2
): number {
  const baseMod = getAbilityModifier(abilityScore);
  if (proficiencyLevel === 'expertise') {
    return baseMod + 2 * proficiencyBonus;
  }
  if (proficiencyLevel === 'proficient') {
    return baseMod + proficiencyBonus;
  }
  return baseMod;
}

export interface DamageTypeDefinition {
  key: string;
  name: string;
  nameEn: string;
}

export const DAMAGE_TYPES: DamageTypeDefinition[] = [
  { key: 'fire', name: 'Ogień', nameEn: 'Fire' },
  { key: 'cold', name: 'Zimno', nameEn: 'Cold' },
  { key: 'acid', name: 'Kwas', nameEn: 'Acid' },
  { key: 'lightning', name: 'Błyskawice', nameEn: 'Lightning' },
  { key: 'thunder', name: 'Grzmot', nameEn: 'Thunder' },
  { key: 'poison', name: 'Trucizna', nameEn: 'Poison' },
  { key: 'necrotic', name: 'Nekrotyczne', nameEn: 'Necrotic' },
  { key: 'radiant', name: 'Promienne', nameEn: 'Radiant' },
  { key: 'force', name: 'Moc', nameEn: 'Force' },
  { key: 'psychic', name: 'Psychiczne', nameEn: 'Psychic' },
  { key: 'slashing', name: 'Cięte', nameEn: 'Slashing' },
  { key: 'piercing', name: 'Kłute', nameEn: 'Piercing' },
  { key: 'bludgeoning', name: 'Obuchowe', nameEn: 'Bludgeoning' },
];

export interface ConditionDefinition {
  key: string;
  name: string;
  nameEn: string;
}

export const COMMON_CONDITIONS: ConditionDefinition[] = [
  { key: 'frightened', name: 'Przerażenie', nameEn: 'Frightened' },
  { key: 'unconscious', name: 'Nieprzytomność', nameEn: 'Unconscious' },
  { key: 'paralyzed', name: 'Paraliż', nameEn: 'Paralyzed' },
  { key: 'prone', name: 'Powalenie', nameEn: 'Prone' },
  { key: 'stunned', name: 'Ogłuszenie', nameEn: 'Stunned' },
  { key: 'charmed', name: 'Zauroczenie', nameEn: 'Charmed' },
  { key: 'blinded', name: 'Oślepienie', nameEn: 'Blinded' },
  { key: 'poisoned', name: 'Zatrucie', nameEn: 'Poisoned' },
  { key: 'incapacitated', name: 'Obezwładnienie', nameEn: 'Incapacitated' },
  { key: 'restrained', name: 'Unieruchomienie', nameEn: 'Restrained' },
  { key: 'petrified', name: 'Skamienienie', nameEn: 'Petrified' },
  { key: 'grappled', name: 'Pochwycenie', nameEn: 'Grappled' },
  { key: 'exhaustion', name: 'Wyczerpanie', nameEn: 'Exhaustion' },
];

export const COMMON_SENSES = [
  'Widzenie w ciemności 18m (Darkvision 60ft)',
  'Widzenie w ciemności 36m (Darkvision 120ft)',
  'Ślepowidzenie 9m (Blindsight 30ft)',
  'Ślepowidzenie 18m (Blindsight 60ft)',
  'Prawdziwe widzenie 36m (Truesight 120ft)',
  'Czucie drgań 18m (Tremorsense 60ft)',
];

export interface CombatantDefenses {
  resistances: string[];
  damageImmunities: string[];
  conditionImmunities: string[];
  senses: string[];
}

function translateDamageType(raw: string): string {
  const lower = raw.trim().toLowerCase();
  const matched = DAMAGE_TYPES.find(
    (d) => d.key === lower || d.name.toLowerCase() === lower || d.nameEn.toLowerCase() === lower
  );
  if (matched) {
    return `${matched.name} (${matched.nameEn})`;
  }
  return raw;
}

function translateCondition(raw: string): string {
  const lower = raw.trim().toLowerCase();
  const matched = COMMON_CONDITIONS.find(
    (c) => c.key === lower || c.name.toLowerCase() === lower || c.nameEn.toLowerCase() === lower
  );
  if (matched) {
    return `${matched.name} (${matched.nameEn})`;
  }
  return raw;
}

export interface RawMonsterDefensesData {
  damage_resistances?: string[];
  damage_immunities?: string[];
  condition_immunities?: Array<{ name?: string } | string>;
  senses?: Record<string, string | number> | string;
}

/**
 * Extracts resistances, damage immunities, condition immunities, and senses from monster data.
 */
export function extractMonsterDefenses(monster: {
  rawData?: RawMonsterDefensesData | unknown;
  damageResistances?: string[];
  damageImmunities?: string[];
  conditionImmunities?: string[];
  senses?: string[];
}): CombatantDefenses {
  const resistances: string[] = [];
  const damageImmunities: string[] = [];
  const conditionImmunities: string[] = [];
  const senses: string[] = [];

  // Direct properties fallback
  if (Array.isArray(monster.damageResistances)) {
    resistances.push(...monster.damageResistances.map(translateDamageType));
  }
  if (Array.isArray(monster.damageImmunities)) {
    damageImmunities.push(...monster.damageImmunities.map(translateDamageType));
  }
  if (Array.isArray(monster.conditionImmunities)) {
    conditionImmunities.push(...monster.conditionImmunities.map(translateCondition));
  }
  if (Array.isArray(monster.senses)) {
    senses.push(...monster.senses);
  }

  // Parse from rawData if available
  const raw =
    monster.rawData && typeof monster.rawData === 'object'
      ? (monster.rawData as RawMonsterDefensesData)
      : undefined;
  if (raw) {
    if (Array.isArray(raw.damage_resistances)) {
      for (const res of raw.damage_resistances) {
        const translated = translateDamageType(res);
        if (!resistances.includes(translated)) resistances.push(translated);
      }
    }

    if (Array.isArray(raw.damage_immunities)) {
      for (const imm of raw.damage_immunities) {
        const translated = translateDamageType(imm);
        if (!damageImmunities.includes(translated)) damageImmunities.push(translated);
      }
    }

    if (Array.isArray(raw.condition_immunities)) {
      for (const cond of raw.condition_immunities) {
        const name = typeof cond === 'string' ? cond : cond.name || '';
        if (name) {
          const translated = translateCondition(name);
          if (!conditionImmunities.includes(translated)) conditionImmunities.push(translated);
        }
      }
    }

    if (raw.senses) {
      if (typeof raw.senses === 'object') {
        for (const [k, v] of Object.entries(raw.senses)) {
          if (k === 'passive_perception') continue;
          const capitalized = k.charAt(0).toUpperCase() + k.slice(1);
          const senseStr = `${capitalized}: ${v}`;
          if (!senses.includes(senseStr)) senses.push(senseStr);
        }
      } else if (typeof raw.senses === 'string') {
        senses.push(raw.senses);
      }
    }
  }

  return {
    resistances,
    damageImmunities,
    conditionImmunities,
    senses,
  };
}

/**
 * Extracts defenses from character structure (e.g. character.defenses or character.proficiencies).
 */
export function extractCharacterDefenses(character: {
  defenses?: Partial<CombatantDefenses>;
  proficiencies?:
    | {
        defenses?: Partial<CombatantDefenses>;
      }
    | unknown;
}): CombatantDefenses {
  const src =
    character.defenses ||
    (character.proficiencies &&
    typeof character.proficiencies === 'object' &&
    'defenses' in character.proficiencies
      ? (character.proficiencies as { defenses?: Partial<CombatantDefenses> }).defenses
      : undefined);

  return {
    resistances: Array.isArray(src?.resistances) ? [...src.resistances] : [],
    damageImmunities: Array.isArray(src?.damageImmunities) ? [...src.damageImmunities] : [],
    conditionImmunities: Array.isArray(src?.conditionImmunities)
      ? [...src.conditionImmunities]
      : [],
    senses: Array.isArray(src?.senses) ? [...src.senses] : [],
  };
}
