# Monorepo brief

Repo name: `dice-jar`. Package scope: `@dice-jar/*`.

Read this whole file before doing anything. It is the context for scaffolding a new monorepo that will hold several tabletop RPG character apps.

## Why

The owner has built the same kind of app four times, each on a slightly different stack. Each time the Firebase setup, the save logic, the UI kit and the tooling were rebuilt from nothing. The fourth app, codename, is the one that got it right. The monorepo exists so that work is written once and every app uses it.

| App | Game | Local path | Stack today |
| --- | --- | --- | --- |
| codename (yourcodena.me) | Delta Green | `/Users/g/Sites/codename` | Vite, React 19, React Aria Components, plain CSS tokens, Zod, react-router. **The standard.** |
| codex-quest | Basic Fantasy RPG | `/Users/g/Sites/codex-quest` | Vite, Tailwind, zustand, react-query, wouter, Firebase Auth |
| hearthfire | Stonetop | `/Users/g/Sites/hearthfire` | Vite, CSS modules, tiptap, react-router |
| glyph-quest | Knave | `/Users/g/Sites/glyph-quest` | Next.js, MUI, emotion, Firebase Auth |

## Decisions already made

- **codename is the standard.** Every app in the monorepo, including codename itself when it arrives, is aligned to codename's conventions. Where this brief is silent, do what codename does.
- **codename is not imported yet.** Treat `/Users/g/Sites/codename` as a read-only reference. Do not edit it, and do not copy its app code in during scaffolding.
- **Set up everything so that importing codename later is the lightest possible lift.** Same Node version, same script names, same ESLint rules, same tsconfig, same test layout. Do not add a stricter rule that codename would fail unless this brief lists it.
- **Other apps are rebuilt to the standard, not ported as they are.** That means React Aria Components for UI, codename's Firestore setup and document conventions (each app needs a data migration), and codename's tooling.
- **Import order: codename, hearthfire, codex-quest, glyph-quest.** codename comes in first, after the scaffold is done.
- **Existing data gets migrated.** The document shapes of hearthfire, codex-quest and glyph-quest are brought in line with codename's. Each app needs a migration of its live data at some point; existing users and games must survive it.
- **Two access models live side by side, one per app.** Link-only (codename, hearthfire) and accounts (codex-quest, glyph-quest). Account apps keep their accounts. See "Data standard".
- **Commit history does not matter.** Apps come in as plain copies. No `git subtree`, no `filter-repo`.
- **Strict from the first commit.** Nothing lands without passing format, lint, types, unused-code and tests.
- **One Firebase project and one custom domain per app.** Apps never share a database.

## Scope of this work: scaffold only

Build the empty, fully enforced monorepo. No app code. Done when all of these are true:

- A fresh clone passes `npm ci && npm run check`.
- A commit with unformatted or lint-failing code is blocked by the hook.
- CI runs the same checks on every PR to `dev` and every push to `dev` and `main`.
- `AGENTS.md`, `CLAUDE.md`, `README.md`, Dependabot and Greptile configs are in place.

Out of scope: importing any app (codename included), creating shared packages, deploy workflows, data migrations. Those are later phases (see the end).

## Layout

```
apps/<app>/          one app each: its own firebase.json, .firebaserc, firestore.rules, functions/, e2e/, test/
packages/<name>/     shared code, created only when a second app needs it
.github/             workflows, dependabot.yml
.husky/              git hooks
AGENTS.md  CLAUDE.md  README.md  greptile.json
package.json         npm workspaces: ["apps/*", "packages/*"]
eslint.config.js  prettier.config.js  knip.jsonc  tsconfig.base.json  .editorconfig  .nvmrc
```

Inside an app, keep codename's folders: `src/pages`, `src/rules`, `src/model`, `src/lib`, `src/ui`, `src/styles`, and the game-specific steps. Read codename's `README.md` section "Where things are".

Do not create empty packages or placeholder apps. `apps/` and `packages/` start with a `.gitkeep`.

## Tooling

Copy these from codename, changing only what a workspace root needs:

