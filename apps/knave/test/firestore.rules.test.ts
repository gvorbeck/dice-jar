// Runs firestore.rules in the Firestore emulator: `npm run test:rules` (needs Java 21+).
// Documents are built with the app's own model code, so a schema change that the rules would reject fails here.
import { readFileSync } from 'node:fs';
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { newCharacter, summary, type Character } from '../src/model/character';

let env: RulesTestEnvironment;
const db = () => env.unauthenticatedContext().firestore();
const G = 'games/g1';

const character = (over: Partial<Character> = {}) => {
  const c = { ...newCharacter(), name: 'Wren', hp: 4, hpMax: 4, ...over };
  return { ...summary(c), character: c, createdAt: 1, updatedAt: 1 };
};
const roll = (over: Record<string, unknown> = {}) => ({
  characterId: 'c1',
  characterName: 'Wren',
  label: 'Check (STR)',
  detail: 'd20 12 + 1 STR = 13 against 16: failure',
  total: 13,
  createdAt: serverTimestamp(),
  ...over,
});

beforeAll(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-knave', firestore: { rules: readFileSync('firestore.rules', 'utf8') } });
});
afterAll(() => env.cleanup());
beforeEach(async () => {
  await env.clearFirestore();
  // Seed with rules off.
  await env.withSecurityRulesDisabled(async (ctx) => {
    const d = ctx.firestore();
    await setDoc(doc(d, G), { createdAt: 1, schemaVersion: 1 });
    await setDoc(doc(d, `${G}/characters/c1`), character());
    await setDoc(doc(d, `${G}/rolls/r1`), roll());
  });
});

describe('global alert', () => {
  it('can be read by anyone, but not listed or written from a browser', async () => {
    await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), 'alerts/current'), { messages: [] }));
    await assertSucceeds(getDoc(doc(db(), 'alerts/current')));
    await assertFails(getDocs(collection(db(), 'alerts')));
    await assertFails(setDoc(doc(db(), 'alerts/current'), { messages: [] }));
    await assertFails(deleteDoc(doc(db(), 'alerts/current')));
  });
});

describe('the old app', () => {
  it('users/{uid} data is closed to browsers now that the old accounts app is gone', async () => {
    await assertFails(getDoc(doc(db(), 'users/u1/characters/c1')));
    await assertFails(setDoc(doc(db(), 'users/u1/characters/c1'), { name: 'x' }));
  });
});

describe('games', () => {
  it('can be read by ID but not listed', async () => {
    await assertSucceeds(getDoc(doc(db(), G)));
    await assertFails(getDocs(collection(db(), 'games')));
  });
  it('can be created with only createdAt and schemaVersion', async () => {
    await assertSucceeds(setDoc(doc(db(), 'games/g2'), { createdAt: 1, schemaVersion: 1 }));
    await assertFails(setDoc(doc(db(), 'games/g3'), { createdAt: 1, schemaVersion: 1, admin: true }));
    await assertFails(setDoc(doc(db(), 'games/g4'), { createdAt: '1', schemaVersion: 1 }));
  });
  it('are immutable', async () => {
    await assertFails(updateDoc(doc(db(), G), { schemaVersion: 2 }));
    await assertFails(deleteDoc(doc(db(), G)));
  });
});

