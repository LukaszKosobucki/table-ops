import { expect, type Page } from '@playwright/test';

/**
 * Ensures an active session is selected or created,
 * allowing subsequent tests to interact with unlocked application modules.
 */
export async function ensureSessionSelected(page: Page) {
  await page.goto('/');

  // Wait for initial render
  await page.waitForLoadState('domcontentloaded');

  const gmTab = page.locator('button:has-text("Ekran Prowadzenia (GM)")');
  const isGmVisible = await gmTab.isVisible().catch(() => false);
  const isGmDisabled = isGmVisible ? await gmTab.isDisabled() : true;

  if (isGmVisible && !isGmDisabled) {
    return;
  }

  // If an existing session tile is available, enter it
  const enterBtn = page.locator('button:has-text("Wejdź do sesji")').first();
  const hasEnterBtn = await enterBtn.isVisible({ timeout: 2000 }).catch(() => false);

  if (hasEnterBtn) {
    await enterBtn.click();
    await expect(gmTab).toBeEnabled({ timeout: 10000 });
    return;
  }

  // Otherwise, create a new session via the modal
  const createBtn = page.locator('button:has-text("+ Nowa Sesja")').first();
  await expect(createBtn).toBeVisible({ timeout: 5000 });
  await createBtn.click();

  const nameInput = page.locator('#session-name');
  await expect(nameInput).toBeVisible({ timeout: 5000 });
  await nameInput.fill(`Sesja E2E ${Date.now()}`);

  const submitBtn = page.locator('button:has-text("Utwórz i rozpocznij")');
  await submitBtn.click();

  await expect(gmTab).toBeEnabled({ timeout: 10000 });
}
