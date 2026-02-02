import { test, expect } from '@playwright/test';

test('hero CTA navigates to app', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /continuer vers l'application/i }).click();
  await expect(page).toHaveURL(/app\.romuo\.ch/);
});
