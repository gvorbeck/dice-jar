// Runs firestore.rules in the Firestore emulator: `npm run test:rules` (needs Java 21+).
import { readFileSync } from 'node:fs';
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

let env: RulesTestEnvironment;
const db = () => env.unauthenticatedContext().firestore();
const G = 'games/g1';

// The shape src/lib/game.ts creates.
const game = (over: Record<string, unknown> = {}) => ({ name: '', createdAt: 1, characters: [], schemaVersion: 2, ...over });

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
  it('lets the first character be saved into a new game', async () => {
    await assertSucceeds(setDoc(doc(db(), 'games/new'), game()));
    await assertSucceeds(setDoc(doc(db(), 'games/new/characters/c1'), { id: 'c1', name: 'Ada', playbook: 'blessed', level: 1, order: 0 }));
  });
  it.each([
    ['a name that is not a string', { name: 7 }],
    ['a createdAt that is not a number', { createdAt: 'now' }],
    ['characters that are not a list', { characters: {} }],
    ['characters already in the list', { characters: [{ id: 'c1', name: 'x', playbook: 'blessed' }] }],
    ['a diceRolls list', { diceRolls: [] }],
    ['a key the app does not write', { steadingg: { name: 'Stonetop' } }],
  ])('rejects %s', async (_label, over) => {
    await assertFails(setDoc(doc(db(), 'games/new'), game(over)));
  });
  it('accepts every field the app writes', async () => {
    await assertSucceeds(
      setDoc(
        doc(db(), 'games/new'),
        game({ content: {}, threats: '', iWonder: '', steading: { size: 'village' }, notes: {}, notesLocks: {}, restoreToken: 'x' }),
      ),
    );
  });
  it('does not accept a game in the old shape: no schemaVersion, or version 1, 3, "2" or null', async () => {
    const { schemaVersion: _version, ...old } = game();
    await assertFails(setDoc(doc(db(), 'games/old'), old));
    for (const v of [1, 3, '2', null]) await assertFails(setDoc(doc(db(), 'games/old'), game({ schemaVersion: v })));
  });
});

describe('updating', () => {
  it('accepts a change that keeps the game valid', async () => {
    await assertSucceeds(updateDoc(doc(db(), G), { name: 'Renamed', 'steading.size': 'village' }));
  });
  it('rejects a change that breaks the shape', async () => {
    await assertFails(updateDoc(doc(db(), G), { name: 7 }));
    await assertFails(updateDoc(doc(db(), G), { characters: [{ id: 'c1', name: 'x', playbook: 'blessed' }] }));
    await assertFails(updateDoc(doc(db(), G), { diceRolls: [{ id: 'r1' }] }));
    await assertFails(updateDoc(doc(db(), G), { schemaVersion: 1 }));
  });
  it('rejects a key the app does not write', async () => {
    await assertFails(updateDoc(doc(db(), G), { surprise: 1 }));
  });
  it('keeps saving a game that carries a field the app does not write, as long as the save does not touch it', async () => {
    await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), 'games/kept'), game({ preserved: 'x' })));
    await assertSucceeds(updateDoc(doc(db(), 'games/kept'), { name: 'Renamed' }));
    await assertFails(updateDoc(doc(db(), 'games/kept'), { preserved: 'y' }));
  });
  it('rejects writing a whole game over it in the old shape', async () => {
    const { schemaVersion: _version, ...old } = game({ name: 'Overwritten' });
    await assertFails(setDoc(doc(db(), G), old)); // a whole-document restore would drop the version
  });
  it('lets a game saved without a name get one, and nothing else until it has', async () => {
    await env.withSecurityRulesDisabled((ctx) =>
      setDoc(doc(ctx.firestore(), 'games/nameless'), { createdAt: 1, characters: [], schemaVersion: 2 }),
    );
    await assertFails(updateDoc(doc(db(), 'games/nameless'), { 'steading.size': 'village' }));
    await assertSucceeds(updateDoc(doc(db(), 'games/nameless'), { name: '' }));
    await assertSucceeds(updateDoc(doc(db(), 'games/nameless'), { 'steading.size': 'village' }));
  });
  it('does not touch a game still in the old shape', async () => {
    await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), 'games/old'), { name: 'Old', createdAt: 1, characters: [] }));
    await assertFails(updateDoc(doc(db(), 'games/old'), { name: 'Renamed' }));
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

