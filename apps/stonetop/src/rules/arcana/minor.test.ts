import { describe, expect, it } from 'vitest';
import { MINOR_ARCANA } from './minor';

// Stonetop (Book 1), p. 20: the range tags are hand < close < reach < near < far; there is no "band" tag.
// A misread glyph turned "hand" into "band" on five arcana (Wider World pp. 512, 517, 524, 534, 539).
describe('minor arcana weapon tags', () => {
  it('never use the misread "band" tag', () => {
    expect(JSON.stringify(MINOR_ARCANA)).not.toContain('*band*');
  });
});
