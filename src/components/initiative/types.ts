export type CombatPhase = 'PREPARING' | 'ACTIVE' | 'FINISHED';

export interface CombatStatusItem {
  id: string;
  statusName: string;
  durationTurns: number;
}

export interface DeathSaveState {
  successes: number;
  failures: number;
  isStabilized?: boolean;
  isDead?: boolean;
}

export interface Combatant {
  id: string;
  characterId?: string | null;
  monsterId?: string | null;
  apiMonsterId?: string | null;
  name: string;
  initiative: number;
  currentHp: number;
  maxHp: number;
  ac: number;
  isMonster: boolean;
  type?: string;
  conditions: string[];
  statuses?: CombatStatusItem[];
  order?: number;
  avatarUrl?: string | null;
  xp?: number;
  isFled?: boolean;
  deathSaves?: DeathSaveState;
}

export interface CombatLogEntry {
  id: string;
  timestamp: string;
  text: string;
  type?:
    | 'turn'
    | 'damage'
    | 'heal'
    | 'status'
    | 'system'
    | 'spell'
    | 'action'
    | 'flee'
    | 'death_save';
  actorName?: string;
  actorIsMonster?: boolean;
  actorAvatar?: string;
  targetName?: string;
  targetIsMonster?: boolean;
  spellLevel?: number;
}

export const AVAILABLE_CONDITIONS = [
  'Poisoned',
  'Prone',
  'Stunned',
  'Blinded',
  'Paralyzed',
  'Charmed',
  'Frightened',
  'Grappled',
  'Invisible',
  'Restrained',
  'Exhaustion',
  'Deafened',
] as const;