| Thing | Standard | Source in codename |
| --- | --- | --- |
| Node | 24, in `.nvmrc` and `engines`, with `engine-strict=true` in `.npmrc` | `README.md`, `deploy.yml` |
| Package manager | npm workspaces, one root lockfile | new |
| TypeScript | `strict`, `noUnusedLocals`, `moduleResolution: bundler`, `ES2022`. Becomes `tsconfig.base.json`; apps extend it. Keep the separate Node tsconfig for tests and configs | `tsconfig.json`, `tsconfig.node.json` |
| ESLint | flat config, one file at the root: `@eslint/js`, `typescript-eslint` recommended, `jsx-a11y` recommended, `react-hooks`. Same rule overrides. Globs widen to `apps/*/src/**` and so on | `eslint.config.js` |
| Unused code | knip with a workspace entry per app. Version pinned exactly | `knip.jsonc` |
| Unit tests | Vitest, `*.test.ts` next to the file, v8 coverage with a floor per app that only goes up | `vite.config.ts` |
| Rules tests | `@firebase/rules-unit-testing` against the Firestore emulator, project ID `demo-<app>` | `vitest.rules.config.ts`, `test/` |
| Browser tests | Playwright against the emulator with dummy keys | `playwright.config.ts`, `e2e/` |
| Branches | work goes to `dev`; `main` deploys | `deploy.yml` |

Script names stay the same in every workspace: `dev`, `build`, `test`, `lint`, `typecheck`, `knip`, `test:coverage`, `test:rules`, `test:e2e`, `check`.

Root `check` runs, in order: `prettier --check .`, `eslint .`, `knip`, then `typecheck` and `test:coverage` in every workspace that has them. It must pass with zero workspaces.

New, not in codename today:

- **Prettier.** Match how codename is already written so its import diff is small: single quotes, semicolons, 2 spaces, trailing commas, `printWidth: 140`. Add `eslint-config-prettier` so the two don't fight. codename has never been Prettier-formatted, so its import will include one mechanical format commit. That is expected.
- **Commit hooks.** husky and lint-staged. `pre-commit`: Prettier and ESLint on staged files. `pre-push`: `npm run check`.
- **EditorConfig.** UTF-8, LF, 2 spaces, final newline.
- **Dependabot.** Copy codename's `.github/dependabot.yml`: GitHub Actions monthly; npm weekly with minor and patch grouped into one PR and each major on its own; target `dev`. With one root lockfile the npm entry is `directory: /`. Add each app's `functions/` when it arrives (see "Things that will trip you up"). Carry over the `eslint` major-version ignore and its `shortcut:` comment.
- **Greptile.** `greptile.json` at the root. Point its context at `AGENTS.md` so reviews enforce the same rules agents follow. Check Greptile's current docs for the field names; do not guess them.
- **CI.** One `checks` job modelled on codename's: `npm ci`, `npm run check`, then `test:rules` and `test:e2e` for workspaces that have them. Pin action versions the way codename does. Least-privilege `permissions`.
- **Branch protection** on `dev` and `main`: the `checks` job is required, no direct pushes to `main`. The owner sets this in GitHub; list the exact settings in the README.

Do not add anything else (Turborepo, Nx, changesets, commitlint, Storybook) without asking.

## Data standard

Each rebuilt app follows codename's Firestore conventions. Read codename's `README.md` sections "Data" and "Deploying", then `firestore.rules`, `src/lib/agents.ts` and `src/lib/diff.ts`.

- Every document shape is a Zod schema in `src/model`. Stored data is parsed on read, never trusted.
- The top-level document carries `schemaVersion`.
- `firestore.rules` checks every write against an allowed key list (`hasOnly`), string lengths and number ranges. A unit test fails when the app writes a field the rules don't list.
- Saves are diffs against what the tab last read. Never write a whole document.
- Rules deploy before the build. Adding or removing a field takes two releases, because open tabs still run the old build.
- App Check on, a monthly budget with the kill-switch Function, emulators on a `demo-*` project so tests cannot reach production.

### Access models

Each app uses exactly one. Everything in the list above applies to both.

| | Link-only (codename, hearthfire) | Accounts (codex-quest, glyph-quest) |
| --- | --- | --- |
| Document path | `games/{gameId}/...` | `users/{uid}/...` |
| Rule guard | knowing the ID | `request.auth.uid == uid` |
| Extra UI | game ID entry, recent games | sign-in, sign-out |

