import {
  FieldPath,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocFromCache,
  getDocs,
  runTransaction,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { REMOVED, diffPaths } from '@dice-jar/diff';
import { db } from '@/lib/firebase';
import { GAMES_COLLECTION } from '@/lib/constants';
import { assembleGame, restoredLevel, splitGame, type Stored } from '@/lib/gameShape';
import { parseCharacters, ROLL_LOG_CAP } from '@/lib/gameParsing';
import { stripUndefined, UserFacingError } from '@/lib/gameMutations';
import { generateId } from '@/lib/id';
import { ROLL_TEXT_MAX_LENGTH } from '@/lib/constants';
import { isPlainObject } from '@/lib/typeGuards';
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

// The fields of a character document this build knows. `order` and anything else on the document are not the character's to change.
const CHARACTER_FIELDS = ['id', 'name', 'playbook', 'level', 'data'];

/**
 * Changes one character and writes only the fields that changed, so two devices editing different fields never overwrite each other
 * (the same field goes to whoever writes last, so two devices changing one stat in the same instant keep only one change).
 * It builds on this tab's local copy, which the page's listener keeps current and which already holds this tab's unconfirmed writes,
 * so quick edits, and edits made offline, add up. It resolves once the write is queued: the server's answer can take any time
 * offline, and holding the caller until then would hold every later edit back in memory, where closing the tab loses it.
 * `onRejected` hears of a write the server later refuses.
 * `confirmed` is for edits that cannot be merged from a stale copy (an id-merged list) or that a bonus depends on (an XP payment):
 * it reads the server's copy when online and resolves only once the server accepts the write, rejecting if it refuses.
 */
export const editCharacter = async (
  gameId: string,
  characterId: string,
  transform: (c: Character) => Character,
  onRejected: (error: unknown) => void,
  confirmed = false,
): Promise<void> => {
  const ref = characterRef(gameId, characterId);
  const snap = confirmed ? await getDoc(ref) : await getDocFromCache(ref).catch(() => getDoc(ref)); // not cached: ask the server
  // Fail loud: a missing document means the character was removed mid-session, and "Saved" would be a lie.
  if (!snap.exists()) throw new Error('Character not found — it may have been removed.');
  const raw = snap.data();
  const [before] = parseCharacters({ characters: [{ ...raw, id: characterId }] });
  if (!before) throw new Error("This character's data couldn't be read.");
  const after = stripUndefined(transform(before));
  // Compared with what is stored, not with the parsed copy, so what the reader repairs or drops (a missing level, a key it no longer knows) is written too.
  const known = (from: Record<string, unknown>) =>
    Object.fromEntries(CHARACTER_FIELDS.filter((field) => field in from).map((field) => [field, from[field]]));
  const changes = diffPaths(known(raw), known({ ...after }));
  if (!changes.length) return;
  const writes = changes.flatMap(([path, value]) => [new FieldPath(...path), value === REMOVED ? deleteField() : value]);
  const write = updateDoc(ref, ...(writes as [FieldPath, unknown, ...unknown[]]));
  if (confirmed) await write;
  else write.catch(onRejected);
};

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
export const logRoll = async (gameId: string, logged: LoggedRoll): Promise<void> => {
  // A custom move can have any name, and the rules refuse a roll with a label over the cap: shorten it so the roll still reaches the log.
  const clip = (text?: string) => {
    const cut = text?.slice(0, ROLL_TEXT_MAX_LENGTH);
    return cut && /[\uD800-\uDBFF]$/.test(cut) ? cut.slice(0, -1) : cut; // never leave half of an emoji
  };
  const roll = {
    ...logged,
    characterName: clip(logged.characterName) ?? '',
    moveName: clip(logged.moveName) ?? '',
    resource: clip(logged.resource),
  };
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
  // A backup from before characters had a level has none: give it the level the reader would, which the rules require.
  const repaired = Array.isArray(backup.characters)
    ? backup.characters.map((c) => (isPlainObject(c) ? { ...c, level: restoredLevel(c.level) ?? c.level } : c))
    : backup.characters;
  const result = splitGame({ ...backup, characters: repaired });
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
