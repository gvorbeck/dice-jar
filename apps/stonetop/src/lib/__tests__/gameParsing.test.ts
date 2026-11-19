import { describe, it, expect } from 'vitest';
import { parseCharacters, parseDiceRolls, parseSteading } from '../gameParsing';

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

describe('parseCharacters — custom moves', () => {
  it('keeps a character’s custom moves, so a write-back does not erase them', () => {
    const customMoves = [{ id: 'm1', name: 'Howl', text: 'When you howl, roll +CHA.' }];
    const [c] = parseCharacters({ characters: [{ id: 'c1', name: 'A', playbook: 'ranger', level: 1, data: { customMoves } }] });
    expect(c?.data?.customMoves).toEqual(customMoves);
  });
  it('drops malformed custom moves', () => {
    const [c] = parseCharacters({
      characters: [{ id: 'c1', name: 'A', playbook: 'ranger', level: 1, data: { customMoves: [{ id: 'm1' }, 'x'] } }],
    });
    expect(c?.data?.customMoves).toEqual([]);
  });
});

describe('a character level the reader repairs', () => {
  it.each([
    [undefined, 1],
    [null, 1],
    ['2', 2],
    ['high', 1],
    [3, 3],
  ])('reads level %j as %j, the same way a restore stores it', (level, expected) => {
    const [c] = parseCharacters({ characters: [{ id: 'c1', name: 'A', playbook: 'ranger', level }] });
    expect(c?.level).toBe(expected);
  });
});

// The old first Harnessing the Stream box meant "a reservoir, and some way for water to flow uphill"; it is now two boxes (Book 1, p. 157).
describe('Harnessing the Stream boxes saved before it was split', () => {
  const OLD = 'harnessing-the-stream__req__b1i0__0';
  const AQUEDUCTS = 'harnessing-the-stream__req__b1i1__0';
  const RESERVOIR = 'harnessing-the-stream__req__b1i2__0';

  it('counts the old tick for the reservoir too, and leaves the aqueduct box alone', () => {
    expect(parseSteading({ improvements: { [OLD]: true, [AQUEDUCTS]: false } })?.improvements).toEqual({
      [OLD]: true,
      [AQUEDUCTS]: false,
      [RESERVOIR]: true,
    });
  });

  it('keeps a reservoir box the GM has since cleared', () => {
    expect(parseSteading({ improvements: { [OLD]: true, [RESERVOIR]: false } })?.improvements).toEqual({ [OLD]: true, [RESERVOIR]: false });
  });

  it('adds nothing when the old box was never ticked', () => {
    expect(parseSteading({ improvements: { [AQUEDUCTS]: true } })?.improvements).toEqual({ [AQUEDUCTS]: true });
  });
});
