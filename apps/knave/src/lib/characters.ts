import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { diffPaths } from '@dice-jar/diff';
import { updatePairs } from '@dice-jar/firebase';
import { newCharacter, parseCharacter, summary, type Character } from '@/model/character';
import { characterRef, charactersCol } from './games';

// Kept apart from games.ts so the game page only loads the sheet model when a character is created or opened.

// shortcut: the write is not awaited (the promise only settles once the server acknowledges it, which never happens offline). The character
// page reads it back from the local cache; a write the rules reject shows up there as "no such character". Add a toast if that proves confusing.
export const createCharacter = (g: string, c: Character = newCharacter()) => {
  const ref = doc(charactersCol(g));
  const now = Date.now();
  setDoc(ref, { ...summary(c), character: c, createdAt: now, updatedAt: now }).catch(console.error);
  return ref.id;
};

/**
 * What this tab last read or wrote, per character. Saves send only the leaves that differ from it, so a second
 * device changing other fields isn't overwritten (the same field still goes to whoever writes last). It moves
 * forward when a write is sent, so a value put back before the server answers is still sent; a rejected write
 * moves it back, so its changes go out again with the next diff.
 * shortcut: an open sheet doesn't show what another device saved until it is reloaded; add a snapshot listener that merges remote changes into the open sheet (see mergeRemote in @dice-jar/diff) when a table plays one character from two devices.
 */
const known = new Map<string, Character | undefined>();
// Which send `known` stands for (0 = what was loaded), so overlapping rejections only ever move it back to an older base.
const sends = new Map<string, { n: number; at: number }>();
const slot = (g: string, id: string) => `${g}/${id}`;

export function saveCharacter(g: string, id: string, c: Character) {
  const k = slot(g, id);
  const before = known.get(k);
  const leaves = diffPaths(before, c);
  const s = sends.get(k) ?? { n: 0, at: 0 };
  sends.set(k, s);
  const baseAt = s.at;
  s.at = ++s.n;
  known.set(k, c);
  const pairs = [
    ...(leaves.length ? updatePairs(leaves, ['character']) : []),
    ...Object.entries({ ...summary(c), updatedAt: Date.now() }).flat(),
  ];
  return updateDoc(characterRef(g, id), ...(pairs as [string, unknown, ...unknown[]])).catch((e) => {
    // A newer write may already have moved `known` on; this one's changes must go out again either way, so go back to its base unless an older rejection already went further back.
    if (sends.get(k) === s && baseAt < s.at) {
      known.set(k, before);
      s.at = baseAt;
    }
    throw e;
  });
}

/** The stored character doesn't match the sheet's shape, so reloading won't help. */
export class DamagedCharacter extends Error {}

/** One read, not a subscription: the open page is the source of truth while editing, so a snapshot echo can't clobber typing. */
export const loadCharacter = async (g: string, id: string): Promise<Character | null> => {
  const snap = await getDoc(characterRef(g, id));
  if (!snap.exists()) return null;
  let c: Character;
  try {
    c = parseCharacter(snap.data().character);
  } catch {
    throw new DamagedCharacter();
  }
  sends.delete(slot(g, id));
  known.set(slot(g, id), c);
  return c;
};
