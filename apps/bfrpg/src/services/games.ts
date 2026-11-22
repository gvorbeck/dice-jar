// Games service for Firebase Firestore operations
import { collection, doc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FIREBASE_COLLECTIONS } from '@/constants';
import type { Game } from '@/types';
import { handleServiceError } from '@/utils';
import { gameSchema, problemWith, SCHEMA_VERSION } from './documentSchemas';
import { forget, remember, saveDiff } from './diffSave';

export type { Game };

const gamesRef = (userId: string) => collection(db, FIREBASE_COLLECTIONS.USERS, userId, 'games');
const gameRef = (userId: string, gameId: string) => doc(gamesRef(userId), gameId);
const slot = (userId: string, gameId: string) => `games/${userId}/${gameId}`;

/** Live list of a user's games. */
export const watchUserGames = (userId: string, ok: (games: Game[]) => void, bad: (e: Error) => void) =>
  onSnapshot(
    gamesRef(userId),
    (snapshot) => ok(snapshot.docs.map((d) => ({ id: d.id, name: d.data()['name'] || 'Unnamed Game', ...d.data() }) as Game)),
    bad,
  );

/** Live view of one game; null when it doesn't exist. */
export const watchGame = (userId: string, gameId: string, ok: (game: Game | null) => void, bad: (e: Error) => void) =>
  onSnapshot(
    gameRef(userId, gameId),
    (snapshot) => {
      if (!snapshot.exists()) {
        forget(slot(userId, gameId));
        ok(null);
        return;
      }
      const problem = problemWith(gameSchema, snapshot.data());
      if (problem) console.warn(`Game ${gameId} doesn't match its schema, ${problem}`);
      remember(slot(userId, gameId), snapshot.data());
      ok({ id: snapshot.id, ...snapshot.data() } as Game);
    },
    bad,
  );

/** Saves a game: only the changed fields when it was read in this tab; a new one gets a fresh id. */
export const saveGame = async (userId: string, game: Omit<Game, 'id'>, gameId?: string): Promise<string> => {
  try {
    const ref = gameId ? gameRef(userId, gameId) : doc(gamesRef(userId));
    // Only a new game gets createdAt; an existing one keeps its own, or gets it from the migration script.
    const next = { ...game, schemaVersion: SCHEMA_VERSION, ...(gameId ? {} : { createdAt: Date.now() }) };
    await saveDiff(ref, slot(userId, ref.id), next, Boolean(gameId));
    return ref.id;
  } catch (error) {
    handleServiceError(error, { action: 'saving game', context: { userId, gameId, gameName: game['name'] } });
  }
};

/** Delete a game for a specific user */
export const deleteGame = async (userId: string, gameId: string): Promise<void> => {
  try {
    await deleteDoc(gameRef(userId, gameId));
    forget(slot(userId, gameId));
  } catch (error) {
    handleServiceError(error, { action: 'deleting game', context: { userId, gameId } });
  }
};
