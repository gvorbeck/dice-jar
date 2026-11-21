import { FieldPath, deleteField, getDoc, setDoc, updateDoc, type DocumentReference } from 'firebase/firestore';
import { REMOVED, diffPaths } from '@dice-jar/diff';

/**
 * What this tab last read or wrote, per document. A save sends only the fields that differ from it, so another device
 * changing other fields isn't overwritten (the same field still goes to whoever writes last). It moves forward when a write
 * is sent, so a value put back before the server answers is still sent; a rejected write moves it back.
 */
const known = new Map<string, unknown>();

/** Records what the server holds for `key` (call it with each snapshot). */
export const remember = (key: string, value: unknown) => void known.set(key, value);

/** Forgets a document that no longer exists. */
export const forget = (key: string) => void known.delete(key);

/**
 * Writes `next` to `ref`: only the changed fields when this tab has read the document, otherwise the whole thing.
 * `existing` is for a caller that names a document that may already exist: it is read first so its fields can be diffed (against the stored form, not any cleaned-up copy a watcher keeps), never overwritten whole.
 * shortcut: a new document goes whole, so two devices creating the same id at once overwrite each other; new ids are fresh, so that doesn't happen today.
 */
export async function saveDiff(ref: DocumentReference, key: string, next: Record<string, unknown>, existing = false): Promise<void> {
  let before = known.get(key);
  if (before === undefined && existing) {
    const snapshot = await getDoc(ref);
    if (snapshot.exists()) before = snapshot.data();
  }
  known.set(key, next);
  try {
    if (before === undefined) {
      await setDoc(ref, next);
      return;
    }
    const leaves = diffPaths(before, next);
    if (!leaves.length) return;
    const [first, ...rest] = leaves.flatMap(([path, value]) => [new FieldPath(...path), value === REMOVED ? deleteField() : value]);
    await updateDoc(ref, first as FieldPath, rest[0], ...rest.slice(1));
  } catch (error) {
    if (known.get(key) === next) {
      if (before === undefined) known.delete(key);
      else known.set(key, before);
    }
    throw error;
  }
}
