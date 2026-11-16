import { describe, it, expect } from 'vitest';
import { parseDiceRolls } from '../gameParsing';

const base = {
  id: 'r1',
  characterId: 'gm',
  characterName: 'GM',
  moveName: '',
  stat: 'nothing',
  dice: [],
  mod: 0,
  total: 9,
  mode: 'normal',
  band: null,
  createdAt: 1,
};

describe('parseDiceRolls', () => {
  it('keeps notation and breakdown on free-form rolls', () => {
    const [roll] = parseDiceRolls([{ ...base, notation: '2d6+1', breakdown: '[4, 4] + 1' }]) ?? [];
    if (!roll) throw new Error('no roll parsed');
    expect(roll.notation).toBe('2d6+1');
    expect(roll.breakdown).toBe('[4, 4] + 1');
  });

  it('keeps the Burn Brightly flag only when it is true', () => {
    expect(parseDiceRolls([{ ...base, burned: true }])?.[0]).toHaveProperty('burned', true);
    expect(parseDiceRolls([{ ...base, burned: false }])?.[0]).not.toHaveProperty('burned');
    expect(parseDiceRolls([base])?.[0]).not.toHaveProperty('burned');
  });

  it('leaves them off legacy move rolls', () => {
    const [roll] = parseDiceRolls([base]) ?? [];
    expect(roll).not.toHaveProperty('notation');
    expect(roll).not.toHaveProperty('breakdown');
  });
});
