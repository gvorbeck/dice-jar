# Moving a game to subcollections

Status: done (November 2026). Every game is on subcollections, new games are created that way, and the rules allow nothing else. What is left is housekeeping, listed at the end. This file is the record of how it was done and how to run the scripts again.

## Why

One `games/{id}` document holds the whole campaign: every character, the steading, the roll log and the notes. That costs us three things:

- **One 1 MiB ceiling** for everything. A party of nine with arcana and notes can approach it.
- **Every character save rewrites all characters.** Two players saving at once contend on one document, so `withCharacters` runs a transaction and `mergeById` / `changedById` exist to avoid overwriting each other.
- **Saves cannot be diffs** the way delta-green's are (a leaf path of one small document).

## Target shape

```
games/{id}                    name, createdAt, schemaVersion: 2, content, threats, iWonder, steading, notes, notesLocks
                              characters: []   (kept empty; v1 builds' rules and parsers require the list)
games/{id}/characters/{cid}   the character exactly as it was in the array, plus `order` (its index)
games/{id}/rolls/{rid}        the roll exactly as it was in `diceRolls`, plus `order`
```

The steading, notes and locks stay in the game document: they are small and already written with dotted paths.

`src/lib/gameShape.ts` is the conversion, both ways (`splitGame`, `joinGame`). It is pure, lossless (unknown fields travel along) and **refuses** a game it cannot carry over exactly: a character or roll without a usable id, a repeated id, an id Firestore cannot use as a document name, or a game that is already v2. It never drops or repairs data. A refused game stays as it is and is reported.

## The rule that makes it safe

A game is moved in **one transaction**: write the subdocuments, set `schemaVersion: 2` and empty `characters`. Either the whole game moves or none of it does. From then on the rules refuse a write that puts characters or `diceRolls` back into the document, so a tab still running an old build gets an error instead of silently saving into a place nothing reads.

Every step before the first live write is local: the emulator, test fixtures and a read-only backup file.

## Steps

1. **Conversion and the plan** (done). `gameShape.ts` with tests, including the refusals. No app behaviour changes.
2. **Prove it on real data, offline** (done). `npm run audit-backup` reads a backup JSON and writes nothing. On the live data, 10 games from May 2026 were refused: no name and only character fragments. They were deleted, and a fresh backup audits clean: every game splits and rejoins exactly. Re-run it on a new backup before step 4.
3. **Rules, then the dual-reading app.**
   - **Release A, rules only.** `firestore.rules` accepts the subcollections and `schemaVersion`. Browsers cannot create, change or restore a game into version 2, and a version 2 game refuses characters or rolls written back as arrays. The app is unchanged, so players see nothing.
   - **Release B, the app (deployed).** It reads both shapes and writes by the game's `schemaVersion`; new games are still v1. A tab holding a cached copy from before a game was moved finds out on its first write and carries on the new way, so the move can happen while people are playing. Tests run the same saves on a v1 and a v2 copy of one game and require identical results, and the emulator e2e moves a real game and plays on it. Merge it to `dev` only once Release A's deploy has finished.
4. **Migrate** (done: 1,481 games moved, read back and compared). Run order, all from `apps/stonetop`:
   1. **Rehearse on a copy.** `BACKUP=./firestore-backup-<timestamp>.json npm run rehearse-migration` loads the backup into the emulator only, moves every game, checks each reads back exactly as in the backup, puts every game back and checks again. It refuses to run unless the emulator is in use. Last run, on the cleaned backup of 1,476 games: all moved, all identical, all put back identical.
   2. **Back up, then audit.** `npm run backup`, then `npm run audit-backup -- <file>` must say 0 refused. Moved games are backed up as the one document they were, so every backup has the same shape.
   3. **Dry run.** `npm run migrate-games -- --backup <file>` reports what would move and writes nothing.
   4. **One game.** `npm run migrate-games -- --backup <file> --write --only <id>`, then open it in the app and use it.
   5. **A small batch, then the rest.** `--write --limit 25`, then without `--limit`. The backup must be less than a day old, a game not in it or changed since is left alone and reported (take a fresh backup and run again), and games already moved are skipped, so the run can be repeated.
   6. **Take a final backup and audit it.**

   Each game moves in one transaction and is read back and compared before it counts as moved. To put a game back in one document, with whatever was saved since it moved: `npm run unmigrate-game -- <id> --write`. Restoring from a backup into a moved game is refused: put it back first.

5. **Clean up** (done, in four releases).
   - **Release C, rules only (deployed).** A browser may create a game as version 2 (empty `characters`, no `diceRolls`). Creating version 1 still works, and a browser still cannot change an existing game's version.
   - **Release D, the app (deployed).** New games are created as version 2.
   - **Release E1, the app (deployed).** The old-shape write paths are gone (`withCharacters`, `GameMovedError`, the one-document roll log and restore), and a game still in the old shape is refused instead of shown with its characters missing. `mergeById` stays: steading lists and arcana still id-merge inside one document.
   - **Release E2, rules only (deployed).** A browser can create and write only version 2 games, and only with the top-level keys the app writes. Tabs still running an old build fail to save until they refresh. `createdAt` stays a number: the app writes `Date.now()`.

Each release follows the two-release rule in `AGENTS.md`: rules deploy before the build that uses a field.

## Decisions made

- **Backup and import.** The export file keeps the one-document shape (exports assemble it with `joinGame`; a restore replaces the subdocuments in one transaction), so old exports still import. The import check refuses a file the rules would refuse, naming the character or roll.
- **`firebase-admin` for the scripts.** A dev dependency of stonetop, the same version as delta-green's Functions.
- **Rolls cap.** Kept at 50. The client deletes the oldest roll after adding one.

## After the migration

Rules now bound every character and roll document (`firestore.rules`), and `src/lib/__tests__/rulesAgree.test.ts` keeps the app and the rules in step. Left to do, tracked in `AGENTS.md` "Planned work":

- Enforce App Check once its metrics look healthy (README.md "App Check").
- Look at the Firebase Usage page after a normal day: a game now costs about 10 to 15 reads to open.
- `migrateCore`, `unmigrate-game` and `rehearse-migration` are kept as history. Delete them when nobody needs to re-run a migration.
