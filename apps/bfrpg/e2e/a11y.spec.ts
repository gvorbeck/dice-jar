// Every page, scanned with axe: home, both tabs, the creation steps, a character sheet, a game sheet and the not-found page.
import type { Page } from '@playwright/test';
import { expectAccessible, expectSkipLink } from '@dice-jar/e2e-helpers';
import { expect, rollHigh, test } from './fixtures';

const hrefOf = async (page: Page, pattern: string, tab?: string) => {
  await page.goto('/');
  if (tab) await page.getByRole('tab', { name: tab }).click();
  const href = await page.locator(`a[href^="/u/"][href*="${pattern}"]`).first().getAttribute('href');
  if (!href) throw new Error(`no link containing ${pattern} on the home page; is the sample data seeded?`);
  return href;
};

test('every page has no accessibility violations', async ({ page }) => {
  await page.goto('/');
  await expectAccessible(page);
  await page.getByRole('tab', { name: 'Games' }).click();
  await expect(page.getByRole('heading', { name: 'Your Games' })).toBeVisible();
  await expectAccessible(page);

  await page.goto('/new-game');
  await expectAccessible(page);

  await page.goto(await hrefOf(page, '/c/'));
  await expectAccessible(page);
  await page.goto(await hrefOf(page, '/g/', 'Games'));
  await expectAccessible(page);

  await page.goto('/no/such/page');
  await expectAccessible(page);
});

test('each character creation step has no accessibility violations', async ({ page }) => {
  await page.goto('/new-character');
  await rollHigh(page);
  await page.getByRole('button', { name: 'Roll All Abilities' }).click();
  const next = page.getByRole('button', { name: /next/i });
  await expect(next).toBeEnabled();
  await expectAccessible(page); // abilities
  await next.click();
  await page.getByLabel('Race*').selectOption('human');
  await expectAccessible(page);
  await next.click();
  await page.getByLabel('Class*').selectOption('fighter');
  await expectAccessible(page);
  await next.click();
  await page.getByRole('button', { name: /roll.*d8/i }).click();
  await expectAccessible(page);
  await next.click();
  await expectAccessible(page); // equipment
  await next.click();
  await page.getByLabel(/character name/i).fill('Test Fighter');
  await expectAccessible(page); // review
});

test('the skip link moves focus to the page', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('tab', { name: 'Games' })).toBeVisible();
  await expectSkipLink(page);
});

test('focus moves to the page after in-app navigation', async ({ page }) => {
  await page.goto('/');
  await page.locator('a[href^="/u/"][href*="/c/"]').first().click();
  await expect(page).toHaveURL(/\/c\//);
  await expect(page.getByRole('main')).toBeFocused();
});
