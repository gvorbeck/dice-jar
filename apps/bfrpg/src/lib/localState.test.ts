import { describe, it, expect, beforeEach } from 'vitest';
import { migrateOldStores, readStored } from './localState';

beforeEach(() => localStorage.clear());

describe('readStored', () => {
  it('lays what is stored over the fallback', () => {
    localStorage.setItem('k', JSON.stringify({ a: 2 }));
    expect(readStored('k', { a: 1, b: 1 })).toEqual({ a: 2, b: 1 });
  });

  it('returns the fallback when nothing is stored or it is unreadable', () => {
    expect(readStored('k', { a: 1 })).toEqual({ a: 1 });
    localStorage.setItem('k', '{not json');
    expect(readStored('k', { a: 1 })).toEqual({ a: 1 });
  });
});

describe('migrateOldStores', () => {
  const old = (key: string, state: object) => localStorage.setItem(key, JSON.stringify({ state, version: 0 }));

  it('moves the old draft, combats and collapsed sections to the new keys and drops the old ones', () => {
    old('character-creation-store', {
      draftCharacter: { name: 'Ana' },
      currentStep: 3,
      preferences: { includeSupplementalRace: true, includeSupplementalClass: false, useCombinationClass: true },
    });
    old('combat-store', { games: { g1: { combatState: { round: 2 }, preCombatInitiatives: { Ana: 4 } } } });
    old('ui-store', { collapsedSections: { spells: true, gear: false } });

    migrateOldStores();

    expect(JSON.parse(localStorage.getItem('characterDraft')!)).toEqual({
      character: { name: 'Ana' },
      step: 3,
      includeSupplementalRace: true,
      includeSupplementalClass: false,
      useCombinationClass: true,
    });
    expect(JSON.parse(localStorage.getItem('combat:g1')!)).toEqual({ combatState: { round: 2 }, preCombatInitiatives: { Ana: 4 } });
    expect(localStorage.getItem('section-collapsed:spells')).toBe('1');
    expect(localStorage.getItem('section-collapsed:gear')).toBe('0');
    for (const key of ['character-creation-store', 'combat-store', 'ui-store']) expect(localStorage.getItem(key)).toBeNull();
  });

  it('keeps what is already under a new key and survives unreadable old data', () => {
    localStorage.setItem('combat:g1', 'newer');
    old('combat-store', { games: { g1: { combatState: { round: 9 } } } });
    localStorage.setItem('character-creation-store', '{broken');

    migrateOldStores();

    expect(localStorage.getItem('combat:g1')).toBe('newer');
    expect(localStorage.getItem('characterDraft')).toBeNull();
    expect(localStorage.getItem('character-creation-store')).toBeNull();
  });
});
