import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Page, TestInfo } from '@playwright/test';
import { expect, test } from './fixtures';

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
        await expect(page.getByText(/^Loading/)).toHaveCount(0); // live listeners keep a connection open, so the network is never idle
        await page.waitForFunction(() => [...document.images].every((i) => i.complete)); // avatars load lazily
        await page.mouse.move(0, 0); // a hovered button changes its shadow
        // a modal sits in the viewport; a full-page capture would resize it
        const png = await page.screenshot({ fullPage: !name.startsWith('modal-'), animations: 'disabled' });
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
        if (!href) throw new Error(`no link containing ${pattern} on the home page; is the sample data seeded?`);
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
      // Rolls decide what the creation steps show, so pin Math.random for the tests that roll.
      const seeded = async (page: Page) =>
        page.addInitScript(() => {
          let a = 123456789;
          Math.random = () => {
            a = (a + 0x6d2b79f5) | 0;
            let t = Math.imul(a ^ (a >>> 15), 1 | a);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
          };
        });

      test('creation steps', async ({ page }, info) => {
        await seeded(page);
        await page.goto('/new-character');
        await page.getByRole('button', { name: 'Roll All Abilities' }).click();
        await expect(page.getByRole('heading', { name: 'Ability Scores', exact: true })).toBeVisible();
        await shot(page, 'creation-1-abilities', info);
        const next = page.getByRole('button', { name: /^Go to next step/ });
        await next.click();
        await page.getByLabel('Race*').selectOption('human');
        await shot(page, 'creation-2-race', info);
        await next.click();
        await page.getByLabel('Class*').selectOption('fighter');
        await shot(page, 'creation-3-class', info);
        await next.click();
        await page
          .getByRole('button', { name: /roll.*d8/i })
          .first()
          .click();
        await shot(page, 'creation-4-hit-points', info);
        await next.click();
        await expect(page.locator('#step-content-heading').filter({ hasText: 'Equipment' })).toBeVisible();
        await shot(page, 'creation-5-equipment', info);
        await next.click();
        await page.getByLabel(/character name/i).fill('Test Fighter');
        await shot(page, 'creation-6-review', info);
      });
      test('import and export modals', async ({ page }, info) => {
        await page.goto('/');
        await page.getByRole('button', { name: 'Import' }).click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await shot(page, 'modal-import', info);
        await page.keyboard.press('Escape');
        await page.getByRole('button', { name: 'Export' }).click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await shot(page, 'modal-export', info);
      });
      test('sheet modals', async ({ page }, info) => {
        await page.goto(await hrefOf(page, '/c/'));
        await page.getByRole('button', { name: 'Open character settings' }).click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await shot(page, 'modal-settings', info);
        await page.keyboard.press('Escape');
        await page.getByRole('button', { name: 'Create custom equipment' }).click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await shot(page, 'modal-custom-equipment', info);
      });
      test('not found', async ({ page }, info) => {
        await page.goto('/no-such-page');
        await shot(page, 'not-found', info);
      });
    });
  }
});
