import { afterEach, describe, expect, it, vi } from 'vitest';
import { isOpenableId, MIN_GAME_ID, newGameId, randomInt, slugifyGameId } from './index';

describe('newGameId', () => {
  it('is two lowercase words and six characters, safe as a URL segment', () => {
    expect(newGameId(['Kestrel', 'Lantern'])).toMatch(/^(kestrel|lantern)-(kestrel|lantern)-[a-z0-9]{6}$/);
  });
  it('differs between calls', () => {
    expect(new Set(Array.from({ length: 20 }, () => newGameId(['a', 'b']))).size).toBeGreaterThan(1);
  });
});

describe('randomInt', () => {
  afterEach(() => vi.restoreAllMocks());

  it('stays in [0, n)', () => {
    for (let i = 0; i < 200; i++) expect(randomInt(3)).toBeLessThan(3);
  });
  it('redraws a value that would favour the low results', () => {
    const draws = [2 ** 32 - 1, 4]; // 2^32 − 1 is not below the largest multiple of 3 (2^32 − 1), so taking it % 3 would over-weight 0
    vi.spyOn(crypto, 'getRandomValues').mockImplementation(((a: Uint32Array) => {
      a[0] = draws.shift()!;
      return a;
    }) as typeof crypto.getRandomValues);
    expect(randomInt(3)).toBe(1);
  });
});

describe('slugifyGameId', () => {
  it('lowercases and collapses everything else to single dashes', () => {
    expect(slugifyGameId('  My Cool Game!  ')).toBe('my-cool-game');
    expect(slugifyGameId('--a   b__c--')).toBe('a-b-c');
    expect(slugifyGameId('!!!')).toBe('');
  });
  it('cuts to the length limit without leaving a trailing dash', () => {
    expect(slugifyGameId('abc-def', 4)).toBe('abc');
  });
});

describe('isOpenableId', () => {
  it('opens only IDs that are slugs and long enough', () => {
    expect(isOpenableId('a'.repeat(MIN_GAME_ID))).toBe(true);
    expect(isOpenableId('a'.repeat(MIN_GAME_ID - 1))).toBe(false);
    expect(isOpenableId('Not A Slug')).toBe(false);
  });
  it('refuses an ID longer than the limit', () => {
    expect(isOpenableId('abcde', 4)).toBe(false);
  });
});
