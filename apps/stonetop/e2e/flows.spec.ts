// What a table does: start a game, build a party, come back later (or from another device) and find it as left.
import { expect, test } from '@playwright/test';
import { addCharacter, createGame, freshPage } from './helpers';

test('a game and its party survive a visit from another device', async ({ page, browser }) => {
  const id = await createGame(page);
  await addCharacter(page, 'The Blessed');
  await addCharacter(page, 'The Fox');
  await expect(page.getByRole('link', { name: /The Blessed Playbook/ })).toBeVisible();

  const other = await freshPage(browser); // its own cache: it sees only what reached the server
  await other.goto(`/game/${id}`);
  await expect(other.getByRole('link', { name: /The Blessed Playbook/ })).toBeVisible();
  await expect(other.getByRole('link', { name: /The Fox Playbook/ })).toBeVisible();
  await other.context().close();
});

test('the order of the party can be changed from the keyboard buttons and is saved', async ({ page, browser }) => {
  const id = await createGame(page);
  await addCharacter(page, 'The Blessed');
  await addCharacter(page, 'The Fox');

  // The move buttons are collapsed until they take keyboard focus, so reach them the way a keyboard user does.
  await page.getByRole('button', { name: /^Move The Blessed .* down$/ }).focus();
  await page.keyboard.press('Enter');

  const links = (p: typeof page) => p.getByRole('gridcell').getByRole('link');
  await expect(links(page).first()).toContainText('The Fox');

  const other = await freshPage(browser);
  await other.goto(`/game/${id}`);
  await expect(links(other).first()).toContainText('The Fox');
  await other.context().close();
});

test('a character can be removed after confirming', async ({ page }) => {
  await createGame(page);
  await addCharacter(page, 'The Blessed');
  await page.getByRole('button', { name: /^Remove The Blessed/ }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /^Remove/ })
    .click();
  await expect(page.getByRole('link', { name: /The Blessed Playbook/ })).toBeHidden();
  await expect(page.getByText('Your party roster is empty')).toBeVisible();
});

test('an existing game can be joined from the home page by its ID', async ({ page, browser }) => {
  const id = await createGame(page);
  const other = await freshPage(browser);
  await other.goto('/');
  await other.getByLabel('Game ID').fill(id);
  await other.getByRole('button', { name: /^Join/ }).click();
  await other.waitForURL(new RegExp(`/game/${id}$`));
  await expect(other.getByRole('heading', { name: 'Characters' })).toBeVisible();
  await other.context().close();
});

test('a character sheet edit is saved for the next visitor', async ({ page, browser }) => {
  const id = await createGame(page);
  await addCharacter(page, 'The Blessed');
  await page.goto(`/game/${id}/blessed`);
  const xp = page.getByLabel('XP', { exact: true });
  await xp.fill('3');
  await xp.blur();

  const other = await freshPage(browser);
  await other.goto(`/game/${id}/blessed`);
  await expect(other.getByLabel('XP', { exact: true })).toHaveValue('3');
  await other.context().close();
});

test('each page sets its own tab title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Hearthfire — Stonetop Party Tracker');
  const id = await createGame(page);
  await expect(page).toHaveTitle(/ — Hearthfire$/);
  await page.goto(`/game/${id}/gm`);
  await expect(page).toHaveTitle(/^GM Playbook — /);
});

test('Burn Brightly spends 2 XP for +1 once the character can level up, and the XP is saved', async ({ page, browser }) => {
  const id = await createGame(page);
  await addCharacter(page, 'The Blessed');
  await page.goto(`/game/${id}/blessed`);
  const xp = page.getByLabel('XP', { exact: true });
  await xp.fill('3');
  await xp.blur();

  await page.getByRole('button', { name: 'Basic Moves' }).click();
  await page.getByRole('button', { name: 'Roll +STR' }).first().click();
  await expect(page.getByRole('button', { name: /Burn Brightly/ })).toBeHidden(); // 3 XP is short of the 8 needed at level 1

  await xp.fill('8');
  await xp.blur();
  await page.getByRole('button', { name: 'Roll +STR' }).first().click();
  await page.getByRole('button', { name: /Burn Brightly/ }).click();
  await expect(xp).toHaveValue('6');

  const other = await freshPage(browser);
  await other.goto(`/game/${id}/blessed`);
  await expect(other.getByLabel('XP', { exact: true })).toHaveValue('6');
  await other.context().close();
});

// Book 1, pp. 40, 52, 230: stats stop at +2, and a debility's disadvantage is cancelled by advantage.
test('a stat stops at +2, and advantage cancels a marked debility', async ({ page }) => {
  const id = await createGame(page);
  await addCharacter(page, 'The Blessed');
  await page.goto(`/game/${id}/blessed`);

  const str = page.getByLabel('Strength', { exact: true });
  await str.fill('3');
  await expect(str).toHaveValue('2');

  await page.locator('label', { hasText: 'weakened' }).first().click();
  await page.getByRole('button', { name: 'Basic Moves' }).click();
  await page.getByRole('button', { name: 'Roll +STR' }).first().click();
  await expect(page.getByText('Debility: disadvantage.').first()).toBeVisible();
  await page.getByRole('button', { name: 'Adv', exact: true }).first().click();
  await expect(page.getByText('Advantage cancels your debility.')).toHaveCount(1);
});
