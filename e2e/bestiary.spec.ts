import { expect, test } from '@playwright/test';

test.describe('Bestiary Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Bestiariusz")');
    await expect(page.locator('text=Kompendium Bestiariusza')).toBeVisible();
  });

  test('filters monsters by search query and opens detail modal', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Szukaj potwora..."]');
    await expect(searchInput).toBeVisible();

    // Type in search query for Goblin
    await searchInput.fill('Goblin');

    // Wait for filtered card to appear
    const monsterCard = page.locator('h3:has-text("Goblin")').first();
    await expect(monsterCard).toBeVisible();

    // Click on the card to open detail modal
    await monsterCard.click();

    // Verify modal appears with combat stats
    await expect(page.locator('text=Klasa Pancerza').first()).toBeVisible();
    await expect(page.locator('text=Punkty Życia').first()).toBeVisible();

    // Click "Zamknij" to dismiss modal
    await page.locator('button:has-text("Zamknij")').click();
    await expect(page.locator('button:has-text("Zamknij")')).not.toBeVisible();
  });
});
