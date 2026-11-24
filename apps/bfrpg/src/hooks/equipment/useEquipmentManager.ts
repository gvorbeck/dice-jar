import { useCallback, useMemo } from 'react';
import type { Equipment, Character } from '@/types';
import {
  cleanEquipmentArray,
  ensureEquipmentAmount,
  isArmorItem,
  isShieldItem,
  isWearableItem,
  formatWeight,
  formatCost,
} from '@/utils/equipment';

/**
 * Core hook for equipment operations on existing characters
 * Includes BFRPG-compliant carrying capacity and encumbrance calculations
 * Used in character sheets and inventory management
 *
 * @param character - The current character (can be undefined)
 * @param onEquipmentChange - Callback to update the character's equipment
 * @returns Equipment management utilities including carrying capacity and encumbrance
 */
function useEquipmentManagerCore(character: Character | undefined, onEquipmentChange?: (equipment: Equipment[]) => void) {
  // Memoized clean equipment array to avoid repeated calculations
  const cleanedEquipment = useMemo(() => {
    return character ? cleanEquipmentArray(character.equipment) : [];
  }, [character]);
  // Shared helper function for adding equipment to inventory
  const addEquipmentToInventory = useCallback(
    (newEquipment: Equipment) => {
      if (!onEquipmentChange || !character) return;

      const existingIndex = cleanedEquipment.findIndex((item) => item.name === newEquipment.name);

      if (existingIndex >= 0) {
        // Increase amount of existing item
        const updatedEquipment = [...cleanedEquipment];
        const existingItem = updatedEquipment[existingIndex];

        if (existingItem) {
          updatedEquipment[existingIndex] = {
            ...existingItem,
            amount: existingItem.amount + newEquipment.amount,
          };
        }
        onEquipmentChange(updatedEquipment);
      } else {
        // Add new item with proper amount to cleaned equipment array
        const equipmentToAdd = ensureEquipmentAmount(newEquipment);
        onEquipmentChange([...cleanedEquipment, equipmentToAdd]);
      }
    },
    [cleanedEquipment, onEquipmentChange, character],
  );

  const removeEquipmentFromInventory = useCallback(
    (index: number) => {
      if (!onEquipmentChange || !character) return;

      // The index is into character.equipment, like update and toggle: cleanedEquipment drops empty items and shifts it.
      const updatedEquipment = [...character.equipment];
      const item = updatedEquipment[index];

      if (!item) return;

      if (item.amount > 1) {
        // Decrease amount by 1
        updatedEquipment[index] = {
          ...item,
          amount: item.amount - 1,
        };
      } else {
        // Remove item completely if amount is 1 or less
        updatedEquipment.splice(index, 1);
      }

      onEquipmentChange(updatedEquipment);
    },
    [onEquipmentChange, character],
  );

  const updateEquipmentInInventory = useCallback(
    (index: number, updates: Partial<Equipment>) => {
      if (!onEquipmentChange || !character) return;

      const updatedEquipment = [...character.equipment];
      const currentItem = updatedEquipment[index];
      if (currentItem) {
        updatedEquipment[index] = { ...currentItem, ...updates };
        onEquipmentChange(updatedEquipment);
      }
    },
    [character, onEquipmentChange],
  );

  const toggleWearing = useCallback(
    (index: number) => {
      if (!onEquipmentChange || !character) return;

      const updatedEquipment = [...character.equipment];
      const item = updatedEquipment[index];

      if (!item) return;

      if (isWearableItem(item)) {
        const newWearingState = !item.wearing;

        if (newWearingState) {
          // If we're equipping this item, unequip any other item of the same type
          if (isArmorItem(item)) {
            // Unequip any currently worn armor
            updatedEquipment.forEach((equipItem, i) => {
              if (i !== index && equipItem.wearing && isArmorItem(equipItem)) {
                updatedEquipment[i] = { ...equipItem, wearing: false };
              }
            });
          } else if (isShieldItem(item)) {
            // Unequip any currently worn shield
            updatedEquipment.forEach((equipItem, i) => {
              if (i !== index && equipItem.wearing && isShieldItem(equipItem)) {
                updatedEquipment[i] = { ...equipItem, wearing: false };
              }
            });
          }
        }

        // Toggle the current item's wearing state
        updatedEquipment[index] = {
          ...item,
          wearing: newWearingState,
        };

        onEquipmentChange(updatedEquipment);
      }
    },
    [character, onEquipmentChange],
  );

  return {
    addEquipmentToInventory,
    removeEquipmentFromInventory,
    updateEquipmentInInventory,
    toggleWearing,
    isArmorItem,
    isShieldItem,
    isWearableItem,
    formatWeight,
    formatCost,
  };
}

/**
 * Public hook for equipment operations that handles optional characters
 * Provides safer operations when character is undefined
 *
 * @param character - The current character (optional)
 * @param onEquipmentChange - Callback to update the character's equipment
 * @returns Equipment management utilities including carrying capacity and encumbrance
 */
export function useEquipmentManager(character: Character | undefined, onEquipmentChange?: (equipment: Equipment[]) => void) {
  // Use the core hook but with safer guard clauses
  const result = useEquipmentManagerCore(character, onEquipmentChange);

  // Return the result with null object pattern applied for undefined character
  return character
    ? result
    : {
        addEquipmentToInventory: () => {},
        removeEquipmentFromInventory: () => {},
        updateEquipmentInInventory: () => {},
        toggleWearing: () => {},
        isArmorItem,
        isShieldItem,
        isWearableItem,
        formatWeight,
        formatCost,
      };
}