describe('characters and rolls subcollections', () => {
  const character = (over: Record<string, unknown> = {}) => ({ id: 'c1', name: 'Ada', playbook: 'blessed', level: 1, order: 0, ...over });
  const roll = (over: Record<string, unknown> = {}) => ({ id: 'r1', characterId: 'c1', createdAt: 1, order: 0, ...over });
  beforeEach(async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `${G}/characters/c1`), character());
      await setDoc(doc(ctx.firestore(), `${G}/rolls/r1`), roll());
    });
  });

  it('can be read and listed by anyone with the game ID', async () => {
    await assertSucceeds(getDoc(doc(db(), `${G}/characters/c1`)));
    await assertSucceeds(getDocs(collection(db(), `${G}/characters`)));
    await assertSucceeds(getDocs(collection(db(), `${G}/rolls`)));
  });
  it('can be created, changed and deleted on a version 2 game', async () => {
    await assertSucceeds(setDoc(doc(db(), `${G}/characters/c2`), character({ id: 'c2', order: 1 })));
    await assertSucceeds(updateDoc(doc(db(), `${G}/characters/c1`), { 'data.statStr': '+2' }));
    await assertSucceeds(deleteDoc(doc(db(), `${G}/characters/c2`)));
    await assertSucceeds(setDoc(doc(db(), `${G}/rolls/r2`), roll({ id: 'r2', order: 1 })));
    await assertSucceeds(updateDoc(doc(db(), `${G}/rolls/r1`), { mode: 'adv' }));
    await assertSucceeds(deleteDoc(doc(db(), `${G}/rolls/r2`)));
  });
  it.each([
    ['an id that is not the document id', { id: 'other' }],
    ['no name', { name: undefined }],
    ['a name that is not a string', { name: 7 }],
    ['a playbook that is not a string', { playbook: 7 }],
    ['no order', { order: undefined }],
    ['no level', { level: undefined }],
    ['a level that is not a number', { level: '1' }],
    ['a level out of range', { level: 101 }],
    ['a name over 200 characters', { name: 'x'.repeat(201) }],
    ['a playbook over 50 characters', { playbook: 'x'.repeat(51) }],
    ['data that is not a map', { data: 'x' }],
    ['more than 100 sheet fields', { data: Object.fromEntries(Array.from({ length: 101 }, (_, i) => [`f${i}`, i])) }],
    ['a key the app does not write', { surprise: 1 }],
  ])('rejects a character with %s', async (_label, over) => {
    const data = Object.fromEntries(Object.entries(character({ id: 'c9', ...over })).filter(([, v]) => v !== undefined));
    await assertFails(setDoc(doc(db(), `${G}/characters/c9`), data));
  });
  it.each([
    ['an id that is not the document id', { id: 'other' }],
    ['no character id', { characterId: undefined }],
    ['a createdAt that is not a number', { createdAt: 'now' }],
    ['no order', { order: undefined }],
    ['a mode that is not adv, dis or normal', { mode: 'lucky' }],
    ['more than 50 dice', { dice: Array.from({ length: 51 }, () => 1) }],
    ['dice that are not a list', { dice: 'x' }],
    ['a total that is not a number', { total: '8' }],
    ['a move name over 200 characters', { moveName: 'x'.repeat(201) }],
    ['a breakdown over 10000 characters', { breakdown: 'x'.repeat(10001) }],
    ['a burned that is not true or false', { burned: 'yes' }],
    ['a key the app does not write', { surprise: 1 }],
  ])('rejects a roll with %s', async (_label, over) => {
    const data = Object.fromEntries(Object.entries(roll({ id: 'r9', ...over })).filter(([, v]) => v !== undefined));
    await assertFails(setDoc(doc(db(), `${G}/rolls/r9`), data));
  });
  it('accepts the longest working the dice roller can produce', async () => {
    await assertSucceeds(setDoc(doc(db(), `${G}/rolls/r6`), roll({ id: 'r6', notation: 'x'.repeat(500), breakdown: 'x'.repeat(4000) })));
  });
  it('accepts every field the app writes on a character and a roll, including null where the app writes null', async () => {
    await assertSucceeds(setDoc(doc(db(), `${G}/characters/c5`), character({ id: 'c5', data: { statStr: '+1' } })));
    await assertSucceeds(
      setDoc(
        doc(db(), `${G}/rolls/r5`),
        roll({
          id: 'r5',
          characterName: 'Ada',
          moveName: 'Fight',
          stat: 'STR',
          resource: '+Favor',
          dice: [3, 4],
          dropped: null,
          mod: 1,
          total: 8,
          mode: 'adv',
          burned: true,
          band: null,
          notation: '2d6',
          breakdown: '[3, 4]',
        }),
      ),
    );
  });
  it('keeps saving a character or roll that carries a field the app does not write, as long as the save does not touch it', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `${G}/characters/kept`), character({ id: 'kept', preserved: 'x' }));
      await setDoc(doc(ctx.firestore(), `${G}/rolls/kept`), roll({ id: 'kept', preserved: 'x' }));
    });
    await assertSucceeds(updateDoc(doc(db(), `${G}/characters/kept`), { 'data.statStr': '+2' }));
    await assertSucceeds(updateDoc(doc(db(), `${G}/rolls/kept`), { mode: 'adv' }));
    await assertFails(updateDoc(doc(db(), `${G}/characters/kept`), { preserved: 'y' }));
    await assertFails(updateDoc(doc(db(), `${G}/rolls/kept`), { preserved: 'y' }));
  });
  it('is not writable on a game still in the old shape, so a game cannot end up with both shapes', async () => {
    await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), 'games/old'), { name: 'Old', createdAt: 1, characters: [] }));
    await assertFails(setDoc(doc(db(), 'games/old/characters/c1'), character()));
    await assertFails(setDoc(doc(db(), 'games/old/rolls/r1'), roll()));
  });
  it('is not writable on a game that does not exist', async () => {
    await assertFails(setDoc(doc(db(), 'games/ghost/characters/c1'), character()));
  });
  it('keeps every other subcollection denied', async () => {
    await assertFails(setDoc(doc(db(), `${G}/secrets/x`), { a: 1 }));
    await assertFails(getDoc(doc(db(), `${G}/secrets/x`)));
  });
});
