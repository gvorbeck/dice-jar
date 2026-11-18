import { beforeEach, describe, expect, it, vi } from 'vitest';
import { firestoreMockModule, firestoreStore } from '@/test/firestoreMock';

vi.mock('firebase/app', () => ({ initializeApp: () => ({}) }));
vi.mock('firebase/firestore', () => firestoreMockModule());

import { FieldPath, getDocFromCache, runTransaction, updateDoc } from 'firebase/firestore';
import { editCharacter } from '../gameV2';
import { patchCharacterData } from '../gameMutations';

const PATH = 'games/g1/characters/c1';
const stored = (over: Record<string, unknown> = {}) => ({
  id: 'c1',
  name: 'Ada',
  playbook: 'blessed',
  level: 1,
  order: 0,
  data: { statStr: '+1', statHp: '4', typeMoves: { a: true } },
  ...over,
});
const rejected = vi.fn();
const edit = (transform: Parameters<typeof editCharacter>[2]) => editCharacter('g1', 'c1', transform, rejected);
// The fields one updateDoc call wrote, as dotted text.
const written = () =>
  vi
    .mocked(updateDoc)
    .mock.calls.map(([, ...pairs]) =>
      Object.fromEntries(
        pairs.flatMap((_, i) =>
          i % 2 === 0 ? [[(pairs[i] as unknown as FieldPath & { segments: string[] }).segments.join('.'), pairs[i + 1]]] : [],
        ),
      ),
    );

beforeEach(() => {
  firestoreStore.reset();
  vi.mocked(updateDoc).mockClear();
  vi.mocked(runTransaction).mockClear();
  rejected.mockClear();
  firestoreStore.set(PATH, stored());
});

describe('editCharacter writes only what changed', () => {
  it('sends the one field that changed, not the character', async () => {
    await edit((c) => patchCharacterData(c, { statStr: '+2' }));
    expect(written()).toEqual([{ 'data.statStr': '+2' }]);
    expect(firestoreStore.get(PATH)).toMatchObject({ order: 0, data: { statStr: '+2', statHp: '4', typeMoves: { a: true } } });
  });

  it('renames without touching the sheet', async () => {
    await edit((c) => ({ ...c, name: 'Bea' }));
    expect(written()).toEqual([{ name: 'Bea' }]);
  });

  it('writes nothing when nothing changed', async () => {
    await edit((c) => c);
    expect(updateDoc).not.toHaveBeenCalled();
  });

  it('removes a field with a delete, leaving its siblings', async () => {
    firestoreStore.set(PATH, stored({ data: { playbookFeatures: { sacredPouchTrait: 'sweet', sacredPouchIs: { a: 'x' } } } }));
    await edit((c) => patchCharacterData(c, { deleteFeatureKeys: ['sacredPouchTrait'] }));
    expect(firestoreStore.get(PATH)!.data).toEqual({ playbookFeatures: { sacredPouchIs: { a: 'x' } } });
  });

  it('writes keys with dots in them as the exact steps they are, in one update with no overlapping paths', async () => {
    firestoreStore.set(PATH, stored({ data: { typeMoves: { 'a.b': true, ok: true } } }));
    await edit((c) => patchCharacterData(c, { typeMoves: { 'a.b': false, ok: false } }));
    expect(written()).toEqual([{ 'data.typeMoves.a.b': false, 'data.typeMoves.ok': false }]);
    expect(firestoreStore.get(PATH)!.data).toEqual({ typeMoves: { 'a.b': false, ok: false } });
  });
});

describe('editCharacter and the connection', () => {
  it('does not use a transaction, so a save queues while offline instead of failing', async () => {
    await edit((c) => ({ ...c, name: 'Bea' }));
    expect(runTransaction).not.toHaveBeenCalled();
  });

  it('resolves once the write is queued, so a server that is out of reach does not hold back the next edit', async () => {
    vi.mocked(updateDoc).mockImplementationOnce(() => new Promise(() => {})); // never answers, as offline
    await edit((c) => patchCharacterData(c, { statStr: '+2' }));
    await edit((c) => patchCharacterData(c, { statHp: '7' })); // would hang if the first one were awaited
    expect(updateDoc).toHaveBeenCalledTimes(2);
  });

  it('builds on its own unconfirmed writes: two quick edits both land', async () => {
    await edit((c) => patchCharacterData(c, { statStr: '+2' }));
    await edit((c) => patchCharacterData(c, { statHp: '7' }));
    expect(firestoreStore.get(PATH)!.data).toMatchObject({ statStr: '+2', statHp: '7' });
  });

  it('tells the caller when the server later refuses the write', async () => {
    const refusal = Object.assign(new Error('denied'), { code: 'permission-denied' });
    vi.mocked(updateDoc).mockRejectedValueOnce(refusal);
    await edit((c) => ({ ...c, name: 'Bea' }));
    await vi.waitFor(() => expect(rejected).toHaveBeenCalledWith(refusal));
  });

  it('leaves a field another device changed alone, even from a copy that has not heard of the change', async () => {
    const stale = firestoreStore.get(PATH)!;
    firestoreStore.set(PATH, stored({ data: { statStr: '+5', statHp: '4', typeMoves: { a: true } } })); // the other device
    vi.mocked(getDocFromCache).mockImplementationOnce(async () => ({ exists: () => true, data: () => stale }) as never);
    await edit((c) => patchCharacterData(c, { statHp: '9' }));
    expect(firestoreStore.get(PATH)!.data).toMatchObject({ statStr: '+5', statHp: '9' });
  });
});

describe('editCharacter repairs what the reader repairs', () => {
  it('gives a character with no level, or a wrong id, what the reader shows, so the rules accept it', async () => {
    const { level: _level, id: _id, ...old } = stored();
    firestoreStore.set(PATH, old);
    await edit((c) => ({ ...c, name: 'Bea' }));
    expect(firestoreStore.get(PATH)).toMatchObject({ name: 'Bea', level: 1, id: 'c1' });
  });

  it('drops a sheet key the reader no longer knows, so stray keys never pile up', async () => {
    firestoreStore.set(PATH, stored({ data: { statStr: '+1', garbage: 'x' } }));
    await edit((c) => patchCharacterData(c, { statHp: '5' }));
    expect(firestoreStore.get(PATH)!.data).toEqual({ statStr: '+1', statHp: '5' });
  });

  it('leaves a field of the document this build does not know, and `order`, alone', async () => {
    firestoreStore.set(PATH, stored({ preserved: 'x', order: 3 }));
    await edit((c) => ({ ...c, name: 'Bea' }));
    expect(firestoreStore.get(PATH)).toMatchObject({ name: 'Bea', preserved: 'x', order: 3 });
    expect(written()).toEqual([{ name: 'Bea' }]);
  });

  it('says so when the character is gone, instead of reporting Saved', async () => {
    firestoreStore.delete(PATH);
    await expect(edit((c) => c)).rejects.toThrow('Character not found');
  });
});
