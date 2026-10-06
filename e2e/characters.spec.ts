import { expect, test } from '@playwright/test';
import { ensureSessionSelected } from './helpers';

test.describe('Character Wizard Module', () => {
  test.beforeEach(async ({ page }) => {
    await ensureSessionSelected(page);
    await page.click('button:has-text("Kreator i Karty Postaci")');
    await expect(page.locator('text=Karty Postaci Graczy')).toBeVisible();
  });

  test('displays existing party members and creates a new character through wizard', async ({
    page,
  }) => {
    // 1. Verify GM view section is present
    await expect(page.locator('text=Karty Postaci Graczy (GM View)')).toBeVisible();

    // 2. Step 1: Select Race and Class, proceed
    await page.locator('div:has-text("Krasnolud (Dwarf)")').last().click();
    await page.locator('div:has-text("Wojownik (Fighter)")').last().click();
    await page.locator('button:has-text("Dalej: Przypisanie Atrybutów")').click();

    // 3. Step 2: Roll stats and proceed
    await expect(page.locator('text=Krok 2: Statystyki i Cechy Bazowe')).toBeVisible();
    await page.locator('button:has-text("Rzuć 4d6 (Drop Lowest)")').click();
    await page.locator('button:has-text("Dalej: Nazwa i Poziom")').click();

    // 4. Step 3: Fill name and level
    await expect(page.locator('text=Krok 3: Tożsamość i Poziom Postaci')).toBeVisible();
    const nameInput = page.locator('input[placeholder="np. Thorin Dębowa Tarcza"]');
    await nameInput.fill('Gildor Strażnik Lasu');

    await page.locator('button:has-text("Podsumowanie Karty")').click();

    // 5. Step 4: Summary and save
    await expect(page.locator('text=Krok 4: Podsumowanie Wygenerowanej Karty')).toBeVisible();
    await page.locator('button:has-text("Zapisz Kartę Postaci")').click();

    // 6. Verify newly created character appears in the party list
    await expect(page.locator('h3:has-text("Gildor Strażnik Lasu")')).toBeVisible();
  });
});
