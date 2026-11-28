import { serveAlerts } from '@dice-jar/e2e-helpers';
import { expect, test, type Browser, type Page } from '@playwright/test';

test.beforeEach(({ context }) => serveAlerts(context));

// react-aria hides the real input under its label, so click the label like a person would.
const choose = (page: Page, text: string | RegExp) => page.locator('label.choice', { hasText: text }).first().click();
const next = (page: Page) => page.getByRole('button', { name: 'Next', exact: true }).click();
export const hp = (page: Page) => page.getByRole('group', { name: 'HP', exact: true }).locator('output');

/** A page in a new browser context: its own offline cache, so it only sees what reached the server. */
export async function freshPage(browser: Browser) {
  const context = await browser.newContext();
  await serveAlerts(context);
  return context.newPage();
}

/** Makes a game and a new character, and goes through every creation step but the last; ends on Details, unnamed. `atStep` runs on each step's page. */
export async function startCharacter(page: Page, atStep?: (page: Page) => Promise<void>) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Generate game' }).click();
  await page.getByRole('button', { name: 'New character' }).click();
  await page.waitForURL(/\/g\/[^/]+\/c\/[^/]+$/);
  const [gameId, characterId] = new URL(page.url()).pathname.match(/^\/g\/([^/]+)\/c\/([^/]+)$/)!.slice(1) as [string, string];

  await atStep?.(page);
  for (let i = 0; i < 2; i++) await page.getByRole('button', { name: 'Increase STR strength' }).click();
  await page.getByRole('button', { name: 'Increase CON constitution' }).click();
  await page.getByRole('button', { name: 'Roll hit points' }).click();
  await next(page);

  await atStep?.(page);
  await page.getByLabel('Career 1', { exact: true }).selectOption('acolyte');
  await page.getByLabel('Career 2', { exact: true }).selectOption('acrobat');
  await next(page);

  await atStep?.(page);
  await choose(page, 'Helmet');
  await page.getByRole('button', { name: 'Roll coins' }).click();
  await next(page);
  return { gameId, characterId, gameUrl: `/g/${gameId}` };
}

/** Names the character started by startCharacter and opens the sheet. */
export async function finishCharacter(page: Page) {
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Wren');
  await page.getByRole('button', { name: 'Open sheet' }).click();
  await expect(page.getByRole('heading', { name: 'Wren' })).toBeVisible();
}

/** A complete character (STR 2, CON 1, a helmet) in a new game; ends on the sheet. */
export async function createCharacter(page: Page) {
  const ids = await startCharacter(page);
  await finishCharacter(page);
  return { ...ids, characterUrl: page.url() };
}
