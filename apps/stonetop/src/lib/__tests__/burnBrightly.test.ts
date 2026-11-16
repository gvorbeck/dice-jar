import { describe, expect, it } from 'vitest';
import { BURN_BRIGHTLY_COST, canBurnBrightly } from '../burnBrightly';
import type { CharacterData } from '@/types';

const at = (statXp: string, statLevel: string, over: Partial<CharacterData> = {}) => ({ statXp, statLevel, ...over }) as CharacterData;

// Book 1, pp. 74-75, 231, 528 (and Would-be Hero, Driven, p. 137): spend 2 XP after a roll for +1, once you have enough
// XP to Level Up (6 + twice your level); the Driven Would-be Hero may always do it.
describe('canBurnBrightly', () => {
  it('costs 2 XP', () => {
    expect(BURN_BRIGHTLY_COST).toBe(2);
  });
  it('needs the XP to level up (6 + 2 × level)', () => {
    expect(canBurnBrightly(at('7', '1'))).toBe(false); // needs 8
    expect(canBurnBrightly(at('8', '1'))).toBe(true);
    expect(canBurnBrightly(at('9', '2'))).toBe(false); // needs 10
    expect(canBurnBrightly(at('10', '2'))).toBe(true);
  });
  it('lets the Driven Would-be Hero do it with any 2 XP', () => {
    expect(canBurnBrightly(at('2', '1', { background: 'driven' }))).toBe(true);
    expect(canBurnBrightly(at('1', '1', { background: 'driven' }))).toBe(false);
  });
  it('is false without data, XP or a level', () => {
    expect(canBurnBrightly(undefined)).toBe(false);
    expect(canBurnBrightly(at('', '1'))).toBe(false);
    expect(canBurnBrightly(at('20', ''))).toBe(false);
  });
});
