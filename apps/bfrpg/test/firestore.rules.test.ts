// Runs firestore.rules in the Firestore emulator: `npm run test:rules` (needs Java 21+).
import { readFileSync } from 'node:fs';
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

let env: RulesTestEnvironment;
const owner = () => env.authenticatedContext('alice').firestore();
const other = () => env.authenticatedContext('bob').firestore();
const anon = () => env.unauthenticatedContext().firestore();

beforeAll(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-bfrpg', firestore: { rules: readFileSync('firestore.rules', 'utf8') } });
});
afterAll(() => env.cleanup());
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'users/alice/characters/c1'), { name: 'Brother Marcus' });
    await setDoc(doc(ctx.firestore(), 'users/alice/games/g1'), { name: 'Keep on the Borderlands' });
  });
});

for (const kind of ['characters', 'games']) {
  const path = `users/alice/${kind}/${kind === 'games' ? 'g1' : 'c1'}`;
  describe(kind, () => {
    it(kind === 'characters' ? 'anyone with the link can read one document' : 'only the owner can read one document', async () => {
      await assertSucceeds(getDoc(doc(owner(), path)));
      const readable = kind === 'characters' ? assertSucceeds : assertFails;
      await readable(getDoc(doc(anon(), path)));
      await readable(getDoc(doc(other(), path)));
    });
    it('only the owner can list', async () => {
      await assertSucceeds(getDocs(collection(owner(), `users/alice/${kind}`)));
      await assertFails(getDocs(collection(other(), `users/alice/${kind}`)));
      await assertFails(getDocs(collection(anon(), `users/alice/${kind}`)));
    });
    it('only the owner can create, update and delete', async () => {
      await assertSucceeds(setDoc(doc(owner(), `users/alice/${kind}/new`), { name: 'New' }));
      await assertSucceeds(updateDoc(doc(owner(), path), { name: 'Renamed' }));
      for (const db of [other(), anon()]) {
        await assertFails(setDoc(doc(db, `users/alice/${kind}/new2`), { name: 'X' }));
        await assertFails(updateDoc(doc(db, path), { name: 'X' }));
        await assertFails(deleteDoc(doc(db, path)));
      }
      await assertSucceeds(deleteDoc(doc(owner(), path)));
    });
  });
}

it('nothing else under a user is readable or writable', async () => {
  await assertFails(getDoc(doc(owner(), 'users/alice/secrets/s1')));
  await assertFails(setDoc(doc(owner(), 'users/alice/secrets/s1'), { a: 1 }));
  await assertFails(setDoc(doc(owner(), 'elsewhere/e1'), { a: 1 }));
});
