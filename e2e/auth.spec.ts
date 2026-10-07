import { expect, test } from '@playwright/test';

test.describe('Authentication & Guest Access (Faza 6)', () => {
  test('displays login button for guest and allows navigation to /login and /register', async ({
    page,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const loadingIndicator = page.locator('text=Ładowanie Twoich sesji RPG...');
    if (await loadingIndicator.isVisible().catch(() => false)) {
      await expect(loadingIndicator).not.toBeVisible({ timeout: 10000 });
    }

    // 1. Verify "Zaloguj się" button is visible in Navbar for guest
    const loginLink = page.getByTestId('login-link-btn');
    await expect(loginLink).toBeVisible();

    // 2. Click login button and verify navigation to /login
    await loginLink.click();
    await page.waitForURL('**/login');
    await expect(page.getByRole('heading', { name: 'Witaj ponownie, Mistrzu Gry' })).toBeVisible();

    // 3. Verify form inputs on /login
    await expect(page.getByTestId('email-input')).toBeVisible();
    await expect(page.getByTestId('password-input')).toBeVisible();
    await expect(page.getByTestId('login-submit-btn')).toBeVisible();
    await expect(page.getByTestId('google-login-btn')).toBeVisible();

    // 4. Navigate from /login to /register
    const registerLink = page.locator('a:has-text("Zarejestruj się za darmo")');
    await expect(registerLink).toBeVisible();
    await registerLink.click();

    await page.waitForURL('**/register');
    await expect(page.getByRole('heading', { name: 'Dołącz do TableOps' })).toBeVisible();

    // 5. Verify registration inputs on /register
    await expect(page.getByTestId('email-input')).toBeVisible();
    await expect(page.getByTestId('password-input')).toBeVisible();
    await expect(page.getByTestId('confirm-password-input')).toBeVisible();
    await expect(page.getByTestId('register-submit-btn')).toBeVisible();

    // 6. Test password mismatch validation
    await page.getByTestId('email-input').fill('gm-test@tableops.app');
    await page.getByTestId('password-input').fill('haslo123');
    await page.getByTestId('confirm-password-input').fill('innehaslo123');
    await page.getByTestId('register-submit-btn').click();

    await expect(page.locator('text=Hasła nie są identyczne')).toBeVisible();

    // 7. Click guest mode link and verify smooth return to main app
    const guestLink = page.locator('a:has-text("Wypróbuj w trybie gościa")');
    await expect(guestLink).toBeVisible();
    await guestLink.click();

    await page.waitForURL('**/');
    await expect(page.locator('h1')).toContainText('TableOps');
  });

  test('isolates guest sessions between different browser contexts (Option A)', async ({
    browser,
  }) => {
    // Context 1: First guest
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    await page1.goto('/');
    await page1.waitForLoadState('domcontentloaded');

    const loadingIndicator1 = page1.locator('text=Ładowanie Twoich sesji RPG...');
    if (await loadingIndicator1.isVisible().catch(() => false)) {
      await expect(loadingIndicator1).not.toBeVisible({ timeout: 10000 });
    }

    const uniqueSession1 = `Kampania Gościa 1 - ${Date.now()}`;
    const openModalBtn1 = page1
      .locator('button:has-text("+ Nowa Sesja"), button:has-text("Stwórz pierwszą sesję")')
      .first();
    await expect(openModalBtn1).toBeVisible({ timeout: 10000 });
    await openModalBtn1.click();

    const nameInput1 = page1.locator('#session-name');
    await expect(nameInput1).toBeVisible({ timeout: 5000 });
    await nameInput1.fill(uniqueSession1);
    await page1.click('button:has-text("Utwórz i rozpocznij")');

    // Wait until dashboard loads for session 1
    await expect(page1.getByRole('heading', { name: uniqueSession1 })).toBeVisible({
      timeout: 10000,
    });

    // Context 2: Second guest (different device/browser sandbox)
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await page2.goto('/');
    await page2.waitForLoadState('domcontentloaded');

    const loadingIndicator2 = page2.locator('text=Ładowanie Twoich sesji RPG...');
    if (await loadingIndicator2.isVisible().catch(() => false)) {
      await expect(loadingIndicator2).not.toBeVisible({ timeout: 10000 });
    }

    // Verify Context 2 does NOT see Context 1's session
    await expect(page2.locator(`text=${uniqueSession1}`)).not.toBeVisible();

    // Create a different session in Context 2
    const uniqueSession2 = `Kampania Gościa 2 - ${Date.now()}`;
    const openModalBtn2 = page2
      .locator('button:has-text("+ Nowa Sesja"), button:has-text("Stwórz pierwszą sesję")')
      .first();
    await expect(openModalBtn2).toBeVisible({ timeout: 10000 });
    await openModalBtn2.click();

    const nameInput2 = page2.locator('#session-name');
    await expect(nameInput2).toBeVisible({ timeout: 5000 });
    await nameInput2.fill(uniqueSession2);
    await page2.click('button:has-text("Utwórz i rozpocznij")');

    await expect(page2.getByRole('heading', { name: uniqueSession2 })).toBeVisible({
      timeout: 10000,
    });

    // Verify Context 1 does not see Context 2's session when looking at session list
    await page1.goto('/?tab=sessions');
    await expect(page1.locator(`text=${uniqueSession2}`)).not.toBeVisible();

    await context1.close();
    await context2.close();
  });
});
