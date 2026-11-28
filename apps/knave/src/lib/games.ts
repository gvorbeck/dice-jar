import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  type DocumentData,
} from 'firebase/firestore';
import { useSub, type Sub } from '@dice-jar/browser';
import { db } from './firebase';
import { characterPath, charactersPath, gamePath, rollsPath } from './paths';

/*
 * Firestore layout (rules in firestore.rules):
 *   games/{gameId}                        { createdAt, schemaVersion }                 immutable
 *   games/{gameId}/characters/{id}        { name, careers, level, hp, hpMax,           summary fields for the game page
 *                                           character,                                 the sheet itself (model/character)
 *                                           createdAt, updatedAt }
 *   games/{gameId}/rolls/{id}             { characterId, characterName, label, detail, total, createdAt }   append-only
 * Anything new at game level becomes another sibling subcollection.
 */
export const SCHEMA_VERSION = 1;

export const gameRef = (g: string) => doc(db, gamePath(g));
export const charactersCol = (g: string) => collection(db, charactersPath(g));
export const characterRef = (g: string, c: string) => doc(db, characterPath(g, c));
export const deleteCharacter = (g: string, c: string) => deleteDoc(characterRef(g, c));
const rollsCol = (g: string) => collection(db, rollsPath(g));

/** Rejects with Error('taken') when the ID is in use. */
export const createGame = (id: string) =>
  runTransaction(db, async (tx) => {
    if ((await tx.get(gameRef(id))).exists()) throw new Error('taken');
    tx.set(gameRef(id), { createdAt: Date.now(), schemaVersion: SCHEMA_VERSION });
  });

export interface Roll {
  characterId: string;
  characterName: string;
  label: string;
  /** The dice, so the table can see how the total came about: "d20 14 + STR 2". */ detail: string;
  total: number;
}
export type RollDoc = Roll & { id: string; createdAt: number };
/** Server time, so devices with wrong clocks still log in order. A long label or breakdown (free dice can be 500 characters) is cut to what the rules allow. */
export const logRoll = (g: string, r: Roll) =>
  addDoc(rollsCol(g), { ...r, label: r.label.slice(0, 120), detail: r.detail.slice(0, 1000), createdAt: serverTimestamp() });

export interface CharacterCard {
  id: string;
  name: string;
  careers: string;
  level: number;
  hp: number;
  hpMax: number;
}
const toCard = (id: string, d: DocumentData): CharacterCard => ({
  id,
  name: d.name ?? '',
  careers: d.careers ?? '',
  level: d.level ?? 1,
  hp: d.hp ?? 0,
  hpMax: d.hpMax ?? 0,
});
const toRoll = (id: string, d: DocumentData) => ({ ...d, id, createdAt: d.createdAt.toMillis() }) as RollDoc;

// Offline, a game this browser never opened is "missing" only because the cache is empty, so wait for the server's word on it.
const subGame: Sub<boolean> = (g, ok, bad) =>
  onSnapshot(
    gameRef(g),
    { includeMetadataChanges: true },
    (s) => {
      if (s.exists() || !s.metadata.fromCache) ok(s.exists());
    },
    bad,
  );
const subCharacters: Sub<CharacterCard[]> = (g, ok, bad) =>
  onSnapshot(query(charactersCol(g), orderBy('createdAt')), (s) => ok(s.docs.map((d) => toCard(d.id, d.data()))), bad);
const subRolls: Sub<RollDoc[]> = (g, ok, bad) =>
  onSnapshot(
    query(rollsCol(g), orderBy('createdAt', 'desc'), limit(50)),
    (s) => ok(s.docs.map((d) => toRoll(d.id, d.data({ serverTimestamps: 'estimate' })))),
    bad,
  );

/** data: whether the game exists. */
export const useGameExists = (g: string) => useSub(g, subGame);
export const useCharacters = (g: string) => useSub(g, subCharacters);
export const useRolls = (g: string) => useSub(g, subRolls);
