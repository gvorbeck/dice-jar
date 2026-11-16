import { describe, expect, it } from 'vitest';
import { newGameId, randomInt } from './index';

describe('newGameId', () => {
  it('is two lowercase words and six characters, safe as a URL segment', () => {
    expect(newGameId(['Kestrel', 'Lantern'])).toMatch(/^(kestrel|lantern)-(kestrel|lantern)-[a-z0-9]{6}$/);
  });
  it('differs between calls', () => {
    expect(new Set(Array.from({ length: 20 }, () => newGameId(['a', 'b']))).size).toBeGreaterThan(1);
  });
});

describe('randomInt', () => {
  it('stays in [0, n)', () => {
    for (let i = 0; i < 200; i++) expect(randomInt(3)).toBeLessThan(3);
  });
});
