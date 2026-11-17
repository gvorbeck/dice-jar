// Runs the migration against the Firestore emulator: `npm run test:rules` (needs Java 21+). No real project is involved.
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { migrateAll, migrateGame, unmigrateGame } from '../scripts/migrateCore.ts';
import { sameGame } from '../scripts/gameAudit.ts';

let db: Firestore;
beforeAll(() => {
  if (!getApps().length) initializeApp({ projectId: 'demo-stonetop' });
  db = getFirestore();
});
beforeEach(async () => {
  await db.recursiveDelete(db.collection('games'));
});

const character = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  name: `Char ${id}`,
  playbook: 'blessed',
  level: 2,
  data: { statStr: '+1', typeMoves: { a: true }, arcanaMinor: [{ id: '31', followerHp: [8] }] },
  ...extra,
});
const roll = (id: string, createdAt: number) => ({
  id,
  characterId: 'a',
  stat: 'STR',
  dice: [3, 4],
  mod: 1,
  total: 8,
  mode: 'normal',
  createdAt,
});
const game = (over: Record<string, unknown> = {}) => ({
  name: 'The Long Winter',
  createdAt: 5,
  characters: [character('a'), character('b', { futureField: { nested: [1] } }), character('c')],
  steading: { size: 'village' },
  notes: { gm: '<p>hi</p>' },
  diceRolls: [roll('r1', 10), roll('r2', 20)],
  somethingNew: 1,
  ...over,
});
const seed = (id: string, data: Record<string, unknown> = game()) => db.collection('games').doc(id).set(data);
const read = async (id: string) => (await db.collection('games').doc(id).get()).data()!;
const count = async (id: string, sub: string) => (await db.collection('games').doc(id).collection(sub).get()).size;

describe('migrateGame', () => {
  it('moves a game: one document each for its characters and rolls, and the game marked version 2', async () => {
    await seed('g');
    const outcome = await migrateGame(db, 'g', { expected: game() });
    expect(outcome).toEqual({ id: 'g', status: 'moved', characters: 3, rolls: 2 });
    expect(await read('g')).toMatchObject({ schemaVersion: 2, characters: [], name: 'The Long Winter', somethingNew: 1 });
    expect(await read('g')).not.toHaveProperty('diceRolls');
    expect(await count('g', 'characters')).toBe(3);
    expect(await count('g', 'rolls')).toBe(2);
  });

  it('can be run again: a moved game is left exactly as it is', async () => {
    await seed('g');
    await migrateGame(db, 'g');
    const before = await read('g');
    expect(await migrateGame(db, 'g')).toEqual({ id: 'g', status: 'already moved' });
    expect(await read('g')).toEqual(before);
    expect(await count('g', 'characters')).toBe(3);
  });

  it('writes nothing on a dry run', async () => {
    await seed('g');
    expect(await migrateGame(db, 'g', { dryRun: true })).toEqual({ id: 'g', status: 'would move', characters: 3, rolls: 2 });
    expect(sameGame(await read('g'), game())).toBe(true);
    expect(await count('g', 'characters')).toBe(0);
  });

  it('refuses a game it cannot move exactly, and leaves it untouched', async () => {
    const bad = game({ characters: [{ name: 'no id' }, character('a'), character('a')] });
    await seed('g', bad);
    const outcome = await migrateGame(db, 'g');
    expect(outcome).toMatchObject({
      status: 'refused',
      problems: expect.arrayContaining(['characters[0] has no usable id', 'characters[2] repeats the id a']),
    });
    expect(sameGame(await read('g'), bad)).toBe(true);
    expect(await count('g', 'characters')).toBe(0);
  });

  it('refuses when documents already sit in the subcollections, rather than overwrite them', async () => {
    await seed('g');
    await db.doc('games/g/characters/a').set({ id: 'a', name: 'Stray', playbook: 'fox', order: 0 });
    expect(await migrateGame(db, 'g')).toMatchObject({ status: 'refused', problems: ['subcollection documents already exist'] });
    expect(sameGame(await read('g'), game())).toBe(true);
    expect((await db.doc('games/g/characters/a').get()).data()!.name).toBe('Stray');
  });

  it('leaves a game alone that has changed since the backup', async () => {
    await seed('g', game({ name: 'Edited after the backup' }));
    expect(await migrateGame(db, 'g', { expected: game() })).toEqual({ id: 'g', status: 'changed since backup' });
    expect((await read('g')).schemaVersion).toBeUndefined();
    expect(await count('g', 'characters')).toBe(0);
  });

  it('reports a game that does not exist', async () => {
    expect(await migrateGame(db, 'nope')).toEqual({ id: 'nope', status: 'missing' });
  });

  it('moves a game with no characters and no rolls', async () => {
    await seed('g', { name: '', createdAt: 1, characters: [] });
    expect(await migrateGame(db, 'g')).toMatchObject({ status: 'moved', characters: 0, rolls: 0 });
    expect(await read('g')).toMatchObject({ schemaVersion: 2, characters: [] });
  });

  it('moves a game with its steading and notes untouched in the game document', async () => {
    await seed('g');
    await migrateGame(db, 'g');
    expect(await read('g')).toMatchObject({ steading: { size: 'village' }, notes: { gm: '<p>hi</p>' } });
  });
});

