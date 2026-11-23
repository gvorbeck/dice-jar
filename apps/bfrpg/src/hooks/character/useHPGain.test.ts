import '@/utils'; // first: validation/rules and utils import each other, and this order is the one that loads
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { roll } from '@dice-jar/dice';
import { allClasses } from '@/data';
import { createMockCharacter, createMockAbilityScores } from '@/test/helpers';
import { useHPGain } from './useHPGain';

vi.mock('@dice-jar/dice', () => ({ roll: vi.fn() }));
beforeEach(() =>
  vi
    .mocked(roll)
    .mockReset()
    .mockReturnValue({ total: 4, breakdown: '4' } as never),
);

const classOf = (id: string) => allClasses.find((c) => c.id === id)!;
const withCon = (modifier: number) => createMockAbilityScores({ constitution: { value: 14, modifier } });
const props = (overrides = {}) => ({
  character: createMockCharacter({ class: 'cleric', level: 2, abilities: withCon(1) }),
  primaryClass: classOf('cleric'),
  hasRequiredXP: true,
  isOpen: true,
  nextLevel: 3,
  ...overrides,
});

describe('useHPGain', () => {
  it('rolls the class hit die and adds the Constitution modifier', () => {
    const { result } = renderHook(() => useHPGain(props()));
    expect(roll).toHaveBeenCalledWith('1d6');
    expect(result.current.hpGainResult).toMatchObject({ roll: 4, constitutionBonus: 1, total: 5, max: 7, isFixed: false });
  });

  it('never gives less than 1 hit point', () => {
    vi.mocked(roll).mockReturnValue({ total: 1, breakdown: '1' } as never);
    const { result } = renderHook(() =>
      useHPGain(props({ character: createMockCharacter({ class: 'cleric', level: 2, abilities: withCon(-3) }) })),
    );
    expect(result.current.hpGainResult?.total).toBe(1);
  });

  // After 9th level hit points are a fixed +2 for Fighters and Thieves and +1 for Clerics and Magic-Users (Core Rules pp. 7-8: 9d8+2, 9d4+2, 9d6+1, 9d4+1).
  it.each([
    ['fighter', 2],
    ['thief', 2],
    ['cleric', 1],
    ['magic-user', 1],
  ])('gives a %s a fixed %i hit points per level after 9th', (id, fixed) => {
    const { result } = renderHook(() =>
      useHPGain(props({ character: createMockCharacter({ class: id, level: 9 }), primaryClass: classOf(id), nextLevel: 10 })),
    );
    expect(roll).not.toHaveBeenCalled();
    expect(result.current.hpGainResult).toMatchObject({ total: fixed, roll: null, isFixed: true });
  });

  it('uses the character hit die for a custom class, and a fixed 1 after 9th', () => {
    const witch = (level: number) =>
      createMockCharacter({ class: 'witch', level, abilities: withCon(0), hp: { current: 5, max: 5, points: [], die: '1d8' } as never });
    const early = renderHook(() => useHPGain(props({ character: witch(3), primaryClass: null, nextLevel: 4 })));
    expect(roll).toHaveBeenCalledWith('1d8');
    expect(early.result.current.hpGainResult).toMatchObject({ total: 4, max: 8 });
    const late = renderHook(() => useHPGain(props({ character: witch(9), primaryClass: null, nextLevel: 10 })));
    expect(late.result.current.hpGainResult).toMatchObject({ total: 1, isFixed: true });
  });

  it('rolls nothing until the level-up is open and the XP is there', () => {
    expect(renderHook(() => useHPGain(props({ isOpen: false }))).result.current.hpGainResult).toBeNull();
    expect(renderHook(() => useHPGain(props({ hasRequiredXP: false }))).result.current.hpGainResult).toBeNull();
    expect(roll).not.toHaveBeenCalled();
  });

  it('forgets the roll when the level-up closes', () => {
    const { result, rerender } = renderHook((p) => useHPGain(p), { initialProps: props() });
    expect(result.current.hpGainResult).not.toBeNull();
    rerender(props({ isOpen: false }));
    expect(result.current.hpGainResult).toBeNull();
  });

  it('rolls again on request, only while it is open', () => {
    const { result } = renderHook(() => useHPGain(props()));
    vi.mocked(roll).mockReturnValue({ total: 6, breakdown: '6' } as never);
    act(() => result.current.rerollHP());
    expect(result.current.hpGainResult?.total).toBe(7);
    const closed = renderHook(() => useHPGain(props({ isOpen: false })));
    act(() => closed.result.current.rerollHP());
    expect(closed.result.current.hpGainResult).toBeNull();
  });

  it('takes a typed-in total, never below 1', () => {
    const { result } = renderHook(() => useHPGain(props()));
    act(() => result.current.setCustomHP(9));
    expect(result.current.hpGainResult).toMatchObject({ total: 9, roll: null, breakdown: 'Manual entry: 9' });
    act(() => result.current.setCustomHP(-4));
    expect(result.current.hpGainResult?.total).toBe(1);
  });

  it('reports a hit die it cannot read, and lets the error be cleared', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const bad = createMockCharacter({ class: 'witch', level: 3, hp: { current: 5, max: 5, points: [], die: 'banana' } as never });
    const { result } = renderHook(() => useHPGain(props({ character: bad, primaryClass: null, nextLevel: 4 })));
    expect(result.current.error).toContain('Invalid hit die format');
    act(() => result.current.clearError());
    expect(result.current.error).toBeNull();
  });
});
