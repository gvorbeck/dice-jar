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