describe('unmigrateGame', () => {
  it('puts a moved game back exactly as it was', async () => {
    await seed('g');
    await migrateGame(db, 'g');
    expect(await unmigrateGame(db, 'g')).toEqual({ id: 'g', status: 'put back', characters: 3, rolls: 2 });
    expect(sameGame(await read('g'), game())).toBe(true);
    expect(await count('g', 'characters')).toBe(0);
    expect(await count('g', 'rolls')).toBe(0);
  });

  it('carries back what was saved while the game was moved, with rolls newest-last and no leftover markers', async () => {
    await seed('g');
    await migrateGame(db, 'g');
    const ref = db.doc('games/g');
    await ref
      .collection('characters')
      .doc('d')
      .set({ ...character('d'), order: 3 });
    await ref.collection('characters').doc('a').update({ name: 'Renamed' });
    await ref
      .collection('rolls')
      .doc('r1')
      .set({ ...roll('r1', 50), order: 0 }); // an old roll edited later
    await ref.update({ restoreToken: 'abc' });
    await unmigrateGame(db, 'g');
    const back = await read('g');
    expect((back.characters as { id: string; name: string }[]).map((c) => [c.id, c.name])).toEqual([
      ['a', 'Renamed'],
      ['b', 'Char b'],
      ['c', 'Char c'],
      ['d', 'Char d'],
    ]);
    expect((back.diceRolls as { id: string }[]).map((r) => r.id)).toEqual(['r2', 'r1']);
    expect(back).not.toHaveProperty('schemaVersion');
    expect(back).not.toHaveProperty('restoreToken');
  });

  it('leaves a game that was never moved alone', async () => {
    await seed('g');
    expect(await unmigrateGame(db, 'g')).toEqual({ id: 'g', status: 'not moved' });
    expect(sameGame(await read('g'), game())).toBe(true);
  });

  it('can move again after being put back', async () => {
    await seed('g');
    await migrateGame(db, 'g');
    await unmigrateGame(db, 'g');
    expect(await migrateGame(db, 'g')).toMatchObject({ status: 'moved' });
    await unmigrateGame(db, 'g');
    expect(sameGame(await read('g'), game())).toBe(true);
  });
});

describe('migrateAll', () => {
  const backup = (ids: string[]) => Object.fromEntries(ids.map((id) => [id, game()]));

  it('refuses to write without a backup', async () => {
    await expect(migrateAll(db, { write: true })).rejects.toThrow('without a backup');
  });

  it('writes nothing without --write, and says what it would do', async () => {
    await seed('a');
    await seed('b');
    const outcomes = await migrateAll(db, { write: false });
    expect(outcomes.map((o) => o.status)).toEqual(['would move', 'would move']);
    expect(await count('a', 'characters')).toBe(0);
  });

  it('moves every game in the backup, skips the ones that are done, and reports the rest', async () => {
    await seed('a');
    await seed('b');
    await seed('c', game({ name: 'Edited after the backup' }));
    await seed('d', game({ characters: [{ name: 'no id' }] }));
    await migrateGame(db, 'b');
    await seed('e'); // not in the backup
    const outcomes = await migrateAll(db, {
      write: true,
      backup: { ...backup(['a', 'b', 'c']), d: game({ characters: [{ name: 'no id' }] }) },
    });
    expect(Object.fromEntries(outcomes.map((o) => [o.id, o.status]))).toEqual({
      a: 'moved',
      b: 'already moved',
      c: 'changed since backup',
      d: 'refused',
      e: 'refused',
    });
    expect((await read('e')).schemaVersion).toBeUndefined();
  });

  it('stops after the limit, so a first run can be a single game', async () => {
    await seed('a');
    await seed('b');
    await seed('c');
    const outcomes = await migrateAll(db, { write: true, backup: backup(['a', 'b', 'c']), limit: 1 });
    expect(outcomes.map((o) => [o.id, o.status])).toEqual([['a', 'moved']]);
    expect((await read('b')).schemaVersion).toBeUndefined();
  });

  it('can be limited to named games', async () => {
    await seed('a');
    await seed('b');
    const outcomes = await migrateAll(db, { write: true, backup: backup(['a', 'b']), only: ['b'] });
    expect(outcomes.map((o) => o.id)).toEqual(['b']);
  });
});
