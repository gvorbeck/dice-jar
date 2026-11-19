import { collection, doc, onSnapshot, runTransaction, updateDoc } from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLatest } from './useLatest';
import { db } from '@/lib/firebase';
import { useSaveStatusOptional } from '@/ui/SaveStatus/SaveStatusContext';
import { useToastOptional } from '@/ui/Toast/ToastContext';
import { GAMES_COLLECTION, SAVE_ERROR_MESSAGE } from '@/lib/constants';
import { isBoolean, isNumber, isPlainObject, isRecord } from '@/lib/typeGuards';
import { NOTES_CLIENT_ID, NOTES_STALE_MS } from '@/lib/sharedNotes';
import { parseGameSession, parseSteading } from '@/lib/gameParsing';
import {
  FIRESTORE_ERROR_MESSAGES,
  friendlyFirestoreError,
  isFirestoreError,
  mergeById,
  UserFacingError,
  patchCharacterData,
  STEADING_ID_ARRAY_FIELDS,
  stripUndefined,
} from '@/lib/gameMutations';
import { applyStatDeltas, type SheetGuard } from '@/lib/statDeltas';
import * as v2 from '@/lib/gameV2';
import { assembleGame, type Stored } from '@/lib/gameShape';
import type { AdditiveStat, Character, CharacterData, ContentLists, GameSession, LoggedRoll, SteadingData } from '@/model';

// Re-exported from their new home in lib/gameParsing so existing consumers and tests
// that import them from this hook keep working.
export { parseCharacterData, parseCharacters, parseContent, parseSteading } from '@/lib/gameParsing';

export interface UseGameResult {
  game: GameSession | null;
  loading: boolean;
  error: string | null;
  updateGameName: (name: string) => Promise<void>;
  updateCharacterName: (characterId: string, name: string) => Promise<void>;
  updateCharacterData: (characterId: string, data: Partial<CharacterData>) => Promise<void>;
  adjustCharacterStats: (characterId: string, deltas: Partial<Record<AdditiveStat, number>>, guard?: SheetGuard) => Promise<void>;
  updateContent: (field: keyof ContentLists, value: string) => Promise<void>;
  updateField: (field: keyof Pick<GameSession, 'threats' | 'iWonder'>, value: string) => Promise<void>;
  updateSteading: (patch: Partial<SteadingData>) => Promise<void>;
  addCharacter: (character: Character) => Promise<void>;
  removeCharacter: (characterId: string) => Promise<void>;
  reorderCharacters: (characters: Character[]) => Promise<void>;
  logRoll: (roll: LoggedRoll) => Promise<void>;
  updateNotes: (key: string, html: string) => Promise<void>;
  claimNotesLock: (key: string) => Promise<boolean>;
  refreshNotesLock: (key: string) => Promise<void>;
  releaseNotesLock: (key: string, html: string) => Promise<void>;
  replaceGameData: (game: Record<string, unknown>) => Promise<void>;
}

// A game saved without a name fails firestore.rules on every write but a rename: give it the empty name the parser already shows.
// A transaction, so a copy from the offline cache cannot overwrite a name another device has set since; a failure retries on the next open.
const nameMissingGame = (gameRef: ReturnType<typeof doc>) =>
  runTransaction(db, async (tx) => {
    const snap = await tx.get(gameRef);
    if (snap.exists() && typeof snap.data().name !== 'string') tx.update(gameRef, { name: '' });
  }).catch(() => {});

// The line a failed save shows: the one a player can act on if there is one, else the generic one. The debounce hook's toast uses the same strings, so the Toast dedupe collapses the two.
const saveErrorMessage = (error: unknown): string =>
  error instanceof UserFacingError
    ? error.message
    : isFirestoreError(error) && FIRESTORE_ERROR_MESSAGES[error.code]
      ? FIRESTORE_ERROR_MESSAGES[error.code]!
      : SAVE_ERROR_MESSAGE;

