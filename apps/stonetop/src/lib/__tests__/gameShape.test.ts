import { describe, expect, it } from 'vitest';
import { joinGame, splitGame, SCHEMA_VERSION } from '../gameShape';
import { parseGameSession } from '../gameParsing';

// A game as v1 stores it, with the awkward parts real data has: nested maps and arrays, a field this build
// doesn't know about on a character and on the game, and notes with a lock.
const character = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  name: `Char ${id}`,
  playbook: 'blessed',
  level: 2,
  data: {
    statStr: '+1',
    typeMoves: { 'blessed-rites-of-the-land': true },
    arcanaMinor: [{ id: '31', requirementsChecked: { req0: true }, followerHp: [8] }],
    playbookFeatures: { initiates: ['a', 'b'] },
  },
  ...extra,
});
const roll = (id: string, createdAt: number) => ({
  id,
  characterId: 'c1',
  characterName: 'Char c1',
  moveName: 'Fight',
  stat: 'STR',
  dice: [3, 4],
  mod: 1,
  total: 8,
  mode: 'normal',
  band: '7-9',
  createdAt,
});
const v1 = (over: Record<string, unknown> = {}) => ({
  name: 'The Long Winter',
  createdAt: 1_700_000_000_000,
  characters: [character('c1'), character('c2', { futureField: { nested: [1, 2] } }), character('c3')],
  content: { excluded: 'x', veiled: '', specialHandling: '' },
  steading: { size: 'village', residents: [{ id: 'r1', name: 'Ada' }], improvements: { well: true } },
  diceRolls: [roll('r-a', 10), roll('r-b', 20), roll('r-c', 30)],
  notes: { gm: '<p>hi</p>' },
  notesLocks: { gm: { clientId: 'x', at: 5 } },
  somethingNew: { added: 'later' },
  ...over,
});

const split = (raw: Record<string, unknown>) => {
  const r = splitGame(raw);
  if (!r.ok) throw new Error(r.problems.join('; '));
  return r.split;
};

describe('splitGame / joinGame', () => {
  it('gives back exactly the document it was given', () => {
    const raw = v1();
    expect(joinGame(split(raw))).toEqual(raw);
  });

  it('gives back the same game as the app reads it', () => {
    const raw = v1();
    expect(parseGameSession(joinGame(split(raw)), 'g')).toEqual(parseGameSession(raw, 'g'));
  });

  it('keeps unknown fields on the game and on each character', () => {
    const s = split(v1());
    expect(s.game.somethingNew).toEqual({ added: 'later' });
    expect(s.characters[1]!.data.futureField).toEqual({ nested: [1, 2] });
  });

  it('marks the game as v2 and leaves the list v1 builds require', () => {
    const { game } = split(v1());
    expect(game.schemaVersion).toBe(SCHEMA_VERSION);
    expect(game.characters).toEqual([]);
    expect('diceRolls' in game).toBe(false);
  });

  it('uses the character id as the document id and keeps the order, whatever order the docs come back in', () => {
    const s = split(v1());
    expect(s.characters.map((c) => c.id)).toEqual(['c1', 'c2', 'c3']);
    const shuffled = { ...s, characters: [s.characters[2]!, s.characters[0]!, s.characters[1]!], rolls: [...s.rolls].reverse() };
    expect(joinGame(shuffled)).toEqual(v1());
  });

  it('does not change the input', () => {
    const raw = v1();
    const copy = structuredClone(raw);
    split(raw);
    expect(raw).toEqual(copy);
  });

  it('handles a game with no characters and no rolls', () => {
    const raw = { name: '', createdAt: 1, characters: [] };
    expect(joinGame(split(raw))).toEqual(raw);
  });

  it('reads a game without rolls and one with an empty list the same way', () => {
    const { diceRolls: _d, ...none } = v1();
    expect(joinGame(split(v1({ diceRolls: [] })))).toEqual(none);
  });

  it('survives characters stored in a different order than their ids sort', () => {
    const raw = v1({ characters: [character('z'), character('a'), character('m')] });
    expect(joinGame(split(raw))).toEqual(raw);
  });
});

describe('splitGame refuses what it cannot carry over exactly', () => {
  const problems = (raw: unknown) => {
    const r = splitGame(raw as Record<string, unknown>);
    return r.ok ? [] : r.problems;
  };

  it.each([
    ['a character without an id', v1({ characters: [{ name: 'x', playbook: 'blessed' }] }), 'characters[0] has no usable id'],
    ['an id with a slash', v1({ characters: [character('a/b')] }), 'characters[0] has no usable id'],
    ['an id that is "."', v1({ characters: [character('.')] }), 'characters[0] has no usable id'],
    ['a reserved __id__', v1({ characters: [character('__x__')] }), 'characters[0] has no usable id'],
    ['an empty id', v1({ characters: [character('')] }), 'characters[0] has no usable id'],
    ['a numeric id', v1({ characters: [{ ...character('1'), id: 1 }] }), 'characters[0] has no usable id'],
    ['a repeated id', v1({ characters: [character('a'), character('a')] }), 'characters[1] repeats the id a'],
    ['a character that already has an order field', v1({ characters: [character('a', { order: 3 })] }), 'already has an "order"'],
    ['a character that is not an object', v1({ characters: ['nope'] }), 'characters[0] is not an object'],
    ['characters that are not a list', v1({ characters: 'nope' }), 'characters is not an array'],
    ['a roll without an id', v1({ diceRolls: [{ createdAt: 1 }] }), 'diceRolls[0] has no usable id'],
    ['rolls that are not a list', v1({ diceRolls: {} }), 'diceRolls is not an array'],
    ['a document already marked v2', v1({ schemaVersion: 2 }), 'already has a schemaVersion'],
  ])('%s', (_name, raw, expected) => {
    expect(problems(raw).join('; ')).toContain(expected);
  });

  it('reports every problem, not only the first', () => {
    expect(problems(v1({ characters: [character('a'), character('a'), 'x'] }))).toHaveLength(2);
  });

  it('refuses something that is not a document', () => {
    expect(problems(null)).toEqual(['the document is not an object']);
  });
});
