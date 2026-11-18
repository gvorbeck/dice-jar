// Games live in subcollections (MIGRATION.md); a game still in the old shape is refused rather than shown half-empty.
import { expect, test } from '@playwright/test';
import { addCharacter, createGame, createOldShapeGame, freshPage, moveGame, serverGame } from './helpers';

test('a new game shows its party to another device, and that device can change it', async ({ page, browser }) => {
  const id = await createGame(page);
  await addCharacter(page, 'The Blessed');
  await addCharacter(page, 'The Fox');

  await expect.poll(async () => (await serverGame(id)).characters.length).toBe(2); // the other device only sees what reached the server
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

test('the order of a new game party can be changed and is saved', async ({ page, browser }) => {
  const id = await createGame(page);
  await addCharacter(page, 'The Blessed');
  await addCharacter(page, 'The Fox');
  await expect(page.getByRole('link', { name: /The Fox Playbook/ })).toBeVisible();

  await page.getByRole('button', { name: /^Move The Blessed .* down$/ }).focus();
  await page.keyboard.press('Enter');
  const links = (p: typeof page) => p.getByRole('gridcell').getByRole('link');
  await expect(links(page).first()).toContainText('The Fox');

  await expect.poll(async () => (await serverGame(id)).characters.map((c) => c.playbook)).toEqual(['fox', 'blessed']);
  const other = await freshPage(browser);
  await other.goto(`/game/${id}`);
  await expect(links(other).first()).toContainText('The Fox');
  expect((await serverGame(id)).characters.map((c) => c.playbook)).toEqual(['fox', 'blessed']);
  await other.context().close();
});

test('a character can be removed from a new game', async ({ page }) => {
  const id = await createGame(page);
  await addCharacter(page, 'The Blessed');
  await addCharacter(page, 'The Fox');
  await expect(page.getByRole('link', { name: /The Fox Playbook/ })).toBeVisible();

  await page.getByRole('button', { name: /^Remove The Blessed/ }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /^Remove/ })
    .click();
  await expect(page.getByRole('link', { name: /The Blessed Playbook/ })).toBeHidden();
  await expect.poll(async () => (await serverGame(id)).characters.map((c) => c.playbook)).toEqual(['fox']);
});

test('a character sheet edit on a new game is saved to that character', async ({ page, browser }) => {
  const id = await createGame(page);
  await addCharacter(page, 'The Blessed');

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

test('a game still in the old shape is not shown with its characters missing, and opens once it is moved', async ({ page }) => {
  const id = `old-shape-${Date.now()}`;
  await createOldShapeGame(id);
  await page.goto(`/game/${id}`);
  await expect(page.getByText(/couldn't be read/)).toBeVisible();

  await moveGame(id); // the open page finds out from its own listener
  await expect(page.getByRole('heading', { name: 'Characters' })).toBeVisible();
  await addCharacter(page, 'The Fox');
  expect((await serverGame(id)).characters.map((c) => c.playbook)).toEqual(['fox']);
});
