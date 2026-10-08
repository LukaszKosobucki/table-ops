import { expect, test } from '@playwright/test';
import { ensureSessionSelected } from './helpers';

test.describe('TableOps Navigation & Shell', () => {
  test('loads home page with title, branding, and session selection', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=TableOps')).toBeVisible();
    await expect(page.locator('text=Centrum Dowodzenia Mistrza Gry')).toBeVisible();
    await expect(page.locator('text=Wybierz lub stwórz Sesję RPG').first()).toBeVisible();
  });

  test('switches across all main application modules after selecting a session', async ({
    page,
  }) => {
    await ensureSessionSelected(page);

    // 1. Initiative Tracker (default active tab on dashboard)
    await expect(page.locator('text=Kolejność Inicjatywy')).toBeVisible();

    // 2. Characters tab
    await page.click('button:has-text("Kreator i Karty Postaci")');
    await expect(page.locator('text=Karty Postaci Graczy')).toBeVisible();
    await expect(page.locator('text=Kreator Wielokrokowy Postaci')).toBeVisible();

    // 3. Bestiary tab
    await page.click('button:has-text("Bestiariusz")');
    await expect(page.locator('text=Kompendium Bestiariusza')).toBeVisible();

    // 4. Verify dice tab is absent from navbar
    await expect(page.locator('button:has-text("Kości i Real-time")')).not.toBeVisible();

    // 5. Back to sessions
    await page.click('button:has-text("Sesje")');
    await expect(page.locator('text=Wybierz lub stwórz Sesję RPG').first()).toBeVisible();
  });
});
