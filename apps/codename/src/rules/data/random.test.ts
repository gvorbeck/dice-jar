import { afterEach, expect, it, vi } from 'vitest';
import { pick, randomInt } from './random';

afterEach(() => vi.restoreAllMocks());

it('redraws a value that would favour the low results', () => {
  const draws = [2 ** 32 - 1, 4]; // 2^32 − 1 is not below the largest multiple of 3 (2^32 − 1), so taking it % 3 would over-weight 0
  vi.spyOn(crypto, 'getRandomValues').mockImplementation(((a: Uint32Array) => {
    a[0] = draws.shift()!;
    return a;
  }) as typeof crypto.getRandomValues);
  expect(randomInt(3)).toBe(1);
});

it('picking from an empty list throws instead of returning undefined', () => {
  expect(() => pick([])).toThrow('empty list');
});
