import { doc, getDoc, runTransaction } from 'firebase/firestore';
import { newGameId } from '@dice-jar/game-id';
import { db } from './firebase';
import { GAMES_COLLECTION } from './constants';
import { GAME_ID_WORDS } from './gameIdWords';
import { SCHEMA_VERSION } from './gameShape';

const newGame = () => ({ name: '', createdAt: Date.now(), characters: [], schemaVersion: SCHEMA_VERSION });

export const gameIdExists = async (id: string): Promise<boolean> => {
  const snap = await getDoc(doc(db, GAMES_COLLECTION, id));
  return snap.exists();
};

export const createGameWithId = async (id: string): Promise<void> => {
  const ref = doc(db, GAMES_COLLECTION, id);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists()) throw new Error('Game ID already taken.');
    tx.set(ref, newGame());
  });
};

export const createGame = async (): Promise<string> => {
  const id = newGameId(GAME_ID_WORDS); // the transaction refuses an ID that exists, so a collision is an error, not an overwrite
  await createGameWithId(id);
  return id;
};
