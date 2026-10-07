import { expect, type Page, test } from '@playwright/test';
import { createNewSession } from './helpers';

async function addCustomCombatant(page: Page, name: string) {
  const nameInput = page.locator('input[placeholder="np. Garrok Barbarzyńca"]');
  await expect(nameInput).toBeVisible();
  await nameInput.fill(name);
  const submitBtn = page.locator('form button:has-text("Dodaj")');
  await submitBtn.click();
  await expect(page.locator(`[data-testid^="combatant-card-"]:has-text("${name}")`)).toBeVisible();
}

test.describe('Initiative Tracker Module', () => {
  test.beforeEach(async ({ page }) => {
    await createNewSession(page, 'Inicjatywa E2E');
    await page.click('button:has-text("Ekran Prowadzenia (GM)")');
    await expect(page.locator('[data-testid="initiative-tracker-skeleton"]')).not.toBeVisible();
  });

  test('displays empty queue initially, enables start after adding combatants, and advances turns', async ({
    page,
  }) => {
    // Check initial round
    await expect(page.getByText('Runda 1', { exact: true })).toBeVisible();

    // Verify empty state initially
    await expect(page.getByText('Brak postaci w walce')).toBeVisible();

    const startCombatBtn = page.locator('button[data-testid="start-combat-btn"]');
    await expect(startCombatBtn).toBeVisible();
    await expect(startCombatBtn).toBeDisabled();

    // Add two combatants
    await addCustomCombatant(page, 'Bohater Testowy 1');
    await addCustomCombatant(page, 'Bohater Testowy 2');

    // Button should now be enabled
    await expect(startCombatBtn).toBeEnabled();
    await startCombatBtn.click();

    const nextTurnBtn = page.locator('button[data-testid="next-turn-btn"]');
    await expect(nextTurnBtn).toBeVisible();

    // Verify combatants are visible in active combat
    await expect(
      page.locator('[data-testid^="combatant-card-"]:has-text("Bohater Testowy 1")')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid^="combatant-card-"]:has-text("Bohater Testowy 2")')
    ).toBeVisible();

    // Click "Następna Tura"
    await nextTurnBtn.click();

    // Click through combatants to advance round
    await nextTurnBtn.click();

    // Should have advanced to Round 2
    await expect(page.getByText('Runda 2', { exact: true })).toBeVisible();
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
    await expect(
      page.locator('[data-testid^="combatant-card-"]:has-text("Bohater Testowy")')
    ).toBeVisible();
  });

  test('opens encounter builder and returns to combat scene', async ({ page }) => {
    // Click "Kreator Potyczek" tab
    const encounterBuilderTab = page.locator('button[data-testid="tab-encounter-builder"]');
    await expect(encounterBuilderTab).toBeVisible();
    await encounterBuilderTab.click();

    // Verify encounter builder header is visible
    await expect(page.locator('text=Kreator Potyczek (Encounter Builder)')).toBeVisible();
    await expect(page.locator('text=Planowanie walki, kalkulator trudności DMG')).toBeVisible();

    // Click back button
    const backBtn = page.locator('button[title="Powrót do walki"]');
    await backBtn.click();

    // Verify returned to combat initiative tracker
    await expect(page.locator('text=Runda 1')).toBeVisible();
    await expect(page.locator('text=Kolejność Inicjatywy')).toBeVisible();
  });

  test('executes combat lifecycle: active turn badge, HP damage, status, and conclusion', async ({
    page,
  }) => {
    await expect(page.getByText('Initiative Tracker GM')).toBeVisible();

    // Add a combatant first
    await addCustomCombatant(page, 'Wojownik Bojowy');

    const nextTurnBtn = page.locator('button[data-testid="next-turn-btn"]');
    const startCombatBtn = page.locator('button[data-testid="start-combat-btn"]');
    await expect(startCombatBtn).toBeVisible();

    const startPromise = page.waitForResponse(
      (res) => res.url().includes('/api/combat/start') && res.status() === 201
    );
    await startCombatBtn.click();
    await startPromise;
    await expect(nextTurnBtn).toBeVisible();

    // Verify active turn badge
    await expect(page.locator('[data-testid="active-turn-badge"]')).toBeVisible();

    // Apply quick HP damage (-5) to first combatant
    const minusFiveBtn = page.locator('button[title="-5 HP"]').first();
    await minusFiveBtn.click();

    // Advance turn
    await nextTurnBtn.click();

    // End combat
    const endPromise = page
      .waitForResponse((res) => res.url().includes('/end') && res.status() === 200)
      .catch(() => null);
    const endCombatBtn = page.locator('button[data-testid="end-combat-btn"]');
    await endCombatBtn.click();
    await endPromise;

    // Verify victory summary banner and reset button
    await expect(page.locator('text=Starcie Zakończone!')).toBeVisible();
    const resetCombatBtn = page.locator('button[data-testid="reset-combat-summary-btn"]');
    await expect(resetCombatBtn).toBeVisible();

    // Click Nowe Starcie -> transitions back to PREPARING
    await resetCombatBtn.click();
    await expect(page.locator('button[data-testid="start-combat-btn"]')).toBeVisible();
  });

  test('persists combat state and round across page refresh (F5) and clears on combat end', async ({
    page,
  }) => {
    await expect(page.getByText('Initiative Tracker GM')).toBeVisible();

    // Add a combatant first
    await addCustomCombatant(page, 'Wojownik E2E');

    const nextTurnBtn = page.locator('button[data-testid="next-turn-btn"]');
    const startCombatBtn = page.locator('button[data-testid="start-combat-btn"]');
    await expect(startCombatBtn).toBeVisible();

    const startPromise = page.waitForResponse(
      (res) => res.url().includes('/api/combat/start') && res.status() === 201
    );
    await startCombatBtn.click();
    await startPromise;
    await expect(nextTurnBtn).toBeVisible();

    // Advance turn and wait for API persistence
    const turnPromise = page.waitForResponse(
      (res) => res.url().includes('/next-turn') && res.status() === 200
    );
    await nextTurnBtn.click();
    await turnPromise;

    // Refresh page (F5 simulation)
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Switch to GM screen if not already active
    const gmTab = page.locator('button:has-text("Ekran Prowadzenia (GM)")');
    if (await gmTab.isVisible().catch(() => false)) {
      await gmTab.click();
    }

    // Verify combat is STILL active after reload (not reset to preparing)
    await expect(page.locator('button[data-testid="next-turn-btn"]')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator('[data-testid="active-turn-badge"]')).toBeVisible();

    // End combat and wait for persistence
    const endPromise = page.waitForResponse(
      (res) => res.url().includes('/end') && res.status() === 200
    );
    const endCombatBtn = page.locator('button[data-testid="end-combat-btn"]');
    await endCombatBtn.click();
    await endPromise;
    await expect(page.locator('text=Starcie Zakończone!')).toBeVisible();

    // Reload page again after ending combat
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    if (await gmTab.isVisible().catch(() => false)) {
      await gmTab.click();
    }

    // Now combat should be cleared / back in PREPARING phase
    await expect(page.locator('button[data-testid="start-combat-btn"]')).toBeVisible({
      timeout: 10000,
    });
  });

  test('loads party and individual characters/NPCs into combat with status indicators', async ({
    page,
  }) => {
    // 1. Extract session ID from URL and seed a Hero and an NPC
    const url = new URL(page.url());
    const sessionId = url.searchParams.get('session');
    expect(sessionId).toBeTruthy();

    const heroRes = await page.request.post('/api/characters', {
      data: {
        sessionId,
        name: 'Gimli Wojownik',
        type: 'HERO',
        race: 'Krasnolud',
        class: 'Wojownik',
        level: 3,
        maxHp: 30,
        currentHp: 30,
        ac: 16,
      },
    });
    expect(heroRes.ok()).toBeTruthy();

    const npcRes = await page.request.post('/api/characters', {
      data: {
        sessionId,
        name: 'Karczmarz Durnan',
        type: 'NPC',
        race: 'Człowiek',
        class: 'Kupiec',
        level: 2,
        maxHp: 20,
        currentHp: 20,
        ac: 13,
      },
    });
    expect(npcRes.ok()).toBeTruthy();

    // 2. Reload page to let full-state load seeded characters
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    const gmTab = page.locator('button:has-text("Ekran Prowadzenia (GM)")');
    if (await gmTab.isVisible().catch(() => false)) {
      await gmTab.click();
    }

    // 3. Verify characters in PartySidebar
    await expect(page.locator('text=Gimli Wojownik')).toBeVisible();
    await expect(page.locator('text=Karczmarz Durnan')).toBeVisible();

    // 4. Verify party load button in InitiativeTracker empty state
    const trackerAddPartyBtn = page.locator('button[data-testid="tracker-add-party-btn"]');
    await expect(trackerAddPartyBtn).toBeVisible();
    await expect(trackerAddPartyBtn).toContainText('Załaduj Drużynę do Walki (1)');

    // 5. Click to load party into combat
    await trackerAddPartyBtn.click();

    // 6. Verify Gimli is in the combat queue
    await expect(
      page.locator('[data-testid^="combatant-card-"]:has-text("Gimli Wojownik")')
    ).toBeVisible();

    // 7. Verify PartySidebar reflects "W walce" status for Gimli
    const gimliCard = page.locator('[data-testid^="party-card-"]:has-text("Gimli Wojownik")');
    await expect(gimliCard.locator('[data-testid^="in-combat-badge-"]')).toBeVisible();
    const partySidebarAddBtn = page.locator('button[data-testid="add-party-to-combat-btn"]');
    await expect(partySidebarAddBtn).toBeDisabled();
    await expect(partySidebarAddBtn).toContainText('Drużyna w Walce');

    // 8. Add individual NPC (Karczmarz Durnan) to combat
    const durnanCard = page.locator('[data-testid^="party-card-"]:has-text("Karczmarz Durnan")');
    const addDurnanBtn = durnanCard.locator('button:has-text("Do walki")');
    await expect(addDurnanBtn).toBeVisible();
    await addDurnanBtn.click();

    // 9. Verify Karczmarz Durnan is also in the combat queue and has badge
    await expect(durnanCard.locator('[data-testid^="in-combat-badge-"]')).toBeVisible();
    await expect(
      page.locator('[data-testid^="combatant-card-"]:has-text("Karczmarz Durnan")')
    ).toBeVisible();

    // 10. Start combat with both participants
    const startCombatBtn = page.locator('button[data-testid="start-combat-btn"]');
    await expect(startCombatBtn).toBeEnabled();

    const startPromise = page.waitForResponse(
      (res) => res.url().includes('/api/combat/start') && res.status() === 201
    );
    await startCombatBtn.click();
    await startPromise;

    // Verify combat is ACTIVE
    await expect(page.locator('button[data-testid="next-turn-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-turn-badge"]')).toBeVisible();
  });

  test('rapidly damages hero and immediately ends combat, persisting exact HP across reload', async ({
    page,
  }) => {
    // 1. Seed a Hero with 10 HP
    const url = new URL(page.url());
    const sessionId = url.searchParams.get('session');
    expect(sessionId).toBeTruthy();

    const heroRes = await page.request.post('/api/characters', {
      data: {
        sessionId,
        name: 'Wojownik Szybki',
        type: 'HERO',
        race: 'Człowiek',
        class: 'Wojownik',
        level: 1,
        maxHp: 10,
        currentHp: 10,
        ac: 15,
      },
    });
    expect(heroRes.ok()).toBeTruthy();

    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    const gmTab = page.locator('button:has-text("Ekran Prowadzenia (GM)")');
    if (await gmTab.isVisible().catch(() => false)) {
      await gmTab.click();
    }

    // 2. Load hero into combat
    const trackerAddPartyBtn = page.locator('button[data-testid="tracker-add-party-btn"]');
    await expect(trackerAddPartyBtn).toBeVisible();
    await trackerAddPartyBtn.click();

    // 3. Start combat
    const startCombatBtn = page.locator('button[data-testid="start-combat-btn"]');
    const startPromise = page.waitForResponse(
      (res) => res.url().includes('/api/combat/start') && res.status() === 201
    );
    await startCombatBtn.click();
    await startPromise;

    // 4. Verify combatant card
    const combatantCard = page.locator(
      '[data-testid^="combatant-card-"]:has-text("Wojownik Szybki")'
    );
    await expect(combatantCard).toBeVisible();

    // 5. Click -1 HP button 4 times rapidly
    const minusOneBtn = combatantCard.locator('button[title="-1 HP"]');
    await minusOneBtn.click();
    await minusOneBtn.click();
    await minusOneBtn.click();
    await minusOneBtn.click();

    // 6. Verify in UI it immediately shows 6 / 10 HP
    await expect(combatantCard.locator('text=6 / 10 HP')).toBeVisible();

    // 7. Immediately click "Zakończ Walkę"
    const endPromise = page.waitForResponse(
      (res) =>
        res.url().includes('/api/combat/') && res.url().includes('/end') && res.status() === 200
    );
    const endCombatBtn = page.locator('button[data-testid="end-combat-btn"]');
    await endCombatBtn.click();
    await endPromise;

    // 8. Verify victory summary banner
    await expect(page.locator('text=Starcie Zakończone!')).toBeVisible();

    // 9. In PartySidebar, the hero should already show 6/10 HP
    const heroCard = page.locator('[data-testid^="party-card-"]:has-text("Wojownik Szybki")');
    await expect(heroCard.locator('text=6/10')).toBeVisible();

    // 10. Reload page (F5) to verify database persistence from PostgreSQL
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    if (await gmTab.isVisible().catch(() => false)) {
      await gmTab.click();
    }

    // Hero in PartySidebar MUST still have exactly 6/10 HP!
    const heroCardAfterReload = page.locator(
      '[data-testid^="party-card-"]:has-text("Wojownik Szybki")'
    );
    await expect(heroCardAfterReload.locator('text=6/10')).toBeVisible();
  });
});