- Shared save code takes a document reference from the app. It never builds a path, so it works under either model. codename's `src/lib/agents.ts` builds `games/{g}/agents/{a}` itself today; that changes when the code moves to `packages/`.
- Auth code goes in its own package, created when codex-quest comes in and not before. Link-only apps never depend on it.
- Account apps keep their `users/{uid}` paths, so ownership does not move. Their migration changes the document shape inside those paths only.
- An account app's rules tests run as a signed-in user, as another user, and signed out.

### Migrations

- Write the target document shape as Zod schemas first. The migration script parses its own output with them.
- Run every migration against a copy of the data, never production, until the owner approves the result.
- A migration must be safe to run twice.
- Old and new builds overlap while tabs stay open, so the rules must accept both shapes for one release.

### What the older apps store today

Read from the code in November 2026. Re-read before designing a migration.

| | hearthfire | codex-quest | glyph-quest |
| --- | --- | --- | --- |
| Paths | `games/{id}`, one document per game | `users/{uid}/characters/{id}`, `users/{uid}/games/{id}` | `users/{uid}/characters/{id}` |
| Shape | Everything in the one document: `characters` array, roll log, notes, steading | A game lists players as `{ user, character }` and reads those characters from other users' paths | Characters only, no games |
| Types | TypeScript interfaces, no Zod, no `schemaVersion` | Interfaces with open index signatures; `settings.version` (2.6) | Interfaces |
| Rules | In the repo. Check four fields, cap `characters` at 20, allow any new top-level key | **Not in the repo.** They exist only in the Firebase console | **Not in the repo** |
| Sign-in | none | email and Google | email |
| Existing migration code | Admin scripts in `scripts/` (backup, restore, migrate) | Migrates on read in `src/services/characterMigration.ts` | none |

What this means for each migration:

- **hearthfire:** split the one game document into codename's layout: `games/{id}` plus `characters/{id}` and `rolls/{id}` subcollections. This removes its 1 MiB document ceiling and makes diff saves per character possible. Its notes use a lock so two people don't edit at once; decide whether diff saves replace that. Its `scripts/` are the starting point for the migration script.
- **codex-quest:** export the live rules from the console into the repo before anything else; nobody can test or change them safely until then. Cross-user character reads must keep working, so the rules need an explicit read grant for characters in a game. Replace migrate-on-read with one migration script, then delete `characterMigration.ts`.
- **glyph-quest:** export the live rules first, as above. It is hosted as a Next.js server app; the rebuild is a static Vite app like the others, so its Hosting setup changes too.

## Rules MCP

codename was built with an MCP server that lets the agent search the game's rulebooks and cite the page, so rules are implemented from the book and not from memory. Every app gets the same.

- Repo: `/Users/g/Sites/ttrpg-rules-mcp` (private, `gvorbeck/ttrpg-rules-mcp`). Registered today as one server, `ttrpg-rules`, holding Delta Green only. Tools: `search_rules`, `read_rules`, `list_sections`.
- **It stays a separate, private repo.** It holds text from copyrighted books. Never copy its `data/` or any book text into dice-jar.
- **One server per game, never mixed.** Same code, one running copy per game, each loading only that game's books and registered under its own name: `rules-delta-green`, `rules-stonetop`, `rules-bfrpg`, `rules-knave`. A server cannot return another game's text, and the tool name says which game it is. Games share terms with different rules (Delta Green and Stonetop both have "Bonds"), so a shared index with an optional filter is not safe enough.
- **How:** the server already reads its books from `RULES_DATA_DIR`. Move each game's `.jsonl` files into `rules-server/data/<game>/`, and have `install.sh` register one server per folder with that variable set. The existing `ttrpg-rules` registration is removed.
- **Adding a game** is the "Add a book" steps in that repo's `README.md`: the owner supplies the PDF, then a settings file in `chunker/books/` and `chunker/build.sh <book>`. Needed before each rebuild: Stonetop (hearthfire), Basic Fantasy RPG (codex-quest), Knave (glyph-quest).
- **Three bits of Delta Green wording are hard-coded in `rules-server/src/index.ts`** and need to become per-game or neutral before a second game is added: the "Handler only" label for GM-only books, the citation example, and the example search terms.

