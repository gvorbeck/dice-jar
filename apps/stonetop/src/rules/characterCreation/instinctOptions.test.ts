import { describe, expect, it } from 'vitest';
import { INSTINCT_OPTIONS } from './instinctOptions';

// Stonetop (Book 1), pp. 105-106, the Blessed's Instinct list.
describe('Blessed instincts', () => {
  it('match the book word for word', () => {
    expect(INSTINCT_OPTIONS.blessed?.map((o) => `${o.label} ${o.description}`)).toEqual([
      'DELIGHT To find beauty, in even the most ugly thing.',
      'DETACHMENT To remain unmoved, to be cold as winter.',
      'NURTURE To help others grow, learn, or improve.',
      'PRESERVATION To protect the natural world.',
      'REVERENCE To demand sacrifice to the spirits and Danu.',
    ]);
  });
});
