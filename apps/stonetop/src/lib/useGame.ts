import { collection, doc, onSnapshot, runTransaction, updateDoc } from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLatest } from './useLatest';
import { db } from '@/lib/firebase';
import { useSaveStatusOptional } from '@/ui/SaveStatus/SaveStatusContext';
import { useToastOptional } from '@/ui/Toast/ToastContext';
import { GAMES_COLLECTION, SAVE_ERROR_MESSAGE } from '@/lib/constants';
import { isBoolean, isNumber, isPlainObject, isRecord } from '@/lib/typeGuards';
import { NOTES_CLIENT_ID, NOTES_STALE_MS } from '@/lib/sharedNotes';
import { parseDiceRolls, parseGameSession, parseSteading, ROLL_LOG_CAP } from '@/lib/gameParsing';
import {
  FIRESTORE_ERROR_MESSAGES,
  friendlyFirestoreError,
  isFirestoreError,
  mergeById,
  GameMovedError,
  UserFacingError,
  patchCharacterData,
  STEADING_ID_ARRAY_FIELDS,
  stripUndefined,
  withCharacters,
} from '@/lib/gameMutations';
import { applyStatDeltas, type SheetGuard } from '@/lib/statDeltas';
import * as v2 from '@/lib/gameV2';
import { assembleGame, type Stored } from '@/lib/gameShape';
import { fitsOneDocument } from '@/lib/gameBackup';
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

