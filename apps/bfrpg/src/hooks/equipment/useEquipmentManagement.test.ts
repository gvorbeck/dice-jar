import '@/utils'; // first: validation/rules and utils import each other, and this order is the one that loads
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createMockCharacter, createMockEquipment } from '@/test/helpers';
import { useEquipmentManagement } from './useEquipmentManagement';

const rope = createMockEquipment({ name: 'Rope', costValue: 2, costCurrency: 'gp', weight: 5, amount: 1 });
const setup = (overrides = {}) => {
  const onCharacterChange = vi.fn();
  const character = createMockCharacter({ currency: { gold: 10 }, equipment: [], ...overrides });
  const { result } = renderHook(() => useEquipmentManagement(character, onCharacterChange));
  const last = () => onCharacterChange.mock.lastCall![0];
  return { result, onCharacterChange, last };
};

describe('useEquipmentManagement', () => {
  it('starts from the gold the character has, or nothing yet', () => {
    expect(setup().result.current.startingGold).toBe(10);
    expect(setup({ currency: { gold: 0 } }).result.current.startingGold).toBeUndefined();
  });

  it('sets the gold from a roll', () => {
    const { result, last } = setup({ currency: { gold: 0 } });
    act(() => result.current.handleGoldRoll(60));
    expect(last().currency.gold).toBe(60);
    expect(result.current.startingGold).toBe(60);
    act(() => result.current.handleGoldRoll(undefined));
    expect(last().currency.gold).toBe(0);
  });

  it('buys an item, taking its price from the gold', () => {
    const { result, last } = setup();
    act(() => result.current.handleEquipmentAdd(rope));
    expect(last().currency.gold).toBe(8);
    expect(last().equipment).toEqual([expect.objectContaining({ name: 'Rope', amount: 1 })]);
    expect(result.current.startingGold).toBe(8);
  });

  it('adds one to an item already carried', () => {
    const { result, last } = setup({ equipment: [{ ...rope, amount: 2 }] });
    act(() => result.current.handleEquipmentAdd(rope));
    expect(last().equipment).toEqual([expect.objectContaining({ name: 'Rope', amount: 3 })]);
    expect(last().currency.gold).toBe(8);
  });

  it('refuses what the character cannot afford', () => {
    const { result, onCharacterChange } = setup({ currency: { gold: 1 } });
    act(() => result.current.handleEquipmentAdd(rope));
    expect(onCharacterChange).not.toHaveBeenCalled();
  });

  it('gives back the price in the item currency when one is removed', () => {
    const silverRing = createMockEquipment({ name: 'Ring', costValue: 5, costCurrency: 'sp', amount: 2 });
    const { result, last } = setup({ currency: { gold: 3, silver: 1 }, equipment: [silverRing] });
    act(() => result.current.handleEquipmentRemove('Ring'));
    expect(last().currency).toMatchObject({ gold: 3, silver: 6 });
    expect(last().equipment).toEqual([expect.objectContaining({ name: 'Ring', amount: 1 })]);
  });

  it('removes the last one from the list and refunds gold', () => {
    const { result, last } = setup({ equipment: [rope] });
    act(() => result.current.handleEquipmentRemove('Rope'));
    expect(last().equipment).toEqual([]);
    expect(last().currency.gold).toBe(12);
    expect(result.current.startingGold).toBe(12);
  });

  it('ignores removing something not carried', () => {
    const { result, onCharacterChange } = setup();
    act(() => result.current.handleEquipmentRemove('Nothing'));
    expect(onCharacterChange).not.toHaveBeenCalled();
  });

  it('counts weight and value without items that are all gone', () => {
    const { result } = setup({ equipment: [{ ...rope, amount: 3 }, createMockEquipment({ name: 'Gone', amount: 0, weight: 50 })] });
    expect(result.current.cleanedEquipment).toHaveLength(1);
    expect(result.current.totalWeight).toBe(15);
    expect(result.current.totalValue).toBe(6);
  });

  it('describes what the character has left', () => {
    expect(setup({ equipment: [rope] }).result.current.getStatusMessage()).toMatch(/^1 items, .* remaining$/);
    expect(setup().result.current.getStatusMessage()).toMatch(/ available$/);
    expect(setup({ currency: { gold: 0 } }).result.current.getStatusMessage()).toBe('');
  });
});
