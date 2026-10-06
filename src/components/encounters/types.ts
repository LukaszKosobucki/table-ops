import type { EncounterDifficulty, XpThresholds } from '@/lib/dnd-rules';

export interface EncounterMemberDraft {
  monsterIndex: string;
  monsterName: string;
  count: number;
  cr: number;
  xp: number;
  hp: number;
  ac: number;
  monsterId?: string | null;
}

export interface SavedEncounterMember {
  id: string;
  groupId: string;
  characterId: string | null;
  monsterId: string | null;
  apiMonsterId: string | null;
  count: number;
  monster?: {
    id?: string;
    index?: string;
    name?: string;
    challengeRating?: number;
    xp?: number;
    hitPoints?: number;
    armorClass?: number;
    stats?: {
      str?: number;
      dex?: number;
      con?: number;
      int?: number;
      wis?: number;
      cha?: number;
    } | null;
  } | null;
  character?: {
    id?: string;
    name?: string;
    level?: number;
  } | null;
}

export interface SavedEncounter {
  id: string;
  sessionId: string;
  name: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  members: SavedEncounterMember[];
}

export interface EncounterDifficultyInfo {
  difficulty: EncounterDifficulty;
  totalXp: number;
  adjustedXp: number;
  multiplier: number;
  thresholds: XpThresholds;
}
