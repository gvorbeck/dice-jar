// Every page, scanned with axe: the home page, each creation step, the review, the live sheet, the game page and a standalone sheet.
import { expect, test } from '@playwright/test';
import { createAgent, expectAccessible, finishAgent, startAgent } from './helpers';
import { newCharacter } from '../src/model/character';
import { encodeSheet, freshLive } from '../src/model/live';

test('home, creation steps, review, live sheet and game page have no accessibility violations', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Generate game' })).toBeVisible();
  await expectAccessible(page);

  const { gameUrl } = await startAgent(page, expectAccessible); // stats, profession, bonds
  await expectAccessible(page); // final details
  await finishAgent(page);
  await expectAccessible(page); // live sheet

  await page.getByRole('link', { name: '< Game' }).click();
  await expect(page).toHaveURL(new RegExp(`${gameUrl}$`));
  await expect(page.getByRole('region', { name: 'SANITY' })).toBeVisible();
  await expectAccessible(page);
});

test('the review and a standalone sheet have no accessibility violations', async ({ page }) => {
  await createAgent(page);
  await page.getByRole('button', { name: 'Edit agent' }).click();
  await expect(page.getByText('All steps complete')).toBeVisible();
  await expectAccessible(page);

  const c = newCharacter();
  await page.goto('/' + encodeSheet(c, freshLive(c)));
  await expect(page.getByRole('main')).toBeVisible();
  await expectAccessible(page);
});

test('the home page, live sheet and game page have no accessibility violations in dark mode', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await expectAccessible(page);

  const { gameUrl } = await createAgent(page);
  await expectAccessible(page);
  await page.getByRole('link', { name: '< Game' }).click();
  await expect(page).toHaveURL(new RegExp(`${gameUrl}$`));
  await expect(page.getByRole('region', { name: 'SANITY' })).toBeVisible();
  await expectAccessible(page);
});
