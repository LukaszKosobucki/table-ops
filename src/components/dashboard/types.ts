export type HealthStatus = 'healthy' | 'bloodied' | 'critical' | 'dead';

export interface DashboardCharacter {
  id: string;
  sessionId?: string | null;
  name: string;
  type: 'HERO' | 'NPC';
  race?: string | null;
  class?: string | null;
  level?: number;
  currentHp: number;
  maxHp: number;
  ac: number;
  passivePerception: number;
  stats?: {
    str?: number;
    dex?: number;
    con?: number;
    int?: number;
    wis?: number;
    cha?: number;
    tempHp?: number;
    xp?: number;
  } | null;
  traits?: string[] | null;
  inventory?: string[] | null;
  spells?: {
    slots?: Record<number, { max: number; used: number }>;
    known?: string[];
    prepared?: string[];
  } | null;
}

export type SessionLogType =
  | 'REST_SHORT'
  | 'REST_LONG'
  | 'COMBAT_END'
  | 'SPELL_CAST'
  | 'COMBAT_ACTION'
  | 'CUSTOM_NOTE';

export interface DashboardLog {
  id: string;
  sessionId: string;
  combatId?: string | null;
  logType: SessionLogType;
  description: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string | Date;
}

export type CenterWorkspaceView =
  | 'combat'
  | 'character-inspect'
  | 'log-inspect'
  | 'encounter-builder';
export type MobileDashboardTab = 'party' | 'workspace' | 'timeline';
