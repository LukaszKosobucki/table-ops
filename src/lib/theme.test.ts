import { describe, it, expect } from 'vitest';
import { getHealthStatus, getRoleBadge, THEME_COLORS } from './theme';

describe('theme - getHealthStatus', () => {
  it('returns DEAD status when currentHp is 0 or negative', () => {
    const deadResult = getHealthStatus(0, 50);
    expect(deadResult.state).toBe('DEAD');
    expect(deadResult.isDead).toBe(true);
    expect(deadResult.label).toBe('Nieprzytomny / Martwy');
    expect(deadResult.textClass).toBe('text-red-400');

    const overkillResult = getHealthStatus(-10, 50);
    expect(overkillResult.state).toBe('DEAD');
    expect(overkillResult.isDead).toBe(true);
  });

  it('returns CRITICAL status when HP is <= 20%', () => {
    const result = getHealthStatus(10, 50); // 20%
    expect(result.state).toBe('CRITICAL');
    expect(result.isDead).toBe(false);
    expect(result.label).toBe('Krytyczny');
    expect(result.badgeClass).toContain('animate-pulse');
  });

  it('returns BLOODIED status when HP is > 20% and <= 50%', () => {
    const result = getHealthStatus(25, 50); // 50%
    expect(result.state).toBe('BLOODIED');
    expect(result.isDead).toBe(false);
    expect(result.label).toBe('Ranny');
    expect(result.textClass).toBe('text-amber-400');
  });

  it('returns HEALTHY status when HP is > 50%', () => {
    const result = getHealthStatus(26, 50); // 52%
    expect(result.state).toBe('HEALTHY');
    expect(result.isDead).toBe(false);
    expect(result.label).toBe('Zdolny do walki');
    expect(result.fillClass).toBe('bg-emerald-500');
  });
});

describe('theme - getRoleBadge', () => {
  it('returns proper role configuration for HERO', () => {
    const role = getRoleBadge('HERO');
    expect(role.label).toBe('Postać Gracza');
    expect(role.badgeClass).toContain('indigo');
  });

  it('returns proper role configuration for NPC', () => {
    const role = getRoleBadge('NPC');
    expect(role.label).toBe('Ważny NPC');
    expect(role.badgeClass).toContain('amber');
  });

  it('returns proper role configuration for MONSTER', () => {
    const role = getRoleBadge('MONSTER');
    expect(role.label).toBe('Przeciwnik / Potwór');
    expect(role.badgeClass).toContain('red');
  });
});

describe('theme - THEME_COLORS', () => {
  it('defines valid hex colors for core tokens', () => {
    expect(THEME_COLORS.appBg).toBe('#090d16');
    expect(THEME_COLORS.brandPrimary).toBe('#6366f1');
    expect(THEME_COLORS.brandAccent).toBe('#f59e0b');
  });
});
