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
        const snap = await ref.get();
        if (!snap.exists) {
          if (options.only) throw new Error(`No game found with ID: ${ref.id}`);
          return; // a bare parent of subcollections, not a game
        }
        const game = snap.data() as Raw;
        data[ref.id] =
          game.schemaVersion === 2
            ? assembleGame(game, stored(await ref.collection('characters').get()), stored(await ref.collection('rolls').get()))
            : game;
        options.onProgress?.(++done, refs.length);
      }),
    );
  }
  return data;
};
