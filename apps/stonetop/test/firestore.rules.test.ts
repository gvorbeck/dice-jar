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

// Games moved to subcollections (schemaVersion 2). Only the migration script sets that, and it ignores the rules.
describe('schemaVersion', () => {
  const V2 = 'games/v2';
  const v2Game = (over: Record<string, unknown> = {}) => ({ name: 'Moved', createdAt: 1, characters: [], schemaVersion: 2, ...over });
  const seedV2 = () => env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), V2), v2Game()));

  it('lets a browser create a version 1 game, with or without the field', async () => {
    await assertSucceeds(setDoc(doc(db(), 'games/a'), game()));
    await assertSucceeds(setDoc(doc(db(), 'games/b'), game({ schemaVersion: 1 })));
  });
  it.each([2, 3, '1', null])('does not let a browser create a game with schemaVersion %s', async (v) => {
    await assertFails(setDoc(doc(db(), 'games/new'), game({ schemaVersion: v })));
  });
  it('does not let a browser move a game to version 2, or back', async () => {
    await assertFails(updateDoc(doc(db(), G), { schemaVersion: 2 }));
    await seedV2();
    await assertFails(updateDoc(doc(db(), V2), { schemaVersion: 1 }));
    await assertFails(setDoc(doc(db(), V2), game({ name: 'Overwritten' }))); // a whole-document restore would drop the version
  });
  it('keeps writing a version 2 game as long as it stays empty of characters and rolls', async () => {
    await seedV2();
    await assertSucceeds(updateDoc(doc(db(), V2), { name: 'Renamed', 'steading.size': 'village' }));
  });
  it('refuses characters or rolls written back into a version 2 game, as a version 1 tab would', async () => {
    await seedV2();
    await assertFails(updateDoc(doc(db(), V2), { characters: [{ id: 'c1', name: 'x', playbook: 'blessed' }] }));
    await assertFails(updateDoc(doc(db(), V2), { diceRolls: [{ id: 'r1' }] }));
  });
});

describe('characters and rolls subcollections', () => {
  const V2 = 'games/v2';
  const character = (over: Record<string, unknown> = {}) => ({ id: 'c1', name: 'Ada', playbook: 'blessed', level: 1, order: 0, ...over });
  const roll = (over: Record<string, unknown> = {}) => ({ id: 'r1', characterId: 'c1', createdAt: 1, order: 0, ...over });
  beforeEach(async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), V2), { name: 'Moved', createdAt: 1, characters: [], schemaVersion: 2 });
      await setDoc(doc(ctx.firestore(), `${V2}/characters/c1`), character());
      await setDoc(doc(ctx.firestore(), `${V2}/rolls/r1`), roll());
    });
  });

  it('can be read and listed by anyone with the game ID', async () => {
    await assertSucceeds(getDoc(doc(db(), `${V2}/characters/c1`)));
    await assertSucceeds(getDocs(collection(db(), `${V2}/characters`)));
    await assertSucceeds(getDocs(collection(db(), `${V2}/rolls`)));
  });
  it('can be created, changed and deleted on a version 2 game', async () => {
    await assertSucceeds(setDoc(doc(db(), `${V2}/characters/c2`), character({ id: 'c2', order: 1 })));
    await assertSucceeds(updateDoc(doc(db(), `${V2}/characters/c1`), { 'data.statStr': '+2' }));
    await assertSucceeds(deleteDoc(doc(db(), `${V2}/characters/c2`)));
    await assertSucceeds(setDoc(doc(db(), `${V2}/rolls/r2`), roll({ id: 'r2', order: 1 })));
    await assertSucceeds(updateDoc(doc(db(), `${V2}/rolls/r1`), { mode: 'adv' }));
    await assertSucceeds(deleteDoc(doc(db(), `${V2}/rolls/r2`)));
  });
  it.each([
    ['an id that is not the document id', { id: 'other' }],
    ['no name', { name: undefined }],
    ['a name that is not a string', { name: 7 }],
    ['a playbook that is not a string', { playbook: 7 }],
    ['no order', { order: undefined }],
    ['more than 40 fields', Object.fromEntries(Array.from({ length: 40 }, (_, i) => [`f${i}`, i]))],
  ])('rejects a character with %s', async (_label, over) => {
    const data = Object.fromEntries(Object.entries(character(over)).filter(([, v]) => v !== undefined));
    await assertFails(setDoc(doc(db(), `${V2}/characters/c9`), data));
  });
  it.each([
    ['an id that is not the document id', { id: 'other' }],
    ['no character id', { characterId: undefined }],
    ['a createdAt that is not a number', { createdAt: 'now' }],
    ['no order', { order: undefined }],
  ])('rejects a roll with %s', async (_label, over) => {
    const data = Object.fromEntries(Object.entries(roll(over)).filter(([, v]) => v !== undefined));
    await assertFails(setDoc(doc(db(), `${V2}/rolls/r9`), data));
  });
  it('is not writable on a version 1 game, so a game cannot end up with both shapes', async () => {
    await assertFails(setDoc(doc(db(), `${G}/characters/c1`), character()));
    await assertFails(setDoc(doc(db(), `${G}/rolls/r1`), roll()));
  });
  it('is not writable on a game that does not exist', async () => {
    await assertFails(setDoc(doc(db(), 'games/ghost/characters/c1'), character()));
  });
  it('keeps every other subcollection denied', async () => {
    await assertFails(setDoc(doc(db(), `${V2}/secrets/x`), { a: 1 }));
    await assertFails(getDoc(doc(db(), `${V2}/secrets/x`)));
  });
});
