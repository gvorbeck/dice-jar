// Character service for Firebase Firestore operations
import { collection, doc, getDoc, onSnapshot, setDoc, deleteDoc, type DocumentReference } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FIREBASE_COLLECTIONS } from '@/constants';
import type { Character } from '@/types';
import { processCharacterData, isLegacyCharacter, CURRENT_VERSION } from './characterMigration';
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
  xp?: number;
  hasTurnUndead?: boolean;
}

const charactersRef = (userId: string) => collection(db, FIREBASE_COLLECTIONS.USERS, userId, FIREBASE_COLLECTIONS.CHARACTERS);
const characterRef = (userId: string, characterId: string) => doc(charactersRef(userId), characterId);
const slot = (userId: string, characterId: string) => `characters/${userId}/${characterId}`;

/** Saves a character that was stored in an older shape back in the current one. */
const persistMigration = (ref: DocumentReference, migrated: Character) =>
  setDoc(ref, migrated).catch((error) => console.error(`Failed to persist migration for character ${ref.id}:`, error));

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
          if (!isLegacyCharacter(data)) return toListItem(d.id, data);
          const migrated = processCharacterData(data);
          void persistMigration(d.ref, migrated);
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
      if (isLegacyCharacter(data)) void persistMigration(snapshot.ref, character);
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
    const dataToSave = { ...character, settings: { ...character.settings, version: CURRENT_VERSION } };
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
