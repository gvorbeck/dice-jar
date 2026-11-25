import '@/utils'; // first: validation/rules and utils import each other, and this order is the one that loads
import { describe, it, expect } from 'vitest';
import { allRaces, allClasses } from '@/data';
import { Rules, ABILITY_NAMES } from './rules';

const ok = (rule: { validate: (v: never) => boolean }, value: unknown) => rule.validate(value as never);

describe('Rules', () => {
  it('checks types', () => {
    expect([ok(Rules.isString, 'a'), ok(Rules.isString, 1)]).toEqual([true, false]);
    expect([ok(Rules.isNumber, 1), ok(Rules.isNumber, '1')]).toEqual([true, false]);
    expect([ok(Rules.isInteger, 3), ok(Rules.isInteger, 3.5)]).toEqual([true, false]);
  });

  it('checks string length and pattern', () => {
    expect([ok(Rules.minLength(3), 'abc'), ok(Rules.minLength(3), 'ab')]).toEqual([true, false]);
    expect([ok(Rules.maxLength(3), 'abc'), ok(Rules.maxLength(3), 'abcd')]).toEqual([true, false]);
    expect(Rules.minLength(3).message).toBe('Must be at least 3 characters');
    expect(Rules.maxLength(3).message).toBe('Must be no more than 3 characters');
    const digits = Rules.pattern(/^\d+$/, 'Digits only');
    expect([ok(digits, '123'), ok(digits, '12a')]).toEqual([true, false]);
    expect(digits.message).toBe('Digits only');
  });

  it('checks number bounds', () => {
    expect([ok(Rules.min(5), 5), ok(Rules.min(5), 4)]).toEqual([true, false]);
    expect([ok(Rules.max(5), 5), ok(Rules.max(5), 6)]).toEqual([true, false]);
    expect([ok(Rules.range(1, 3), 1), ok(Rules.range(1, 3), 3), ok(Rules.range(1, 3), 4), ok(Rules.range(1, 3), 0)]).toEqual([true, true, false, false]); // prettier-ignore
    expect(Rules.range(1, 3).message).toBe('Must be between 1 and 3');
  });

  // Each ability is a score from 3 to 18 (Core Rules p. 4).
  it('accepts an ability score from 3 to 18, whole numbers only', () => {
    const scores = [2, 3, 10, 18, 19, 10.5].map((n) => ok(Rules.isValidAbilityScore, n));
    expect(scores).toEqual([false, true, true, true, false, false]);
    expect(ok(Rules.isValidAbilityScore, '10')).toBe(false);
  });

  it('names the six abilities', () => {
    expect(ABILITY_NAMES).toEqual(['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma']);
  });

  it('accepts a name of 2 to 50 letters, spaces, hyphens, apostrophes and periods', () => {
    const names = ['Bo', "D'Arcy-Smith Jr.", ' Brom ', 'B', 'R2D2', 'x'.repeat(51), 'Brom<script>'].map((n) => ok(Rules.characterName, n));
    expect(names).toEqual([true, true, true, false, false, false, false]);
  });

  it('wants at least one item in a list', () => {
    expect([ok(Rules.nonEmptyArray, [1]), ok(Rules.nonEmptyArray, []), ok(Rules.nonEmptyArray, 'x')]).toEqual([true, false, false]);
  });

  it('accepts a known race, a custom race, or none yet', () => {
    const rule = Rules.validRace(allRaces);
    expect([ok(rule, 'human'), ok(rule, ''), ok(rule, 'custom'), ok(rule, 'Tiefling')]).toEqual([true, true, true, true]);
    expect(rule.message).toBe('Selected race is not available');
  });

  it('accepts known and custom classes in a list', () => {
    const rule = Rules.validClassArray(allClasses);
    expect([ok(rule, ['fighter']), ok(rule, ['fighter', 'witch']), ok(rule, [])]).toEqual([true, true, true]);
    expect(ok(rule, [5])).toBe(false);
    expect(ok(rule, 'fighter')).toBe(false);
  });
});
