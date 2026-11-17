import type { Firestore, QuerySnapshot } from 'firebase-admin/firestore';
import { assembleGame, joinGame, splitGame, type SplitGame, type Stored } from '../src/lib/gameShape.ts';
import { sameGame } from './gameAudit.ts';

// Moves a game between one document and subcollections (MIGRATION.md). Each game is one Admin transaction, so it moves
// completely or not at all, and a write from a player in the same instant makes the transaction read again.

type Raw = Record<string, unknown>;

export type Outcome =
  | { id: string; status: 'moved'; characters: number; rolls: number; changedAfter?: string[] }
  | { id: string; status: 'would move'; characters: number; rolls: number }
  | { id: string; status: 'put back'; characters: number; rolls: number }
  | { id: string; status: 'already moved' | 'not moved' | 'missing' | 'changed since backup' }
  | { id: string; status: 'refused'; problems: string[] }
  | { id: string; status: 'failed'; error: string };

// A transaction holds at most 500 writes; stay well under it.
const MAX_WRITES = 450;

const stored = (snap: QuerySnapshot): Stored[] => snap.docs.map((d) => ({ id: d.id, data: d.data() as Raw }));

/**
 * Moves one game to subcollections. `expected` is the game as the backup holds it: a game that has changed since is left
 * alone, so the backup is always exactly what a restore would need. With `dryRun` nothing is written.
 */
export const migrateGame = async (db: Firestore, id: string, options: { expected?: Raw; dryRun?: boolean } = {}): Promise<Outcome> => {
  const ref = db.collection('games').doc(id);
  let written: SplitGame | undefined; // what the committed attempt of the transaction wrote
  const outcome = await db.runTransaction(async (tx): Promise<Outcome> => {
    written = undefined;
    const snap = await tx.get(ref);
    if (!snap.exists) return { id, status: 'missing' };
    const data = snap.data() as Raw;
    if (data.schemaVersion === 2) return { id, status: 'already moved' };
    if (options.expected && !sameGame(data, options.expected)) return { id, status: 'changed since backup' };

    const result = splitGame(data);
    if (!result.ok) return { id, status: 'refused', problems: result.problems };
    const { split } = result;
    if (!sameGame(joinGame(split), data))
      return { id, status: 'refused', problems: ['splitting and joining does not give back the stored document'] };
    if (split.characters.length + split.rolls.length + 1 > MAX_WRITES)
      return { id, status: 'refused', problems: ['too many documents for one transaction'] };
    const [oldCharacters, oldRolls] = [await tx.get(ref.collection('characters').limit(1)), await tx.get(ref.collection('rolls').limit(1))];
    if (!oldCharacters.empty || !oldRolls.empty) return { id, status: 'refused', problems: ['subcollection documents already exist'] };

    const counts = { characters: split.characters.length, rolls: split.rolls.length };
    if (options.dryRun) return { id, status: 'would move', ...counts };
    written = split;
    tx.set(ref, split.game);
    split.characters.forEach((c) => tx.set(ref.collection('characters').doc(c.id), c.data));
    split.rolls.forEach((r) => tx.set(ref.collection('rolls').doc(r.id), r.data));
    return { id, status: 'moved', ...counts };
  });

  // The move was checked before it was written. Read it back to confirm it landed, and note (not fail on) anything a player saved since.
  if (outcome.status === 'moved' && written) {
    const [game, characters, rolls] = await Promise.all([ref.get(), ref.collection('characters').get(), ref.collection('rolls').get()]);
    const back = game.data() as Raw | undefined;
    if (back?.schemaVersion !== 2) throw new Error(`Verification failed for ${id}: the game is not marked as moved.`);
    const changedAfter = changedAfterMove(written, { game: back, characters: stored(characters), rolls: stored(rolls) });
    if (changedAfter.length) return { ...outcome, changedAfter };
  }
  return outcome;
};

/** What differs between the documents a move wrote and what is stored now: a player's save in between, not a failed move. */
export const changedAfterMove = (wrote: SplitGame, now: { game: Raw; characters: Stored[]; rolls: Stored[] }): string[] => {
  const changes = sameGame(now.game, wrote.game) ? [] : ['game document'];
  const compare = (kind: string, written: Stored[], live: Stored[]) => {
    const liveById = new Map(live.map((d) => [d.id, d.data]));
    written.forEach((d) => {
      const found = liveById.get(d.id);
      if (!found) changes.push(`${kind}/${d.id} removed`);
      else if (!sameGame(found, d.data)) changes.push(`${kind}/${d.id} edited`);
    });
    const writtenIds = new Set(written.map((d) => d.id));
    live.filter((d) => !writtenIds.has(d.id)).forEach((d) => changes.push(`${kind}/${d.id} added`));
  };
  compare('characters', wrote.characters, now.characters);
  compare('rolls', wrote.rolls, now.rolls);
  return changes;
};

/** Puts a moved game back in one document, with whatever has been saved since it moved. The inverse of `migrateGame`. */
export const unmigrateGame = async (db: Firestore, id: string): Promise<Outcome> => {
  const ref = db.collection('games').doc(id);
  return db.runTransaction(async (tx): Promise<Outcome> => {
    const snap = await tx.get(ref);
    if (!snap.exists) return { id, status: 'missing' };
    const data = snap.data() as Raw;
    if (data.schemaVersion !== 2) return { id, status: 'not moved' };
    const [characters, rolls] = [await tx.get(ref.collection('characters')), await tx.get(ref.collection('rolls'))];
    if (characters.size + rolls.size + 1 > MAX_WRITES)
      return { id, status: 'refused', problems: ['too many documents for one transaction'] };
    tx.set(ref, assembleGame(data, stored(characters), stored(rolls)));
    characters.docs.forEach((d) => tx.delete(d.ref));
    rolls.docs.forEach((d) => tx.delete(d.ref));
    return { id, status: 'put back', characters: characters.size, rolls: rolls.size };
  });
};

export interface RunOptions {
  /** Without it nothing is written. */
  write: boolean;
  /** The backup, `{ id: document }`. Required to write: a game not in it, or changed since, is left alone. */
  backup?: Record<string, Raw>;
  only?: string[];
  /** Stop after this many games have moved (or would). */
  limit?: number;
  /** Called after each game, so a long run can show that it is moving. */
  onProgress?: (done: number, total: number, outcome: Outcome) => void;
}

export const migrateAll = async (db: Firestore, options: RunOptions): Promise<Outcome[]> => {
  if (options.write && !options.backup) throw new Error('Refusing to write without a backup to check against.');
  const ids = options.only ?? (await db.collection('games').listDocuments()).map((d) => d.id).sort();
  const outcomes: Outcome[] = [];
  let moved = 0;
  for (const id of ids) {
    if (options.limit !== undefined && moved >= options.limit) break;
    const expected = options.backup?.[id];
    if (options.write && !expected) {
      const refused: Outcome = { id, status: 'refused', problems: ['not in the backup'] };
      outcomes.push(refused);
      options.onProgress?.(outcomes.length, ids.length, refused);
      continue;
    }
    // One game that fails (a dropped connection, say) is reported and the rest carry on.
    const outcome = await migrateGame(db, id, { expected, dryRun: !options.write }).catch((e: unknown): Outcome => ({
      id,
      status: 'failed',
      error: e instanceof Error ? e.message : String(e),
    }));
    if (outcome.status === 'moved' || outcome.status === 'would move') moved++;
    outcomes.push(outcome);
    options.onProgress?.(outcomes.length, ids.length, outcome);
  }
  return outcomes;
};
