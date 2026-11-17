import * as fs from 'fs';
import { EXPORT_FORMAT, EXPORT_VERSION } from '../src/lib/gameBackupFormat.ts';

/**
 * Two file shapes reach the restore script: `npm run backup` writes `{ gameId: document }` for the whole collection,
 * and the in-app Export writes a one-game envelope. Returns the first shape for either; throws a message the operator can act on.
 */
export const gamesFromBackup = (parsed: Record<string, unknown>): Record<string, unknown> => {
  if (parsed.format !== EXPORT_FORMAT) return parsed;
  const { version, gameId, game } = parsed;
  if (typeof version !== 'number') throw new Error('Export file is missing its version number — refusing to restore it.');
  if (version > EXPORT_VERSION) {
    throw new Error(
      `Export file is format v${version}, but this script only understands up to v${EXPORT_VERSION}. Update the repo and try again.`,
    );
  }
  if (typeof gameId !== 'string' || !gameId) throw new Error('Export file has no gameId — refusing to guess which document to overwrite.');
  if (typeof game !== 'object' || game === null || Array.isArray(game)) throw new Error('Export file has no game data in it.');
  return { [gameId]: game };
};

/** A game moved to subcollections (MIGRATION.md): overwriting its document would leave its characters and rolls behind. */
export const isMoved = (doc: Record<string, unknown> | undefined) => doc?.schemaVersion === 2;

/** The ids a previous, interrupted run already restored. An unreadable checkpoint counts as none: restoring twice is harmless, skipping a game is not. */
export const readCheckpoint = (text: string | null): Set<string> => {
  if (text === null) return new Set();
  try {
    const ids: unknown = JSON.parse(text);
    return Array.isArray(ids) ? new Set(ids.filter((id): id is string => typeof id === 'string')) : new Set();
  } catch {
    return new Set();
  }
};

/** The ids left to restore, in backup order. */
export const pendingIds = (ids: string[], done: Set<string>) => ids.filter((id) => !done.has(id));

/** The ids among `live` (id to stored document) that have moved to subcollections. */
export const movedIds = (live: Record<string, Record<string, unknown> | undefined>) => Object.keys(live).filter((id) => isMoved(live[id]));

export const loadCheckpoint = (file: string) => readCheckpoint(fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null);

export const saveCheckpoint = (file: string, done: Set<string>) => fs.writeFileSync(file, JSON.stringify([...done], null, 2));

export const clearCheckpoint = (file: string) => fs.rmSync(file, { force: true });
