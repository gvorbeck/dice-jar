import { describe, expect, it } from 'vitest';
import { EXPORT_FORMAT, EXPORT_VERSION } from '../src/lib/gameBackupFormat.ts';
import { gamesFromBackup, isMoved, movedIds, pendingIds, readCheckpoint } from './backupFile.ts';

const envelope = (over: Record<string, unknown> = {}) => ({
  format: EXPORT_FORMAT,
  version: EXPORT_VERSION,
  gameId: 'g1',
  exportedAt: '2026-01-01T00:00:00.000Z',
  game: { name: 'A', createdAt: 1, characters: [] },
  ...over,
});

describe('gamesFromBackup', () => {
  it('passes a whole-collection backup through untouched', () => {
    const backup = { g1: { name: 'A' }, g2: { name: 'B' } };
    expect(gamesFromBackup(backup)).toBe(backup);
  });

  it('turns a one-game export into the same { id: document } shape', () => {
    expect(gamesFromBackup(envelope())).toEqual({ g1: { name: 'A', createdAt: 1, characters: [] } });
  });

  it('accepts an older export version', () => {
    expect(Object.keys(gamesFromBackup(envelope({ version: 0 })))).toEqual(['g1']);
  });

  it.each([
    ['no version', { version: undefined }, 'missing its version'],
    ['a newer version', { version: EXPORT_VERSION + 1 }, 'only understands up to'],
    ['no game id', { gameId: undefined }, 'no gameId'],
    ['an empty game id', { gameId: '' }, 'no gameId'],
    ['no game', { game: undefined }, 'no game data'],
    ['a game that is a list', { game: [] }, 'no game data'],
    ['a null game', { game: null }, 'no game data'],
  ])('refuses an export with %s', (_name, over, message) => {
    expect(() => gamesFromBackup(envelope(over))).toThrow(message);
  });
});

describe('isMoved', () => {
  it('is true only for a game on schemaVersion 2', () => {
    expect(isMoved({ schemaVersion: 2 })).toBe(true);
    expect(isMoved({ schemaVersion: 1 })).toBe(false);
    expect(isMoved({ name: 'old' })).toBe(false);
    expect(isMoved(undefined)).toBe(false);
  });
});

describe('readCheckpoint', () => {
  it('reads the ids a previous run saved', () => {
    expect([...readCheckpoint('["a","b"]')]).toEqual(['a', 'b']);
  });

  it('starts clean when there is no checkpoint file', () => {
    expect(readCheckpoint(null).size).toBe(0);
  });

  it.each([
    ['not json', 'nope'],
    ['not a list', '{"a":1}'],
    ['empty', ''],
  ])('treats a checkpoint that is %s as none', (_name, text) => {
    expect(readCheckpoint(text).size).toBe(0);
  });

  it('ignores entries that are not ids', () => {
    expect([...readCheckpoint('["a",1,null,"b"]')]).toEqual(['a', 'b']);
  });
});

describe('pendingIds', () => {
  it('skips what is already restored and keeps the backup order', () => {
    expect(pendingIds(['c', 'a', 'b'], new Set(['a']))).toEqual(['c', 'b']);
  });
});

describe('movedIds', () => {
  it('lists only the games that have moved, so a restore can refuse them', () => {
    expect(movedIds({ a: { schemaVersion: 2 }, b: { name: 'old' }, c: undefined })).toEqual(['a']);
  });
});
