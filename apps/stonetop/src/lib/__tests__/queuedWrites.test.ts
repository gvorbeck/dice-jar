import { beforeEach, describe, expect, it, vi } from 'vitest';
import { firestoreMockModule, firestoreStore } from '@/test/firestoreMock';

vi.mock('firebase/app', () => ({ initializeApp: () => ({}) }));
vi.mock('firebase/firestore', () => firestoreMockModule());

import { deleteDoc, runTransaction, setDoc, writeBatch } from 'firebase/firestore';
import { addCharacter, logRoll, reorderCharacters } from '../gameV2';
import { ROLL_LOG_CAP } from '../gameParsing';
import type { Character, LoggedRoll } from '@/model';

const G = 'games/g1';
const char = (id: string, order: number) => ({ id, name: id, playbook: 'blessed', level: 1, order });
const roll = (id: string, createdAt: number): LoggedRoll => ({
  id,
  characterId: 'a',
  characterName: 'A',
  moveName: 'Fight',
  stat: 'STR',
  dice: [1],
  mod: 0,
  total: 1,
  mode: 'normal',
  band: null,
  createdAt,
});
const rejected = vi.fn();
const never = () => new Promise<never>(() => {}); // the server out of reach: a write that is queued but not answered

beforeEach(() => {
  firestoreStore.reset();
  for (const fn of [setDoc, writeBatch, deleteDoc, runTransaction, rejected]) vi.mocked(fn).mockClear();
  ['a', 'b', 'c'].forEach((id, i) => firestoreStore.set(`${G}/characters/${id}`, char(id, i)));
});

describe('writes that queue while offline', () => {
  it('adds a character and resolves before the server answers, without a transaction', async () => {
    vi.mocked(setDoc).mockImplementationOnce(never);
    await addCharacter('g1', { id: 'd', name: 'D', playbook: 'fox', level: 1 } as Character, rejected);
    expect(setDoc).toHaveBeenCalledTimes(1);
    expect(runTransaction).not.toHaveBeenCalled();
  });

  it('does not add the same id twice', async () => {
    await addCharacter('g1', { id: 'a', name: 'Again', playbook: 'fox', level: 1 } as Character, rejected);
    expect(setDoc).not.toHaveBeenCalled();
  });

  it('puts a new character at the end of the party', async () => {
    await addCharacter('g1', { id: 'd', name: 'D', playbook: 'fox', level: 1 } as Character, rejected);
    expect(firestoreStore.get(`${G}/characters/d`)).toMatchObject({ order: 3 });
  });

  it('reorders in one batch and resolves before the server answers, writing only the characters that moved', async () => {
    const update = vi.fn();
    vi.mocked(writeBatch).mockImplementationOnce(() => ({ update, commit: never }) as never);
    await reorderCharacters('g1', ['b', 'a', 'c'], rejected);
    expect(writeBatch).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledTimes(2);
  });

  it('writes nothing when the order is already right', async () => {
    await reorderCharacters('g1', ['a', 'b', 'c'], rejected);
    expect(writeBatch).toHaveBeenCalledTimes(1); // built, but with nothing to commit
    expect(firestoreStore.list(`${G}/characters`).map((c) => c.data.order)).toEqual([0, 1, 2]);
  });

  it('tries once more on the party as it is when a character was removed meanwhile, and does not report that', async () => {
    const real = vi.mocked(writeBatch).getMockImplementation()!;
    vi.mocked(writeBatch).mockImplementationOnce((...args) => {
      firestoreStore.delete(`${G}/characters/b`); // removed after the party was read, before the batch is sent
      return real(...args);
    });
    await reorderCharacters('g1', ['b', 'c', 'a'], rejected); // b is moved, so the batch names it
    await vi.waitFor(() => expect(firestoreStore.get(`${G}/characters/c`)).toMatchObject({ order: 0 }));
    expect(writeBatch).toHaveBeenCalledTimes(2);
    expect(firestoreStore.get(`${G}/characters/a`)).toMatchObject({ order: 1 });
    expect(rejected).not.toHaveBeenCalled();
  });

  it('tells the caller when the server refuses an add, a reorder or a roll', async () => {
    const denied = Object.assign(new Error('denied'), { code: 'permission-denied' });
    vi.mocked(setDoc).mockRejectedValueOnce(denied);
    await addCharacter('g1', { id: 'd', name: 'D', playbook: 'fox', level: 1 } as Character, rejected);
    vi.mocked(writeBatch).mockImplementationOnce(() => ({ update: vi.fn(), commit: () => Promise.reject(denied) }) as never);
    await reorderCharacters('g1', ['c', 'b', 'a'], rejected);
    vi.mocked(setDoc).mockRejectedValueOnce(denied);
    await logRoll('g1', roll('r1', 1), rejected);
    await vi.waitFor(() => expect(rejected).toHaveBeenCalledTimes(3));
  });

  it('logs a roll and resolves before the server answers, without a transaction', async () => {
    vi.mocked(setDoc).mockImplementationOnce(never);
    await logRoll('g1', roll('r1', 1), rejected);
    expect(setDoc).toHaveBeenCalledTimes(1);
    expect(runTransaction).not.toHaveBeenCalled();
  });

  it('does not trim the log for a roll the server refused', async () => {
    for (let i = 0; i < ROLL_LOG_CAP; i++) firestoreStore.set(`${G}/rolls/old${i}`, { ...roll(`old${i}`, i + 1), order: i });
    // As the real client does: the roll shows in the local copy at once, and is taken back when the server refuses it.
    vi.mocked(setDoc).mockImplementationOnce(async (ref, data) => {
      firestoreStore.set((ref as unknown as { path: string }).path, data as never);
      await new Promise((resolve) => setTimeout(resolve, 5));
      firestoreStore.delete((ref as unknown as { path: string }).path);
      throw Object.assign(new Error('denied'), { code: 'permission-denied' });
    });
    await logRoll('g1', roll('new', 1000), rejected);
    await vi.waitFor(() => expect(rejected).toHaveBeenCalled());
    expect(deleteDoc).not.toHaveBeenCalled();
    expect(firestoreStore.list(`${G}/rolls`)).toHaveLength(ROLL_LOG_CAP);
  });

  it('trims the log to the newest rolls', async () => {
    for (let i = 0; i < ROLL_LOG_CAP + 3; i++) await logRoll('g1', roll(`r${i}`, i + 1), rejected);
    await vi.waitFor(() => expect(firestoreStore.list(`${G}/rolls`)).toHaveLength(ROLL_LOG_CAP));
    const ids = firestoreStore.list(`${G}/rolls`).map((r) => r.id);
    expect(ids).not.toContain('r0');
    expect(ids).toContain(`r${ROLL_LOG_CAP + 2}`);
  });
});
