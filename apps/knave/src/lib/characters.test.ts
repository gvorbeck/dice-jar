// What the browser writes, checked against firestore.rules, and how saves are diffed. Firestore itself is faked.
import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { newCharacter, type Character } from '@/model/character';

type Pairs = Record<string, unknown>;
const writes: { set: Pairs[]; add: Pairs[]; tx: Pairs[]; updates: Pairs[] } = { set: [], add: [], tx: [], updates: [] };
let reject = false;
const deleted: string[] = [];
const docs = new Map<string, Pairs>(); // what getDoc reads, by path

vi.mock('./firebase', () => ({ db: {} }));
vi.mock('firebase/firestore', () => {
  class FieldPath {
    segments: string[];
    constructor(...s: string[]) {
      this.segments = s;
    }
  }
  const key = (f: unknown) => (f instanceof FieldPath ? f.segments.join('.') : String(f));
  return {
    FieldPath,
    deleteField: () => ({ deleted: true }),
    serverTimestamp: () => ({ serverTime: true }),
    collection: (_db: unknown, path: string) => ({ path }),
    doc: (parent: { path?: string }, path?: string) => ({ id: 'new', path: path ?? `${parent.path}/new` }),
    getDoc: async (ref: { path: string }) => ({ exists: () => docs.has(ref.path), data: () => docs.get(ref.path) }),
    setDoc: async (_ref: unknown, v: Pairs) => {
      writes.set.push(v);
    },
    addDoc: async (_ref: unknown, v: Pairs) => {
      writes.add.push(v);
    },
    deleteDoc: async (ref: { path: string }) => {
      deleted.push(ref.path);
    },
    updateDoc: async (_ref: unknown, ...args: unknown[]) => {
      if (reject) throw new Error('denied');
      const p: Pairs = {};
      for (let i = 0; i < args.length; i += 2) p[key(args[i])] = args[i + 1];
      writes.updates.push(p);
    },
    runTransaction: async (_db: unknown, fn: (tx: unknown) => Promise<void>) =>
      fn({
        get: async () => ({ exists: () => false }),
        set: (_ref: unknown, v: Pairs) => {
          writes.tx.push(v);
        },
      }),
  };
});

const { createCharacter, DamagedCharacter, loadCharacter, saveCharacter } = await import('./characters');
const { createGame, deleteCharacter, logRoll } = await import('./games');

/** The hasOnly list of the first match block whose path starts with `path`. */
const RULES = readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8');
const allowed = (path: string) => {
  const at = RULES.indexOf(`match /${path}`);
  const list = at < 0 ? null : /hasOnly\((\[[^\]]*\])\)/.exec(RULES.slice(at));
  if (!list) throw new Error(`firestore.rules has no hasOnly list under "match /${path}"; update this test if it moved`);
  return JSON.parse(list[1]!.replace(/'/g, '"')) as string[];
};
const fieldsOf = (p: Pairs) => [...new Set(Object.keys(p).map((k) => k.split('.')[0]))];

const stored = (c: Character) => ({ character: c });
beforeEach(() => {
  writes.set = [];
  writes.add = [];
  writes.tx = [];
  writes.updates = [];
  reject = false;
  deleted.length = 0;
  docs.clear();
});

describe('writes stay inside firestore.rules', () => {
  it('game, character and roll documents only use fields their hasOnly lists allow', async () => {
    await createGame('gravedigger-brewer-abc123');
    createCharacter('g');
    await saveCharacter('g', 'rules', newCharacter());
    await logRoll('g', { characterId: 'c', characterName: 'Wren', label: 'Check (STR)', detail: 'd20 12', total: 12 });

    expect(allowed('games/{gameId}')).toEqual(expect.arrayContaining(fieldsOf(writes.tx[0]!)));
    for (const p of [...writes.set, ...writes.updates])
      expect(allowed('characters/{characterId}')).toEqual(expect.arrayContaining(fieldsOf(p)));
    expect(allowed('rolls/{rollId}')).toEqual(expect.arrayContaining(fieldsOf(writes.add[0]!)));
  });

  it('every field of a sheet is checked by validCharacter, and a sheet stays under its 30 keys', () => {
    const keys = Object.keys(newCharacter());
    expect(keys.length).toBeLessThanOrEqual(30);
    for (const k of keys) expect(RULES).toContain(`c.${k}`);
  });

  it('cuts a label and breakdown to the lengths the rules allow', async () => {
    await logRoll('g', { characterId: 'c', characterName: 'Wren', label: 'x'.repeat(500), detail: 'y'.repeat(2000), total: 1 });
    expect(writes.add[0]).toMatchObject({ label: 'x'.repeat(120), detail: 'y'.repeat(1000) });
  });
});

describe('saveCharacter sends only what changed', () => {
  const sheet = (over: Partial<Character> = {}): Character => ({ ...newCharacter(), ...over });

  it('the first save without a read sends the whole sheet, later ones only the changed leaves', async () => {
    await saveCharacter('g', 'c1', sheet());
    expect(Object.keys(writes.updates[0]!)).toContain('character');
    await saveCharacter('g', 'c1', sheet({ hp: 3 }));
    expect(writes.updates[1]).toMatchObject({ 'character.hp': 3, updatedAt: expect.any(Number), hp: 3 });
    expect(Object.keys(writes.updates[1]!).filter((k) => k.startsWith('character'))).toEqual(['character.hp']);
  });

  it('diffs against what was read, so a loaded sheet saves only its edit', async () => {
    docs.set('games/g/characters/c2', stored(sheet({ coins: 100 })));
    const c = await loadCharacter('g', 'c2');
    await saveCharacter('g', 'c2', { ...c!, notes: 'hi' });
    expect(Object.keys(writes.updates[0]!).filter((k) => k.startsWith('character'))).toEqual(['character.notes']);
  });

  it('a write the server refuses is sent again with the next save', async () => {
    docs.set('games/g/characters/c3', stored(sheet()));
    const c = (await loadCharacter('g', 'c3'))!;
    reject = true;
    await expect(saveCharacter('g', 'c3', { ...c, hp: 2 })).rejects.toThrow('denied');
    reject = false;
    await saveCharacter('g', 'c3', { ...c, hp: 2, notes: 'x' });
    expect(
      Object.keys(writes.updates[0]!)
        .filter((k) => k.startsWith('character'))
        .sort(),
    ).toEqual(['character.hp', 'character.notes']);
  });
});

describe('loadCharacter', () => {
  it('is null for a character that is not there', async () => expect(await loadCharacter('g', 'none')).toBeNull());
  it('throws DamagedCharacter for data that is not a sheet', async () => {
    docs.set('games/g/characters/bad', { character: { version: 1 } });
    await expect(loadCharacter('g', 'bad')).rejects.toBeInstanceOf(DamagedCharacter);
  });
});

describe('deleteCharacter', () => {
  it('deletes that character document and nothing else', async () => {
    await deleteCharacter('g', 'c9');
    expect(deleted).toEqual(['games/g/characters/c9']);
  });
});
