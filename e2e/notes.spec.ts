import { expect, test } from '@playwright/test';
import { createNewSession } from './helpers';

test.describe('External Notes & Bottom Dock (Chunk 9.1 & 9.2)', () => {
  test('opens draggable notes window, saves Google Docs URL, renders embed, minimizes to dock, restores, and persists after reload', async ({
    page,
  }) => {
    // 1. Create a fresh isolated session
    await createNewSession(page, 'Notatki E2E');

    // 2. Open GM dashboard
    const gmTab = page.locator('button:has-text("Ekran Prowadzenia (GM)")');
    await expect(gmTab).toBeEnabled({ timeout: 10000 });
    await gmTab.click();

    // 3. Check "Zewnętrzne notatki" button in title bar
    const notesBtn = page.getByTestId('external-notes-btn');
    await expect(notesBtn).toBeVisible({ timeout: 10000 });
    await expect(notesBtn).toContainText('Zewnętrzne notatki');

    // 4. Click button to open draggable window
    await notesBtn.click();
    const notesWindow = page.getByTestId('draggable-notes-window');
    await expect(notesWindow).toBeVisible();

    // 5. Fill URL into input
    const testDocUrl =
      'https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit';
    const input = page.getByTestId('notes-url-input');
    await expect(input).toBeVisible();
    await input.fill(testDocUrl);

    // 6. Save URL
    await Promise.all([
      page.waitForResponse(
        (res) =>
          res.request().method() === 'PUT' &&
          res.url().includes('/api/sessions') &&
          res.status() === 200
      ),
      page.getByTestId('notes-save-url-btn').click(),
    ]);

    // 7. Verify Smart Embed iframe appears with preview URL
    const iframe = page.getByTestId('notes-iframe');
    await expect(iframe).toBeVisible();
    await expect(iframe).toHaveAttribute(
      'src',
      'https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/preview'
    );

    // Title bar button should now have the emerald active dot
    const activeDot = page.getByTestId('external-notes-active-dot');
    await expect(activeDot).toBeVisible();

    // 8. Minimize window to bottom dock
    await page.getByTestId('notes-minimize-btn').click();
    await expect(notesWindow).not.toBeVisible();

    // 9. Minimized pill should be visible in bottom dock
    const dockRestoreBtn = page.getByTestId('dock-minimized-notes-btn');
    await expect(dockRestoreBtn).toBeVisible();
    await expect(dockRestoreBtn).toContainText('Zewnętrzne Notatki');

    // 10. Restore window from dock
    await dockRestoreBtn.click();
    await expect(notesWindow).toBeVisible();
    await expect(iframe).toBeVisible();

    // 11. Close window
    await page.getByTestId('notes-close-btn').click();
    await expect(notesWindow).not.toBeVisible();

    // 12. Reload page (F5) to verify database persistence in PostgreSQL
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    await expect(gmTab).toBeEnabled({ timeout: 15000 });
    await gmTab.click();

    // External notes button still has the active indicator dot after reload
    await expect(notesBtn).toBeVisible();
    await expect(activeDot).toBeVisible();

    // Opening it immediately shows the embed iframe
    await notesBtn.click();
    await expect(notesWindow).toBeVisible();
    await expect(iframe).toBeVisible();
    await expect(iframe).toHaveAttribute(
      'src',
      'https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/preview'
    );
  });
});
