import { expect, test } from '@playwright/test';
import { createCharacter, finishCharacter, freshPage, hp, startCharacter } from './helpers';

test('a character goes from creation to the roll log', async ({ page }) => {
  const { gameUrl } = await createCharacter(page);
  await expect(page.getByText(/Armor Class\s*12/)).toBeVisible(); // 11 + a helmet (p. 38)
  await expect(page.getByRole('listitem').filter({ hasText: 'candlestick' })).toBeVisible(); // acolyte's items

  await page.getByRole('button', { name: 'Roll d20' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Check (STR)' })).toBeVisible();

  await page.getByLabel('Dice', { exact: true }).fill('2d6+1');
  await page.getByRole('button', { name: 'Roll dice' }).click();
  await expect(page.getByRole('status').filter({ hasText: '2d6+1' })).toBeVisible();
  await page.getByLabel('Dice', { exact: true }).fill('nope');
  await page.getByRole('button', { name: 'Roll dice' }).click();
  await expect(page.getByRole('alert').filter({ hasText: /\S/ })).toBeVisible();

  await page.getByRole('link', { name: /Back to game/ }).click();
  await expect(page).toHaveURL(new RegExp(`${gameUrl}$`));
  await expect(page.getByRole('link', { name: 'Wren' }).first()).toBeVisible();
  await expect(page.getByRole('cell', { name: /Check \(STR\)/ })).toBeVisible();
  await expect(page.getByRole('cell', { name: /2d6\+1/ })).toBeVisible();
});

test('the sheet blocks Open sheet until creation is complete', async ({ page }) => {
  await startCharacter(page);
  await expect(page.getByRole('button', { name: 'Open sheet' })).toBeDisabled();
  await expect(page.getByText('Name your character')).toBeVisible();
  await finishCharacter(page);
});

test('what changes on the sheet reaches the server', async ({ page, browser }) => {
  const { characterUrl } = await createCharacter(page);
  const before = Number(await hp(page).textContent());
  await page.getByRole('button', { name: 'Decrease HP' }).click();
  await page.getByRole('button', { name: 'Increase Wounds' }).click();
  await page.getByRole('textbox', { name: 'Notes' }).fill('Owes the innkeeper');

  const other = await freshPage(browser); // its own cache: only what the server has
  await expect(async () => {
    await other.goto(characterUrl);
    await expect(hp(other)).toHaveText(String(before - 1), { timeout: 1000 });
    await expect(other.getByRole('textbox', { name: 'Notes' })).toHaveValue('Owes the innkeeper', { timeout: 1000 });
  }).toPass();
  await expect(other.getByRole('group', { name: 'Wounds' }).locator('output')).toHaveText('1');
  await other.context().close();
});

test('a character with the XP for the next level levels up', async ({ page }) => {
  await createCharacter(page);
  await expect(page.getByRole('button', { name: 'Creation steps' })).toBeHidden(); // its rolls would overwrite a played sheet
  await page.getByRole('textbox', { name: 'XP' }).fill('2000');
  await page.getByRole('textbox', { name: 'XP' }).press('Tab');
  await expect(page.getByRole('heading', { name: 'LEVEL UP' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Level up', exact: true })).toBeDisabled();
  for (const a of ['STR', 'DEX', 'INT']) await page.locator('label.choice', { hasText: new RegExp(`^${a} `) }).click();
  await page.getByRole('button', { name: 'Level up', exact: true }).click();
  await expect(page.getByText(/Level 2 Lowlife/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Creation steps' })).toBeHidden(); // its rolls would overwrite a played sheet
  await expect(page.getByRole('heading', { name: 'LEVEL UP' })).toBeHidden();
});

test('a game lists its characters, and a character can be deleted', async ({ page }) => {
  const { gameUrl } = await createCharacter(page);
  await page.getByRole('link', { name: /Back to game/ }).click();
  await expect(page).toHaveURL(new RegExp(`${gameUrl}$`));
  await page.getByRole('button', { name: 'Delete Wren' }).click();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.getByText('No characters yet.')).toBeVisible();
});

test('a game that does not exist offers to create it', async ({ page }) => {
  await page.goto('/g/brand-new-game');
  await expect(page.getByRole('heading', { name: 'No such game' })).toBeVisible();
  await page.getByRole('button', { name: 'Create game brand-new-game' }).click();
  await expect(page.getByRole('heading', { name: 'Game brand-new-game' })).toBeVisible();
});

test('the home page opens a game by ID and remembers it', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Generate game' }).click();
  await expect(page).toHaveURL(/\/g\/[^/]+$/);
  const id = new URL(page.url()).pathname.split('/').pop()!;
  await expect(page.getByRole('heading', { name: `Game ${id}` })).toBeVisible(); // the game is remembered once it has loaded
  await page.goto('/');
  await expect(page.getByRole('link', { name: id })).toBeVisible();
  await page.getByLabel('Game ID').fill(id);
  await page.getByRole('button', { name: 'Open', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/g/${id}$`));
});

test('a sheet whose name was cleared still opens as the sheet, not the creator', async ({ page, browser }) => {
  const { characterUrl } = await createCharacter(page);
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('');
  await expect(page.getByRole('heading', { name: 'Unnamed' })).toBeVisible();

  const other = await freshPage(browser); // its own cache: only what the server has
  await expect(async () => {
    await other.goto(characterUrl);
    await expect(other.getByRole('heading', { name: 'Unnamed' })).toBeVisible({ timeout: 1000 });
  }).toPass();
  await expect(other.getByRole('heading', { name: 'Create a character' })).toBeHidden();
  await other.context().close();
});

test('a dead character cannot rest', async ({ page }) => {
  await createCharacter(page); // CON 1: 11 slots
  const rest = page.getByRole('button', { name: 'Rest: HP to maximum' });
  await expect(rest).toBeEnabled();
  for (let i = 0; i < 11; i++) await page.getByRole('button', { name: 'Increase Wounds' }).click();
  await expect(page.getByText(/this character is dead/)).toBeVisible();
  await expect(rest).toBeDisabled();
});
