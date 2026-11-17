import type { Firestore, QuerySnapshot } from 'firebase-admin/firestore';
import { assembleGame, type Stored } from '../src/lib/gameShape.ts';

type Raw = Record<string, unknown>;

const stored = (snap: QuerySnapshot): Stored[] => snap.docs.map((d) => ({ id: d.id, data: d.data() as Raw }));
const READ_AT_ONCE = 10;

/**
 * Every game (or just `only`) as `{ id: document }`. A moved game is saved as the one document it was, so every backup has
 * one shape and any tool can read it.
 */
export const backupGames = async (
  db: Firestore,
  options: { only?: string[]; onProgress?: (done: number, total: number) => void } = {},
): Promise<Record<string, Raw>> => {
  const refs = options.only ? options.only.map((id) => db.collection('games').doc(id)) : await db.collection('games').listDocuments();
  const data: Record<string, Raw> = {};
  let done = 0;
  for (let i = 0; i < refs.length; i += READ_AT_ONCE) {
    await Promise.all(
      refs.slice(i, i + READ_AT_ONCE).map(async (ref) => {
        // One read-only transaction, so the game and its characters and rolls come from the same moment, whatever players or a restore do meanwhile.
        const copy = await db.runTransaction(
          async (tx) => {
            const snap = await tx.get(ref);
            if (!snap.exists) return undefined;
            const game = snap.data() as Raw;
            if (game.schemaVersion !== 2) return game;
            const [characters, rolls] = [await tx.get(ref.collection('characters')), await tx.get(ref.collection('rolls'))];
            return assembleGame(game, stored(characters), stored(rolls));
          },
          { readOnly: true },
        );
        if (!copy && options.only) throw new Error(`No game found with ID: ${ref.id}`);
        if (copy) data[ref.id] = copy; // a missing one is a bare parent of subcollections, not a game
        options.onProgress?.(++done, refs.length);
      }),
    );
  }
  return data;
};
