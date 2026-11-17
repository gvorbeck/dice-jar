import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { firestoreMockModule, firestoreStore } from '@/test/firestoreMock';
import { addToastSpy, toastModuleMock } from '@/test/toastMock';

vi.mock('firebase/app', () => ({ initializeApp: () => ({}) }));
vi.mock('firebase/firestore', () => firestoreMockModule());
vi.mock('@/ui/Toast/ToastContext', () => toastModuleMock());

import { useGame } from '../useGame';
import { assembleGame } from '../gameV2';
import { splitGame } from '../gameShape';
import { ROLL_LOG_CAP } from '../gameParsing';
import type { Character, LoggedRoll } from '@/model';

// The same saves run on a game in one document and on its moved copy must give the same game once the moved one is put back together.

const V1 = 'games/old';
const V2 = 'games/new';

const char = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  name: `Char ${id}`,
  playbook: 'blessed',
  level: 2,
  data: {
    statStr: '+1',
    typeMoves: { 'blessed-rites-of-the-land': true },
    arcanaMinor: [{ id: '31', requirementsChecked: { req0: true } }],
    playbookFeatures: { sacredPouchTrait: 'sweet', sacredPouchIs: { a: 'x' } },
  },
  ...extra,
});
const roll = (id: string, createdAt: number, over: Record<string, unknown> = {}) => ({
  id,
  characterId: 'a',
  characterName: 'Char a',
  moveName: 'Fight',
  stat: 'STR',
  dice: [3, 4],
  mod: 1,
  total: 8,
  mode: 'normal',
  band: '7-9',
  createdAt,
  ...over,
});
const game = () => ({
  name: 'The Long Winter',
  createdAt: 5,
  characters: [char('a'), char('b'), char('c')],
  steading: { size: 'village', fortunes: 1 },
  notes: { gm: '<p>hi</p>' },
  diceRolls: [roll('r1', 10), roll('r2', 20)],
});

const seed = () => {
  firestoreStore.reset();
  firestoreStore.set(V1, game());
  const r = splitGame(game());
  if (!r.ok) throw new Error('fixture does not split');
  firestoreStore.set(V2, r.split.game);
  r.split.characters.forEach((c) => firestoreStore.set(`${V2}/characters/${c.id}`, c.data));
  r.split.rolls.forEach((c) => firestoreStore.set(`${V2}/rolls/${c.id}`, c.data));
};

const stored = (path: string) => firestoreStore.list(path).map(({ id, data }) => ({ id, data }));
// The moved game put back into one document, to compare with the old one.
const movedAsOneDocument = () => assembleGame(firestoreStore.get(V2)!, stored(`${V2}/characters`), stored(`${V2}/rolls`));
const oneDocument = () => firestoreStore.get(V1)!;

const renderBoth = async () => {
  const old = renderHook(() => useGame('old'));
  const moved = renderHook(() => useGame('new'));
  await waitFor(() => expect(old.result.current.loading).toBe(false));
  await waitFor(() => expect(moved.result.current.loading).toBe(false));
  return { old, moved };
};

type Api = ReturnType<typeof useGame>;
// Runs the same save on both games and checks they still agree.
const both = async (old: { result: { current: Api } }, moved: { result: { current: Api } }, save: (api: Api) => Promise<void>) => {
  await act(async () => {
    await save(old.result.current);
  });
  await act(async () => {
    await save(moved.result.current);
  });
  expect(movedAsOneDocument()).toEqual(oneDocument());
};

beforeEach(() => {
  seed();
  addToastSpy.mockClear();
});

