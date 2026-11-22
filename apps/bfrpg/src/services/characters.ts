// Character service for Firebase Firestore operations
import { collection, doc, getDoc, onSnapshot, deleteDoc, type DocumentReference } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { FIREBASE_COLLECTIONS } from '@/constants';
import type { Character } from '@/types';
import { characterSchema, problemWith, SCHEMA_VERSION } from './documentSchemas';
import { processCharacterData, needsMigration, OLD_BUILD_VERSION } from './characterMigration';
import { handleServiceError } from '@/utils';
import { forget, remember, saveDiff } from './diffSave';

// Simple interface for listing characters - we don't need the full Character type
export interface CharacterListItem {
  id: string;
  name: string;
  race?: string;
  class?: string;
  level?: number;
  hp?: { current?: number; max?: number } | number;
  avatar?: string;
  equipment?: Character['equipment'];
  abilities?: Character['abilities'];
  xp?: number;
  hasTurnUndead?: boolean;
}

const charactersRef = (userId: string) => collection(db, FIREBASE_COLLECTIONS.USERS, userId, FIREBASE_COLLECTIONS.CHARACTERS);
const characterRef = (userId: string, characterId: string) => doc(charactersRef(userId), characterId);
const slot = (userId: string, characterId: string) => `characters/${userId}/${characterId}`;

/** Saves a character stored in an older shape back in the current one: only the owner may write, and only the changed fields go. */
const persistMigration = (userId: string, ref: DocumentReference, stored: Record<string, unknown>, migrated: Character) => {
  if (auth.currentUser?.uid !== userId) return;
  remember(slot(userId, ref.id), stored);
  saveDiff(ref, slot(userId, ref.id), migrated as unknown as Record<string, unknown>).catch((error) =>
    console.error(`Failed to persist migration for character ${ref.id}:`, error),
  );
};

const toListItem = (id: string, data: Record<string, unknown>): CharacterListItem => {
  const item: CharacterListItem = { id, name: (data['name'] as string) || 'Unnamed Character' };
  if (data['race']) item.race = data['race'] as string;
  if (data['class']) item.class = data['class'] as string;
  if (data['level']) item.level = data['level'] as number;
  if (data['hp']) item.hp = data['hp'] as { current?: number; max?: number } | number;
  if (data['xp']) item.xp = data['xp'] as number;
  return item;
};

/** Live list of a user's characters. */
export const watchUserCharacters = (userId: string, ok: (characters: CharacterListItem[]) => void, bad: (e: Error) => void) =>
  onSnapshot(
    charactersRef(userId),
    (snapshot) => {
      ok(
        snapshot.docs.map((d) => {
          const data = d.data();
          if (!needsMigration(data)) return toListItem(d.id, data);
          const migrated = processCharacterData(data);
          persistMigration(userId, d.ref, data, migrated);
          return toListItem(d.id, migrated as unknown as Record<string, unknown>);
        }),
      );
    },
    bad,
  );

/** Live view of one character; null when it doesn't exist. */
export const watchCharacter = (userId: string, characterId: string, ok: (character: Character | null) => void, bad: (e: Error) => void) =>
  onSnapshot(
    characterRef(userId, characterId),
    (snapshot) => {
      if (!snapshot.exists()) {
        forget(slot(userId, characterId));
        ok(null);
        return;
      }
      const data = snapshot.data();
      const character = processCharacterData(data);
      if (needsMigration(data)) persistMigration(userId, snapshot.ref, data, character);
      const problem = problemWith(characterSchema, character);
      if (problem) console.warn(`Character ${characterId} doesn't match its schema, ${problem}`);
      remember(slot(userId, characterId), character);
      ok(character);
    },
    bad,
  );

/** One look at a character, for places that don't need it live. */
export const getCharacterById = async (userId: string, characterId: string): Promise<Character | null> => {
  try {
    const snapshot = await getDoc(characterRef(userId, characterId));
    return snapshot.exists() ? processCharacterData(snapshot.data()) : null;
  } catch (error) {
    handleServiceError(error, { action: 'fetching character', context: { userId, characterId } });
  }
};

/** Saves a character: only the changed fields when it was read in this tab; a new one gets a fresh id. */
export const saveCharacter = async (userId: string, character: Character, characterId?: string): Promise<string> => {
  try {
    // A new document (an import too) is created now; an existing one keeps its createdAt, or gets it from the migration script.
    const dataToSave = {
      ...character,
      schemaVersion: SCHEMA_VERSION,
      settings: { ...character.settings, version: OLD_BUILD_VERSION },
      ...(characterId ? {} : { createdAt: Date.now() }),
    };
    const ref = characterId ? characterRef(userId, characterId) : doc(charactersRef(userId));
    await saveDiff(ref, slot(userId, ref.id), dataToSave as unknown as Record<string, unknown>, Boolean(characterId));
    return ref.id;
  } catch (error) {
    handleServiceError(error, { action: 'saving character', context: { userId, characterId, characterName: character.name } });
  }
};

/** Delete a character from Firebase */
export const deleteCharacter = async (userId: string, characterId: string): Promise<void> => {
  try {
    await deleteDoc(characterRef(userId, characterId));
    forget(slot(userId, characterId));
  } catch (error) {
    handleServiceError(error, { action: 'deleting character', context: { userId, characterId } });
  }
};
