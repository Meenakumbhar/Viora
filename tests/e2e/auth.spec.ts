import { test, expect } from '@playwright/test';
import { verifyTestUser, deleteTestUser } from './helpers/db';

const EMAIL = `playwright-${Date.now()}@example.test`;
const PASSWORD = 'e2e-test-password-1';

test.describe('login / logout', () => {
  test.beforeAll(async ({ request }) => {
    const res = await request.post('/api/auth/sign-up/email', {
      data: { email: EMAIL, password: PASSWORD, name: 'Playwright Runner' },
    });
    expect(res.ok()).toBe(true);
    await verifyTestUser(EMAIL);
  });

  test.afterAll(async () => {
    await deleteTestUser(EMAIL);
  });

  test('logs in through the UI, reaches /account, then logs out', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#login-email').fill(EMAIL);
    await page.locator('#login-password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(page).toHaveURL(/\/account$/);
    await expect(page.getByText('No orders yet')).toBeVisible();

    await page.getByRole('button', { name: 'Log out' }).click();
    await expect(page).toHaveURL(/\/login$/);

    // Session cookie should actually be gone — direct nav to /account bounces back to /login.
    await page.goto('/account');
    await expect(page).toHaveURL(/\/login/);
  });

  test('rejects a wrong password with an inline error', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#login-email').fill(EMAIL);
    await page.locator('#login-password').fill('definitely-the-wrong-password');
    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });
});
