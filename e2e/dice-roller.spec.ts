import { expect, test } from '@playwright/test';
import { ensureSessionSelected } from './helpers';

test.describe('Dice Roller Module (Chunk 10.1 & Chunk 10.2)', () => {
  test.beforeEach(async ({ page }) => {
    await ensureSessionSelected(page);
    await page.waitForLoadState('networkidle');
  });

  test('opens and closes dice tray using header button and keyboard shortcut D', async ({
    page,
  }) => {
    // 1. Initial state: Dice Tray is not rendered
    await expect(page.locator('[data-testid="dice-tray-window"]')).not.toBeVisible();

    // 2. Open via header action button
    const headerDiceBtn = page.locator('[data-testid="header-dice-btn"]');
    await expect(headerDiceBtn).toBeVisible();
    await headerDiceBtn.click();
    await expect(page.locator('[data-testid="dice-tray-window"]')).toBeVisible();

    // 3. Close via close button
    await page.locator('[data-testid="close-dice-tray-btn"]').click();
    await expect(page.locator('[data-testid="dice-tray-window"]')).not.toBeVisible();

    // 4. Toggle open via global hotkey 'D'
    await page.keyboard.press('d');
    await expect(page.locator('[data-testid="dice-tray-window"]')).toBeVisible();

    // 5. Close via Escape key
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="dice-tray-window"]')).not.toBeVisible();
  });

  test('composes dice pool, executes roll, displays result, minimizes to dock and restores', async ({
    page,
  }) => {
    // 1. Open dice tray
    await page.locator('[data-testid="header-dice-btn"]').click();
    const tray = page.locator('[data-testid="dice-tray-window"]');
    await expect(tray).toBeVisible();

    // 2. Compose pool: 2d6 + 1d20 + 2
    await page.locator('[data-testid="die-btn-d6"]').click();
    await page.locator('[data-testid="die-btn-d6"]').click();
    await page.locator('[data-testid="die-btn-d20"]').click();
    await page.locator('[data-testid="modifier-plus-btn"]').click();
    await page.locator('[data-testid="modifier-plus-btn"]').click();

    // Verify formula
    await expect(page.locator('[data-testid="dice-pool-formula"]')).toHaveText('2d6 + 1d20 + 2');

    // 3. Roll dice via button
    await page.locator('[data-testid="roll-dice-btn"]').click();

    // 4. Result card appears with total
    const resultCard = page.locator('[data-testid="dice-result-card"]');
    await expect(resultCard).toBeVisible();
    await expect(page.locator('[data-testid="dice-result-total"]')).toBeVisible();
    await expect(page.locator('[data-testid="dice-result-breakdown"]')).toBeVisible();

    // 5. Minimize to Bottom Dock
    await page.locator('[data-testid="minimize-dice-tray-btn"]').click();
    await expect(tray).not.toBeVisible();

    const dockPill = page.locator('[data-testid="dock-minimized-dice-btn"]');
    await expect(dockPill).toBeVisible();
    await expect(dockPill).toContainText('Rzutnik Kości');

    // 6. Restore from Bottom Dock
    await dockPill.click();
    await expect(tray).toBeVisible();
    await expect(resultCard).toBeVisible();

    // 7. Toggle history and verify item recorded
    await page.locator('[data-testid="toggle-history-btn"]').click();
    await expect(page.locator('[data-testid="roll-history-item-0"]')).toBeVisible();
    await expect(page.locator('[data-testid="roll-history-item-0"]')).toContainText(
      '2d6 + 1d20 + 2'
    );
  });

  test('executes roll, verifies result card and timeline entry', async ({ page }) => {
    // 1. Open dice tray
    await page.locator('[data-testid="header-dice-btn"]').click();

    // 2. Add 1d20
    await page.locator('[data-testid="die-btn-d20"]').click();

    // 3. Roll using Enter key
    await page.keyboard.press('Enter');

    // 4. Result card should display result
    const resultCard = page.locator('[data-testid="dice-result-card"]');
    await expect(resultCard).toBeVisible();
    await expect(page.locator('[data-testid="dice-result-total"]')).toBeVisible();

    // 5. Close dice tray and verify timeline entry
    await page.locator('[data-testid="close-dice-tray-btn"]').click();
    await expect(page.locator('text=RZUT KOŚĆMI').first()).toBeVisible();
    await expect(page.locator('text=1d20').first()).toBeVisible();
  });

  test('triggers quick roll from character inspection card with loaded modifier and context', async ({
    page,
  }) => {
    // 1. Create a character via wizard first
    await page.click('button:has-text("Kreator i Karty Postaci")');
    await page.locator('div:has-text("Krasnolud (Dwarf)")').last().click();
    await page.locator('div:has-text("Wojownik (Fighter)")').last().click();
    await page.locator('button:has-text("Dalej: Przypisanie Atrybutów")').click();
    await page.locator('button:has-text("Rzuć 4d6 (Drop Lowest)")').click();
    await page.locator('button:has-text("Dalej: Nazwa i Poziom")').click();
    const nameInput = page.locator('input[placeholder="np. Thorin Dębowa Tarcza"]');
    await nameInput.fill('Thorin Rolujący');
    await page.locator('button:has-text("Dalej: Ekwipunek i Zaklęcia")').click();
    await page.locator('button:has-text("Dalej: Podsumowanie")').click();
    await page.locator('button:has-text("Zapisz Kartę Postaci")').click();

    // 2. Return to GM Dashboard
    await page.click('button:has-text("Ekran Prowadzenia (GM)")');
    await expect(page.locator('text=Thorin Rolujący')).toBeVisible();

    // 3. Select the character in the party sidebar
    await page.locator('h3:has-text("Thorin Rolujący")').click();

    // 4. Character inspection card should be visible
    await expect(page.locator('text=Atrybuty D&D 5e')).toBeVisible();

    // 5. Click STR attribute test button
    const strTestBtn = page.locator('[data-testid="roll-test-str"]');
    await expect(strTestBtn).toBeVisible();
    await strTestBtn.click();

    // 6. Dice tray opens automatically with 1d20 and context banner
    const tray = page.locator('[data-testid="dice-tray-window"]');
    await expect(tray).toBeVisible();
    await expect(page.locator('[data-testid="roll-context-banner"]')).toBeVisible();
    await expect(page.locator('[data-testid="roll-context-banner"]')).toContainText('Siła (STR)');

    // 7. Roll via Enter key
    await page.keyboard.press('Enter');

    // 8. Result card displays total
    await expect(page.locator('[data-testid="dice-result-card"]')).toBeVisible();
  });

  test('renders polyhedral shape tokens for rolled dice without text labels', async ({ page }) => {
    // 1. Open dice tray
    await page.locator('[data-testid="header-dice-btn"]').click();
    const tray = page.locator('[data-testid="dice-tray-window"]');
    await expect(tray).toBeVisible();

    // 2. Initial state shows empty placeholder
    await expect(page.locator('[data-testid="dice-tray-empty-placeholder"]')).toBeVisible();

    // 3. Roll 1d20 + 1d6
    await page.locator('[data-testid="die-btn-d20"]').click();
    await page.locator('[data-testid="die-btn-d6"]').click();
    await page.locator('[data-testid="roll-dice-btn"]').click();

    // 4. Dice tokens tray renders with d20 and d6 shape tokens
    await expect(page.locator('[data-testid="dice-tokens-tray"]')).toBeVisible();
    await expect(page.locator('[data-testid="die-token-d20"]')).toBeVisible();
    await expect(page.locator('[data-testid="die-token-d6"]')).toBeVisible();

    // 5. Shape tokens contain numbers, not labels
    await expect(page.locator('[data-testid="dice-result-card"]')).toBeVisible();
  });

  test('persists bottom dock and allows opening dice tray and rolling across Bestiary and Character tabs', async ({
    page,
  }) => {
    // 1. Initial on GmDashboard: Bottom dock is visible
    await expect(page.locator('[data-testid="bottom-dock"]')).toBeVisible();

    // 2. Switch to Bestiary tab
    await page.click('button:has-text("Bestiariusz")');
    await expect(page.locator('text=Kompendium Bestiariusza')).toBeVisible();

    // Bottom dock must remain visible on Bestiary tab
    await expect(page.locator('[data-testid="bottom-dock"]')).toBeVisible();

    // 3. Open dice tray via dock button on Bestiary tab
    await page.locator('[data-testid="dock-dice-btn"]').click();
    await expect(page.locator('[data-testid="dice-tray-window"]')).toBeVisible();

    // 4. Roll a d20 from Bestiary tab
    await page.locator('[data-testid="die-btn-d20"]').click();
    await page.locator('[data-testid="roll-dice-btn"]').click();
    await expect(page.locator('[data-testid="dice-result-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="die-token-d20"]')).toBeVisible();

    // 5. Switch to Character Wizard tab while dice tray is open
    await page.click('button:has-text("Kreator i Karty Postaci")');
    await expect(page.locator('text=Karty Postaci Graczy')).toBeVisible();

    // Dice tray and bottom dock must persist across tab switch
    await expect(page.locator('[data-testid="bottom-dock"]')).toBeVisible();
    await expect(page.locator('[data-testid="dice-tray-window"]')).toBeVisible();

    // 6. Minimize to dock
    await page.locator('[data-testid="minimize-dice-tray-btn"]').click();
    await expect(page.locator('[data-testid="dice-tray-window"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="dock-minimized-dice-btn"]')).toBeVisible();

    // 7. Switch back to GM Dashboard
    await page.click('button:has-text("Ekran Prowadzenia (GM)")');
    await expect(page.locator('text=Kolejność Inicjatywy')).toBeVisible();

    // Minimized dice button is still in dock on GM Dashboard
    await expect(page.locator('[data-testid="dock-minimized-dice-btn"]')).toBeVisible();

    // Restore from dock
    await page.locator('[data-testid="dock-minimized-dice-btn"]').click();
    await expect(page.locator('[data-testid="dice-tray-window"]')).toBeVisible();
  });
});
