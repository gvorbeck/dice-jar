import { describe, expect, it } from 'vitest';
import { PLAYBOOKS } from '../constants';

// Stonetop (Book 1), the stat block on the front of each playbook (pp. 105-140): damage die and max HP.
const BOOK: Record<string, [damage: string, hp: number]> = {
  blessed: ['d6', 18],
  fox: ['d8', 16],
  heavy: ['d10', 20],
  judge: ['d6', 20],
  lightbearer: ['d4', 18],
  marshal: ['d8', 20],
  ranger: ['d8', 18],
  seeker: ['d6', 16],
  'would-be-hero': ['d6', 16],
};

describe('playbook stats', () => {
  it('match the book', () => {
    expect(Object.fromEntries(PLAYBOOKS.map((p) => [p.value, [p.damage, p.hpMax]]))).toEqual(BOOK);
  });

  // Two playbook intros once had words run together ("sendyour", "facedstorm"): Marshal p. 125, Ranger p. 133.
  it('keep the intro words the book separates', () => {
    const text = (v: string) => PLAYBOOKS.find((p) => p.value === v)!.description;
    expect(text('marshal')).toContain('to send your neighbors to a sure death');
    expect(text('ranger')).toContain("where you've faced storm and beast alike");
  });
});
