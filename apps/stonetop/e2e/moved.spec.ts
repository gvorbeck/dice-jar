// A game moved to subcollections (MIGRATION.md) has to behave exactly like any other for the people playing it.
// Each test builds a game through the app, moves it the way the migration will, then plays on.
import { expect, test } from '@playwright/test';
import { addCharacter, createGame, freshPage, moveGame, serverGame } from './helpers';

test('a moved game shows its party to another device, and that device can change it', async ({ page, browser }) => {
  const id = await createGame(page);
  await addCharacter(page, 'The Blessed');
  await addCharacter(page, 'The Fox');
  await moveGame(id);

  const other = await freshPage(browser);
  await other.goto(`/game/${id}`);
  await expect(other.getByRole('link', { name: /The Blessed Playbook/ })).toBeVisible();
  await expect(other.getByRole('link', { name: /The Fox Playbook/ })).toBeVisible();

  await addCharacter(other, 'The Judge');
  await expect(other.getByRole('link', { name: /The Judge Playbook/ })).toBeVisible();

  // The first device sees the new character without reloading.
  await expect(page.getByRole('link', { name: /The Judge Playbook/ })).toBeVisible();

  const { game, characters } = await serverGame(id);
  expect(characters.map((c) => c.playbook)).toEqual(['blessed', 'fox', 'judge']);
  expect(game?.characters).toEqual([]); // nothing was saved back into the old array
  expect(game?.schemaVersion).toBe(2);
  await other.context().close();
});

test('the order of a moved game party can be changed and is saved', async ({ page, browser }) => {
  const id = await createGame(page);
  await addCharacter(page, 'The Blessed');
  await addCharacter(page, 'The Fox');
  await moveGame(id); // the open page finds out from its own listener, as a table would mid-session
  await expect(page.getByRole('link', { name: /The Fox Playbook/ })).toBeVisible();

  // The page re-renders once while it switches to the moved game, so keep trying until the focus holds.
  const down = page.getByRole('button', { name: /^Move The Blessed .* down$/ });
  await expect(async () => {
    await down.focus();
    await expect(down).toBeFocused();
  }).toPass();
  await page.keyboard.press('Enter');
  const links = (p: typeof page) => p.getByRole('gridcell').getByRole('link');
  await expect(links(page).first()).toContainText('The Fox');

  const other = await freshPage(browser);
  await other.goto(`/game/${id}`);
  await expect(links(other).first()).toContainText('The Fox');
  expect((await serverGame(id)).characters.map((c) => c.playbook)).toEqual(['fox', 'blessed']);
  await other.context().close();
});

test('a character can be removed from a moved game', async ({ page }) => {
  const id = await createGame(page);
  await addCharacter(page, 'The Blessed');
  await addCharacter(page, 'The Fox');
  await moveGame(id); // the open page finds out from its own listener, as a table would mid-session
  await expect(page.getByRole('link', { name: /The Fox Playbook/ })).toBeVisible();

  await page.getByRole('button', { name: /^Remove The Blessed/ }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /^Remove/ })
    .click();
  await expect(page.getByRole('link', { name: /The Blessed Playbook/ })).toBeHidden();
  await expect.poll(async () => (await serverGame(id)).characters.map((c) => c.playbook)).toEqual(['fox']);
});

test('a character sheet edit on a moved game is saved to that character', async ({ page, browser }) => {
  const id = await createGame(page);
  await addCharacter(page, 'The Blessed');
  await moveGame(id);

  await page.goto(`/game/${id}/blessed`);
  const xp = page.getByLabel('XP', { exact: true });
  await xp.fill('3');
  await xp.blur();

  const other = await freshPage(browser);
  await other.goto(`/game/${id}/blessed`);
  await expect(other.getByLabel('XP', { exact: true })).toHaveValue('3');
  await expect.poll(async () => (await serverGame(id)).characters[0]?.data?.statXp).toBe('3');
  await other.context().close();
});
