import { expect, test } from '@playwright/test';
import { ensureSessionSelected } from './helpers';

test.describe
  .skip('Dice Roller Module (tab removed from navbar pending live dice redesign)', () => {
    test.beforeEach(async ({ page }) => {
      await ensureSessionSelected(page);
      await page.click('button:has-text("Kości i Real-time")');
      await expect(page.locator('text=Wirtualny Symulator Rzutów Kośćmi')).toBeVisible();
    });

    test('adjusts modifier stepper and rolls dice', async ({ page }) => {
      // Check initial modifier is +0
      const modifierContainer = page.locator('div:has-text("Modyfikator:")').last();
      await expect(modifierContainer).toContainText('+0');

      // Click "+" button to increase modifier
      await modifierContainer.locator('button:has-text("+")').click();
      await expect(modifierContainer).toContainText('+1');

      // Click "Rzuć D12" button to generate a distinct log entry
      const rollD12Button = page.locator('button:has-text("Rzuć D12")');
      await expect(rollD12Button).toBeVisible();
      await rollD12Button.click();

      // Verify roll history container contains the new D12 entry
      const historyCard = page.locator('.glass-card:has-text("Dziennik Rzutów")');
      await expect(historyCard).toBeVisible();
      await expect(historyCard.locator('text=D12').first()).toBeVisible({ timeout: 5000 });
    });
  });
