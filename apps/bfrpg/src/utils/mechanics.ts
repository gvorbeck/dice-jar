/**
 * Game mechanics utilities - consolidated from dice.ts, combatUtils.ts, and gameConstants.ts
 * Contains combat mechanics and game constants
 */

import type { CombatCharacterData, CombatantHP, CombatantWithInitiative } from '@/types';

// ============================================================================
// GAME CONSTANTS
// ============================================================================

export const GAME_MECHANICS = {
  // Armor Class defaults
  DEFAULT_UNARMORED_AC: 11 as number,

  // Movement rates (per round)
  DEFAULT_MOVEMENT_RATE: "40'",
  LEATHER_ARMOR_MOVEMENT: "30'",
  METAL_ARMOR_MOVEMENT: "20'",

  // Ability score modifier thresholds (BFRPG system)
  ABILITY_MODIFIERS: [
    { max: 3, modifier: -3 },
    { max: 5, modifier: -2 },
    { max: 8, modifier: -1 },
    { max: 12, modifier: 0 },
    { max: 15, modifier: 1 },
    { max: 17, modifier: 2 },
  ] as const,

  // Default modifier for scores above 17
  DEFAULT_HIGH_MODIFIER: 3,

  // Starting gold for first level characters
  STARTING_GOLD_DICE: '3d6',
  STARTING_GOLD_MULTIPLIER: 10,
} as const;

export const ENCUMBRANCE = {
  GOLD_PIECE_WEIGHT: 1 / 20, // 1/20th of a pound per gold piece
  COINS_PER_CUBIC_INCH: 10, // Storage space estimation
} as const;

// ============================================================================
// COMBAT UTILITIES
// ============================================================================

export function normalizeCombatantHP(character: CombatCharacterData): CombatantHP {
  let current = 0;
  let max = 0;

  if (character['currentHp'] !== undefined) {
    current = character['currentHp'] as number;
  } else if (typeof character.hp === 'object' && character.hp?.current !== undefined) {
    current = character.hp.current;
  } else if (typeof character.hp === 'number') {
    current = character.hp;
  }

  if (character['maxHp'] !== undefined) {
    max = character['maxHp'] as number;
  } else if (typeof character.hp === 'object' && character.hp?.max !== undefined) {
    max = character.hp.max;
  } else if (typeof character.hp === 'number') {
    max = character.hp;
  }

  return { current: Math.max(0, current), max: Math.max(1, max) };
}

export function sortCombatantsByInitiative(combatants: CombatantWithInitiative[]): CombatantWithInitiative[] {
  return [...combatants].sort((a, b) => {
    if (b.initiative === a.initiative) {
      return (b._sortId || 0) - (a._sortId || 0);
    }
    return b.initiative - a.initiative;
  });
}
