/**
 * TableOps Design System & Theme Utilities
 * Accurately calibrated to the authentic dark tabletop fantasy styling of TableOps:
 * Deep slate backgrounds (#090d16, slate-900, slate-950), rich amber accents, and indigo magic.
 */

export const THEME_COLORS = {
  // Surfaces
  appBg: '#090d16',
  surfacePanel: 'rgba(15, 23, 42, 0.75)', // slate-900 with glass blur
  surfaceCard: 'rgba(15, 23, 42, 0.6)',
  surfaceElevated: '#020617', // slate-950

  // Brand Accents
  brandPrimary: '#6366f1', // Indigo 500
  brandPrimaryDark: '#4f46e5', // Indigo 600
  brandAccent: '#f59e0b', // Amber 500
  brandAccentGold: '#fbbf24', // Amber 400

  // Roles
  hero: '#818cf8', // Indigo 400
  npc: '#fbbf24', // Amber 400
  monster: '#f87171', // Red 400

  // Health Statuses
  healthy: '#34d399', // Emerald 400
  bloodied: '#fbbf24', // Amber 400
  critical: '#fb923c', // Orange 400
  dead: '#f87171', // Red 400

  // Combat Turn Indicators
  turnActiveBorder: '#6366f1', // Indigo 500
  turnActiveTab: '#f59e0b', // Amber 500
} as const;

export type EntityRole = 'HERO' | 'NPC' | 'MONSTER';
export type HealthState = 'HEALTHY' | 'BLOODIED' | 'CRITICAL' | 'DEAD';

/**
 * Calculates current health tier and returns semantic styling classes matching the original TableOps UI.
 */
export function getHealthStatus(currentHp: number, maxHp: number): {
  state: HealthState;
  label: string;
  badgeClass: string;
  fillClass: string;
  textClass: string;
  isDead: boolean;
} {
  if (currentHp <= 0) {
    return {
      state: 'DEAD',
      label: 'Nieprzytomny / Martwy',
      badgeClass: 'bg-red-950/80 text-red-400 border border-red-900/60',
      fillClass: 'bg-red-600',
      textClass: 'text-red-400',
      isDead: true,
    };
  }

  const ratio = maxHp > 0 ? currentHp / maxHp : 1;

  if (ratio <= 0.2) {
    return {
      state: 'CRITICAL',
      label: 'Krytyczny',
      badgeClass: 'bg-orange-950/80 text-orange-400 border border-orange-900/60 animate-pulse',
      fillClass: 'bg-orange-500',
      textClass: 'text-orange-400',
      isDead: false,
    };
  }

  if (ratio <= 0.5) {
    return {
      state: 'BLOODIED',
      label: 'Ranny',
      badgeClass: 'bg-amber-950/80 text-amber-400 border border-amber-900/60',
      fillClass: 'bg-amber-500',
      textClass: 'text-amber-400',
      isDead: false,
    };
  }

  return {
    state: 'HEALTHY',
    label: 'Zdolny do walki',
    badgeClass: 'bg-emerald-950/80 text-emerald-400 border border-emerald-900/60',
    fillClass: 'bg-emerald-500',
    textClass: 'text-emerald-400',
    isDead: false,
  };
}

/**
 * Returns role-specific badge styling and display label matching original TableOps.
 */
export function getRoleBadge(role: EntityRole): { label: string; badgeClass: string } {
  switch (role) {
    case 'HERO':
      return {
        label: 'Postać Gracza',
        badgeClass: 'bg-indigo-950/60 text-indigo-300 border border-indigo-700/50',
      };
    case 'NPC':
      return {
        label: 'Ważny NPC',
        badgeClass: 'bg-amber-950/60 text-amber-300 border border-amber-700/50',
      };
    case 'MONSTER':
      return {
        label: 'Przeciwnik / Potwór',
        badgeClass: 'bg-red-950/60 text-red-300 border border-red-700/50',
      };
  }
}
