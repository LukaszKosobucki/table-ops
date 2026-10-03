/**
 * TableOps Design System & Theme Utilities
 * Single source of truth for semantic role colors, status helpers, and Tailwind theme tokens.
 */

export const THEME_COLORS = {
  // Surfaces
  appBg: '#090d16',
  surfacePanel: '#0d1322',
  surfaceCard: '#131b2e',
  surfaceCardHover: '#1c2742',
  surfaceElevated: '#1e293b',

  // Brand
  brandPrimary: '#6366f1', // Indigo
  brandAccent: '#d97706',  // Amber

  // Roles
  hero: '#10b981',    // Emerald
  npc: '#f59e0b',     // Amber
  monster: '#f43f5e', // Rose

  // Health Statuses
  healthy: '#10b981',  // > 50%
  bloodied: '#f59e0b', // <= 50%
  critical: '#f97316', // <= 20%
  dead: '#e11d48',     // 0 HP

  // Combat Turn Indicators
  turnActive: '#fbbf24',
  turnNext: '#818cf8',

  // Timeline / Logs
  logRest: '#c084fc',
  logCombat: '#fb7185',
  logSpell: '#38bdf8',
  logAction: '#fbbf24',
} as const;

export type EntityRole = 'HERO' | 'NPC' | 'MONSTER';
export type HealthState = 'HEALTHY' | 'BLOODIED' | 'CRITICAL' | 'DEAD';
export type SessionLogType = 'REST_SHORT' | 'REST_LONG' | 'COMBAT_END' | 'SPELL_CAST' | 'COMBAT_ACTION';

/**
 * Calculates current health tier and returns semantic styling classes.
 */
export function getHealthStatus(currentHp: number, maxHp: number): {
  state: HealthState;
  label: string;
  dotClass: string;
  badgeClass: string;
  fillClass: string;
  textClass: string;
  isDead: boolean;
} {
  if (currentHp <= 0) {
    return {
      state: 'DEAD',
      label: 'Nieprzytomny / Martwy',
      dotClass: 'bg-status-dead shadow-rose-500/50',
      badgeClass: 'bg-rose-500/10 text-rose-400 border border-rose-500/30',
      fillClass: 'bg-status-dead',
      textClass: 'text-rose-400',
      isDead: true,
    };
  }

  const ratio = maxHp > 0 ? currentHp / maxHp : 1;

  if (ratio <= 0.2) {
    return {
      state: 'CRITICAL',
      label: 'Krytyczny',
      dotClass: 'bg-status-critical shadow-orange-500/50 animate-pulse',
      badgeClass: 'bg-orange-500/10 text-orange-400 border border-orange-500/30',
      fillClass: 'bg-status-critical',
      textClass: 'text-orange-400',
      isDead: false,
    };
  }

  if (ratio <= 0.5) {
    return {
      state: 'BLOODIED',
      label: 'Ranny',
      dotClass: 'bg-status-bloodied shadow-amber-500/50',
      badgeClass: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
      fillClass: 'bg-status-bloodied',
      textClass: 'text-amber-400',
      isDead: false,
    };
  }

  return {
    state: 'HEALTHY',
    label: 'Zdolny do walki',
    dotClass: 'bg-status-healthy shadow-emerald-500/50',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
    fillClass: 'bg-status-healthy',
    textClass: 'text-emerald-400',
    isDead: false,
  };
}

/**
 * Returns role-specific badge styling and display label.
 */
export function getRoleBadge(role: EntityRole): { label: string; badgeClass: string } {
  switch (role) {
    case 'HERO':
      return { label: 'Bohater Gracza', badgeClass: 'badge-hero' };
    case 'NPC':
      return { label: 'Ważny NPC', badgeClass: 'badge-npc' };
    case 'MONSTER':
      return { label: 'Przeciwnik / Potwór', badgeClass: 'badge-monster' };
  }
}

/**
 * Returns timeline log badge styling and metadata.
 */
export function getLogTypeBadge(type: SessionLogType): { label: string; badgeClass: string } {
  switch (type) {
    case 'REST_SHORT':
      return {
        label: 'Krótki Odpoczynek',
        badgeClass: 'bg-purple-500/10 text-purple-300 border border-purple-500/30',
      };
    case 'REST_LONG':
      return {
        label: 'Długi Odpoczynek',
        badgeClass: 'bg-purple-500/20 text-purple-200 border border-purple-400/40 font-semibold',
      };
    case 'COMBAT_END':
      return {
        label: 'Koniec Potyczki',
        badgeClass: 'bg-rose-500/10 text-rose-400 border border-rose-500/30',
      };
    case 'SPELL_CAST':
      return {
        label: 'Rzucenie Zaklęcia',
        badgeClass: 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30',
      };
    case 'COMBAT_ACTION':
      return {
        label: 'Akcja w Walce',
        badgeClass: 'bg-amber-500/10 text-amber-300 border border-amber-500/30',
      };
  }
}
