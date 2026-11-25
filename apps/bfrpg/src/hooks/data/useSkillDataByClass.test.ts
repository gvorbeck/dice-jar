import '@/utils'; // first: validation/rules and utils import each other, and this order is the one that loads
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { allClasses } from '@/data';
import type { Game } from '@/types';
import { useSkillDataByClass } from './useSkillDataByClass';

const game = { players: [{ character: 'c1', user: 'u1' }] } as unknown as Game;
const hero = (over = {}) => ({ id: 'c1', name: 'Brom', class: 'thief', level: 3, ...over });
const run = (characters: unknown[]) => renderHook(() => useSkillDataByClass(characters as never, game)).result.current;

// Thief Abilities, Core Rules p. 9: [level, Open Locks, Remove Traps, Pick Pockets, Move Silently, Climb Walls, Hide, Listen].
const BOOK = [
  [1, 25, 20, 30, 25, 80, 10, 30],
  [2, 30, 25, 35, 30, 81, 15, 34],
  [10, 68, 63, 74, 68, 89, 53, 65],
  [15, 83, 78, 94, 83, 94, 68, 80],
  [20, 88, 83, 99, 93, 99, 73, 95],
] as const;

describe('the Thief ability table in the class data', () => {
  const thief = allClasses.find((c) => c.id === 'thief')!;

  it.each(BOOK)('level %i matches the book', (level, openLocks, removeTraps, pickPockets, moveSilently, climbWalls, hide, listen) => {
    expect(thief.skills?.[level]).toMatchObject({ openLocks, removeTraps, pickPockets, moveSilently, climbWalls, hide, listen });
  });
});

describe('useSkillDataByClass', () => {
  it('gives nothing when there are no characters', () => {
    expect(run([])).toEqual([]);
  });

  it('ignores a class without skills', () => {
    expect(run([hero({ class: 'fighter' })])).toEqual([]);
  });

  it('builds one row per level, with a character marked in their own level row', () => {
    const [thieves] = run([hero()]);
    expect(thieves).toMatchObject({ classId: 'thief', displayName: 'Thief Skills' });
    expect(thieves!.skills).toHaveLength(20);
    const row = thieves!.skills.find((r) => r.level === 3)!;
    expect(row).toMatchObject({ isPlayer: true, characterName: 'Brom', characterId: 'c1', userId: 'u1', openLocks: 35 });
    expect(thieves!.skills.find((r) => r.level === 4)).toMatchObject({ isPlayer: false, id: 'thief-4' });
  });

  it('adds a row for every character at one level', () => {
    const [thieves] = run([hero(), hero({ id: 'c2', name: 'Ada' })]);
    expect(thieves!.skills.filter((r) => r.level === 3)).toHaveLength(2);
    expect(thieves!.skills.find((r) => r.characterName === 'Ada')!.userId).toBeUndefined();
  });

  it('keeps a table for each skill class present', () => {
    expect(run([hero(), hero({ id: 'c3', class: 'assassin' })]).map((t) => t.classId)).toEqual(['thief', 'assassin']);
  });

  it('warns and leaves the table empty when a class has no skill data', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const thief = allClasses.find((c) => c.id === 'thief')!;
    const saved = thief.skills;
    thief.skills = undefined;
    try {
      expect(run([hero()])).toEqual([{ classId: 'thief', displayName: 'Thief Skills', skills: [] }]);
      expect(warn).toHaveBeenCalledWith('Missing skills data for class: thief');
    } finally {
      thief.skills = saved;
    }
  });
});
