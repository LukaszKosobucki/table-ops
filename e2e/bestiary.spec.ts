import { expect, test } from '@playwright/test';
import { ensureSessionSelected } from './helpers';

test.describe('Bestiary Module', () => {
  test.beforeEach(async ({ page }) => {
    await ensureSessionSelected(page);
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

  test('browses and searches spells in compendium spells tab', async ({ page }) => {
    // Switch to Spells tab
    const spellsTab = page.locator('[data-testid="compendium-spells-tab"]');
    await expect(spellsTab).toBeVisible();
    await spellsTab.click();

    await expect(page.locator('text=Księga Zaklęć (D&D 5e SRD)')).toBeVisible();

    // Wait for spells to load from API
    await expect(page.locator('[data-testid^="spell-card-"]').first()).toBeVisible({
      timeout: 10000,
    });

    // Search for Cure Wounds
    const searchInput = page.locator('input[placeholder*="Szukaj zaklęcia"]');
    await searchInput.fill('Cure Wounds');

    // Spell card should be visible
    const spellCard = page.locator('h3:has-text("Cure Wounds")').first();
    await expect(spellCard).toBeVisible();

    // Click Szczegóły
    const detailsBtn = page.locator('button:has-text("Szczegóły")').first();
    await detailsBtn.click();

    // Verify modal appears
    const dialog = page.locator('role=dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('text=Czas rzucania')).toBeVisible();
    await expect(dialog.locator('text=Zasięg')).toBeVisible();

    // Close modal
    await dialog.locator('button:has-text("Zamknij")').click();
    await expect(dialog).not.toBeVisible();
  });

  test('browses and searches items in compendium items tab', async ({ page }) => {
    // Switch to Items tab
    const itemsTab = page.locator('[data-testid="compendium-items-tab"]');
    await expect(itemsTab).toBeVisible();
    await itemsTab.click();

    await expect(page.locator('text=Ekwipunek i Przedmioty Magiczne (D&D 5e SRD)')).toBeVisible();

    // Wait for items to load from API
    await expect(page.locator('[data-testid^="item-card-"]').first()).toBeVisible({
      timeout: 10000,
    });

    // Search for Longsword
    const searchInput = page.locator('input[placeholder*="Szukaj przedmiotu"]');
    await searchInput.fill('Longsword');

    // Item card should be visible
    const itemCard = page.locator('h3:has-text("Longsword")').first();
    await expect(itemCard).toBeVisible();

    // Click Szczegóły
    const detailsBtn = page.locator('button:has-text("Szczegóły")').first();
    await detailsBtn.click();

    // Verify modal appears
    const dialog = page.locator('role=dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('text=Cena')).toBeVisible();
    await expect(dialog.locator('text=Waga')).toBeVisible();

    // Close modal
    await dialog.locator('button:has-text("Zamknij")').click();
    await expect(dialog).not.toBeVisible();
  });
});
