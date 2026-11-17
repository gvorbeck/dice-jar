import { expect, test } from '@playwright/test';
import { expectAccessible } from '@dice-jar/e2e-helpers';

test('the landing page links each live app and has no accessibility violations', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'dice-jar' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'YOURCODENA.ME' })).toHaveAttribute('href', 'https://yourcodena.me/');
  await expect(page.getByRole('link', { name: 'Hearthfire' })).toHaveAttribute('href', 'https://hearthfire.camp/');
  await expect(page.getByText('Coming soon')).toHaveCount(2);
  await expectAccessible(page);
});
