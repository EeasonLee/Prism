import { test, expect } from '@playwright/test';

test.describe('Prism application', () => {
  test('renders hero content', async ({ page }) => {
    await page.goto('/');

    await expect(
      page.getByRole('heading', { level: 1, name: /hello next in prism/i })
    ).toBeVisible();
    await expect(page.getByRole('link', { name: '查看文档' })).toBeVisible();
  });
});
