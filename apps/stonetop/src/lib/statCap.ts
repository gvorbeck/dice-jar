// Stats top out at +2 (Improved Stat); Superior Stat, available from level 6, raises the limit to +3 (Book 1, pp. 52, 106-107).
export const statCap = (takes: Record<string, number> | undefined): 2 | 3 =>
  Object.entries(takes ?? {}).some(([id, n]) => id.endsWith('-superior-stat') && n > 0) ? 3 : 2;
