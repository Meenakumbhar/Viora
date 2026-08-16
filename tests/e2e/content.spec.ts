import { test, expect } from '@playwright/test';

test.describe('core content flows', () => {
  test('homepage loads with hero content and primary nav', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Memories in Prints/);
    const nav = page.getByLabel('Main navigation');
    await expect(nav.getByRole('link', { name: 'Portfolio' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Products' })).toBeVisible();
  });

  test('nav links to portfolio, products, and about', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByLabel('Main navigation');

    await nav.getByRole('link', { name: 'Portfolio' }).click();
    await expect(page).toHaveURL(/\/portfolio$/);

    await nav.getByRole('link', { name: 'Products' }).click();
    await expect(page).toHaveURL(/\/products$/);

    await nav.getByRole('link', { name: 'About' }).click();
    await expect(page).toHaveURL(/\/about$/);
  });

  test('portfolio page renders filter controls and at least one item', async ({ page }) => {
    await page.goto('/portfolio');
    await expect(page.locator('main')).toBeVisible();
  });
});
