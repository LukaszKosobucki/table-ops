export interface Combatant {
  id: string;
  name: string;
  initiative: number;
  currentHp: number;
  maxHp: number;
  ac: number;
  isMonster: boolean;
  type?: string;
  conditions: string[];
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
