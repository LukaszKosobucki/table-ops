import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FALLBACK_MOCK_MONSTERS, getMockMonsters, isDemoMode } from './mock-data';
import { getMonsters } from './monsters';

describe('mock-data - isDemoMode and getMockMonsters', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('detects demo mode when NEXT_PUBLIC_DEMO_MODE is true', () => {
    process.env.NEXT_PUBLIC_DEMO_MODE = 'true';
    expect(isDemoMode()).toBe(true);
  });

  it('detects demo mode when GITHUB_PAGES is true', () => {
    process.env.GITHUB_PAGES = 'true';
    expect(isDemoMode()).toBe(true);
  });

  it('returns valid monster objects from getMockMonsters', () => {
    const monsters = getMockMonsters();
    expect(monsters.length).toBeGreaterThan(0);

    const first = monsters[0];
    expect(first).toHaveProperty('name');
    expect(first).toHaveProperty('armorClass');
    expect(first).toHaveProperty('hitPoints');
    expect(first).toHaveProperty('challengeRating');
  });

  it('falls back to FALLBACK_MOCK_MONSTERS if seed file is missing', () => {
    expect(FALLBACK_MOCK_MONSTERS.length).toBeGreaterThan(0);
    const goblin = FALLBACK_MOCK_MONSTERS.find((m) => m.index === 'goblin');
    expect(goblin?.name).toBe('Goblin');
  });

  it('ensures getMonsters returns mock data in demo mode without DB connection', async () => {
    process.env.NEXT_PUBLIC_DEMO_MODE = 'true';
    delete process.env.DATABASE_URL;

    const monsters = await getMonsters();
    expect(monsters.length).toBeGreaterThan(0);
  });
});
