import { doc, runTransaction } from 'firebase/firestore';
import type { FirestoreError } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { INVALID_WRITE_MESSAGE } from '@/lib/constants';
import { isPlainObject, isRecord, isString } from '@/lib/typeGuards';
import { parseCharacters } from '@/lib/gameParsing';
import type { Character, CharacterData } from '@/model';

// Map raw Firestore error codes to messages a player can act on — the raw
// strings (e.g. "Missing or insufficient permissions") are infra noise. Any
// unmapped code falls through to a generic line, so raw text never reaches the UI.
export const FIRESTORE_ERROR_MESSAGES: Partial<Record<FirestoreError['code'], string>> = {
  'permission-denied': "You don't have access to this game.",
  unavailable: "Can't reach the server — check your connection and try again.",
  'deadline-exceeded': 'The server took too long to respond — try again.',
  unauthenticated: 'Your session expired — reload the page and try again.',
  // Covers both a write that exceeds Firestore's 1 MiB per-doc ceiling and a malformed value
  // (e.g. an app bug leaving `undefined` in the payload) — Firestore uses the same code for
  // both, and the client can't reliably tell them apart (see INVALID_WRITE_MESSAGE). Without
  // this it fell through to the generic "check your connection" line, which is wrong for either
  // cause and offers no recovery path.
  'invalid-argument': INVALID_WRITE_MESSAGE,
};

export const friendlyFirestoreError = (err: FirestoreError): string =>
  FIRESTORE_ERROR_MESSAGES[err.code] ?? 'Something went wrong loading this game. Please try again.';

// A FirestoreError carries a string `code`; other throws (network, mock) don't.
export const isFirestoreError = (err: unknown): err is FirestoreError => isRecord(err) && isString(err.code);

// Merge an id-keyed array against the freshly-read doc's version so a save only touches the
// entries it names. `incoming` wins for ids it names (edited or added); every other stored entry
// is kept as stored, UNLESS it's named in `removedIds` — the explicit sentinel for intentional
// removal (mirrors deleteFeatureKeys), since omitting an id from `incoming` alone is ambiguous
// between "removed" and "never seen". Stored order is kept, and new ids go on the end, so an edit
// never reshuffles the list.
export const mergeById = <T extends { id: string }>(existing: T[] | undefined, incoming: T[], removedIds?: string[]): T[] => {
  const removed = new Set(removedIds ?? []);
  const incomingById = new Map(incoming.map((e) => [e.id, e]));
  const kept = (existing ?? []).filter((e) => !removed.has(e.id)).map((e) => incomingById.get(e.id) ?? e);
  const keptIds = new Set(kept.map((e) => e.id));
  return [...kept, ...incoming.filter((e) => !keptIds.has(e.id) && !removed.has(e.id))];
};

// The entries of `next` that are new or differ from the same id in `prev` (what this tab last read).
// Send these, not the whole list, to a save that id-merges: the rest of the list is other tabs' to change.
export const changedById = <T extends { id: string }>(prev: T[], next: T[]): T[] => {
  const before = new Map(prev.map((e) => [e.id, JSON.stringify(e)]));
  return next.filter((e) => before.get(e.id) !== JSON.stringify(e));
};

// Strip undefined-valued keys (e.g. parsed NPCs' optional fields, or debilities'
// untouched keys from parseDebilities) before writing to Firestore, which rejects
// undefined values outright.
export const stripUndefined = <T>(v: T): T => JSON.parse(JSON.stringify(v));

// steading array fields that are id-merged (not overwritten) against the freshly-read doc,
// each paired with its SteadingData sentinel field for explicit-removal ids.
export const STEADING_ID_ARRAY_FIELDS = {
  residents: 'removedResidentIds',
  neighbors: 'removedNeighborIds',
  gmImprovements: 'removedGmImprovementIds',
} as const;

/** An error whose message is meant for the player, so a save shows it instead of the generic "couldn't save". */
export class UserFacingError extends Error {}

// Thrown when a write finds the game has moved to subcollections, so a tab with a stale copy can carry on the new way.
export class GameMovedError extends Error {}

export const withCharacters = async (ref: ReturnType<typeof doc>, transform: (characters: Character[]) => Character[]): Promise<void> => {
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    // Fail loud rather than silently no-op: a missing doc here means the game was
    // deleted mid-session, so returning would let reportSave flag "Saved." for a
    // write that never happened. Throwing routes it through the save-error path.
    if (!snap.exists()) throw new Error('Game not found — it may have been deleted.');
    if (snap.data()?.schemaVersion === 2) throw new GameMovedError();
    // parseCharacterData sets every unrecognized/absent optional CharacterData field to `undefined`
    // explicitly (rather than omitting the key), so every character read here already carries some.
    // Firestore's tx.update rejects the whole write the moment any value anywhere in the payload is
    // `undefined` (see INVALID_WRITE_MESSAGE for how that surfaces to the player). Strip them at this
    // single choke point every character write passes through, rather than in each transform.
    tx.update(ref, { characters: stripUndefined(transform(parseCharacters(snap.data()))) });
  });
};

// Applies a partial CharacterData save to the freshly-read character, so a stale save only touches what it names.
export const patchCharacterData = (c: Character, data: Partial<CharacterData>): Character => {
  // Shallow-merge plain-object fields so a concurrent save to a sibling key can't be clobbered; arrays are id-merged below.
  const next = { ...c.data, ...data };
  for (const key of Object.keys(data) as (keyof CharacterData)[]) {
    const incoming = data[key];
    const existing = c.data?.[key];
    if (isPlainObject(incoming) && isPlainObject(existing)) {
      (next as Record<string, unknown>)[key] = { ...existing, ...incoming };
    }
  }
  // Omitting a playbookFeatures key merges as "unchanged"; deletion needs the explicit deleteFeatureKeys sentinel.
  if (data.deleteFeatureKeys?.length && next.playbookFeatures) {
    next.playbookFeatures = { ...next.playbookFeatures };
    for (const key of data.deleteFeatureKeys) delete next.playbookFeatures[key];
  }
  delete next.deleteFeatureKeys;
  // Arcana entries id-merge so a concurrent edit to another entry survives; removal uses the removedArcana*Ids sentinels.
  if (data.arcanaMinor) next.arcanaMinor = mergeById(c.data?.arcanaMinor, data.arcanaMinor, data.removedArcanaMinorIds);
  if (data.arcanaMajor) next.arcanaMajor = mergeById(c.data?.arcanaMajor, data.arcanaMajor, data.removedArcanaMajorIds);
  delete next.removedArcanaMinorIds;
  delete next.removedArcanaMajorIds;
  return { ...c, data: next };
};
