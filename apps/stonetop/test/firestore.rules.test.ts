// Runs firestore.rules in the Firestore emulator: `npm run test:rules` (needs Java 21+).
import { readFileSync } from 'node:fs';
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

let env: RulesTestEnvironment;
const db = () => env.unauthenticatedContext().firestore();
const G = 'games/g1';

// The shape src/lib/game.ts creates.
const game = (over: Record<string, unknown> = {}) => ({ name: '', createdAt: 1, characters: [], ...over });

beforeAll(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-stonetop', firestore: { rules: readFileSync('firestore.rules', 'utf8') } });
});
afterAll(() => env.cleanup());
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), G), game({ name: 'Stonetop' })));
});

describe('reading', () => {
  it('lets anyone with the ID read a game', async () => {
    await assertSucceeds(getDoc(doc(db(), G)));
  });
  it('does not let anyone list games, so IDs cannot be enumerated', async () => {
    await assertFails(getDocs(collection(db(), 'games')));
  });
});

describe('creating', () => {
  it('accepts a new game', async () => {
    await assertSucceeds(setDoc(doc(db(), 'games/new'), game()));
  });
  it.each([
    ['a name that is not a string', { name: 7 }],
    ['a createdAt that is not a number', { createdAt: 'now' }],
    ['characters that are not a list', { characters: {} }],
    ['more than 20 characters', { characters: Array.from({ length: 21 }, (_, i) => ({ id: String(i) })) }],
  ])('rejects %s', async (_label, over) => {
    await assertFails(setDoc(doc(db(), 'games/new'), game(over)));
  });
  it('accepts exactly 20 characters', async () => {
    await assertSucceeds(setDoc(doc(db(), 'games/new'), game({ characters: Array.from({ length: 20 }, (_, i) => ({ id: String(i) })) })));
  });
  // shortcut: new top-level keys are allowed because the schema grows by adding fields; tighten with the data migration.
  it('allows an extra top-level key', async () => {
    await assertSucceeds(setDoc(doc(db(), 'games/new'), game({ steading: { name: 'Stonetop' } })));
  });
});

describe('updating', () => {
  it('accepts a change that keeps the game valid', async () => {
    await assertSucceeds(updateDoc(doc(db(), G), { name: 'Renamed' }));
  });
  it('rejects a change that breaks the shape', async () => {
    await assertFails(updateDoc(doc(db(), G), { name: 7 }));
    await assertFails(updateDoc(doc(db(), G), { characters: Array.from({ length: 21 }, (_, i) => ({ id: String(i) })) }));
  });
});

describe('deleting and other paths', () => {
  it('never deletes a game', async () => {
    await assertFails(deleteDoc(doc(db(), G)));
  });
  it('denies every path outside games', async () => {
    await assertFails(getDoc(doc(db(), 'other/x')));
    await assertFails(setDoc(doc(db(), 'other/x'), { a: 1 }));
    await assertFails(getDoc(doc(db(), `${G}/sub/x`)));
  });
});
