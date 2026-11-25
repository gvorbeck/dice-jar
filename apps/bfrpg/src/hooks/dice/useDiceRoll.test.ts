import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { roll } from '@dice-jar/dice';
import { useDiceRoll } from './useDiceRoll';

const addToast = vi.fn();
vi.mock('@dice-jar/browser', () => ({ useToast: () => ({ addToast }) }));
vi.mock('@dice-jar/dice', () => ({ roll: vi.fn() }));

const rolled = (...totals: number[]) => {
  const queue = [...totals];
  vi.mocked(roll).mockImplementation((() => ({ total: queue.shift() })) as never);
};
const hook = () => renderHook(() => useDiceRoll()).result.current;

beforeEach(() => {
  addToast.mockReset();
  vi.mocked(roll).mockReset();
});

describe('useDiceRoll', () => {
  it('shows an attack roll with its bonus', () => {
    rolled(12);
    hook().rollAttack('Melee', 3);
    expect(addToast).toHaveBeenCalledWith('Melee Attack: 1d20+3 = 12+3 = 15', 'success', true);
  });

  it('shows a negative bonus with its own sign', () => {
    rolled(12);
    hook().rollAttack('Missile', -2);
    expect(addToast).toHaveBeenCalledWith('Missile Attack: 1d20-2 = 12-2 = 10', 'success', true);
  });

  it('shows an ability check', () => {
    rolled(9);
    hook().rollAbility('Strength', 1);
    expect(addToast).toHaveBeenCalledWith('Strength Check: 1d20+1 = 9+1 = 10', 'success', true);
  });

  // A save succeeds on meeting the target; a natural 20 always succeeds and a natural 1 always fails (Core Rules p. 60).
  describe('saving throws', () => {
    it('succeeds on meeting the target, with the modifier added', () => {
      rolled(10);
      hook().rollSavingThrow('Spells', 12, 2);
      expect(addToast).toHaveBeenCalledWith('Spells: 1d20+2 = 10+2 = 12 vs target 12 - Success!', 'success', true);
    });

    it('fails below the target', () => {
      rolled(9);
      hook().rollSavingThrow('Magic Wands', 12);
      expect(addToast).toHaveBeenCalledWith('Magic Wands: 1d20 = 9 vs target 12 - Failed', 'error', true);
    });

    it('always succeeds on a natural 20', () => {
      rolled(20);
      hook().rollSavingThrow('Dragon Breath', 25);
      expect(addToast).toHaveBeenCalledWith(expect.stringContaining('Success!'), 'success', true);
    });

    it('always fails on a natural 1, whatever the modifier', () => {
      rolled(1);
      hook().rollSavingThrow('Death Ray or Poison', 5, 10);
      expect(addToast).toHaveBeenCalledWith(expect.stringContaining('Critical Failure!'), 'error', true);
    });
  });

  // A percentile roll succeeds on a result equal to or less than the target (Core Rules p. 2); Thief abilities run from 20% to 99% (p. 9).
  describe('percentile rolls', () => {
    it.each([
      [30, 30, 'Success!', 'success'],
      [31, 30, 'Failure', 'error'],
      [97, 99, 'Success!', 'success'],
      [99, 99, 'Success!', 'success'],
      [100, 99, 'Failure', 'error'],
      [2, 1, 'Failure', 'error'],
    ])('rolling %i against %i%%', (result, target, outcome, kind) => {
      rolled(0, result);
      hook().rollPercentile('Pick Pockets', target);
      expect(addToast).toHaveBeenCalledWith(`Pick Pockets: 1d100 = ${result} vs ${target}% - ${outcome}`, kind, true);
    });
  });

  it('says so when the dice fail', () => {
    vi.mocked(roll).mockImplementation(() => {
      throw new Error('no dice');
    });
    hook().rollAttack('Melee', 1);
    expect(addToast).toHaveBeenCalledWith('Failed to roll dice', 'error');
  });
});
