import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { firestoreMockModule, firestoreStore } from '@/test/firestoreMock';

vi.mock('firebase/app', () => ({ initializeApp: () => ({}) }));
vi.mock('firebase/firestore', () => firestoreMockModule());

import { addCharacter, editCharacter, logRoll, replaceGame } from '../gameV2';
import { ROLL_TEXT_MAX_LENGTH } from '../constants';
import { IMPORTABLE_CHARACTER_FIELDS, LIMITS, IMPORTABLE_ROLL_FIELDS, readImportFile } from '../gameBackup';
import type { Character, LoggedRoll } from '@/model';

// What the app writes must be what firestore.rules allows: a field missing from the rules' key list is refused in production, and nothing else catches it before then.
const rules = readFileSync(join(import.meta.dirname, '../../../firestore.rules'), 'utf8');
const keysIn = (fn: string) => {
  const match = new RegExp(`function ${fn}\\(\\) \\{\\s*return \\[([^\\]]*)\\]`).exec(rules);
  if (!match) throw new Error(`firestore.rules has no "function ${fn}() { return [...] }": keep that layout, or update this test`);
  return [...match[1]!.matchAll(/'([^']+)'/g)].map((m) => m[1]!);
};

beforeEach(() => firestoreStore.reset());

describe('what the app writes against firestore.rules', () => {
  it('writes only the character fields the rules list', async () => {
    const character: Character = { id: 'c1', name: 'Ada', playbook: 'blessed', level: 2, data: { statStr: '+1' } };
    await addCharacter('g1', character);
    await editCharacter('g1', 'c1', (c) => ({ ...c, name: 'Renamed', level: 3, data: { ...c.data, statHp: '4' } }));
    expect(Object.keys(firestoreStore.get('games/g1/characters/c1')!).sort()).toEqual(keysIn('characterKeys').sort());
  });

  it('writes only the roll fields the rules list, with every optional one set', async () => {
    const roll: LoggedRoll = {
      id: 'r1',
      characterId: 'c1',
      characterName: 'Ada',
      moveName: 'Fight',
      stat: 'STR',
      resource: '+Favor',
      dice: [3, 4, 6],
      dropped: 2,
      mod: 1,
      total: 8,
      mode: 'adv',
      burned: true,
      band: '7-9',
      notation: '3d6',
      breakdown: '[3, 4, (6)] + 1',
      createdAt: 5,
    };
    await logRoll('g1', roll);
    expect(Object.keys(firestoreStore.get('games/g1/rolls/r1')!).sort()).toEqual(keysIn('rollKeys').sort());
  });

  it('restores a backup that passes the import check into documents with only the fields the rules list', async () => {
    const character = { id: 'c1', name: 'Ada', playbook: 'blessed', level: 2, data: { statStr: '+1' } };
    const roll = {
      id: 'r1',
      characterId: 'c1',
      characterName: 'Ada',
      moveName: 'Fight',
      stat: 'STR',
      dice: [3, 4],
      mod: 1,
      total: 8,
      mode: 'normal',
      band: '7-9',
      createdAt: 5,
    };
    const game = { name: 'Back', createdAt: 1, characters: [character], diceRolls: [roll] };
    const check = readImportFile(JSON.stringify({ format: 'hearthfire-game-export', version: 1, game }));
    expect(check.ok).toBe(true);
    firestoreStore.set('games/g1', { name: 'x', createdAt: 1, characters: [], schemaVersion: 2 });
    await replaceGame('g1', game);
    const stored = (path: string) => Object.keys(firestoreStore.get(path)!);
    expect(stored('games/g1/characters/c1').every((k) => keysIn('characterKeys').includes(k))).toBe(true);
    expect(stored('games/g1/rolls/r1').every((k) => keysIn('rollKeys').includes(k))).toBe(true);
  });

  it('lets a backup carry exactly the character and roll fields the rules list, besides `order`', () => {
    const without = (keys: string[]) => keys.filter((k) => k !== 'order').sort();
    expect([...IMPORTABLE_CHARACTER_FIELDS].sort()).toEqual(without(keysIn('characterKeys')));
    expect([...IMPORTABLE_ROLL_FIELDS].sort()).toEqual(without(keysIn('rollKeys')));
  });

  // The size limits are written twice (rules and import check): every one the rules state must be the one the import check enforces.
  it('refuses, in the import check, exactly what the rules cap: one past each limit, and nothing at the limit (playbook and stat are limited to the values the reader knows, so their caps are not probed)', () => {
    const caps = [...rules.matchAll(/shortOrAbsent\(data, '(\w+)', (\d+)\)/g)].map((m) => [m[1]!, Number(m[2])] as const);
    expect(caps.length).toBeGreaterThan(5);
    const restore = (game: Record<string, unknown>) =>
      readImportFile(JSON.stringify({ format: 'hearthfire-game-export', version: 1, game })).ok;
    const base = { name: 'x', createdAt: 1, characters: [] };
    const roll = (over: Record<string, unknown>) => ({
      ...base,
      diceRolls: [{ id: 'r1', characterId: 'c1', createdAt: 1, stat: 'STR', mode: 'normal', dice: [1], mod: 0, total: 1, ...over }],
    });
    // `stat` is also limited to the stats the reader knows, so its length cap cannot be probed with filler text.
    for (const [field, cap] of caps.filter(([field]) => field !== 'stat')) {
      expect(restore(roll({ [field]: 'x'.repeat(cap) })), `${field} at ${cap}`).toBe(true);
      expect(restore(roll({ [field]: 'x'.repeat(cap + 1) })), `${field} at ${cap + 1}`).toBe(false);
    }
    const name = Number(/data\.name\.size\(\) <= (\d+)/.exec(rules)![1]);
    const character = (over: Record<string, unknown>) => ({
      ...base,
      characters: [{ id: 'c1', name: 'a', playbook: 'blessed', level: 1, ...over }],
    });
    expect(restore(character({ name: 'x'.repeat(name) }))).toBe(true);
    expect(restore(character({ name: 'x'.repeat(name + 1) }))).toBe(false);
  });

  it('restores a backup whose characters have no level, or a level written as text, with the level the rules require', async () => {
    firestoreStore.set('games/g1', { name: 'x', createdAt: 1, characters: [], schemaVersion: 2 });
    const characters = [
      { id: 'c1', name: 'Ada', playbook: 'blessed' },
      { id: 'c2', name: 'Bo', playbook: 'fox', level: '2' },
      { id: 'c3', name: 'Cy', playbook: 'fox', level: 4 },
    ];
    await replaceGame('g1', { name: 'Back', createdAt: 1, characters });
    expect([1, 2, 3].map((n) => firestoreStore.get(`games/g1/characters/c${n}`)!.level)).toEqual([1, 2, 4]);
  });

  it('uses the limits the rules state for a character and a roll', () => {
    const limit = (pattern: RegExp) => Number(pattern.exec(rules)?.[1]);
    expect(LIMITS).toEqual({
      name: limit(/data\.name\.size\(\) <= (\d+)/),
      playbook: limit(/data\.playbook\.size\(\) <= (\d+)/),
      level: limit(/data\.level <= (\d+)/),
      sheetFields: limit(/data\.data\.keys\(\)\.size\(\) <= (\d+)/),
      characterId: limit(/data\.characterId\.size\(\) <= (\d+)/),
      dice: limit(/data\.dice\.size\(\) <= (\d+)/),
    });
  });

  it('shortens a roll label to the length the rules allow, so a long custom move name still reaches the log', async () => {
    expect(ROLL_TEXT_MAX_LENGTH).toBe(Number(/shortOrAbsent\(data, 'moveName', (\d+)\)/.exec(rules)![1]));
    const long = 'x'.repeat(ROLL_TEXT_MAX_LENGTH + 50);
    const roll = {
      id: 'r9',
      characterId: 'c1',
      characterName: long,
      moveName: long,
      resource: long,
      stat: 'STR',
      dice: [1],
      mod: 0,
      total: 1,
      mode: 'normal',
      band: null,
      createdAt: 1,
    } as LoggedRoll;
    await logRoll('g1', roll);
    const stored = firestoreStore.get('games/g1/rolls/r9')!;
    for (const field of ['characterName', 'moveName', 'resource'])
      expect((stored[field] as string).length, field).toBe(ROLL_TEXT_MAX_LENGTH);
  });

  it('does not cut an emoji in half when it shortens a roll label', async () => {
    const label = `${'x'.repeat(ROLL_TEXT_MAX_LENGTH - 1)}😀tail`; // the emoji straddles the limit
    const roll = {
      id: 'r8',
      characterId: 'c1',
      characterName: 'Ada',
      moveName: label,
      stat: 'STR',
      dice: [1],
      mod: 0,
      total: 1,
      mode: 'normal',
      band: null,
      createdAt: 1,
    };
    await logRoll('g1', roll as LoggedRoll);
    const moveName = firestoreStore.get('games/g1/rolls/r8')!.moveName as string;
    expect(moveName).toBe('x'.repeat(ROLL_TEXT_MAX_LENGTH - 1));
    expect(moveName).not.toMatch(/[\uD800-\uDBFF]$/);
  });
});
