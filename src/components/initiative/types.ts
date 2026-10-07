export type CombatPhase = 'PREPARING' | 'ACTIVE' | 'FINISHED';

export interface CombatStatusItem {
  id: string;
  statusName: string;
  durationTurns: number;
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
}

export interface CombatLogEntry {
  id: string;
  timestamp: string;
  text: string;
  type?: 'turn' | 'damage' | 'heal' | 'status' | 'system';
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
