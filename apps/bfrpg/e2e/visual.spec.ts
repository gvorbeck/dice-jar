import { test } from '@playwright/test';

// Look baseline for the style conversion: `VISUAL=1 npx playwright test visual --project=chromium`.
// Writes full-page PNGs to visual/<label>/ (git-ignored). Run it once before a change and once after, then compare the two folders.
const label = process.env['VISUAL_LABEL'] ?? 'baseline';
const viewports = { desktop: { width: 1280, height: 900 }, phone: { width: 390, height: 844 } };

test.describe('look baseline', () => {
  test.skip(!process.env['VISUAL'], 'set VISUAL=1 to capture');

  for (const [vp, size] of Object.entries(viewports)) {
    test.describe(vp, () => {
      test.use({ viewport: size, reducedMotion: 'reduce' });

      const shot = async (page: import('@playwright/test').Page, name: string) => {
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: `visual/${label}/${vp}-${name}.png`, fullPage: true, animations: 'disabled' });
      };

      test('pages', async ({ page }) => {
        await page.goto('/');
        await shot(page, 'home');

        const character = await page.locator('a[href^="/u/"][href*="/c/"]').first().getAttribute('href');
        await page.getByRole('tab', { name: 'Games' }).click();
        await shot(page, 'home-games');
        const game = await page.locator('a[href^="/u/"][href*="/g/"]').first().getAttribute('href');

        await page.goto('/new-character');
        await shot(page, 'new-character');
        await page.goto('/new-game');
        await shot(page, 'new-game');
        if (character) {
          await page.goto(character);
          await shot(page, 'character-sheet');
        }
        if (game) {
          await page.goto(game);
          await shot(page, 'game-sheet');
        }
        await page.goto('/no-such-page');
        await shot(page, 'not-found');
      });
    });
  }
});
