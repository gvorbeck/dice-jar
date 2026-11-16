// Every page, scanned with axe: home, game, GM playbook, steading, a character sheet and the not-found page.
import { expect, test } from '@playwright/test';
import { expectAccessible } from '@dice-jar/e2e-helpers';
import { addCharacter, createGame } from './helpers';

test('every page has no accessibility violations', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Create Game' })).toBeVisible();
  await expectAccessible(page);

  const id = await createGame(page);
  await expectAccessible(page); // empty game

  await addCharacter(page, 'The Blessed');
  await expectAccessible(page); // game with a character

  await page.goto(`/game/${id}/blessed`);
  await expectAccessible(page);

  await page.goto(`/game/${id}/gm`);
  await expectAccessible(page);

  await page.goto(`/game/${id}/steading`);
  await expectAccessible(page);

  await page.goto('/no/such/page');
  await expectAccessible(page);
});

test('home, game and a character sheet have no accessibility violations in dark mode', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await expectAccessible(page);
  const id = await createGame(page);
  await expectAccessible(page);
  await addCharacter(page, 'The Blessed');
  await page.goto(`/game/${id}/blessed`);
  await expectAccessible(page);
});
