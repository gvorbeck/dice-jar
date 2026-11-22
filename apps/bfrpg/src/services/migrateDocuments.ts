import { diffPaths, type Change } from '@dice-jar/diff';
import { processCharacterData } from './characterMigration';
import { characterSchema, gameSchema, problemWith, SCHEMA_VERSION } from './documentSchemas';

/** `value` with every object's keys sorted: Firestore hands objects back that way, so key order says nothing about a document. */
const sortKeys = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(sortKeys)
    : value && typeof value === 'object'
      ? Object.fromEntries(
          Object.entries(value)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => [k, sortKeys(v)]),
        )
      : value;

/** Same data, whatever the key order. */
export const sameData = (a: unknown, b: unknown) => JSON.stringify(sortKeys(a)) === JSON.stringify(sortKeys(b));

export type Kind = 'characters' | 'games';
type Doc = Record<string, unknown>;

/** What a migration does to one stored document. `changes` are the leaf writes, so a document is never rewritten whole. */
export type Plan = { status: 'current' } | { status: 'migrate'; next: Doc; changes: Change[] } | { status: 'refused'; reason: string };

/**
 * Pure and idempotent: a document already in the current shape plans as 'current' (no write), so running again after a
 * partial run only touches what is left. A document that would not fit its schema once migrated is refused, never guessed at.
 * `created` and `updated` are Firestore's own times for the document (ms), used to backfill createdAt and updatedAt.
 */
export function planMigration(kind: Kind, stored: Doc, times: { created?: number; updated?: number } = {}): Plan {
  let next: Doc;
  try {
    next =
      kind === 'characters'
        ? (processCharacterData(structuredClone(stored)) as unknown as Doc)
        : { ...structuredClone(stored), schemaVersion: SCHEMA_VERSION };
  } catch (error) {
    return { status: 'refused', reason: error instanceof Error ? error.message : String(error) };
  }
  if (typeof next['createdAt'] !== 'number' && times.created !== undefined) next['createdAt'] = times.created;
  if (typeof next['updatedAt'] !== 'number' && times.updated !== undefined) next['updatedAt'] = times.updated;

  const problem = problemWith(kind === 'characters' ? characterSchema : gameSchema, next);
  if (problem) return { status: 'refused', reason: problem };
  // Compared without regard to key order, or a stored document would look changed for ever once Firestore sorted its keys.
  const changes = diffPaths(sortKeys(stored), sortKeys(next));
  return changes.length ? { status: 'migrate', next, changes } : { status: 'current' };
}
