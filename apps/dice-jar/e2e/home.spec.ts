import { expect, test } from '@playwright/test';
import { expectAccessible } from '@dice-jar/e2e-helpers';

test('the landing page links each live app and has no accessibility violations', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Dice Jar' })).toBeVisible();
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

// axe skips text over a gradient, so the Delta Green card's scan lines hide its contrast from expectAccessible.
test('the Delta Green card keeps AA contrast over its scan lines', async ({ page }) => {
  await page.goto('/');
  const ratios = await page.locator('.card.dg').evaluate((card) => {
    const rgb = (c: string) =>
      c
        .match(/[\d.]+/g)!
        .slice(0, 3)
        .map(Number);
    const lum = (c: number[]) =>
      c
        .map((v) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
        .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i]!, 0);
    const ratio = (a: number[], b: number[]) => {
      const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
      return (hi! + 0.05) / (lo! + 0.05);
    };
    const panel = rgb(getComputedStyle(card).backgroundColor);
    const fg = rgb(getComputedStyle(card).color);
    const mix = parseFloat(getComputedStyle(card).getPropertyValue('--dg-scan-mix')) / 100;
    if (!(mix > 0)) throw new Error('--dg-scan-mix is missing'); // a renamed token must fail the test, not check 0%
    const scan = panel.map((p, i) => p * (1 - mix) + fg[i]! * mix); // --dg-scan over the panel
    // The eyebrow sits on its own solid bar, which axe does check.
    return [...card.querySelectorAll('p:not(.eyebrow), h3')].flatMap((el) => {
      const text = rgb(getComputedStyle(el).color);
      return [ratio(text, panel), ratio(text, scan)];
    });
  });
  for (const r of ratios) expect(r).toBeGreaterThanOrEqual(4.5);
});

test('the cards in a row line up their address labels at the bottom', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  const bottoms = await page.locator('.card-meta').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().bottom)));
  expect(new Set(bottoms).size).toBe(1);
});
