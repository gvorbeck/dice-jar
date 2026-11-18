import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { firestoreMockModule, firestoreStore } from '@/test/firestoreMock';

vi.mock('firebase/app', () => ({ initializeApp: () => ({}) }));
vi.mock('firebase/firestore', () => firestoreMockModule());

import { addCharacter, editCharacter, logRoll, replaceGame } from '../gameV2';
import { IMPORTABLE_CHARACTER_FIELDS, IMPORTABLE_ROLL_FIELDS, readImportFile } from '../gameBackup';
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
  it('refuses, in the import check, exactly what the rules cap: one past each limit, and nothing at the limit', () => {
    const caps = [...rules.matchAll(/shortOrAbsent\(data, '(\w+)', (\d+)\)/g)].map((m) => [m[1]!, Number(m[2])] as const);
    expect(caps.length).toBeGreaterThan(5);
    const restore = (game: Record<string, unknown>) =>
      readImportFile(JSON.stringify({ format: 'hearthfire-game-export', version: 1, game })).ok;
    const base = { name: 'x', createdAt: 1, characters: [] };
    const roll = (over: Record<string, unknown>) => ({ ...base, diceRolls: [{ id: 'r1', characterId: 'c1', createdAt: 1, ...over }] });
    for (const [field, cap] of caps) {
      expect(restore(roll({ [field]: 'x'.repeat(cap) })), `${field} at ${cap}`).toBe(true);
      expect(restore(roll({ [field]: 'x'.repeat(cap + 1) })), `${field} at ${cap + 1}`).toBe(false);
    }
    const name = Number(/data\.name\.size\(\) <= (\d+)/.exec(rules)![1]);
    const playbook = Number(/data\.playbook\.size\(\) <= (\d+)/.exec(rules)![1]);
    const character = (over: Record<string, unknown>) => ({
      ...base,
      characters: [{ id: 'c1', name: 'a', playbook: 'b', level: 1, ...over }],
    });
    expect(restore(character({ name: 'x'.repeat(name) }))).toBe(true);
    expect(restore(character({ name: 'x'.repeat(name + 1) }))).toBe(false);
    expect(restore(character({ playbook: 'x'.repeat(playbook) }))).toBe(true);
    expect(restore(character({ playbook: 'x'.repeat(playbook + 1) }))).toBe(false);
  });

  it('restores a backup whose characters have no level, giving them the level 1 the rules require', async () => {
    firestoreStore.set('games/g1', { name: 'x', createdAt: 1, characters: [], schemaVersion: 2 });
    await replaceGame('g1', {
      name: 'Back',
      createdAt: 1,
      characters: [
        { id: 'c1', name: 'Ada', playbook: 'blessed' },
        { id: 'c2', name: 'Bo', playbook: 'fox', level: '2' },
      ],
    });
    expect(firestoreStore.get('games/g1/characters/c1')!.level).toBe(1);
    expect(firestoreStore.get('games/g1/characters/c2')!.level).toBe(1);
  });
});