export const useGame = (gameId: string): UseGameResult => {
  const [docRaw, setDocRaw] = useState<Record<string, unknown> | null | undefined>(undefined);
  const [characterDocs, setCharacterDocs] = useState<Stored[] | undefined>(undefined);
  const [rollDocs, setRollDocs] = useState<Stored[] | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);

  const gameRef = useMemo(() => doc(db, GAMES_COLLECTION, gameId), [gameId]);
  // A game keeps its characters and rolls in their own documents (MIGRATION.md).
  const moved = v2.isMoved(docRaw ?? undefined);

  // Report every persisted write to the app-wide save-status indicator and the
  // error Toast. Held in refs so wrapping a mutation doesn't add the (per-render)
  // context objects to its dependency array — the callbacks stay stable.
  const saveStatus = useSaveStatusOptional();
  const saveStatusRef = useLatest(saveStatus);
  const addToast = useToastOptional()?.addToast;
  const addToastRef = useLatest(addToast);

  // Wraps a write so the indicator shows "Saving…" while it runs and "Saved"
  // once it settles. On failure it surfaces SAVE_ERROR_MESSAGE — every save path
  // funnels through here, so direct callers (radios, checkboxes) fail loud just
  // like debounced fields — then re-throws so callers' own .catch and the
  // debounce hook's retry still run. The shared constant keeps this and the
  // debounce hook on one string, so the Toast dedupe collapses them to one.
  const reportSave = useCallback(
    async (write: () => Promise<void>): Promise<void> => {
      saveStatusRef.current?.reportSaveStart();
      let succeeded = false;
      try {
        await write();
        succeeded = true;
      } catch (error) {
        const message = saveErrorMessage(error);
        addToastRef.current?.(message, 'error');
        throw error;
      } finally {
        saveStatusRef.current?.reportSaveSettled(succeeded);
      }
    },
    [addToastRef, saveStatusRef],
  );

  useEffect(() => {
    // Back to the loading state before (re)subscribing, so a previous game's data never shows for the new one.
    setDocRaw(undefined);
    setCharacterDocs(undefined);
    setRollDocs(undefined);
    setLoadError(null);
    let nameTried = false;
    return onSnapshot(
      gameRef,
      (snapshot) => {
        const data = snapshot.exists() ? (snapshot.data() as Record<string, unknown>) : null;
        if (data?.schemaVersion === 2 && typeof data.name !== 'string' && !nameTried) {
          nameTried = true; // once per open: a write the rules refuse is not retried on every snapshot
          nameMissingGame(gameRef);
        }
        setDocRaw(data);
        setLoadError(null);
      },
      (err) => setLoadError(friendlyFirestoreError(err)),
    );
  }, [gameRef]);

  useEffect(() => {
    if (!moved) return;
    const stored = (snap: { docs: { id: string; data: () => unknown }[] }) =>
      snap.docs.map((d) => ({ id: d.id, data: d.data() as Record<string, unknown> }));
    const fail = (err: Parameters<typeof friendlyFirestoreError>[0]) => setLoadError(friendlyFirestoreError(err));
    const stopCharacters = onSnapshot(
      collection(db, GAMES_COLLECTION, gameId, 'characters'),
      (snap) => setCharacterDocs(stored(snap)),
      fail,
    );
    const stopRolls = onSnapshot(collection(db, GAMES_COLLECTION, gameId, 'rolls'), (snap) => setRollDocs(stored(snap)), fail);
    return () => {
      stopCharacters();
      stopRolls();
    };
  }, [gameId, moved]);

  // shortcut: when a game is moved while open, the page shows loading until both subcollections have arrived; upgrade by keeping the last game on screen.
  const { game, loading, parseFailed } = useMemo(() => {
    const waiting = docRaw === undefined || (moved && (characterDocs === undefined || rollDocs === undefined));
    if (waiting || !docRaw) return { game: null, loading: waiting && !loadError, parseFailed: false };
    // Every game was moved to subcollections (MIGRATION.md); a document still in the old shape is not read, so its characters are never shown as missing.
    if (!moved) return { game: null, loading: false, parseFailed: true };
    try {
      return {
        game: parseGameSession(assembleGame(docRaw, characterDocs ?? [], rollDocs ?? []), gameId),
        loading: false,
        parseFailed: false,
      };
    } catch {
      return { game: null, loading: false, parseFailed: true };
    }
  }, [docRaw, characterDocs, rollDocs, moved, gameId, loadError]);
  // A parse failure means the stored document is malformed: say so in words a player can use.
  const error = loadError ?? (parseFailed ? "This game's data couldn't be read. Please try again or contact your GM." : null);

  const updateGameName = useCallback(
    async (name: string) => {
      await reportSave(() => updateDoc(gameRef, { name }));
    },
    [gameRef, reportSave],
  );

  const updateContent = useCallback(
    async (field: keyof ContentLists, value: string) => {
      await reportSave(() => updateDoc(gameRef, { [`content.${field}`]: value }));
    },
    [gameRef, reportSave],
  );

  const updateField = useCallback(
    async (field: keyof Pick<GameSession, 'threats' | 'iWonder'>, value: string) => {
      await reportSave(() => updateDoc(gameRef, { [field]: value }));
    },
    [gameRef, reportSave],
  );

  // Changes one character on this tab's local copy, writing only the fields that changed. The save is reported done once it is queued
  // (shortcut: "Saved" then means queued on this device, so offline it is not on the server yet, upgrade: show a separate offline state);
  // a write the server refuses later takes the "Saved" back and shows the error.
  const editCharacter = useCallback(
    (characterId: string, transform: (c: Character) => Character, confirmed = false) =>
      v2.editCharacter(
        gameId,
        characterId,
        transform,
        (error) => {
          saveStatusRef.current?.reportSaveRefused();
          addToastRef.current?.(saveErrorMessage(error), 'error');
        },
        confirmed,
      ),
    [gameId, addToastRef, saveStatusRef],
  );

  const addCharacter = useCallback(
    async (character: Character) => {
      await reportSave(() => v2.addCharacter(gameId, character));
    },
    [gameId, reportSave],
  );

  const removeCharacter = useCallback(
    async (characterId: string) => {
      await reportSave(() => v2.removeCharacter(gameId, characterId));
    },
    [gameId, reportSave],
  );

  const reorderCharacters = useCallback(
    async (characters: Character[]) => {
      const ids = characters.map((c) => c.id);
      await reportSave(() => v2.reorderCharacters(gameId, ids));
    },
    [gameId, reportSave],
  );

  const updateCharacterName = useCallback(
    async (characterId: string, name: string) => {
      await reportSave(() => editCharacter(characterId, (c) => ({ ...c, name })));
    },
    [editCharacter, reportSave],
  );

  const updateCharacterData = useCallback(
    async (characterId: string, data: Partial<CharacterData>) => {
      // Arcana lists id-merge, so they must merge into the server's copy, not a stale cached one.
      const confirmed = !!(data.arcanaMinor || data.arcanaMajor);
      await reportSave(() => editCharacter(characterId, (c) => patchCharacterData(c, data), confirmed));
    },
    [editCharacter, reportSave],
  );

  // Reads each stat off this tab's local copy (which holds its own unconfirmed writes), not a caller's snapshot, so a rapid check-then-uncheck can't start from a stale number.
  const adjustCharacterStats = useCallback(
    async (characterId: string, deltas: Partial<Record<AdditiveStat, number>>, guard?: SheetGuard) => {
      // A guarded change is a payment (Burn Brightly): the caller's bonus must wait for the server to accept it.
      await reportSave(() => editCharacter(characterId, (c) => ({ ...c, data: applyStatDeltas(c.data ?? {}, deltas, guard) }), !!guard));
    },
    [editCharacter, reportSave],
  );

  const updateSteading = useCallback(
    async (patch: Partial<SteadingData>) => {
      await reportSave(() =>
        runTransaction(db, async (tx) => {
          const snap = await tx.get(gameRef);
          if (!snap.exists()) throw new Error('Game not found — it may have been deleted.');
          const existing = parseSteading(snap.data().steading) ?? {};

          const idArrayFields: Record<string, keyof SteadingData> = STEADING_ID_ARRAY_FIELDS;
          // The write-only sentinel keys (paired to an id-array field above) are consumed via
          // patch[idArrayFields[k]] below and never written under their own name — unlike
          // removedFixedItems, which has no paired incoming array and is a real persisted field.
          const sentinelKeys = new Set(Object.values(idArrayFields));

          const dotted: Record<string, unknown> = {};
          for (const [k, v] of Object.entries(patch)) {
            if (k === 'improvements' && isRecord(v)) {
              // Only write entries whose value is actually boolean — the patch is
              // cast at the Firestore boundary, so guard against a non-boolean slipping
              // into the dotted write.
              for (const [ik, iv] of Object.entries(v)) {
                if (isBoolean(iv)) dotted[`steading.improvements.${ik}`] = iv;
              }
            } else if (k in idArrayFields && Array.isArray(v)) {
              // Id-merge instead of overwriting the whole array, so a concurrent edit to a
              // different entry (e.g. another NPC) survives rather than being reverted by a
              // stale snapshot. Removal uses the explicit removedXIds sentinel.
              const removedIds = patch[idArrayFields[k]!] as string[] | undefined;
              const merged = mergeById(
                existing[k as keyof SteadingData] as { id: string }[] | undefined,
                v as { id: string }[],
                removedIds,
              );
              dotted[`steading.${k}`] = stripUndefined(merged);
            } else if (k === 'removedFixedItems' && Array.isArray(v)) {
              // Union against the freshly-read doc rather than overwrite: the Resources,
              // Fortifications, and Assets sections each hold their own optimistic copy of this
              // one shared field, so a stale copy's write must not drop another section's
              // concurrent removal (or another client's).
              const merged = new Set([...(existing.removedFixedItems ?? []), ...(v as string[])]);
              dotted[`steading.${k}`] = [...merged];
            } else if (!(k in idArrayFields) && !sentinelKeys.has(k as keyof SteadingData)) {
              dotted[`steading.${k}`] = Array.isArray(v) || isPlainObject(v) ? stripUndefined(v) : v;
            }
          }
          tx.update(gameRef, dotted);
        }),
      );
    },
    [gameRef, reportSave],
  );

  // Append a roll to the shared log: a discrete event, written straight through (not debounced), then the log is trimmed to the newest ROLL_LOG_CAP.
  const logRoll = useCallback(
    async (roll: LoggedRoll) => {
      await reportSave(() => v2.logRoll(gameId, roll));
    },
    [gameId, reportSave],
  );

  // Shared notes: a plain save (on blur) plus a typing lock so only one tab edits a given notes key at
  // a time. Every write keys on `notes.<key>` / `notesLocks.<key>`, so notes for different pages never
  // touch each other. Keys are 'gm', 'steading', or a character id (a UUID) — no dots.
  const updateNotes = useCallback(
    async (key: string, html: string) => {
      await reportSave(() => updateDoc(gameRef, { [`notes.${key}`]: html }));
    },
    [gameRef, reportSave],
  );

  // Resolves true if this tab now holds the lock. Transactional so two tabs whose first keystrokes
  // cross can't both win. The staleness check compares the holder's clock to ours — a skew of a few
  // seconds only shortens or lengthens the abandoned-lock window, it can't break a live lock.
  const claimNotesLock = useCallback(
    async (key: string): Promise<boolean> => {
      let claimed = false;
      await reportSave(() =>
        runTransaction(db, async (tx) => {
          // Reset per attempt — Firestore re-runs the updater when a concurrent write lands.
          claimed = false;
          const snap = await tx.get(gameRef);
          if (!snap.exists()) throw new Error('Game not found — it may have been deleted.');
          const locks = snap.data().notesLocks;
          const lock = isPlainObject(locks) ? locks[key] : undefined;
          const heldByOther =
            isPlainObject(lock) && lock.clientId !== NOTES_CLIENT_ID && isNumber(lock.at) && Date.now() - lock.at < NOTES_STALE_MS;
          if (heldByOther) return;
          tx.update(gameRef, { [`notesLocks.${key}`]: { clientId: NOTES_CLIENT_ID, at: Date.now() } });
          claimed = true;
        }),
      );
      return claimed;
    },
    [gameRef, reportSave],
  );

  // Heartbeat while typing. Deliberately not routed through reportSave: it fires every few seconds and
  // isn't a user-visible save, and a missed beat is harmless (the release write clears the lock anyway).
  const refreshNotesLock = useCallback(
    async (key: string) => {
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(gameRef);
        if (!snap.exists()) return;
        const locks = snap.data().notesLocks;
        const lock = isPlainObject(locks) ? locks[key] : undefined;
        // Only re-stamp our own lock — never extend (or recreate) one another tab has since taken.
        if (!isPlainObject(lock) || lock.clientId !== NOTES_CLIENT_ID) return;
        tx.update(gameRef, { [`notesLocks.${key}.at`]: Date.now() });
      });
    },
    [gameRef],
  );

  // Save the final content and drop the lock in one write, so other tabs see the new text arrive in
  // the same snapshot that re-enables their editor. The content is written even if another tab has
  // since taken over an abandoned lock, so this tab's edit is never silently dropped.
  const releaseNotesLock = useCallback(
    async (key: string, html: string) => {
      await reportSave(() =>
        runTransaction(db, async (tx) => {
          const snap = await tx.get(gameRef);
          if (!snap.exists()) throw new Error('Game not found — it may have been deleted.');
          const locks = snap.data().notesLocks;
          const lock = isPlainObject(locks) ? locks[key] : undefined;
          const ours = isPlainObject(lock) && lock.clientId === NOTES_CLIENT_ID;
          tx.update(gameRef, {
            [`notes.${key}`]: html,
            ...(ours ? { [`notesLocks.${key}`]: null } : {}),
          });
        }),
      );
    },
    [gameRef, reportSave],
  );

  // Replace the whole game with a validated backup payload (see readImportFile). Deliberately an overwrite, not a merge:
  // restoring a backup has to be able to remove things too. The only caller confirms through a destructive-action dialog
  // and downloads a safety copy of the live game first.
  const replaceGameData = useCallback(
    async (game: Record<string, unknown>) => {
      await reportSave(() => v2.replaceGame(gameId, game));
    },
    [gameId, reportSave],
  );

  return {
    game,
    loading,
    error,
    updateGameName,
    updateCharacterName,
    updateCharacterData,
    adjustCharacterStats,
    updateContent,
    updateField,
    updateSteading,
    addCharacter,
    removeCharacter,
    reorderCharacters,
    logRoll,
    updateNotes,
    claimNotesLock,
    refreshNotesLock,
    releaseNotesLock,
    replaceGameData,
  };
};
