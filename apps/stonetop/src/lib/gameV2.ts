import { collection, deleteDoc, doc, getDocs, runTransaction, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { GAMES_COLLECTION } from '@/lib/constants';
import { joinGame, splitGame } from '@/lib/gameShape';
import { parseCharacters, ROLL_LOG_CAP } from '@/lib/gameParsing';
import { stripUndefined } from '@/lib/gameMutations';
import type { Character, LoggedRoll } from '@/model';

// Reads and writes for a game moved to subcollections (schemaVersion 2; see MIGRATION.md). The game document keeps the
// steading, notes and the rest and is written by useGame as before; characters and rolls are one document each.

type Raw = Record<string, unknown>;
export interface Stored {
  id: string;
  data: Raw;
}

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

/** The game as the v1 shape, from its document plus both subcollections. Used for exports. */
export const readMovedGame = async (gameId: string, game: Raw): Promise<Raw> => {
  const [characters, rolls] = await Promise.all([storedDocs(charactersCol(gameId)), storedDocs(rollsCol(gameId))]);
  return joinGame({ game, characters, rolls });
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
  const batch = writeBatch(db);
  [...ids.filter((id) => known.has(id)), ...rest.map((c) => c.id)].forEach((id, order) =>
    batch.update(characterRef(gameId, id), { order }),
  );
  await batch.commit();
};

/** Writes a roll (a new one, or an existing one edited in place) and in the same batch trims the log to the newest ROLL_LOG_CAP. */
export const logRoll = async (gameId: string, roll: LoggedRoll): Promise<void> => {
  const current = await storedDocs(rollsCol(gameId));
  const prior = current.find((r) => r.id === roll.id);
  const batch = writeBatch(db);
  batch.set(rollRef(gameId, roll.id), stripUndefined({ ...roll, order: prior ? Number(prior.data.order) : nextOrder(current) }));
  const all = [...current.filter((r) => r.id !== roll.id).map((r) => ({ id: r.id, createdAt: Number(r.data.createdAt) || 0 })), roll];
  all
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(0, Math.max(0, all.length - ROLL_LOG_CAP))
    .forEach((old) => batch.delete(rollRef(gameId, old.id)));
  await batch.commit();
};

/** Replaces a moved game with the contents of a backup, in one batch: nothing is left of the old characters and rolls, and no half-restored game is ever visible. */
export const replaceGame = async (gameId: string, backup: Raw): Promise<void> => {
  const [characters, rolls] = await Promise.all([storedDocs(charactersCol(gameId)), storedDocs(rollsCol(gameId))]);
  const result = splitGame(backup);
  if (!result.ok) throw new Error(`That backup can't be restored: ${result.problems.join('; ')}`);
  const { split } = result;
  if (characters.length + rolls.length + split.characters.length + split.rolls.length > MAX_BATCH) {
    throw new Error('That backup is too large to restore in one step.');
  }
  const batch = writeBatch(db);
  batch.set(doc(db, GAMES_COLLECTION, gameId), split.game);
  characters.forEach((c) => batch.delete(characterRef(gameId, c.id)));
  rolls.forEach((r) => batch.delete(rollRef(gameId, r.id)));
  split.characters.forEach((c) => batch.set(characterRef(gameId, c.id), c.data));
  split.rolls.forEach((r) => batch.set(rollRef(gameId, r.id), r.data));
  await batch.commit();
};
