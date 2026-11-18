// What a player can type is cut to what firestore.rules accepts, and what is typed at the limit still saves.
import { expect, test } from '@playwright/test';
import { addCharacter, createGame, serverGame } from './helpers';

const NAME_LIMIT = 100;
const NOTATION_LIMIT = 500;

test('a character name stops at its limit, and the name that fits is saved', async ({ page }) => {
  const id = await createGame(page);
  await addCharacter(page, 'The Blessed');
  await page.goto(`/game/${id}/blessed`);

  await page.getByRole('button', { name: 'Edit character name' }).click();
  const field = page.getByRole('textbox', { name: 'Edit character name' });
  await field.pressSequentially('n'.repeat(NAME_LIMIT + 20)); // typing replaces the selected old name
  await expect(field).toHaveValue('n'.repeat(NAME_LIMIT));
  await page.keyboard.press('Enter');

  await expect.poll(async () => (await serverGame(id)).characters[0]?.name).toBe('n'.repeat(NAME_LIMIT));
});

test('dice notation stops at its limit, and a roll written at the limit reaches the shared log', async ({ page }) => {
  const id = await createGame(page);
  await addCharacter(page, 'The Blessed');
  await page.goto(`/game/${id}/blessed`);
  await page.getByRole('button', { name: 'Dice', exact: true }).click();

  const field = page.getByLabel('Dice notation');
  await field.pressSequentially('1'.repeat(NOTATION_LIMIT + 20));
  await expect(field).toHaveValue('1'.repeat(NOTATION_LIMIT));

  const notation = `d6${'+0'.repeat((NOTATION_LIMIT - 2) / 2)}`; // exactly the limit, and still a roll
  expect(notation).toHaveLength(NOTATION_LIMIT);
  await field.fill(notation);
  await field.press('Enter');
  await expect.poll(async () => (await serverGame(id)).rolls.map((r) => r.notation)).toEqual([notation]);
});
