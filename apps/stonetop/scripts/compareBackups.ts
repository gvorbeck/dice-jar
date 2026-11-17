import { sameGame } from './gameAudit.ts';

export interface Comparison {
  same: number;
  /** Games present in both whose contents differ. */
  differ: string[];
  onlyInFirst: string[];
  onlyInSecond: string[];
}

/** Compares two backups (`{ id: document }`): a game counts as the same when its data is, whatever the key order. */
export const compareBackups = (first: Record<string, unknown>, second: Record<string, unknown>): Comparison => {
  const result: Comparison = { same: 0, differ: [], onlyInFirst: [], onlyInSecond: [] };
  for (const id of Object.keys(first)) {
    if (!(id in second)) result.onlyInFirst.push(id);
    else if (sameGame(first[id] as Record<string, unknown>, second[id] as Record<string, unknown>)) result.same++;
    else result.differ.push(id);
  }
  for (const id of Object.keys(second)) if (!(id in first)) result.onlyInSecond.push(id);
  return result;
};
