import { test, expect } from '@playwright/test';
import { verifyTestUser, deleteTestUser, createTestOrder, deleteTestOrder } from './helpers/db';

const EMAIL = `playwright-checkout-${Date.now()}@example.test`;
const PASSWORD = 'e2e-test-password-1';
const AMOUNT = 45;

// Scoped to the boundary this app owns: does the UI offer both payment
// methods, and does each one kick off the right request? Actually completing
// a checkout on PayPal's or Stripe's hosted pages is out of scope for this
// suite — those are third-party surfaces this app doesn't control.
test.describe('payment method choice on an order', () => {
  let orderId: string;

  test.beforeAll(async ({ request }) => {
    const res = await request.post('/api/auth/sign-up/email', {
      data: { email: EMAIL, password: PASSWORD, name: 'Playwright Checkout Runner' },
    });
    expect(res.ok()).toBe(true);
    await verifyTestUser(EMAIL);
    orderId = await createTestOrder(EMAIL, AMOUNT);
  });

  test.afterAll(async () => {
    await deleteTestOrder(orderId);
    await deleteTestUser(EMAIL);
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.locator('#login-email').fill(EMAIL);
    await page.locator('#login-password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page).toHaveURL(/\/account$/);
  });

  test('both PayPal and card payment options are offered for an unpaid order', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Pay via PayPal' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Pay £45\.00 by card/ })).toBeVisible();
  });

  test('choosing PayPal reveals the inline PayPal payment container', async ({ page }) => {
    await page.getByRole('button', { name: 'Pay via PayPal' }).click();
    await expect(page.getByText('Complete your payment via PayPal')).toBeVisible();
    // The PayPal SDK itself loads from paypal.com — not reachable/reliable in a
    // sandboxed test run, so this only asserts our own container mounted, not
    // that PayPal's widget rendered inside it.
    await expect(page.locator(`#paypal-btn-${orderId}`)).toBeAttached();
  });

  test('choosing card checkout hits the Stripe boundary correctly', async ({ page }) => {
    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/payments/stripe/create-session')),
      page.getByRole('button', { name: /Pay £45\.00 by card/ }).click(),
    ]);

    if (response.status() === 503) {
      // Expected in an environment with no Stripe keys configured — verify the
      // graceful failure surfaces to the customer instead of a silent/broken button.
      await expect(page.getByText('Card payments are not configured.')).toBeVisible();
    } else {
      // Real keys are configured — the API returned a Stripe-hosted checkout URL
      // and the browser should be mid-redirect there.
      expect(response.ok()).toBe(true);
      const body = await response.json();
      expect(body.data.url).toContain('stripe.com');
    }
  });
});
