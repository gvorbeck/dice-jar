import { store } from '@dice-jar/browser';
import { STORAGE_KEYS } from '@/constants';

/** The JSON stored under `key` over `fallback`'s fields; `fallback` when nothing is stored or it can't be read. */
export function readStored<T extends object>(key: string, fallback: T): T {
  try {
    return { ...fallback, ...JSON.parse(store.get(key) ?? '{}') };
  } catch {
    return fallback;
  }
}

const readOld = (key: string) => {
  try {
    return JSON.parse(store.get(key) ?? 'null')?.state;
  } catch {
    return undefined;
  }
};

const setIfMissing = (key: string, value: string) => {
  if (store.get(key) === null) store.set(key, value);
};

/** Moves what the app's earlier stores ('character-creation-store', 'combat-store', 'ui-store') kept into today's keys, once, so a draft or combat in progress survives the release. */
// shortcut: runs on every load and costs three reads, delete once old visitors have had months to load a new build.
export function migrateOldStores(): void {
  const draft = readOld('character-creation-store');
  if (draft?.draftCharacter) {
    const { includeSupplementalRace, includeSupplementalClass, useCombinationClass } = draft.preferences ?? {};
    setIfMissing(
      STORAGE_KEYS.CHARACTER_DRAFT,
      JSON.stringify({
        character: draft.draftCharacter,
        step: draft.currentStep ?? 0,
        includeSupplementalRace: !!includeSupplementalRace,
        includeSupplementalClass: !!includeSupplementalClass,
        useCombinationClass: !!useCombinationClass,
      }),
    );
  }
  for (const [gameId, saved] of Object.entries(readOld('combat-store')?.games ?? {}))
    setIfMissing(`combat:${gameId}`, JSON.stringify(saved));
  for (const [key, collapsed] of Object.entries(readOld('ui-store')?.collapsedSections ?? {}))
    setIfMissing(`section-collapsed:${key}`, collapsed ? '1' : '0');
  for (const key of ['character-creation-store', 'combat-store', 'ui-store']) store.remove(key);
}
