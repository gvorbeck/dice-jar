import AxeBuilder from '@axe-core/playwright';
import { expect, type Browser, type Page } from '@playwright/test';

// shortcut: copied from delta-green's e2e/helpers.ts; move both to packages/ in the shared-code PR, before a third app needs it.
/** Fails with the list of accessibility violations (axe) on whatever the page shows now. */
export const expectAccessible = async (page: Page) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; }' }); // axe reads a colour mid-transition
  await expect(page.getByRole('main')).toBeVisible(); // past the loading fallback
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => `${n.target} (${n.any[0]?.message ?? ''})`).join(' | ')}`)).toEqual([]);
};

/** A page in a new browser context: its own offline cache, so it only sees what reached the server. */
export const freshPage = async (browser: Browser) => (await browser.newContext()).newPage();

/** Creates a game from the home page and returns its ID. Ends on the game page. */
export const createGame = async (page: Page) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Create Game' }).click();
  await page.waitForURL(/\/game\/[^/]+$/);
  await page.getByRole('button', { name: 'Got it' }).click(); // the new-game ID dialog
  await expect(page.getByRole('heading', { name: 'Characters' })).toBeVisible();
  return new URL(page.url()).pathname.split('/').pop()!;
};

/** Adds a character with the given playbook label from the game page. */
export const addCharacter = async (page: Page, playbook: string) => {
  await page.getByRole('button', { name: 'Add Character Playbook' }).click();
  await page.getByRole('dialog').getByLabel('Playbook').selectOption({ label: playbook });
  await page.getByRole('dialog').getByRole('button', { name: /^Add/ }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
};
