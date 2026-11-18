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

test('each card stays inside the page gutters on a phone at a larger default font', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  // A reader who raised the browser's default font to 20px: the page's 1.0625rem root then comes to 21.25px.
  await page.addStyleTag({ content: 'html { font-size: 21.25px; }' });
  const list = (await page.locator('.cards').boundingBox())!;
  for (const card of await page.locator('.card').all()) {
    const box = (await card.boundingBox())!;
    expect(box.x + box.width).toBeLessThanOrEqual(list.x + list.width); // inside the page's side gutter
  }
});

test('the cards in a row line up their address labels at the bottom', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  const bottoms = await page.locator('.card-meta').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().bottom)));
  expect(new Set(bottoms).size).toBe(1);
});
