import '@/utils'; // first: validation/rules and utils import each other, and this order is the one that loads
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { roll } from '@dice-jar/dice';
import { createMockCharacter } from '@/test/helpers';
import {
  calculateSpellSuccessRate,
  calculateSpellCost,
  calculateSpellTime,
  formatSpellLevel,
  getAvailableCantrips,
  getSpellTypeInfo,
  getCantripOptions,
  assignStartingCantrips,
  rollForEncounter,
  getRandomTableResult,
  createCombatantFromEncounter,
  delay,
} from './magic';

vi.mock('@dice-jar/dice', () => ({ roll: vi.fn() }));
const rolls = (total: number) => vi.mocked(roll).mockReturnValue({ total } as never);
beforeEach(() => vi.mocked(roll).mockReset());

// Spell scrolls, Core Rules p. 192: 15% + 5% per caster level + the casting ability, -10% per spell level; 50 gp and 1 day per spell level.
describe('scroll arithmetic', () => {
  it('matches the book example: a 9th level caster with a 15 has 75%', () => {
    expect(calculateSpellSuccessRate(9, 15, 0, 0)).toBe(75);
  });

  it('takes 10% off per spell level and adds any bonus', () => {
    expect(calculateSpellSuccessRate(9, 15, 0, 2)).toBe(55);
    expect(calculateSpellSuccessRate(9, 15, 10, 2)).toBe(65);
  });

  // shortcut: the 5% and 95% limits are the app's own (the book gives 95% only for spell research, p. 191)
  it('stays between 5% and 95%', () => {
    expect(calculateSpellSuccessRate(1, 3, 0, 9)).toBe(5);
    expect(calculateSpellSuccessRate(20, 18, 50, 0)).toBe(95);
  });

  it('costs 50 gp and takes a day per spell level, less with a reduction', () => {
    expect(calculateSpellCost(3)).toBe(150);
    expect(calculateSpellCost(3, 50, 50)).toBe(75);
    expect(calculateSpellTime(3)).toBe(3);
    expect(calculateSpellTime(3, 1, 50)).toBe(1);
    expect(calculateSpellTime(1, 1, 90)).toBe(1);
  });

  it('writes ordinals', () => {
    expect([1, 2, 3, 4, 9].map(formatSpellLevel)).toEqual(['1st', '2nd', '3rd', '4th', '9th']);
  });
});

describe('cantrips and orisons', () => {
  it('gives Clerics orisons on Wisdom, and arcane casters cantrips on Intelligence', () => {
    expect(getSpellTypeInfo(createMockCharacter({ class: 'cleric' }))).toMatchObject({
      type: 'orisons',
      abilityScore: 'Wisdom',
      capitalized: 'Orisons',
    });
    expect(getSpellTypeInfo(createMockCharacter({ class: 'magic-user' }))).toMatchObject({
      type: 'cantrips',
      abilityScore: 'Intelligence',
      singular: 'cantrip',
    });
  });

  it('treats a custom class with spells as arcane', () => {
    const witch = createMockCharacter({ class: 'witch', spells: [{ name: 'Sleep' }] as never });
    expect(getSpellTypeInfo(witch).abilityScore).toBe('Intelligence');
  });

  it('offers magic-user cantrips to a combination class and to a custom class with spells', () => {
    const forFighterMage = getAvailableCantrips(createMockCharacter({ class: 'fighter-magic-user' }));
    expect(forFighterMage.length).toBeGreaterThan(0);
    expect(forFighterMage.every((c) => c.classes.includes('magic-user'))).toBe(true);
    const witch = getAvailableCantrips(createMockCharacter({ class: 'witch', spells: [{ name: 'Sleep' }] as never }));
    expect(witch).toEqual(forFighterMage);
  });

  it('lists only the cantrips a character does not know yet', () => {
    const all = getAvailableCantrips(createMockCharacter({ class: 'magic-user' }));
    const options = getCantripOptions(all, [all[0]!]);
    expect(options).toHaveLength(all.length - 1);
    expect(options[0]).toEqual({ value: all[1]!.name, label: all[1]!.name });
  });

  it('keeps cantrips a character already has, and gives none to a fighter', () => {
    const known = [{ name: 'Light' }] as never;
    expect(assignStartingCantrips(createMockCharacter({ class: 'magic-user', cantrips: known }))).toBe(known);
    expect(assignStartingCantrips(createMockCharacter({ class: 'fighter', cantrips: [] }))).toEqual([]);
  });

  it('rolls 1d4 plus the casting modifier for how many a caster starts with', () => {
    rolls(3);
    const cantrips = assignStartingCantrips(createMockCharacter({ class: 'magic-user', cantrips: [] }));
    expect(roll).toHaveBeenCalledWith('1d4');
    expect(cantrips).toHaveLength(3 + 0); // the mock Magic-User has Intelligence modifier 0
    expect(new Set(cantrips.map((c) => c.name)).size).toBe(3);
  });

  it('gives none when the roll plus a penalty comes to nothing', () => {
    rolls(1);
    const abilities = createMockCharacter().abilities;
    const dull = createMockCharacter({
      class: 'magic-user',
      cantrips: [],
      abilities: { ...abilities, intelligence: { value: 3, modifier: -3 } },
    });
    expect(assignStartingCantrips(dull)).toEqual([]);
  });
});

describe('encounter helpers', () => {
  it('starts an encounter on a 1 in 6', () => {
    rolls(1);
    expect(rollForEncounter()).toBe(true);
    rolls(2);
    expect(rollForEncounter()).toBe(false);
  });

  it('picks from a table by a d12, capped to the table length', () => {
    rolls(2);
    expect(getRandomTableResult(['a', 'b', 'c'])).toBe('b');
    rolls(12);
    expect(getRandomTableResult(['a', 'b', 'c'])).toBe('c');
    expect(getRandomTableResult([])).toBeNull();
  });

  it('turns an encounter name into an enemy with AC 13 to 16', () => {
    rolls(4);
    expect(createCombatantFromEncounter('NPC Party: Bandit*')).toEqual({ name: 'Bandit', ac: 16, initiative: 0, isPlayer: false });
  });

  it('delays by the given time', async () => {
    vi.useFakeTimers();
    const done = vi.fn();
    void delay(100).then(done);
    await vi.advanceTimersByTimeAsync(99);
    expect(done).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(done).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
