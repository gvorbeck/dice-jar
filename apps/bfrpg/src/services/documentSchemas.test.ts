import { describe, expect, it } from 'vitest';
import { getAllSampleCharacters } from '@/data/sampleCharacters';
import { getAllSampleGames } from '@/data/sampleGames';
import { processCharacterData } from './characterMigration';
import { characterSchema, gameSchema, problemWith } from './documentSchemas';

// A character as the first version of the app stored it: split ability scores and modifiers, gold at the top, an array of class names.
const legacy = () => ({
  name: 'Old Hero',
  race: 'Human',
  class: ['Fighter'],
  level: 3,
  xp: 4000,
  gold: 25,
  abilities: {
    scores: { strength: 16, dexterity: 12, constitution: 14, intelligence: 9, wisdom: 10, charisma: 8 },
    modifiers: { strength: '+2', dexterity: '0', constitution: '+1', intelligence: '0', wisdom: '0', charisma: '-1' },
  },
  hp: { points: 20, max: 20 },
  equipment: [{ name: 'Sword', amount: 1 }],
});

describe('characterSchema', () => {
  it('accepts every sample character', () => {
    for (const c of getAllSampleCharacters()) expect(problemWith(characterSchema, c)).toBeUndefined();
  });

  it('accepts a legacy character once it is migrated, and migrating again changes nothing', () => {
    const once = processCharacterData(legacy());
    expect(problemWith(characterSchema, once)).toBeUndefined();
    expect(processCharacterData(structuredClone(once))).toEqual(once);
  });

  it('names the first problem', () => {
    expect(problemWith(characterSchema, { ...getAllSampleCharacters()[0], level: 'three' })).toMatch(/^level:/);
    expect(problemWith(characterSchema, null)).toMatch(/^document:/);
  });
});

describe('gameSchema', () => {
  it('accepts every sample game and refuses a game with no name', () => {
    for (const g of getAllSampleGames()) expect(problemWith(gameSchema, g)).toBeUndefined();
    expect(problemWith(gameSchema, { notes: 'x' })).toMatch(/^name:/);
  });
});
