// Stats top out at +2 (Improved Stat); Superior Stat, available from level 6, raises the limit to +3 (Book 1, pp. 52, 106-107).
// Superior Stat has a single select box, so taking it is recorded in `typeMoves` (selected moves), not `typeMoveTakes`.
export const statCap = (typeMoves: Record<string, boolean> | undefined): 2 | 3 =>
  Object.entries(typeMoves ?? {}).some(([id, taken]) => taken && id.endsWith('-superior-stat')) ? 3 : 2;