## AGENTS.md work

Write the monorepo's `AGENTS.md` as part of the scaffold, and a `CLAUDE.md` containing only `@AGENTS.md`. Start from codename's `AGENTS.md` and keep its wording where the rule is the same. Required content:

**Rules**

- Make the smallest change that fully works. Reuse what is in `packages/` and the app's own `src/lib`, `src/rules`, `src/model` before writing anything new. No abstractions, options, wrappers or "for later" code nobody asked for.
- An app never imports from another app. Code used by two apps moves to `packages/`; code used by one stays in that app.
- A change in `packages/` must pass the checks of every app that uses it.
- UI: React Aria Components, the shared UI components and the CSS tokens. No inline styles, no new hex colours, no other UI or CSS library. Add a token if one is missing.
- Ask before adding a dependency. The same dependency has the same version in every workspace.
- Delete code your change leaves unused. `npm run knip` fails on unused files, exports and dependencies.
- Bug fix: first write a test that fails, then fix the root cause in the shared code, not at each caller.
- New logic gets a test. Logic: `*.test.ts` next to the file. `firestore.rules`: the app's `test/firestore.rules.test.ts`. Anything a player clicks through: the app's `e2e/`.
- Game rules come from the book. Before writing or changing rules logic or rules data, look it up with that app's rules MCP server (`rules-<game>`; each app's README names its server) and cite the page in the test or comment. Never use another game's server for it. If the app's server isn't connected, stop and say so.
- A known limit gets a comment: `// shortcut: <the limit>, <when to upgrade>`.
- Comments say why, in one line. No comments that repeat the code.
- A coverage floor only goes up. A new app starts at or above codename's floor (lines 77, statements 74, branches 68, functions 78).
- Never skip a hook (`--no-verify`), disable a lint rule inline, or lower a threshold to get a change through. Fix the cause or ask.
- Never commit, push or merge. The owner does that.

**Done means**

- `npm run check` passes at the root.
- If you touched an app's `firestore.rules`, `src/lib`, `src/pages` or Functions, or anything in `packages/`, `test:rules` and `test:e2e` pass for every affected app. Both need Java 21 on `PATH`.

**Things that will trip you up**

- An app's `functions/` is deployed by Firebase on its own, so it keeps its own `package.json` and lockfile and is not an npm workspace. It imports shared code by relative path and esbuild bundles it in. Read codename's `functions/package.json` and the Functions steps in its `deploy.yml`.
- Saves are diffs (see "Data standard").
- E2E tests click a radio's or checkbox's `label.choice`; React Aria hides the input itself.

Add a section to `AGENTS.md` titled "Bringing an app in" with the import checklist from the next section.

## Later phases (not this work)

1. **Import codename.** Copy it to `apps/codename` unchanged, run Prettier once, and get every check green. Move its deploy workflow over with it, triggered by changes under `apps/codename/` or `packages/`. No packages yet: nothing is shared until a second app exists.
2. **Rebuild hearthfire.** First split the rules MCP into one server per game, make its Delta Green wording neutral, and add Stonetop (see "Rules MCP"). Move what it needs out of codename into `packages/` as it needs it: the UI kit and tokens (`src/ui`, `src/styles/tokens.css`) and the game-agnostic parts of `src/lib` (Firebase init, diff saves, autosave, stale-build reload). codename switches to the packages in the same change. Then migrate hearthfire's data.
3. **Rebuild codex-quest.** Add a Basic Fantasy RPG rules server and export the live Firestore rules first. The first account app: this is where the auth package is created. Then migrate its data.
4. **Rebuild glyph-quest.** Add a Knave rules server and export the live Firestore rules first. The largest rewrite (Next.js and MUI today). Then migrate its data.

Each app gets its own deploy workflow modelled on codename's `deploy.yml`: rules first, then Functions, then Hosting.

Import checklist for any app: its `check`, `test:rules` and `test:e2e` pass; it has a knip workspace entry; it has a coverage floor; its Dependabot entries exist; nothing in it imports from another app.
