import '@/utils'; // first: validation/rules and utils import each other, and this order is the one that loads
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { ClassSkillData, SkillTableRow } from '@/types';
import { useSkillColumns } from './useSkillColumns';

const row = (over: Partial<SkillTableRow> = {}) => ({ id: 'r', level: 1, isPlayer: false, userId: undefined, ...over }) as SkillTableRow;
const columnsFor = (classId: string, skills: SkillTableRow[]) =>
  renderHook(() => useSkillColumns({ classId, displayName: 'Skills', skills } as unknown as ClassSkillData)).result.current;

describe('useSkillColumns', () => {
  it('has a level column and one for each skill the class has', () => {
    const columns = columnsFor('thief', [row()]);
    expect(columns.map((c) => c.key).slice(0, 2)).toEqual(['level', 'openLocks']);
    expect(columns.some((c) => c.key === 'characterName')).toBe(false);
    expect(columns.find((c) => c.key === 'openLocks')).toMatchObject({ header: 'Open Locks', ariaLabel: 'Open Locks percentage chance' });
  });

  it('adds the character column only when a player is in the table', () => {
    const columns = columnsFor('thief', [row({ isPlayer: true, characterName: 'Brom' })]);
    const name = columns.find((c) => c.key === 'characterName')!;
    expect(name.cell!(row({ characterName: 'Brom' }))).toBe('Brom');
    expect(name.cell!(row())).toBe('—');
  });

  it('shows the level and each skill as a percentage, or a dash', () => {
    const columns = columnsFor('thief', [row()]);
    expect(columns[0]!.cell!(row({ level: 7 }))).toBe('7');
    const openLocks = columns.find((c) => c.key === 'openLocks')!;
    expect(openLocks.cell!(row({ openLocks: 55 }))).toBe('55%');
    expect(openLocks.cell!(row())).toBe('—');
  });

  it('shows no skill columns for a class without skills', () => {
    expect(columnsFor('fighter', []).map((c) => c.key)).toEqual(['level']);
  });
});