describe('characters', () => {
  const ref = (id = 'c2') => doc(db(), `${G}/characters/${id}`);
  it('a new character from the app is accepted', async () => {
    await assertSucceeds(setDoc(ref(), character()));
    await assertSucceeds(setDoc(ref('c3'), { ...summary(newCharacter()), character: newCharacter(), createdAt: 1, updatedAt: 1 }));
  });
  it('can be read, listed within a game, and deleted', async () => {
    await assertSucceeds(getDoc(ref('c1')));
    await assertSucceeds(getDocs(collection(db(), `${G}/characters`)));
    await assertSucceeds(deleteDoc(ref('c1')));
  });
  it('an update like the sheet autosave is accepted', async () => {
    await assertSucceeds(updateDoc(ref('c1'), { 'character.hp': 3, hp: 3, updatedAt: 2 }));
    await assertSucceeds(updateDoc(ref('c1'), { 'character.items': [{ name: 'rope', slots: 1, armor: false }], updatedAt: 3 }));
  });
  it('rejects unknown fields and wrong types', async () => {
    await assertFails(setDoc(ref(), { ...character(), isAdmin: true }));
    await assertFails(setDoc(ref(), { ...character(), name: 5 }));
    const { createdAt: _, ...noCreatedAt } = character();
    await assertFails(setDoc(ref(), noCreatedAt));
    await assertFails(setDoc(ref(), { ...character(), updatedAt: 'now' }));
    await assertFails(setDoc(ref(), { ...character(), character: 'x' }));
  });
  it('rejects oversized strings', async () => {
    await assertFails(setDoc(ref(), character({ name: 'x'.repeat(101) })));
    await assertFails(updateDoc(ref('c1'), { 'character.notes': 'x'.repeat(4001) }));
    await assertFails(updateDoc(ref('c1'), { 'character.description': 'x'.repeat(4001) }));
  });
  it('accepts strings at the limit', async () => {
    await assertSucceeds(setDoc(ref(), character({ name: 'x'.repeat(100) })));
    await assertSucceeds(updateDoc(ref('c1'), { 'character.notes': 'x'.repeat(4000) }));
  });
  it('rejects out-of-range numbers', async () => {
    for (const a of ['str', 'dex', 'con', 'int', 'wis', 'cha']) {
      await assertFails(updateDoc(ref('c1'), { [`character.abilities.${a}`]: 11 }));
      await assertFails(updateDoc(ref('c1'), { [`character.abilities.${a}`]: -1 }));
      await assertFails(updateDoc(ref('c1'), { [`character.abilities.${a}`]: 1.5 }));
    }
    await assertFails(updateDoc(ref('c1'), { 'character.level': 11 }));
    await assertFails(updateDoc(ref('c1'), { 'character.level': 0 }));
    await assertFails(updateDoc(ref('c1'), { 'character.hp': -1 }));
    await assertFails(updateDoc(ref('c1'), { 'character.hp': 1000 }));
    await assertFails(updateDoc(ref('c1'), { 'character.xp': 10_000_000 }));
    await assertFails(updateDoc(ref('c1'), { 'character.coins': -5 }));
    await assertFails(updateDoc(ref('c1'), { level: 11 }));
  });
  it('rejects stuffed maps and lists', async () => {
    const stuffed = Object.fromEntries(Array.from({ length: 31 }, (_, i) => [`k${i}`, i]));
    await assertFails(setDoc(ref(), { ...character(), character: { ...newCharacter(), ...stuffed } }));
    await assertFails(updateDoc(ref('c1'), { 'character.items': Array(61).fill({ name: 'x', slots: 1, armor: false }) }));
    await assertFails(updateDoc(ref('c1'), { 'character.careers': ['a', 'b', 'c'] }));
    await assertFails(updateDoc(ref('c1'), { 'character.abilities': { str: 1, dex: 0, con: 0, int: 0, wis: 0, cha: 0, luck: 3 } }));
  });
});

describe('rolls', () => {
  const add = (over: Record<string, unknown> = {}) => addDoc(collection(db(), `${G}/rolls`), roll(over));
  it('a valid roll is accepted and readable', async () => {
    await assertSucceeds(add());
    await assertSucceeds(getDocs(collection(db(), `${G}/rolls`)));
  });
  it('are append-only', async () => {
    await assertFails(updateDoc(doc(db(), `${G}/rolls/r1`), { total: 1 }));
    await assertFails(deleteDoc(doc(db(), `${G}/rolls/r1`)));
  });
  it('rejects malformed entries', async () => {
    await assertFails(add({ characterId: '' }));
    await assertFails(add({ label: '' }));
    await assertFails(add({ label: 'x'.repeat(121) }));
    await assertFails(add({ detail: 'x'.repeat(1001) }));
    await assertFails(add({ total: 10_000_000 }));
    await assertFails(add({ total: 1.5 }));
    await assertFails(add({ extra: 1 }));
  });
  it('accepts the edges', async () => {
    await assertSucceeds(add({ label: 'x'.repeat(120), detail: 'x'.repeat(1000), total: -9_999_999 }));
    await assertSucceeds(add({ total: 9_999_999 }));
  });
  it('take the server clock, not a made-up time', async () => {
    await assertFails(add({ createdAt: Timestamp.fromMillis(1) }));
    await assertFails(add({ createdAt: 1 }));
  });
});
