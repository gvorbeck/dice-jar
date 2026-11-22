import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { mockBasicCharacter } from '@/test/mocks/character-data';
import type { Equipment } from '@/types';
import { useEquipmentManager } from './useEquipmentManager';

const item = (name: string, amount: number) => ({ ...mockBasicCharacter.equipment[0]!, name, amount }) as Equipment;

describe('removeEquipmentFromInventory', () => {
  // The sheet passes each item's index in character.equipment, and a stored item with no amount is not shown.
  it('removes the item at that index even when an earlier stored item has amount 0', () => {
    const character = { ...mockBasicCharacter, equipment: [item('Empty', 0), item('Rope', 1), item('Torch', 1)] };
    const onChange = vi.fn();
    const { result } = renderHook(() => useEquipmentManager(character, onChange));
    result.current.removeEquipmentFromInventory(1); // Rope, as the sheet shows it
    expect(onChange.mock.calls[0]![0].map((e: Equipment) => e.name)).toEqual(['Empty', 'Torch']);
  });

  it('takes one off a stack instead of removing it', () => {
    const character = { ...mockBasicCharacter, equipment: [item('Torch', 3)] };
    const onChange = vi.fn();
    const { result } = renderHook(() => useEquipmentManager(character, onChange));
    result.current.removeEquipmentFromInventory(0);
    expect(onChange.mock.calls[0]![0][0].amount).toBe(2);
  });
});
