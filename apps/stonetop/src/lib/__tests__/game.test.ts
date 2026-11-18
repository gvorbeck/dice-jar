import { describe, it, expect, beforeEach, vi } from 'vitest';
import { firestoreMockModule, firestoreStore } from '@/test/firestoreMock';

vi.mock('firebase/app', () => ({ initializeApp: () => ({}) }));
vi.mock('firebase/firestore', () => firestoreMockModule());

import { createGame, createGameWithId, gameIdExists } from '../game';

beforeEach(() => {
  firestoreStore.reset();
});

describe('createGame', () => {
  it('writes a fresh game doc and returns its generated id', async () => {
    const id = await createGame();
    expect(id).toMatch(/^[a-z]+-[a-z]+-[a-z0-9]{6}$/);
    const stored = firestoreStore.get(`games/${id}`);
    expect(stored).toMatchObject({ name: '', characters: [], schemaVersion: 2 });
    expect(typeof stored?.createdAt).toBe('number');
  });
});

describe('createGameWithId', () => {
  it('creates a game at the requested id', async () => {
    await createGameWithId('my-game');
    expect(firestoreStore.has('games/my-game')).toBe(true);
    expect(firestoreStore.get('games/my-game')).toMatchObject({ name: '', characters: [], schemaVersion: 2 });
  });

  it('throws when the id is already taken and leaves the existing doc intact', async () => {
    firestoreStore.set('games/taken', { name: 'Existing', characters: [{ id: 'x' }] });
    await expect(createGameWithId('taken')).rejects.toThrow('already taken');
    expect(firestoreStore.get('games/taken')).toMatchObject({ name: 'Existing' });
  });
});

describe('gameIdExists', () => {
  it('reflects whether a doc is present', async () => {
    expect(await gameIdExists('nope')).toBe(false);
    firestoreStore.set('games/yes', { name: 'Here' });
    expect(await gameIdExists('yes')).toBe(true);
  });
});
