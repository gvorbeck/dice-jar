import '@/utils'; // first: validation/rules and utils import each other, and this order is the one that loads
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createMockCharacter, createMockAbilityScores } from '@/test/helpers';
import { createSchema } from './core';
import { Rules } from './rules';
import { useValidation, useCascadeValidation } from './hooks';

describe('useValidation', () => {
  const schema = createSchema([Rules.minLength(3)], true);

  it('validates the value against the schema', () => {
    expect(renderHook(() => useValidation('abcd', schema)).result.current.isValid).toBe(true);
    expect(renderHook(() => useValidation('ab', schema)).result.current).toMatchObject({
      isValid: false,
      errors: ['Must be at least 3 characters'],
    });
  });

  it('asks for a required value', () => {
    expect(renderHook(() => useValidation('', schema)).result.current.errors).toEqual(['This field is required']);
  });
});

// Dwarves need Constitution 9 and may become Clerics, Fighters or Thieves (Core Rules p. 5).
describe('useCascadeValidation', () => {
  const abilities = (constitution: number) => createMockAbilityScores({ constitution: { value: constitution, modifier: 0 } });
  const run = (character = createMockCharacter()) => {
    const onCharacterChange = vi.fn();
    const hook = renderHook(
      (c) => useCascadeValidation({ character: c, onCharacterChange, includeSupplementalRace: false, includeSupplementalClass: false }),
      {
        initialProps: character,
      },
    );
    return { onCharacterChange, hook };
  };

  it('leaves a character that is still valid alone', () => {
    const { onCharacterChange } = run(createMockCharacter({ race: 'dwarf', class: 'fighter', abilities: abilities(12) }));
    expect(onCharacterChange).not.toHaveBeenCalled();
  });

  it('clears the class a race cannot take, keeping the race', () => {
    const { onCharacterChange } = run(createMockCharacter({ race: 'dwarf', class: 'magic-user', abilities: abilities(12) }));
    expect(onCharacterChange).toHaveBeenCalledWith(expect.objectContaining({ race: 'dwarf', class: '', spells: [] }));
  });

  it('clears race and class when the abilities no longer meet the race', () => {
    const { onCharacterChange } = run(createMockCharacter({ race: 'dwarf', class: 'fighter', abilities: abilities(8) }));
    expect(onCharacterChange).toHaveBeenCalledWith(expect.objectContaining({ race: '', class: '' }));
  });

  it('checks again when the abilities change, and on request', () => {
    const { onCharacterChange, hook } = run(createMockCharacter({ race: 'dwarf', class: 'fighter', abilities: abilities(12) }));
    hook.rerender(createMockCharacter({ race: 'dwarf', class: 'fighter', abilities: abilities(8) }));
    expect(onCharacterChange).toHaveBeenCalledTimes(1);
    act(() => hook.result.current.validateCharacter());
    expect(onCharacterChange).toHaveBeenCalledTimes(2);
  });

  it('uses the races and classes it is given, instead of everything', () => {
    const onCharacterChange = vi.fn();
    renderHook(() =>
      useCascadeValidation({
        character: createMockCharacter({ race: 'dwarf', class: 'fighter', abilities: abilities(12) }),
        onCharacterChange,
        includeSupplementalRace: true,
        includeSupplementalClass: true,
        filteredRaces: [],
        filteredClasses: [],
      }),
    );
    expect(onCharacterChange).not.toHaveBeenCalled();
  });
});
