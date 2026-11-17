import { expect, it } from 'vitest';
import { pick } from './random';

it('picking from an empty list throws instead of returning undefined', () => {
  expect(() => pick([])).toThrow('empty list');
});
