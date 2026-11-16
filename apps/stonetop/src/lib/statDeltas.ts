import type { AdditiveStat, CharacterData } from '@/types';

// Apply additive changes (armor, HP, XP) to a freshly read sheet. XP never goes below 0: two devices can each spend
// 2 XP (Burn Brightly) from a total that only covered one of them.
export const applyStatDeltas = (data: CharacterData, deltas: Partial<Record<AdditiveStat, number>>): CharacterData => {
  const next = { ...data };
  for (const [field, delta] of Object.entries(deltas) as [AdditiveStat, number][]) {
    const sum = (Number(next[field]) || 0) + delta;
    next[field] = String(field === 'statXp' ? Math.max(0, sum) : sum);
  }
  return next;
};
