import type { AdditiveStat, CharacterData } from '@/types';

// Apply additive changes (armor, HP, XP) to a freshly read sheet. XP can't be overspent: two devices can each try to
// spend 2 XP (Burn Brightly) from a total that only covers one, and the second must fail rather than be waved through.
export const applyStatDeltas = (data: CharacterData, deltas: Partial<Record<AdditiveStat, number>>): CharacterData => {
  const next = { ...data };
  for (const [field, delta] of Object.entries(deltas) as [AdditiveStat, number][]) {
    const sum = (Number(next[field]) || 0) + delta;
    if (field === 'statXp' && sum < 0) throw new Error('Not enough XP.');
    next[field] = String(sum);
  }
  return next;
};
