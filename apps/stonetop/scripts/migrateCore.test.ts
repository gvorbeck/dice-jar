import { describe, expect, it } from 'vitest';
import { splitGame } from '../src/lib/gameShape.ts';
import { changedAfterMove } from './migrateCore.ts';

const character = (id: string) => ({ id, name: `Char ${id}`, playbook: 'blessed', level: 1 });
const roll = (id: string) => ({ id, characterId: 'a', createdAt: 1 });
const written = () => {
  const r = splitGame({ name: 'A', createdAt: 1, characters: [character('a'), character('b')], diceRolls: [roll('r1')] });
  if (!r.ok) throw new Error('fixture does not split');
  return r.split;
};
const asStored = (w = written()) => ({ game: w.game, characters: w.characters, rolls: w.rolls });

describe('changedAfterMove', () => {
  it('finds nothing when the stored game is what the move wrote', () => {
    expect(changedAfterMove(written(), asStored())).toEqual([]);
  });

  it('names what a player saved right after the move', () => {
    const now = asStored();
    now.characters = [
      { ...now.characters[0]!, data: { ...now.characters[0]!.data, name: 'Renamed' } },
      { id: 'c', data: { ...character('c'), order: 2 } },
    ];
    now.rolls = [];
    now.game = { ...now.game, name: 'Renamed game' };
    expect(changedAfterMove(written(), now).sort()).toEqual(
      ['game document', 'characters/a edited', 'characters/b removed', 'characters/c added', 'rolls/r1 removed'].sort(),
    );
  });

  it('does not mind the order of keys', () => {
    const now = asStored();
    now.game = Object.fromEntries(Object.entries(now.game).reverse());
    expect(changedAfterMove(written(), now)).toEqual([]);
  });
});
