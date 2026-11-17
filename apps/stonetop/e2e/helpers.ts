import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { expect, type Browser, type Page } from '@playwright/test';
import { migrateGame } from '../scripts/migrateCore.ts';

/** A page in a new browser context: its own offline cache, so it only sees what reached the server. Close it with `await page.context().close()` when the test is done. */
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

// firebase-admin reads the emulator from FIRESTORE_EMULATOR_HOST, which `firebase emulators:exec` sets.
const admin = () => {
  if (!getApps().length) initializeApp({ projectId: 'demo-stonetop' });
  return getFirestore();
};

/** The real migration, run against the emulator: the game's characters and rolls become documents of their own. */
export const moveGame = async (id: string) => {
  const outcome = await migrateGame(admin(), id);
  if (outcome.status !== 'moved') throw new Error(`The game did not move: ${outcome.status}`);
};

/** The game as the server has it: the document, and the names of its characters in order. */
export const serverGame = async (id: string) => {
  const ref = admin().doc(`games/${id}`);
  const [game, characters] = await Promise.all([ref.get(), ref.collection('characters').orderBy('order').get()]);
  return {
    game: game.data(),
    characters: characters.docs.map((d) => ({ id: d.id, ...d.data() }) as { id: string; playbook: string; data?: { statXp?: string } }),
  };
};
