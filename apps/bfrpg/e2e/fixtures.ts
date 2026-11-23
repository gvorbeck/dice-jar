import { randomUUID } from 'node:crypto';
import { test as base } from '@playwright/test';
import { serveAlerts } from '@dice-jar/e2e-helpers';
import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth } from 'firebase/auth';

const PASSWORD = 'password123';

/** A new user in the Auth emulator, so tests never share data. Returns the email. */
async function newUser() {
  const auth = getAuth(initializeApp({ apiKey: 'demo', projectId: 'demo-bfrpg' }, randomUUID()));
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  const email = `developer@${randomUUID().slice(0, 8)}.test`;
  await createUserWithEmailAndPassword(auth, email, PASSWORD);
  return email;
}

/**
 * Every test starts signed in as its own new user (through the app's sign-in form),
 * holding the sample characters and games, saved through the app's own services.
 */
export const test = base.extend<{ signedIn: void; alertsStubbed: void }>({
  // Every test, signed in or not, so none reads the live alerts file.
  alertsStubbed: [
    async ({ context }, use) => {
      await serveAlerts(context);
      await use();
    },
    { auto: true },
  ],
  signedIn: [
    async ({ page }, use) => {
      const email = await newUser();
      const size = page.viewportSize();
      await page.setViewportSize({ width: 1280, height: 900 }); // the phone header hides Sign In in a menu
      await page.goto('/');
      await page.getByRole('button', { name: 'Sign In' }).first().click();
      await page.getByLabel('Email address').first().fill(email);
      await page.getByLabel('Password').first().fill(PASSWORD);
      await page.getByRole('dialog').getByRole('button', { name: 'Sign In' }).click();
      await page.getByRole('button', { name: 'Sign Out' }).waitFor();

      // The dev server serves the app's source, so the page can import its services by URL (typed here from the same files).
      await page.evaluate(async () => {
        const load = (path: string) => import(/* @vite-ignore */ path);
        const { auth } = (await load('/src/lib/firebase.ts')) as typeof import('../src/lib/firebase');
        const { saveCharacter, saveGame } = (await load('/src/services/index.ts')) as typeof import('../src/services');
        const { getAllSampleCharacters } = (await load('/src/data/sampleCharacters.ts')) as typeof import('../src/data/sampleCharacters');
        const { getAllSampleGames } = (await load('/src/data/sampleGames.ts')) as typeof import('../src/data/sampleGames');
        const uid = auth.currentUser?.uid as string;
        await Promise.all([
          ...getAllSampleCharacters().map((c) => saveCharacter(uid, c)),
          ...getAllSampleGames().map(({ id: _id, ...game }) => saveGame(uid, game)),
        ]);
      });
      if (size) await page.setViewportSize(size);
      await page.reload();
      await use();
    },
    { auto: true },
  ],
});
export { expect } from '@playwright/test';
