import type { CharacterData } from '@/types';

export const BURN_BRIGHTLY_COST = 2;

// Burn Brightly: after any roll, spend 2 XP to add +1 (max +1 per roll). It opens up once the character has the XP to
// Level Up, 6 + twice their level (Book 1, pp. 74-75, 231, 528). The Would-be Hero's Driven background always has it (p. 137).
export const canBurnBrightly = (data: CharacterData | undefined): boolean => {
  const xp = parseInt(data?.statXp ?? '', 10);
  if (isNaN(xp) || xp < BURN_BRIGHTLY_COST) return false;
  if (data?.background === 'driven') return true;
  const level = parseInt(data?.statLevel ?? '', 10);
  return !isNaN(level) && xp >= 6 + 2 * level;
};
