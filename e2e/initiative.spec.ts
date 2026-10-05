import { expect, test } from '@playwright/test';

test.describe('Initiative Tracker Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('displays combatants and allows advancing turns', async ({ page }) => {
    // Check initial round
    await expect(page.locator('text=Runda 1')).toBeVisible();

    // Verify initial combatants
    await expect(page.locator('text=Valerius (Paladyn)')).toBeVisible();
    await expect(page.locator('text=Eldrin (Czarodziej)')).toBeVisible();

    // Click "Następna Tura"
    const nextTurnButton = page.locator('button:has-text("Następna Tura")');
    await nextTurnButton.click();

    // Click through all combatants to advance round
    await nextTurnButton.click();
    await nextTurnButton.click();
    await nextTurnButton.click();

    // Should have advanced to Round 2
    await expect(page.locator('text=Runda 2')).toBeVisible();
  });

  test('adds a custom combatant to the initiative queue', async ({ page }) => {
    // Fill custom combatant form
    const nameInput = page.locator('input[placeholder="np. Garrok Barbarzyńca"]');
    await expect(nameInput).toBeVisible();
    await nameInput.fill('Bohater Testowy');

    // Submit form by clicking the "Dodaj" button in the custom combatant card
    const submitBtn = page.locator('form button:has-text("Dodaj")');
    await submitBtn.click();

    // Verify new combatant appears in the list
    await expect(page.locator('text=Bohater Testowy')).toBeVisible();
  });
});