describe('a moved game reads the same as the old one', () => {
  it('gives the same game', async () => {
    const { old, moved } = await renderBoth();
    expect(moved.result.current.game).toEqual({ ...old.result.current.game, id: 'new' });
  });

  it('is loading until the characters and rolls have arrived, and not found when the game is missing', async () => {
    const { result } = renderHook(() => useGame('nowhere'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.game).toBeNull();
    expect(result.current.error).toBeNull();
  });
});

describe('the same saves give the same game', () => {
  it('adds a character, once even if added twice', async () => {
    const { old, moved } = await renderBoth();
    await both(old, moved, (api) => api.addCharacter(char('d') as unknown as Character));
    await both(old, moved, (api) => api.addCharacter(char('d') as unknown as Character));
    expect(stored(`${V2}/characters`).map((c) => c.id)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('does not rewrite a character that is added a second time', async () => {
    const { old, moved } = await renderBoth();
    await both(old, moved, (api) => api.addCharacter(char('d') as unknown as Character));
    await both(old, moved, (api) => api.updateCharacterName('d', 'Renamed since'));
    await both(old, moved, (api) => api.addCharacter(char('d') as unknown as Character)); // a retry that lands late
    expect(firestoreStore.get(`${V2}/characters/d`)).toMatchObject({ name: 'Renamed since', order: 3 });
  });

  it('removes a character', async () => {
    const { old, moved } = await renderBoth();
    await both(old, moved, (api) => api.removeCharacter('b'));
    expect(stored(`${V2}/characters`).map((c) => c.id)).toEqual(['a', 'c']);
  });

  it('renames a character', async () => {
    const { old, moved } = await renderBoth();
    await both(old, moved, (api) => api.updateCharacterName('b', 'Bea'));
  });

  it('merges a data patch: nested maps, arcana by id, and a deleted feature key', async () => {
    const { old, moved } = await renderBoth();
    await both(old, moved, (api) =>
      api.updateCharacterData('a', {
        statStr: '+2',
        typeMoves: { 'blessed-trackless-step': true },
        arcanaMinor: [
          { id: '31', requirementsChecked: { req1: true } },
          { id: '52', requirementsChecked: {} },
        ],
        deleteFeatureKeys: ['sacredPouchTrait'],
      }),
    );
    const a = movedAsOneDocument().characters as { id: string; data: { typeMoves: object } }[];
    expect(a[0]!.data.typeMoves).toEqual({ 'blessed-rites-of-the-land': true, 'blessed-trackless-step': true });
  });

  it('adjusts a character stat from the stored value', async () => {
    const { old, moved } = await renderBoth();
    await both(old, moved, (api) => api.adjustCharacterStats('a', { statHp: 3 }));
    await both(old, moved, (api) => api.adjustCharacterStats('a', { statHp: -1 }));
  });

  it('reorders the party', async () => {
    const { old, moved } = await renderBoth();
    await both(old, moved, (api) => api.reorderCharacters([char('c'), char('a'), char('b')] as unknown as Character[]));
    expect(
      stored(`${V2}/characters`)
        .sort((x, y) => Number(x.data.order) - Number(y.data.order))
        .map((c) => c.id),
    ).toEqual(['c', 'a', 'b']);
  });

  it('keeps a character another player added while this tab was reordering, after the named ones', async () => {
    const { old, moved } = await renderBoth();
    await both(old, moved, (api) => api.addCharacter(char('d') as unknown as Character));
    await both(old, moved, (api) => api.reorderCharacters([char('b'), char('a')] as unknown as Character[]));
    expect((movedAsOneDocument().characters as { id: string }[]).map((c) => c.id)).toEqual(['b', 'a', 'c', 'd']);
  });

  it('puts the named characters first and moves every other one after them', async () => {
    const { old, moved } = await renderBoth();
    await both(old, moved, (api) => api.addCharacter(char('d') as unknown as Character));
    await both(old, moved, (api) => api.reorderCharacters([char('c'), char('b')] as unknown as Character[]));
    expect((movedAsOneDocument().characters as { id: string }[]).map((c) => c.id)).toEqual(['c', 'b', 'a', 'd']);
  });

  it('logs a roll, and edits it in place by id', async () => {
    const { old, moved } = await renderBoth();
    await both(old, moved, (api) => api.logRoll(roll('r3', 30) as unknown as LoggedRoll));
    await both(old, moved, (api) => api.logRoll(roll('r3', 30, { mode: 'adv', dice: [2, 5, 6], total: 12 }) as unknown as LoggedRoll));
    expect(
      stored(`${V2}/rolls`)
        .map((r) => r.id)
        .sort(),
    ).toEqual(['r1', 'r2', 'r3']);
  });

  it('lists rolls by when they were made, also after an older one is edited and gets a new time', async () => {
    const { old, moved } = await renderBoth();
    await both(old, moved, (api) => api.logRoll(roll('r1', 50, { mode: 'adv' }) as unknown as LoggedRoll));
    expect((movedAsOneDocument().diceRolls as { id: string }[]).map((r) => r.id)).toEqual(['r2', 'r1']);
  });

  it('keeps only the newest rolls', async () => {
    const { old, moved } = await renderBoth();
    for (let i = 0; i < ROLL_LOG_CAP + 5; i++) {
      await both(old, moved, (api) => api.logRoll(roll(`n${i}`, 100 + i) as unknown as LoggedRoll));
    }
    expect(stored(`${V2}/rolls`)).toHaveLength(ROLL_LOG_CAP);
    expect(stored(`${V2}/rolls`).some((r) => r.id === 'r1')).toBe(false);
    expect(stored(`${V2}/rolls`).some((r) => r.id === `n${ROLL_LOG_CAP + 4}`)).toBe(true);
  });

  it('saves the fields that stay in the game document', async () => {
    const { old, moved } = await renderBoth();
    await both(old, moved, (api) => api.updateGameName('Renamed'));
    await both(old, moved, (api) => api.updateContent('veiled', 'spiders'));
    await both(old, moved, (api) => api.updateSteading({ fortunes: 3, improvements: { well: true } }));
    await both(old, moved, (api) => api.updateNotes('gm', '<p>new</p>'));
  });

  it('restores a backup over the game, leaving nothing of what was there', async () => {
    const { old, moved } = await renderBoth();
    const backup = { name: 'Restored', createdAt: 9, characters: [char('x'), char('y')], diceRolls: [roll('q1', 1)] };
    await both(old, moved, (api) => api.replaceGameData(structuredClone(backup)));
    expect(
      stored(`${V2}/characters`)
        .map((c) => c.id)
        .sort(),
    ).toEqual(['x', 'y']);
    expect(stored(`${V2}/rolls`).map((c) => c.id)).toEqual(['q1']);
  });
});

describe('a moved game never saves into the arrays', () => {
  it('keeps characters and diceRolls out of the game document through every kind of save', async () => {
    const { moved } = await renderBoth();
    const api = () => moved.result.current;
    await act(async () => {
      await api().addCharacter(char('d') as unknown as Character);
      await api().updateCharacterName('a', 'Ada');
      await api().logRoll(roll('r9', 99) as unknown as LoggedRoll);
      await api().reorderCharacters([char('d'), char('a')] as unknown as Character[]);
      await api().removeCharacter('c');
      await api().updateSteading({ fortunes: 2 });
    });
    const doc = firestoreStore.get(V2)!;
    expect(doc.characters).toEqual([]);
    expect('diceRolls' in doc).toBe(false);
    expect(doc.schemaVersion).toBe(2);
  });

  it('says so when the character being saved has been removed, instead of reporting Saved', async () => {
    const { moved } = await renderBoth();
    firestoreStore.delete(`${V2}/characters/b`);
    await act(async () => {
      await expect(moved.result.current.updateCharacterName('b', 'Gone')).rejects.toThrow('Character not found');
    });
    expect(firestoreStore.has(`${V2}/characters/b`)).toBe(false);
  });

  it('refuses a backup it cannot carry over exactly, and changes nothing', async () => {
    const { moved } = await renderBoth();
    const before = movedAsOneDocument();
    await act(async () => {
      await expect(moved.result.current.replaceGameData({ name: 'x', createdAt: 1, characters: [{ name: 'no id' }] })).rejects.toThrow(
        "can't be restored",
      );
    });
    expect(movedAsOneDocument()).toEqual(before);
  });
});

describe('a game that is moved while the page is open', () => {
  it('switches to reading the subcollections and keeps saving to the right place', async () => {
    firestoreStore.reset();
    firestoreStore.set(V1, game());
    const { result } = renderHook(() => useGame('old'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.game?.characters).toHaveLength(3);

    // The migration script's move: subdocuments and the version marker, written together.
    const r = splitGame(game());
    if (!r.ok) throw new Error('fixture does not split');
    r.split.characters.forEach((c) => firestoreStore.set(`${V1}/characters/${c.id}`, c.data));
    r.split.rolls.forEach((c) => firestoreStore.set(`${V1}/rolls/${c.id}`, c.data));
    await act(async () => firestoreStore.set(V1, r.split.game));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.game?.characters.map((c) => c.id)).toEqual(['a', 'b', 'c']);
    await act(async () => {
      await result.current.updateCharacterName('a', 'After the move');
    });
    expect(firestoreStore.get(`${V1}/characters/a`)!.name).toBe('After the move');
    expect(firestoreStore.get(V1)!.characters).toEqual([]);
  });
});

describe('a tab that still holds the game from before it was moved', () => {
  it.each([
    ['rename', (api: Api) => api.updateCharacterName('a', 'Renamed')],
    ['adjust a stat', (api: Api) => api.adjustCharacterStats('a', { statHp: 2 })],
    ['edit data', (api: Api) => api.updateCharacterData('a', { statStr: '+2' })],
    ['remove', (api: Api) => api.removeCharacter('b')],
    ['reorder', (api: Api) => api.reorderCharacters([char('c'), char('a'), char('b')] as unknown as Character[])],
    ['add', (api: Api) => api.addCharacter(char('d') as unknown as Character)],
    ['roll', (api: Api) => api.logRoll(roll('r9', 99) as unknown as LoggedRoll)],
    ['restore a backup', (api: Api) => api.replaceGameData({ name: 'Back', createdAt: 1, characters: [char('z')] })],
  ])('carries on the new way after the first write finds the game moved: %s', async (_name, save) => {
    const { result } = renderHook(() => useGame('old'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    // The game moves on the server, but this tab's copy (from its cache) has not heard.
    const r = splitGame(game());
    if (!r.ok) throw new Error('fixture does not split');
    r.split.characters.forEach((c) => firestoreStore.setQuietly(`${V1}/characters/${c.id}`, c.data));
    r.split.rolls.forEach((c) => firestoreStore.setQuietly(`${V1}/rolls/${c.id}`, c.data));
    firestoreStore.setQuietly(V1, r.split.game);

    await act(async () => {
      await save(result.current);
    });
    expect(addToastSpy).not.toHaveBeenCalled();
    expect(firestoreStore.get(V1)!.characters).toEqual([]); // never written back into the array
    expect('diceRolls' in firestoreStore.get(V1)!).toBe(false);
  });
});

describe('two players at once', () => {
  it('two rolls logged together on a full log still leave the log at its cap', async () => {
    const full = Array.from({ length: ROLL_LOG_CAP }, (_, i) => roll(`f${i}`, 1000 + i));
    const r = splitGame({ ...game(), diceRolls: full });
    if (!r.ok) throw new Error('fixture does not split');
    r.split.rolls.forEach((c) => firestoreStore.set(`${V2}/rolls/${c.id}`, c.data));
    for (const id of stored(`${V2}/rolls`).map((x) => x.id)) if (!id.startsWith('f')) firestoreStore.delete(`${V2}/rolls/${id}`);
    const { moved } = await renderBoth();
    await act(async () => {
      await Promise.all([
        moved.result.current.logRoll(roll('p1', 5000) as unknown as LoggedRoll),
        moved.result.current.logRoll(roll('p2', 5001) as unknown as LoggedRoll),
      ]);
    });
    const ids = stored(`${V2}/rolls`).map((x) => x.id);
    expect(ids).toHaveLength(ROLL_LOG_CAP);
    expect(ids).toEqual(expect.arrayContaining(['p1', 'p2']));
  });

  it('a restore sweeps up a character another player added while it was running', async () => {
    const { moved } = await renderBoth();
    const { getDocs } = await import('firebase/firestore');
    const real = vi.mocked(getDocs).getMockImplementation()!;
    let added = false;
    vi.mocked(getDocs).mockImplementation(async (ref) => {
      const result = await real(ref);
      if (!added && (ref as unknown as { path: string }).path.endsWith('/characters')) {
        added = true;
        firestoreStore.setQuietly(`${V2}/characters/late`, { id: 'late', name: 'Late', playbook: 'heavy', order: 9 });
      }
      return result;
    });
    await act(async () => {
      await moved.result.current.replaceGameData({ name: 'Back', createdAt: 1, characters: [char('z')] });
    });
    vi.mocked(getDocs).mockImplementation(real);
    expect(stored(`${V2}/characters`).map((c) => c.id)).toEqual(['z']);
  });
});

describe('a reorder while another player removes someone', () => {
  it('still saves the order of everyone who is left', async () => {
    const { moved } = await renderBoth();
    const { getDocs } = await import('firebase/firestore');
    const real = vi.mocked(getDocs).getMockImplementation()!;
    let removed = false;
    vi.mocked(getDocs).mockImplementation(async (ref) => {
      const result = await real(ref);
      // The other player removes "b" after this tab has read the party and before it writes.
      if (!removed && (ref as unknown as { path: string }).path.endsWith('/characters')) {
        removed = true;
        firestoreStore.delete(`${V2}/characters/b`);
      }
      return result;
    });
    await act(async () => {
      await moved.result.current.reorderCharacters([char('c'), char('b'), char('a')] as unknown as Character[]);
    });
    vi.mocked(getDocs).mockImplementation(real);
    expect(addToastSpy).not.toHaveBeenCalled();
    expect(
      stored(`${V2}/characters`)
        .sort((x, y) => Number(x.data.order) - Number(y.data.order))
        .map((c) => c.id),
    ).toEqual(['c', 'a']);
  });
});

describe('two restores at once', () => {
  it('the second one stops without changing anything when another restore landed after it started reading', async () => {
    const { moved } = await renderBoth();
    const { getDocs } = await import('firebase/firestore');
    const real = vi.mocked(getDocs).getMockImplementation()!;
    let reads = 0;
    vi.mocked(getDocs).mockImplementation(async (ref) => {
      // Restore B commits while A is still reading the party.
      if (++reads === 1) firestoreStore.setQuietly(V2, { ...firestoreStore.get(V2)!, name: 'From B', restoreToken: 'B' });
      return real(ref);
    });
    const before = stored(`${V2}/characters`).map((c) => c.id);
    await act(async () => {
      await expect(moved.result.current.replaceGameData({ name: 'From A', createdAt: 1, characters: [char('z')] })).rejects.toThrow();
    });
    vi.mocked(getDocs).mockImplementation(real);
    expect(addToastSpy).toHaveBeenCalledWith(expect.stringContaining('Someone else restored'), 'error');
    expect(firestoreStore.get(V2)!.name).toBe('From B');
    expect(stored(`${V2}/characters`).map((c) => c.id)).toEqual(before);
  });
});

describe('two restores at once, cleaning up', () => {
  it('the clean-up of one never deletes what a later restore wrote', async () => {
    const { moved } = await renderBoth();
    const { getDocs } = await import('firebase/firestore');
    const real = vi.mocked(getDocs).getMockImplementation()!;
    let reads = 0;
    vi.mocked(getDocs).mockImplementation(async (ref) => {
      // Restore A has committed; before it sweeps, restore B commits a different backup.
      if (++reads === 3) {
        firestoreStore.setQuietly(V2, { ...firestoreStore.get(V2)!, name: 'From B', restoreToken: 'B' });
        firestoreStore.delete(`${V2}/characters/z`);
        firestoreStore.setQuietly(`${V2}/characters/b1`, { id: 'b1', name: 'B', playbook: 'heavy', order: 0 });
      }
      return real(ref);
    });
    await act(async () => {
      await moved.result.current.replaceGameData({ name: 'From A', createdAt: 1, characters: [char('z')] });
    });
    vi.mocked(getDocs).mockImplementation(real);
    expect(stored(`${V2}/characters`).map((c) => c.id)).toEqual(['b1']);
    expect(firestoreStore.get(V2)!.name).toBe('From B');
  });

  it('keeps the restore marker out of the game the app and exports see', async () => {
    const { moved } = await renderBoth();
    await act(async () => {
      await moved.result.current.replaceGameData({ name: 'Back', createdAt: 1, characters: [] });
    });
    expect(firestoreStore.get(V2)!.restoreToken).toEqual(expect.any(String));
    expect(movedAsOneDocument()).not.toHaveProperty('restoreToken');
  });
});

describe('a restore that cannot go ahead says why', () => {
  it('names the size problem for a game still in one document', async () => {
    const { old } = await renderBoth();
    await act(async () => {
      await expect(
        old.result.current.replaceGameData({ name: 'x', createdAt: 1, characters: [], threats: 'x'.repeat(1_000_001) }),
      ).rejects.toThrow();
    });
    expect(addToastSpy).toHaveBeenCalledWith(expect.stringContaining('too large'), 'error');
    expect(addToastSpy).not.toHaveBeenCalledWith(expect.stringContaining('check your connection'), 'error');
  });

  it('names the problem with a backup a moved game cannot take', async () => {
    const { moved } = await renderBoth();
    await act(async () => {
      await expect(moved.result.current.replaceGameData({ name: 'x', createdAt: 1, characters: [{ name: 'no id' }] })).rejects.toThrow();
    });
    expect(addToastSpy).toHaveBeenCalledWith(expect.stringContaining("can't be restored"), 'error');
  });
});

describe('exporting a moved game', () => {
  it('reads again until two passes agree, so a restore running meanwhile cannot leave a mix', async () => {
    seed();
    const { readMovedGame } = await import('../gameV2');
    const { getDocs } = await import('firebase/firestore');
    const real = vi.mocked(getDocs).getMockImplementation()!;
    let calls = 0;
    vi.mocked(getDocs).mockImplementation(async (ref) => {
      // Changes the game between the first pass and the second.
      if (++calls === 3) firestoreStore.setQuietly(`${V2}/characters/mid`, { id: 'mid', name: 'Mid', playbook: 'heavy', order: 9 });
      return real(ref);
    });
    const out = await readMovedGame('new');
    vi.mocked(getDocs).mockImplementation(real);
    expect((out.characters as { id: string }[]).map((c) => c.id)).toContain('mid');
  });

  it('gives up with a clear message if the game never stops changing', async () => {
    seed();
    const { readMovedGame } = await import('../gameV2');
    const { getDocs } = await import('firebase/firestore');
    const real = vi.mocked(getDocs).getMockImplementation()!;
    let n = 0;
    vi.mocked(getDocs).mockImplementation(async (ref) => {
      firestoreStore.setQuietly(`${V2}/rolls/churn${n++}`, { id: `churn${n}`, characterId: 'a', createdAt: n, order: n });
      return real(ref);
    });
    await expect(readMovedGame('new')).rejects.toThrow('kept changing');
    vi.mocked(getDocs).mockImplementation(real);
  });
});
