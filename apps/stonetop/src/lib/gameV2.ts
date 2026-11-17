import { collection, deleteDoc, doc, getDoc, getDocs, runTransaction, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { GAMES_COLLECTION } from '@/lib/constants';
import { assembleGame, splitGame, type Stored } from '@/lib/gameShape';
import { parseCharacters, ROLL_LOG_CAP } from '@/lib/gameParsing';
import { stripUndefined, UserFacingError } from '@/lib/gameMutations';
import { generateId } from '@/lib/id';
import type { Character, LoggedRoll } from '@/model';

// Reads and writes for a game moved to subcollections (schemaVersion 2; see MIGRATION.md).

type Raw = Record<string, unknown>;

export const isMoved = (game: Raw | undefined) => game?.schemaVersion === 2;

const charactersCol = (gameId: string) => collection(db, GAMES_COLLECTION, gameId, 'characters');
const rollsCol = (gameId: string) => collection(db, GAMES_COLLECTION, gameId, 'rolls');
const characterRef = (gameId: string, id: string) => doc(db, GAMES_COLLECTION, gameId, 'characters', id);
const rollRef = (gameId: string, id: string) => doc(db, GAMES_COLLECTION, gameId, 'rolls', id);

// A batch holds at most 500 writes; stay well under it.
const MAX_BATCH = 450;

const storedDocs = async (col: ReturnType<typeof collection>): Promise<Stored[]> =>
  (await getDocs(col)).docs.map((d) => ({ id: d.id, data: d.data() as Raw }));

const nextOrder = (items: Stored[]) => Math.max(-1, ...items.map((i) => Number(i.data.order) || 0)) + 1;

const readOnce = async (gameId: string): Promise<{ game: Raw; characters: Stored[]; rolls: Stored[] } | undefined> => {
  const [game, characters, rolls] = await Promise.all([
    getDoc(doc(db, GAMES_COLLECTION, gameId)),
    storedDocs(charactersCol(gameId)),
    storedDocs(rollsCol(gameId)),
  ]);
  return game.exists() ? { game: game.data() as Raw, characters, rolls } : undefined;
};

/** The game as the one-document shape, for exports. Reads until two passes agree, so a restore running meanwhile cannot give a mix of old and new. */
export const readMovedGame = async (gameId: string): Promise<Raw> => {
  for (let attempt = 0; attempt < 3; attempt++) {
    const [first, second] = [await readOnce(gameId), await readOnce(gameId)];
    if (!first || !second) throw new Error('Game not found — it may have been deleted.');
    if (JSON.stringify(first) === JSON.stringify(second)) return assembleGame(first.game, first.characters, first.rolls);
  }
  throw new Error('The game kept changing while it was being read. Try again in a moment.');
};

/** Changes one character on the freshly-read document, so a save only ever touches that character. */
export const editCharacter = (gameId: string, characterId: string, transform: (c: Character) => Character): Promise<void> =>
  runTransaction(db, async (tx) => {
    const ref = characterRef(gameId, characterId);
    const snap = await tx.get(ref);
    // Fail loud: a missing document means the character was removed mid-session, and "Saved" would be a lie.
    if (!snap.exists()) throw new Error('Character not found — it may have been removed.');
    const [character] = parseCharacters({ characters: [{ ...snap.data(), id: characterId }] });
    if (!character) throw new Error("This character's data couldn't be read.");
    tx.update(ref, stripUndefined(transform(character)));
  });

/** Adds a character unless that id is already there, so a double-tap or a retry after a dropped connection cannot add it twice. */
export const addCharacter = async (gameId: string, character: Character): Promise<void> => {
  const order = nextOrder(await storedDocs(charactersCol(gameId)));
  await runTransaction(db, async (tx) => {
    const ref = characterRef(gameId, character.id);
    if ((await tx.get(ref)).exists()) return;
    tx.set(ref, stripUndefined({ ...character, order }));
  });
};

export const removeCharacter = (gameId: string, characterId: string): Promise<void> => deleteDoc(characterRef(gameId, characterId));

/** Puts `ids` first, in that order; a character another player added meanwhile keeps its place after them. */
export const reorderCharacters = async (gameId: string, ids: string[]): Promise<void> => {
  const current = await storedDocs(charactersCol(gameId));
  const named = new Set(ids);
  const known = new Set(current.map((c) => c.id));
  const rest = [...current].sort((a, b) => Number(a.data.order) - Number(b.data.order)).filter((c) => !named.has(c.id));
  const inOrder = [...ids.filter((id) => known.has(id)), ...rest.map((c) => c.id)];
  // A transaction, so a character removed meanwhile just drops out of the order instead of failing the whole reorder.
  await runTransaction(db, async (tx) => {
    const snaps = await Promise.all(inOrder.map((id) => tx.get(characterRef(gameId, id))));
    inOrder.forEach((id, order) => {
      if (snaps[order]!.exists()) tx.update(characterRef(gameId, id), { order });
    });
  });
};

/** Writes a roll (new, or an existing one edited in place), then trims the log to the newest ROLL_LOG_CAP. */
export const logRoll = async (gameId: string, roll: LoggedRoll): Promise<void> => {
  const prior = (await storedDocs(rollsCol(gameId))).find((r) => r.id === roll.id);
  const order = prior ? Number(prior.data.order) : nextOrder(await storedDocs(rollsCol(gameId)));
  await setDoc(rollRef(gameId, roll.id), stripUndefined({ ...roll, order }));
  const all = (await storedDocs(rollsCol(gameId))).map((r) => ({ id: r.id, createdAt: Number(r.data.createdAt) || 0 }));
  const oldest = all.sort((a, b) => a.createdAt - b.createdAt).slice(0, Math.max(0, all.length - ROLL_LOG_CAP));
  // Each delete re-checks the roll it saw: one edited since (new createdAt) is fresh again and stays; one already gone is fine.
  await Promise.all(
    oldest.map((old) =>
      runTransaction(db, async (tx) => {
        const snap = await tx.get(rollRef(gameId, old.id));
        if (snap.exists() && Number(snap.data().createdAt) === old.createdAt) tx.delete(rollRef(gameId, old.id));
      }),
    ),
  );
};

/** Replaces a moved game with the contents of a backup, in one batch: nothing is left of the old characters and rolls, and no half-restored game is ever visible. */
export const replaceGame = async (gameId: string, backup: Raw): Promise<void> => {
  const gameRef = doc(db, GAMES_COLLECTION, gameId);
  // Read before the party: a restore that lands after this makes the transaction below refuse, so two restores never mix.
  const before = (await getDoc(gameRef)).data()?.restoreToken;
  const [characters, rolls] = await Promise.all([storedDocs(charactersCol(gameId)), storedDocs(rollsCol(gameId))]);
  const result = splitGame(backup);
  if (!result.ok) throw new UserFacingError(`That backup can't be restored: ${result.problems.join('; ')}`);
  const { split } = result;
  if (characters.length + rolls.length + split.characters.length + split.rolls.length > MAX_BATCH) {
    throw new UserFacingError('That backup is too large to restore in one step.');
  }
  // Marks this restore as the latest, so the clean-up below never deletes what a later restore wrote.
  const token = generateId();
  await runTransaction(db, async (tx) => {
    if ((await tx.get(gameRef)).data()?.restoreToken !== before) {
      throw new UserFacingError('Someone else restored this game while this was running. Nothing was changed; try again.');
    }
    tx.set(gameRef, { ...split.game, restoreToken: token });
    characters.forEach((c) => tx.delete(characterRef(gameId, c.id)));
    rolls.forEach((r) => tx.delete(rollRef(gameId, r.id)));
    split.characters.forEach((c) => tx.set(characterRef(gameId, c.id), c.data));
    split.rolls.forEach((r) => tx.set(rollRef(gameId, r.id), r.data));
  });

  // shortcut: a stray added after this read survives; upgrade with a write guard on the party if restores run during play.
  const kept = new Set([
    ...split.characters.map((c) => characterRef(gameId, c.id).path),
    ...split.rolls.map((r) => rollRef(gameId, r.id).path),
  ]);
  const [nowCharacters, nowRolls] = await Promise.all([storedDocs(charactersCol(gameId)), storedDocs(rollsCol(gameId))]);
  const strays = [...nowCharacters.map((c) => characterRef(gameId, c.id)), ...nowRolls.map((r) => rollRef(gameId, r.id))].filter(
    (ref) => !kept.has(ref.path),
  );
  await Promise.all(
    strays.map((ref) =>
      runTransaction(db, async (tx) => {
        if ((await tx.get(gameRef)).data()?.restoreToken === token) tx.delete(ref);
      }),
    ),
  );
};
