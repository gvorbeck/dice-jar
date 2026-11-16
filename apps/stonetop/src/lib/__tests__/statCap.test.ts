import { describe, expect, it } from 'vitest';
import { statCap } from '../statCap';

// Book 1, pp. 52, 106-107: Improved Stat raises a stat to at most +2; only Superior Stat (level 6+) reaches +3.
describe('statCap', () => {
  it('is +2 with no Superior Stat taken', () => {
    expect(statCap(undefined)).toBe(2);
    expect(statCap({})).toBe(2);
    expect(statCap({ 'judge-improved-stat': 3 })).toBe(2);
  });
  it('is +3 once any playbook’s Superior Stat is taken', () => {
    expect(statCap({ 'ranger-superior-stat': 1 })).toBe(3);
    expect(statCap({ 'judge-superior-stat': 1, 'judge-improved-stat': 2 })).toBe(3);
  });
  it('ignores a Superior Stat that is present but not taken', () => {
    expect(statCap({ 'judge-superior-stat': 0 })).toBe(2);
  });
});
