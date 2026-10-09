export type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';

export interface DiceGroup {
  type: DiceType;
  count: number;
}

export type AdvantageMode = 'none' | 'advantage' | 'disadvantage';

export interface RollRequest {
  id: string;
  dice: DiceGroup[];
  modifier: number;
  advantageMode?: AdvantageMode;
  isSecret: boolean;
  sourceContext?: {
    characterId?: string;
    actionName?: string;
  };
}

export interface SingleDieResult {
  id?: string;
  type: DiceType;
  value: number;
  ignored?: boolean;
}

export interface RollResult {
  id: string;
  requestId: string;
  timestamp: string;
  diceResults: SingleDieResult[];
  modifier: number;
  total: number;
  formula: string;
  isSecret: boolean;
  actorName: string;
  advantageMode?: AdvantageMode;
  sourceContext?: {
    characterId?: string;
    actionName?: string;
  };
}

export interface DiceMetadata {
  type: DiceType;
  sides: number;
  label: string;
  colorHex: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
}

export const DICE_CONFIG: Record<DiceType, DiceMetadata> = {
  d4: {
    type: 'd4',
    sides: 4,
    label: 'k4',
    colorHex: '#06b6d4',
    badgeBg: 'bg-cyan-500/20',
    badgeText: 'text-cyan-300',
    borderColor: 'border-cyan-500/40',
  },
  d6: {
    type: 'd6',
    sides: 6,
    label: 'k6',
    colorHex: '#22c55e',
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-300',
    borderColor: 'border-emerald-500/40',
  },
  d8: {
    type: 'd8',
    sides: 8,
    label: 'k8',
    colorHex: '#a855f7',
    badgeBg: 'bg-purple-500/20',
    badgeText: 'text-purple-300',
    borderColor: 'border-purple-500/40',
  },
  d10: {
    type: 'd10',
    sides: 10,
    label: 'k10',
    colorHex: '#eab308',
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-amber-300',
    borderColor: 'border-amber-500/40',
  },
  d12: {
    type: 'd12',
    sides: 12,
    label: 'k12',
    colorHex: '#f97316',
    badgeBg: 'bg-orange-500/20',
    badgeText: 'text-orange-300',
    borderColor: 'border-orange-500/40',
  },
  d20: {
    type: 'd20',
    sides: 20,
    label: 'k20',
    colorHex: '#ef4444',
    badgeBg: 'bg-rose-500/20',
    badgeText: 'text-rose-300',
    borderColor: 'border-rose-500/40',
  },
  d100: {
    type: 'd100',
    sides: 100,
    label: 'k100',
    colorHex: '#64748b',
    badgeBg: 'bg-slate-500/20',
    badgeText: 'text-slate-300',
    borderColor: 'border-slate-500/40',
  },
};

export const DICE_ORDER: DiceType[] = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'];
