import '@/utils'; // first: validation/rules and utils import each other, and this order is the one that loads
import { describe, it, expect } from 'vitest';
import { allRaces, allClasses } from '@/data';
import { createMockCharacter, createMockAbilityScores } from '@/test/helpers';
import { createCharacterValidationPipeline, validateImportedCharacter } from './character';

const pipeline = createCharacterValidationPipeline(allRaces, allClasses);
const [ABILITIES, RACE, CLASS, HIT_POINTS, EQUIPMENT, REVIEW] = [0, 1, 2, 3, 4, 5];

describe('createCharacterValidationPipeline', () => {
  it('has the six wizard steps in order', () => {
    expect(pipeline.steps.map((s) => s.name)).toEqual(['Abilities', 'Race', 'Class', 'Hit Points', 'Equipment', 'Review']);
  });

  it('passes a step that does not exist, and never disables it', () => {
    expect(pipeline.validateStep(99, {})).toEqual({ isValid: true, errors: [], warnings: [] });
    expect(pipeline.isStepDisabled(99, {})).toBe(false);
  });

  it('disables a step whose validation fails', () => {
    const noScores = createMockCharacter({ abilities: createMockAbilityScores({ strength: { value: 0, modifier: 0 } }) });
    expect(pipeline.isStepDisabled(ABILITIES, noScores)).toBe(true);
    expect(pipeline.isStepDisabled(ABILITIES, createMockCharacter())).toBe(false);
  });

  it('asks for ability scores until they are set', () => {
    const result = pipeline.validateStep(
      ABILITIES,
      createMockCharacter({ abilities: createMockAbilityScores({ strength: { value: 0, modifier: 0 } }) }),
    );
    expect(result.errors).toEqual(['Please roll or set all ability scores before proceeding.']);
  });

  it('accepts a human and refuses an unknown race', () => {
    expect(pipeline.validateStep(RACE, createMockCharacter({ race: 'human' })).isValid).toBe(true);
    expect(pipeline.validateStep(RACE, createMockCharacter({ race: '' })).isValid).toBe(false);
  });

  it('needs a class and a race before the class step passes', () => {
    expect(pipeline.validateStep(CLASS, createMockCharacter({ class: '' })).errors).toEqual(['Please select a class for your character']);
    expect(pipeline.validateStep(CLASS, createMockCharacter({ race: '' })).errors).toEqual([
      'Please select a race before choosing classes',
    ]);
  });

  // Dwarves may become Clerics, Fighters or Thieves (Core Rules, p. 5); a name that is not a known class counts as a custom class.
  it('accepts a human fighter and refuses a class the race cannot take', () => {
    expect(pipeline.validateStep(CLASS, createMockCharacter({ race: 'human', class: 'fighter' })).isValid).toBe(true);
    const dwarfMage = pipeline.validateStep(CLASS, createMockCharacter({ race: 'dwarf', class: 'magic-user' }));
    expect(dwarfMage.errors).toContain('Selected class is not allowed for Dwarf');
  });

  it('asks a magic-user for a starting spell', () => {
    const result = pipeline.validateStep(CLASS, createMockCharacter({ race: 'human', class: 'magic-user', spells: [] }));
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Magic-Users must select one first level spell (Read Magic is automatically known).');
  });

  it('needs hit points, treats equipment as optional, and needs a name to review', () => {
    expect(
      pipeline.validateStep(HIT_POINTS, createMockCharacter({ hp: { current: 0, max: 0, points: [], die: 'd8' } as never })).isValid,
    ).toBe(false);
    expect(pipeline.validateStep(EQUIPMENT, createMockCharacter()).isValid).toBe(true);
    expect(pipeline.validateStep(REVIEW, createMockCharacter({ name: '  ' })).isValid).toBe(false);
    expect(pipeline.validateStep(REVIEW, createMockCharacter({ name: 'Brom' })).isValid).toBe(true);
  });
});

describe('validateImportedCharacter', () => {
  it('accepts a sound character', () => {
    expect(validateImportedCharacter(createMockCharacter())).toEqual({ isValid: true, errors: [] });
  });

  it('reports every problem it finds', () => {
    const bad = createMockCharacter({
      name: ' ',
      level: 25,
      abilities: createMockAbilityScores({ strength: { value: 2, modifier: -3 } }),
      hp: { current: 0, max: 0, points: [], die: 'd8' } as never,
    });
    expect(validateImportedCharacter(bad).errors).toEqual([
      'Invalid ability scores (must be between 3-18)',
      'Invalid hit points (must be greater than 0)',
      'Character name is required',
      'Character level must be between 1 and 20',
    ]);
  });
});
