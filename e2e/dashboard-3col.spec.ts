import { expect, test } from '@playwright/test';
import { ensureSessionSelected } from './helpers';

test.describe('GM 3-Column Cockpit Dashboard (Chunk 2.2)', () => {
  test('renders 3 columns simultaneously on Desktop (1920x1080) and supports inspection', async ({
    page,
  }) => {
    // 1. Set Desktop resolution
    await page.setViewportSize({ width: 1920, height: 1080 });
    await ensureSessionSelected(page);

    // 2. Verify all 3 columns are visible in grid layout
    const partyCol = page.locator('[data-testid="dashboard-party-column"]');
    const workspaceCol = page.locator('[data-testid="dashboard-workspace-column"]');
    const timelineCol = page.locator('[data-testid="dashboard-timeline-column"]');

    await expect(partyCol).toBeVisible();
    await expect(workspaceCol).toBeVisible();
    await expect(timelineCol).toBeVisible();

    // 3. Verify mobile switcher is hidden on desktop
    await expect(page.locator('[data-testid="mobile-tab-party"]')).not.toBeVisible();

    // 4. Verify Left Column (Party & NPCs)
    await expect(partyCol.locator('text=Drużyna & NPC')).toBeVisible();

    // 5. Verify Center Column default view (Initiative Tracker)
    await expect(workspaceCol.locator('text=Kolejność Inicjatywy')).toBeVisible();

    // 6. Verify Right Column (Quick Dice & Notes & Timeline)
    await expect(timelineCol.locator('text=Szybkie Rzuty Kośćmi')).toBeVisible();
    await expect(timelineCol.locator('text=Podręczne Notatki GM-a')).toBeVisible();
    await expect(timelineCol.locator('text=Oś Czasu Sesji')).toBeVisible();

    // 7. Interactive inspection: click character card in left column if characters exist
    const characterCard = partyCol.locator('button').first();
    const hasCard = await characterCard.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasCard) {
      await characterCard.click();

      // Center workspace should switch to character inspection card
      await expect(workspaceCol.locator('text=Atrybuty D&D 5e')).toBeVisible();
      await expect(workspaceCol.locator('text=Powrót do Walki / Tracker Inicjatywy')).toBeVisible();

      // Return back to combat
      await workspaceCol.locator('button:has-text("Powrót do Walki")').click();
      await expect(workspaceCol.locator('text=Kolejność Inicjatywy')).toBeVisible();
    }

    // 8. Quick Dice roll in timeline
    await timelineCol.locator('button:has-text("D20!")').click();
    await expect(timelineCol.locator('text=d20:')).toBeVisible();
  });

  test('collapses to responsive tabs on Mobile (375x667) and allows seamless tab switching', async ({
    page,
  }) => {
    // 1. Set Mobile resolution
    await page.setViewportSize({ width: 375, height: 667 });
    await ensureSessionSelected(page);

    const mobilePartyTab = page.locator('[data-testid="mobile-tab-party"]');
    const mobileWorkspaceTab = page.locator('[data-testid="mobile-tab-workspace"]');
    const mobileTimelineTab = page.locator('[data-testid="mobile-tab-timeline"]');

    // 2. Verify mobile tab switcher is visible
    await expect(mobilePartyTab).toBeVisible();
    await expect(mobileWorkspaceTab).toBeVisible();
    await expect(mobileTimelineTab).toBeVisible();

    const partyCol = page.locator('[data-testid="dashboard-party-column"]');
    const workspaceCol = page.locator('[data-testid="dashboard-workspace-column"]');
    const timelineCol = page.locator('[data-testid="dashboard-timeline-column"]');

    // Default mobile active tab is workspace
    await expect(workspaceCol).toBeVisible();
    await expect(partyCol).not.toBeVisible();
    await expect(timelineCol).not.toBeVisible();

    // Switch to Party tab
    await mobilePartyTab.click();
    await expect(partyCol).toBeVisible();
    await expect(workspaceCol).not.toBeVisible();

    // Switch to Timeline tab
    await mobileTimelineTab.click();
    await expect(timelineCol).toBeVisible();
    await expect(partyCol).not.toBeVisible();

    // Switch back to Workspace
    await mobileWorkspaceTab.click();
    await expect(workspaceCol).toBeVisible();
    await expect(timelineCol).not.toBeVisible();
  });
});