export const useGame = (gameId: string): UseGameResult => {
  const [docRaw, setDocRaw] = useState<Record<string, unknown> | null | undefined>(undefined);
  const [characterDocs, setCharacterDocs] = useState<Stored[] | undefined>(undefined);
  const [rollDocs, setRollDocs] = useState<Stored[] | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);

  const gameRef = useMemo(() => doc(db, GAMES_COLLECTION, gameId), [gameId]);
  // A game moved to subcollections (MIGRATION.md) keeps its characters and rolls in their own documents.
  const moved = v2.isMoved(docRaw ?? undefined);
  const movedRef = useLatest(moved);

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
        // A code we have a specific line for (e.g. the 1 MiB doc-size ceiling) gets
        // that actionable message; everything else falls back to SAVE_ERROR_MESSAGE
        // so it still dedupes against the debounce hook's toast on the shared string.
        const message =
          error instanceof UserFacingError
            ? error.message
            : isFirestoreError(error) && FIRESTORE_ERROR_MESSAGES[error.code]
              ? FIRESTORE_ERROR_MESSAGES[error.code]!
              : SAVE_ERROR_MESSAGE;
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
    return onSnapshot(
      gameRef,
      (snapshot) => {
        setDocRaw(snapshot.exists() ? (snapshot.data() as Record<string, unknown>) : null);
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
    try {
      const raw = moved ? assembleGame(docRaw, characterDocs ?? [], rollDocs ?? []) : docRaw;
      return { game: parseGameSession(raw, gameId), loading: false, parseFailed: false };
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

  // A tab can act on a cached copy from before the game was moved; the first write finds out from the server and carries on the new way.
  const either = useCallback(
    async <T>(inOneDocument: () => Promise<T>, inSubcollections: () => Promise<T>): Promise<T> => {
      if (movedRef.current) return inSubcollections();
      try {
        return await inOneDocument();
      } catch (e) {
        if (e instanceof GameMovedError) return inSubcollections();
        throw e;
      }
    },
    [movedRef],
  );

  // Changes one character on the freshly-read data: in the game's array, or on the character's own document once moved.
  const editCharacter = useCallback(
    (characterId: string, transform: (c: Character) => Character) =>
      either(
        () => withCharacters(gameRef, (chars) => chars.map((c) => (c.id === characterId ? transform(c) : c))),
        () => v2.editCharacter(gameId, characterId, transform),
      ),
    [gameId, gameRef, either],
  );

  const addCharacter = useCallback(
    async (character: Character) => {
      // Read-modify-write so a double-tap or post-blip retry can't append the same id twice.
      await reportSave(() =>
        either(
          () => withCharacters(gameRef, (chars) => (chars.some((c) => c.id === character.id) ? chars : [...chars, character])),
          () => v2.addCharacter(gameId, character),
        ),
      );
    },
    [gameId, gameRef, reportSave, either],
  );

  const removeCharacter = useCallback(
    async (characterId: string) => {
      await reportSave(() =>
        either(
          () => withCharacters(gameRef, (chars) => chars.filter((c) => c.id !== characterId)),
          () => v2.removeCharacter(gameId, characterId),
        ),
      );
    },
    [gameId, gameRef, reportSave, either],
  );

  const reorderCharacters = useCallback(
    async (characters: Character[]) => {
      const ids = characters.map((c) => c.id);
      await reportSave(() =>
        either(
          () =>
            withCharacters(gameRef, (current) => {
              const lookup = new Map(current.map((c) => [c.id, c]));
              const reordered = ids.map((id) => lookup.get(id)).filter(Boolean) as Character[];
              // A character concurrently added by another player won't be in the dragging client's stale `ids`: append it, don't drop it.
              const idSet = new Set(ids);
              const added = current.filter((c) => !idSet.has(c.id));
              return [...reordered, ...added];
            }),
          () => v2.reorderCharacters(gameId, ids),
        ),
      );
    },
    [gameId, gameRef, reportSave, either],
  );

  const updateCharacterName = useCallback(
    async (characterId: string, name: string) => {
      await reportSave(() => editCharacter(characterId, (c) => ({ ...c, name })));
    },
    [editCharacter, reportSave],
  );

  const updateCharacterData = useCallback(
    async (characterId: string, data: Partial<CharacterData>) => {
      await reportSave(() => editCharacter(characterId, (c) => patchCharacterData(c, data)));
    },
    [editCharacter, reportSave],
  );

  // Reads each stat off the freshly-read data, not a caller's snapshot, so a rapid check-then-uncheck can't start from a stale number.
  const adjustCharacterStats = useCallback(
    async (characterId: string, deltas: Partial<Record<AdditiveStat, number>>, guard?: SheetGuard) => {
      await reportSave(() => editCharacter(characterId, (c) => ({ ...c, data: applyStatDeltas(c.data ?? {}, deltas, guard) })));
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

  // Append a roll to the shared log. A discrete event — written straight through (not debounced) inside a
  // transaction so a stale snapshot can't drop a concurrent roll, then capped to the most recent
  // ROLL_LOG_CAP. Id-merge keeps another client's just-added roll; the trailing slice trims the oldest.
  const logRoll = useCallback(
    async (roll: LoggedRoll) => {
      await reportSave(() =>
        either(
          () =>
            runTransaction(db, async (tx) => {
              const snap = await tx.get(gameRef);
              if (!snap.exists()) throw new Error('Game not found — it may have been deleted.');
              if (snap.data().schemaVersion === 2) throw new GameMovedError();
              const existing = parseDiceRolls(snap.data().diceRolls) ?? [];
              // mergeById is add/edit-by-id; our roll is always new, so this reduces to "keep everyone's rolls".
              const merged = mergeById(existing, [roll])
                .sort((a, b) => a.createdAt - b.createdAt)
                .slice(-ROLL_LOG_CAP);
              tx.update(gameRef, { diceRolls: stripUndefined(merged) });
            }),
          () => v2.logRoll(gameId, roll),
        ),
      );
    },
    [gameId, gameRef, reportSave, either],
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

  // Replace the whole document with a validated backup payload (see readImportFile).
  // Deliberately a `setDoc` overwrite, not a merge: restoring a backup has to be able to
  // remove things too — a merge would leave characters, NPCs, and improvements added since
  // the backup was taken sitting alongside the restored ones. The only caller confirms
  // through a destructive-action dialog and downloads a safety copy of the live doc first.
  const replaceGameData = useCallback(
    async (game: Record<string, unknown>) => {
      await reportSave(() =>
        either(
          () =>
            runTransaction(db, async (tx) => {
              if ((await tx.get(gameRef)).data()?.schemaVersion === 2) throw new GameMovedError();
              if (!fitsOneDocument(game))
                throw new UserFacingError('That backup is too large for a single game. Trim some content from it and try again.');
              tx.set(gameRef, game);
            }),
          () => v2.replaceGame(gameId, game),
        ),
      );
    },
    [gameId, gameRef, reportSave, either],
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
