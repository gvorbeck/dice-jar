import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { expect, test, type Page, type TestInfo } from '@playwright/test';

// Look baseline for the style conversion, chromium only.
//   VISUAL=1 npx playwright test visual --project=chromium            writes full-page PNGs to e2e/visual.spec.ts-snapshots/ (git-ignored)
//   VISUAL=compare npx playwright test visual --project=chromium      checks the app against them; diffs land in test-results/
const compare = process.env['VISUAL'] === 'compare';
const viewports = { desktop: { width: 1280, height: 900 }, phone: { width: 390, height: 844 } };

test.describe('look baseline', () => {
  test.skip(!process.env['VISUAL'], 'set VISUAL=1 to capture');

  for (const [vp, size] of Object.entries(viewports)) {
    test.describe(vp, () => {
      test.use({ viewport: size, reducedMotion: 'reduce' });

      const shot = async (page: Page, name: string, info: TestInfo) => {
        await page.waitForLoadState('networkidle');
        const png = await page.screenshot({ fullPage: true, animations: 'disabled' });
        if (compare) expect(png).toMatchSnapshot(`${vp}-${name}.png`, { maxDiffPixelRatio: 0 });
        else {
          const file = info.snapshotPath(`${vp}-${name}.png`);
          mkdirSync(dirname(file), { recursive: true });
          writeFileSync(file, png);
        }
      };

      const hrefOf = async (page: Page, pattern: string, tab?: string) => {
        await page.goto('/');
        if (tab) await page.getByRole('tab', { name: tab }).click();
        const href = await page.locator(`a[href^="/u/"][href*="${pattern}"]`).first().getAttribute('href');
        if (!href) throw new Error(`no link containing ${pattern} on the home page; is the mock data loaded?`);
        return href;
      };

      test('home', async ({ page }, info) => {
        await page.goto('/');
        await shot(page, 'home', info);
      });
      test('home games', async ({ page }, info) => {
        await page.goto('/');
        await page.getByRole('tab', { name: 'Games' }).click();
        await expect(page.getByRole('heading', { name: 'Your Games' })).toBeVisible(); // the first baseline was shot before the list loaded
        await shot(page, 'home-games', info);
      });
      test('new character', async ({ page }, info) => {
        await page.goto('/new-character');
        await shot(page, 'new-character', info);
      });
      test('new game', async ({ page }, info) => {
        await page.goto('/new-game');
        await shot(page, 'new-game', info);
      });
      test('character sheet', async ({ page }, info) => {
        await page.goto(await hrefOf(page, '/c/'));
        await shot(page, 'character-sheet', info);
      });
      test('game sheet', async ({ page }, info) => {
        await page.goto(await hrefOf(page, '/g/', 'Games'));
        await shot(page, 'game-sheet', info);
      });
      test('not found', async ({ page }, info) => {
        await page.goto('/no-such-page');
        await shot(page, 'not-found', info);
      });
    });
  }
});
