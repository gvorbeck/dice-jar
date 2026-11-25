import '@/utils'; // first: validation/rules and utils import each other, and this order is the one that loads
import { describe, it, expect } from 'vitest';
import { allClasses } from '@/data';
import { createMockCharacter, createMockAbilityScores } from '@/test/helpers';
import {
  findById,
  getClassById,
  getRaceById,
  getClassName,
  canLevelUp,
  getXPToNextLevel,
  hasSpells,
  hasCantrips,
  hasCustomRace,
  hasCustomClasses,
  hasValidHitPoints,
  getAbilityScoreCategory,
  hasTurnUndeadAbility,
  getSpellLevel,
  getSpellcastingAbilityModifier,
  getEffectiveSpellcastingClass,
} from './character';

describe('lookups', () => {
  it('finds by id, or nothing', () => {
    expect(findById('b', [{ id: 'a' }, { id: 'b' }])).toEqual({ id: 'b' });
    expect(findById('z', [{ id: 'a' }])).toBeUndefined();
  });

  it('finds the built-in classes and races', () => {
    expect(getClassById('fighter')?.name).toBe('Fighter');
    expect(getRaceById('human')?.name).toBe('Human');
    expect(getClassById('nope')).toBeUndefined();
  });

  it('names a built-in class, and a custom class by the name the character gave it', () => {
    expect(getClassName(createMockCharacter(), 'fighter')).toBe('Fighter');
    expect(getClassName(createMockCharacter({ class: 'Witch' }), 'Witch')).toBe('Witch');
  });
});

// Thief: level 2 at 1,250 XP, level 3 at 2,500 XP (Core Rules, p. 8).
describe('levelling', () => {
  const thief = (xp: number, level = 1) => createMockCharacter({ class: 'thief', level, xp });

  it('reports the XP still needed for the next level', () => {
    expect(getXPToNextLevel(thief(1000), allClasses)).toBe(250);
    expect(getXPToNextLevel(thief(5000), allClasses)).toBe(0);
  });

  it('has no next level without a class or for a custom class', () => {
    expect(getXPToNextLevel(createMockCharacter({ class: '' }), allClasses)).toBeNull();
    expect(getXPToNextLevel(createMockCharacter({ class: 'witch' }), allClasses)).toBeNull();
  });

  it('can level up only with enough XP', () => {
    expect(canLevelUp(thief(1249), allClasses)).toBe(false);
    expect(canLevelUp(thief(1250), allClasses)).toBe(true);
    expect(canLevelUp(thief(1250, 2), allClasses)).toBe(false);
  });

  it('always lets a custom class level up', () => {
    expect(canLevelUp(createMockCharacter({ class: 'witch' }), allClasses)).toBe(true);
  });
});

describe('character predicates', () => {
  it('knows about spells and cantrips', () => {
    expect(hasSpells(createMockCharacter({ spells: [] }))).toBe(false);
    expect(hasSpells(createMockCharacter({ spells: [{ name: 'Sleep' }] as never }))).toBe(true);
    expect(hasCantrips(createMockCharacter({ cantrips: [{ name: 'Light' }] as never }))).toBe(true);
    expect(hasCantrips(createMockCharacter({ cantrips: undefined }))).toBe(false);
  });

  it('tells a custom race or class from a built-in one', () => {
    expect(hasCustomRace(createMockCharacter({ race: 'human' }))).toBe(false);
    expect(hasCustomRace(createMockCharacter({ race: 'Tiefling' }))).toBe(true);
    expect(hasCustomClasses(createMockCharacter({ class: 'fighter' }))).toBe(false);
    expect(hasCustomClasses(createMockCharacter({ class: 'witch' }))).toBe(true);
  });

  it('needs both current and max hit points above zero', () => {
    const hp = (current: number, max: number) => createMockCharacter({ hp: { current, max, points: [], die: 'd8' } as never });
    expect(hasValidHitPoints(hp(5, 8))).toBe(true);
    expect(hasValidHitPoints(hp(0, 8))).toBe(false);
    expect(hasValidHitPoints(hp(5, 0))).toBe(false);
  });

  it('finds Turn Undead on Clerics only', () => {
    expect(hasTurnUndeadAbility(createMockCharacter({ class: 'cleric' }))).toBe(true);
    expect(hasTurnUndeadAbility(createMockCharacter({ class: 'fighter' }))).toBe(false);
  });
});

describe('abilities and spells', () => {
  it('marks the highest and lowest scores', () => {
    const scores = [15, 8, 12];
    expect(getAbilityScoreCategory(15, scores)).toBe('highest');
    expect(getAbilityScoreCategory(8, scores)).toBe('lowest');
    expect(getAbilityScoreCategory(12, scores)).toBe('normal');
  });

  it('uses Intelligence for arcane casters and Wisdom for Clerics', () => {
    const abilities = createMockAbilityScores({ intelligence: { value: 16, modifier: 2 }, wisdom: { value: 5, modifier: -2 } });
    expect(getSpellcastingAbilityModifier(createMockCharacter({ class: 'magic-user', abilities }))).toBe(2);
    expect(getSpellcastingAbilityModifier(createMockCharacter({ class: 'cleric', abilities }))).toBe(-2);
    expect(getSpellcastingAbilityModifier(createMockCharacter({ class: 'fighter', abilities }))).toBe(0);
    expect(getSpellcastingAbilityModifier(createMockCharacter({ class: 'witch', abilities }))).toBe(2);
  });

  it('reads a spell level for the class, mapping combinations to Magic-User', () => {
    const spell = { level: { 'magic-user': 2, cleric: null } };
    expect(getSpellLevel(spell, 'magic-user')).toBe(2);
    expect(getSpellLevel(spell, 'fighter-magic-user')).toBe(2);
    expect(getSpellLevel(spell, 'cleric')).toBe(0);
    expect(getSpellLevel(spell, 'witch')).toBe(2);
    expect(getSpellLevel({ level: { cleric: null } }, 'witch')).toBe(1);
  });

  it('finds the spellcasting class a character uses', () => {
    expect(getEffectiveSpellcastingClass(createMockCharacter({ class: 'magic-user' }), allClasses)).toEqual({
      type: 'standard',
      classId: 'magic-user',
    });
    expect(getEffectiveSpellcastingClass(createMockCharacter({ class: 'witch' }), allClasses)).toEqual({
      type: 'custom',
      classId: 'witch',
    });
    expect(getEffectiveSpellcastingClass(createMockCharacter({ class: 'fighter' }), allClasses)).toBeNull();
    expect(getEffectiveSpellcastingClass(createMockCharacter({ class: '' }), allClasses)).toBeNull();
  });
});
