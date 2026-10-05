import { expect, test } from '@playwright/test';

test.describe('TableOps Navigation & Shell', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads home page with title and branding', async ({ page }) => {
    await expect(page.locator('text=TableOps')).toBeVisible();
    await expect(page.locator('text=Centrum Dowodzenia Mistrza Gry')).toBeVisible();
    await expect(page.locator('text=Ekran Prowadzenia (GM)')).toBeVisible();
  });

  test('switches across all main application modules', async ({ page }) => {
    // 1. Initiative Tracker (default active tab)
    await expect(page.locator('text=Kolejność Inicjatywy')).toBeVisible();

    // 2. Bestiary tab
    await page.click('button:has-text("Bestiariusz")');
    await expect(page.locator('text=Kompendium Bestiariusza')).toBeVisible();

    // 3. Characters tab
    await page.click('button:has-text("Kreator i Karty Postaci")');
    await expect(page.locator('text=Karty Postaci Graczy')).toBeVisible();
    await expect(page.locator('text=Kreator Wielokrokowy Postaci')).toBeVisible();

    // 4. Dice Roller tab
    await page.click('button:has-text("Kości i Real-time")');
    await expect(page.locator('text=Wirtualny Symulator Rzutów Kośćmi')).toBeVisible();
    await expect(page.locator('text=Wynik Ostatniego Rzutu')).toBeVisible();
  });
});
