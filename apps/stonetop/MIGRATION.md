# Moving a game to subcollections

Status: steps 1 and 2 are done, Release A (rules) is deployed, and Release B (the app) is written; **no game has been moved.** This file is the plan; each step is its own change and none starts until the one before has passed.

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
   - **Release A, rules only (written, not deployed).** `firestore.rules` accepts the subcollections and `schemaVersion`. Browsers cannot create, change or restore a game into version 2, and a version 2 game refuses characters or rolls written back as arrays. The app is unchanged, so players see nothing.
   - **Release A, rules only (deployed).** Merged to `main` in PR 43.
   - **Release B, the app (written, not merged).** It reads both shapes and writes by the game's `schemaVersion`; new games are still v1. A tab holding a cached copy from before a game was moved finds out on its first write and carries on the new way, so the move can happen while people are playing. Tests run the same saves on a v1 and a v2 copy of one game and require identical results, and the emulator e2e moves a real game and plays on it. Merge it to `dev` only once Release A's deploy has finished.
4. **Migrate** (not started), game by game, against the emulator first with a copy of the backup, then live: back up, dry run, move one game and check it, then the rest. Re-running skips games already moved. A reverse script rebuilds the v1 document from v2 (`joinGame`) for any game.
5. **Clean up** (not started). Once every game is v2 and old builds are gone: new games are v2, the v1 code paths and `mergeById` go, and the rules tighten (no numeric `createdAt`, no unknown top-level keys, no `characters` list).

Each release follows the two-release rule in `AGENTS.md`: rules deploy before the build that uses a field.

## Decisions still open

- **Backup and import.** The export file is the v1 envelope. Proposal: keep it v1 (exports assemble it with `joinGame`; import of a v2 game replaces the subdocuments in one transaction). That keeps old exports importable.
- **`firebase-admin` for the scripts.** The migration needs the Admin SDK (service account). Proposal: a dev dependency of stonetop, same version as delta-green's Functions.
- **Rolls cap.** Today the log is capped at 50 by rewriting the array. With a subcollection the client deletes the oldest. Proposal: keep the cap at 50.
