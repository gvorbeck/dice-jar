// Every page, scanned with axe: the home page, each creation step, the sheet and the game page.
import { expect, test } from '@playwright/test';
import { expectAccessible, expectDiceJarCredit, expectSkipLink } from '@dice-jar/e2e-helpers';
import { createCharacter, startCharacter } from './helpers';

test('home, creation steps, sheet and game page have no accessibility violations', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Generate game' })).toBeVisible();
  await expectAccessible(page);
  await expectDiceJarCredit(page);

  const { gameUrl } = await startCharacter(page, expectAccessible); // abilities, careers, gear
  await expectAccessible(page); // details
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Wren');
  await page.getByRole('button', { name: 'Open sheet' }).click();
  await expect(page.getByRole('heading', { name: 'Wren' })).toBeVisible();
  await expectAccessible(page); // sheet
  await expectDiceJarCredit(page);

  await page.getByRole('link', { name: /Back to game/ }).click();
  await expect(page).toHaveURL(new RegExp(`${gameUrl}$`));
  await expect(page.getByRole('heading', { name: 'CHARACTERS' })).toBeVisible();
  await expectAccessible(page);
  await expectDiceJarCredit(page);
});

test('the home page, sheet and game page have no accessibility violations in dark mode', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await expectAccessible(page);

  const { gameUrl } = await createCharacter(page);
  await expectAccessible(page);
  await page.getByRole('link', { name: /Back to game/ }).click();
  await expect(page).toHaveURL(new RegExp(`${gameUrl}$`));
  await expect(page.getByRole('heading', { name: 'CHARACTERS' })).toBeVisible();
  await expectAccessible(page);
});

test('the skip link moves focus to the page', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Generate game' })).toBeVisible();
  await expectSkipLink(page);
});
