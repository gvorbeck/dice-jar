import '@/utils'; // first: validation/rules and utils import each other, and this order is the one that loads
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createMockCharacter, createMockEquipment, createMockAbilityScores } from '@/test/helpers';
import { useEquipmentManager } from './useEquipmentManager';

const strength = (value: number, modifier: number) => createMockAbilityScores({ strength: { value, modifier } });
const withStrength = (race: string, modifier: number) => createMockCharacter({ race, abilities: strength(10, modifier) });
const capacity = (race: string, modifier: number) =>
  renderHook(() => useEquipmentManager(withStrength(race, modifier))).result.current.getCarryingCapacity(withStrength(race, modifier));

// Carrying Capacity, Core Rules p. 42: [Strength modifier, light, heavy] for Dwarf, Elf and Human, then for Halfling.
// Strength 3 is -3, 4-5 is -2, 6-8 is -1, 9-12 is 0, 13-15 is +1, 16-17 is +2, and 18 is +3.
const HUMAN = [[-3, 25, 60], [-2, 35, 90], [-1, 50, 120], [0, 60, 150], [1, 65, 165], [2, 70, 180], [3, 80, 195]] as const; // prettier-ignore
const HALFLING = [[-3, 20, 40], [-2, 30, 60], [-1, 40, 80], [0, 50, 100], [1, 55, 110], [2, 60, 120], [3, 65, 130]] as const; // prettier-ignore

describe('getCarryingCapacity (Core Rules p. 42)', () => {
  it.each(HUMAN)('a human with Strength modifier %i carries %i light and %i heavy', (modifier, light, heavy) => {
    expect(capacity('human', modifier)).toEqual({ light, heavy });
  });

  it.each(HALFLING)('a halfling with Strength modifier %i carries %i light and %i heavy', (modifier, light, heavy) => {
    expect(capacity('halfling', modifier)).toEqual({ light, heavy });
  });

  it('gives Elves and Dwarves the human figures', () => {
    expect(capacity('elf', 1)).toEqual({ light: 65, heavy: 165 });
    expect(capacity('dwarf', -2)).toEqual({ light: 35, heavy: 90 });
  });
});

const rope = createMockEquipment({ name: 'Rope', weight: 10, amount: 1 });
const setup = (equipment = [rope], overrides = {}) => {
  const onEquipmentChange = vi.fn();
  const character = createMockCharacter({ equipment, ...overrides });
  const { result } = renderHook(() => useEquipmentManager(character, onEquipmentChange));
  return { result, onEquipmentChange, last: () => onEquipmentChange.mock.lastCall![0] };
};

describe('useEquipmentManager inventory', () => {
  it('adds a new item, and adds to the amount of one already carried', () => {
    const { result, last } = setup();
    act(() => result.current.addEquipmentToInventory(createMockEquipment({ name: 'Torch', amount: 0 })));
    expect(last().map((i: { name: string; amount: number }) => [i.name, i.amount])).toEqual([['Rope', 1], ['Torch', 1]]); // prettier-ignore
    act(() => result.current.addEquipmentToInventory(createMockEquipment({ name: 'Rope', amount: 2 })));
    expect(last()[0].amount).toBe(3);
  });

  it('takes one from a stack, and removes a single item', () => {
    const { result, last } = setup([{ ...rope, amount: 3 }, createMockEquipment({ name: 'Torch', amount: 1 })]);
    act(() => result.current.removeEquipmentFromInventory(0));
    expect(last()[0].amount).toBe(2);
    act(() => result.current.removeEquipmentFromInventory(1));
    expect(last().map((i: { name: string }) => i.name)).toEqual(['Rope']);
  });

  it('changes an item in place, and ignores a place that is empty', () => {
    const { result, last, onEquipmentChange } = setup();
    act(() => result.current.updateEquipmentInInventory(0, { amount: 5 }));
    expect(last()[0]).toMatchObject({ name: 'Rope', amount: 5 });
    onEquipmentChange.mockClear();
    act(() => result.current.updateEquipmentInInventory(9, { amount: 5 }));
    act(() => result.current.removeEquipmentFromInventory(9));
    expect(onEquipmentChange).not.toHaveBeenCalled();
  });

  it('wears one armor and one shield at a time', () => {
    const leather = createMockEquipment({ name: 'Leather', category: 'armor', AC: 13, wearing: true });
    const chain = createMockEquipment({ name: 'Chain', category: 'armor', AC: 15 });
    const shield = createMockEquipment({ name: 'Shield', category: 'shields', AC: '+1', wearing: true });
    const buckler = createMockEquipment({ name: 'Buckler', category: 'shields', AC: '+1' });
    const { result, last } = setup([leather, chain, shield, buckler]);
    act(() => result.current.toggleWearing(1));
    expect(last().map((i: { wearing?: boolean }) => !!i.wearing)).toEqual([false, true, true, false]);
    act(() => result.current.toggleWearing(3));
    expect(last().map((i: { wearing?: boolean }) => !!i.wearing)).toEqual([true, false, false, true]);
    act(() => result.current.toggleWearing(0));
    expect(last()[0].wearing).toBe(false);
  });

  it('does not wear what is not wearable', () => {
    const { result, onEquipmentChange } = setup();
    act(() => result.current.toggleWearing(0));
    expect(onEquipmentChange).not.toHaveBeenCalled();
  });
});

// Lightly loaded to 60 lb and heavily loaded to 150 lb for a human of average Strength (Core Rules p. 42).
describe('encumbranceStatus', () => {
  const status = (weight: number) =>
    setup([createMockEquipment({ name: 'Anvil', weight, amount: 1 })], { abilities: strength(10, 0) }).result.current.encumbranceStatus;

  it('is light up to the light load, heavy to the heavy load, then overloaded', () => {
    expect([status(60), status(61), status(150), status(151)]).toEqual(['light', 'heavy', 'heavy', 'overloaded']);
  });

  it('adds up the weight of what is carried', () => {
    expect(setup([{ ...rope, amount: 3 }]).result.current.totalWeight).toBe(30);
  });
});

describe('with no character', () => {
  it('does nothing and reports the average human load', () => {
    const { result } = renderHook(() => useEquipmentManager(undefined));
    expect(result.current.getCarryingCapacity({} as never)).toEqual({ light: 60, heavy: 150 });
    expect(result.current).toMatchObject({ totalWeight: 0, encumbranceStatus: 'light' });
    expect(() => result.current.toggleWearing(0)).not.toThrow();
  });
});
