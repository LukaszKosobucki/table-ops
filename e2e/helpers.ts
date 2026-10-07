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

  // Wait for session list to load if currently loading
  const loadingIndicator = page.locator('text=Ładowanie Twoich sesji RPG...');
  if (await loadingIndicator.isVisible().catch(() => false)) {
    await expect(loadingIndicator).not.toBeVisible({ timeout: 10000 });
  }

  // If an existing session tile is available, enter it
  const enterBtn = page.locator('button:has-text("Wejdź do sesji")').first();
  const hasEnterBtn = await enterBtn.isVisible({ timeout: 5000 }).catch(() => false);

  if (hasEnterBtn) {
    await enterBtn.click();
    await expect(gmTab).toBeEnabled({ timeout: 10000 });
    return;
  }

  // Otherwise, create a new session via the modal
  await createNewSession(page);
}

/**
 * Creates a brand new isolated session specifically for tests that mutate session or combat state.
 */
export async function createNewSession(page: Page, prefix = 'Sesja E2E') {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  const gmTab = page.locator('button:has-text("Ekran Prowadzenia (GM)")');

  // Wait for session list to load if currently loading
  const loadingIndicator = page.locator('text=Ładowanie Twoich sesji RPG...');
  if (await loadingIndicator.isVisible().catch(() => false)) {
    await expect(loadingIndicator).not.toBeVisible({ timeout: 10000 });
  }

  const createBtn = page.locator('button:has-text("+ Nowa Sesja")').first();
  await expect(createBtn).toBeVisible({ timeout: 10000 });
  await createBtn.click();

  const nameInput = page.locator('#session-name');
  await expect(nameInput).toBeVisible({ timeout: 5000 });
  await nameInput.fill(`${prefix} ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);

  const submitBtn = page.locator('button:has-text("Utwórz i rozpocznij")');
  await submitBtn.click();

  await expect(gmTab).toBeEnabled({ timeout: 10000 });
}
