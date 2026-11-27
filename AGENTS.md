# Working in this repo

A monorepo of tabletop RPG character apps. What's here and how it's laid out: [README.md](README.md). Each app's own README says what the app is and where things are in it. Read the code you're changing and its callers before editing.

## Rules

- Make the smallest change that fully works. Reuse what's in `packages/` and the app's own `src/lib`, `src/rules`, `src/model` before writing anything new. No abstractions, options, wrappers or "for later" code nobody asked for. Use ponytail skills where appropriate.
- A PR may change more than one app, for example to move shared code into `packages/` and switch every app to it. A workflow still labels each PR with the name of every app it touches.
- Apps look different and play different games, but they work the same way: one mechanism per job (loading live data, saving, dice, errors, routing, state), written so the code reads as one hand's. Before writing a mechanism, find how the other apps do it. If one already has it, use it; if the others differ from each other, say so and ask which is the standard. A new app-local wrapper around a shared package (for example a second dice helper beside `@dice-jar/dice`) is the same mechanism written twice: call the package directly.
- An app never imports from another app. Code used by two apps moves to `packages/`, and the same PR switches every app that has its own copy over to it and deletes the copy; code used by one stays in that app.
- A change in `packages/` must pass the checks of every app that uses it.
- UI: React Aria Components, the shared UI components and the CSS tokens. No inline styles, no new hex colors, no other UI or CSS library. Add a token if one is missing.
- Ask before adding a dependency. The same dependency has the same version in every workspace.
- Delete code your change leaves unused. `npm run knip` fails on unused files, exports and dependencies.
- Bug fix: first write a test that fails, then fix the root cause in the shared code, not at each caller.
- New logic gets a test. Where it goes:
  - logic: `*.test.ts` next to the file;
  - `firestore.rules`: the app's `test/firestore.rules.test.ts`;
  - anything a player clicks through: the app's `e2e/`.
- Game rules come from the book. Before writing or changing rules logic or rules data, look it up with that app's rules MCP server (`<game>-rules`; each app's README names its server) and cite the page in the test or comment. Never use another game's server for it. If the app's server isn't connected, stop and say so.
- A known limit gets a comment: `// shortcut: <the limit>, <when to upgrade>`.
- Comments say why, in one line. No comments that repeat the code.
- A coverage floor only goes up. A new app starts at or above delta-green's floor (lines 81, statements 79, branches 73, functions 84).
- Never skip a hook (`--no-verify`), disable a lint rule inline, or lower a threshold to get a change through. Fix the cause or ask.
- Licensing: the root `LICENSE` is MIT and covers everything except a directory with its own `LICENSE` or `NOTICE`. An app's game content follows the game's license, not MIT. Never commit book text or other licensed material to the root or `packages/`; ask the owner what an app's `NOTICE` must say.
- Never commit, push or merge. The user does that.
- Cut a branch from `origin/dev` with `--no-track` (`git switch -c <name> --no-track origin/dev`). Without it Git makes the new branch track `dev`, and a plain push then lands its commits on `dev` with no PR. The `pre-push` hook refuses any branch other than `dev` pushing onto `dev`. After creating a branch, `git status -sb` must not show `...origin/dev`.
- Never create a git worktree. Do one change at a time on one branch in this checkout. If a second change is ready while the first is uncommitted, finish and report the first, and ask the user to commit before starting the second.

## Branches and releases

- `main` is production and deploys. Never work on it. Work happens on `dev`, or on a branch cut from `dev` for bigger changes. If you find yourself on `main`, switch before editing anything.
- Fixing review comments on an open PR: work on that PR's head branch (`gh pr view <n> --json headRefName`), not a new one, so the fix lands in the PR. For a release PR that branch is `dev`. Update it first (`git pull --ff-only`), since a local `dev` can lag.
- Changes reach `dev` by PR (or a direct push by the user), and reach `main` only by a PR from `dev` merged with a merge commit, never squash. Nothing is live until that release PR merges.
- A field added or removed takes two releases: one that allows it in `firestore.rules`, a later one that uses it. Plan the change as two PRs through `dev` and `main`.
- When you finish, tell the user what is ready to commit and on which branch. The workflow they follow is in [README.md](README.md) under "Working on a change".

## Done means

- `npm run check` passes at the root (format, lint, unused code, the `scripts/` tests, then types and unit tests with coverage in every workspace).
- If you touched an app's `firestore.rules`, `src/lib`, `src/pages` or Functions, or anything in `packages/`, `npm run test:rules` and `npm run test:e2e` pass for every affected app (`npm run test:rules -w apps/<app>`). Both need Java 21 on `PATH`.

## Things that trip people up

- An app's `functions/` is deployed by Firebase on its own, so it keeps its own `package.json` and lockfile and is not an npm workspace. It imports shared code by relative path and esbuild bundles it in. It does not bundle `@dice-jar/*` packages (`--packages=external`), so nothing the Functions import from the app may import them; the Functions build fails if its output mentions one. See delta-green's `functions/package.json` and the Functions steps in its deploy workflow.
- Saves are diffs against what the tab last read. Shared save code takes a document reference from the app and never builds a path. Never write a whole document, or you'll overwrite changes from another device.
- Firestore rules deploy before the build, and open tabs keep running the old build. Adding or removing a field takes two releases.
- E2E tests click a radio's or checkbox's `label.choice`; React Aria hides the input itself.

## Bringing an app in

Copy the app to `apps/<app>/` as it is, without `.git`, `node_modules`, `dist` or `.env`. Then, in this order (rehearsed with delta-green: every check passed afterwards):

1. Delete the app's own `eslint.config.js`, `knip.jsonc`, `AGENTS.md`, `CLAUDE.md`, `.github/` and `package-lock.json`. The root versions replace them. Its deploy workflow is moved into the root `.github/workflows/` by hand, not copied.
2. Run `npx prettier --write apps/<app>` once. It goes in the same commit as the copy, because the hooks refuse unformatted files.
3. Remove `@eslint/js`, `eslint-plugin-jsx-a11y`, `eslint-plugin-react-hooks`, `globals` and `typescript-eslint` from the app's `package.json`. They live in the root, and knip fails on them otherwise. Then `npm install` at the root.
4. Add the app, and its `functions/` if it has one, to `knip.jsonc`. The `functions/` entry must include `src/**/*.test.ts`, or knip reports its tests and the exports they use as unused.
5. Install the Functions dependencies: `npm ci --prefix apps/<app>/functions`.

An app is ready when all of these are true:

- Its `check`, `test:rules` and `test:e2e` pass.
- It has a workspace entry in `knip.jsonc` (and one for its `functions/`, if it has one).
- It has a coverage floor, at or above delta-green's.
- Its Dependabot entries exist (its `functions/` directory, if it has one).
- Nothing in it imports from another app.
- It has an `apps/<app>/LICENSE` or `NOTICE` stating the terms its game content is under, and its `package.json` `license` field matches (`SEE LICENSE IN LICENSE` if the terms are custom).
- Every page's footer shows `<DiceJarCredit />` from `@dice-jar/browser` ("Another app pulled from the Dice Jar"). `scripts/apps.test.js` fails without it; the dice-jar landing page is the exception.
- Every page has a `lang` attribute, a unique `<title>` and a description. Pages of link-only games (`/g/...`) are `noindex`, since a game is unlisted, not secret.
- Its e2e tests run the automated accessibility check (axe) on every page. The first app in adds `@axe-core/playwright` (ask the owner first) and the helper moves to `packages/` when a second app needs it.
- Perform an audit using the MCP server dedicated to the game's ruleset to make sure the game's rules are properly implemented.

## Planned work, and who raises it

The owner does not track these. When an import finishes, when the owner asks what is next, and at the start of any session in this repo, say which of them are now due (an item with a date is due once that date has passed). Do not wait to be asked.

- **Strictness ratchet:** raise TypeScript strictness in `tsconfig.base.json` one more flag at a time (`jsx-a11y` is on `strict`, and `noUncheckedIndexedAccess`, `noImplicitReturns` and `noFallthroughCasesInSwitch` are on). One PR per change, and only when every app passes. Errors each flag would cause when measured on 2026-11-24: `noUnusedParameters` and `verbatimModuleSyntax` 0; `noImplicitOverride` 15; `exactOptionalPropertyTypes` 98; `noPropertyAccessFromIndexSignature` 404. Take the cheap ones first.
- **Stonetop App Check enforcement (due 2026-12-02):** App Check went live on hearthfire.camp on 2026-11-18, in monitoring mode, so nothing is blocked yet. On 2026-11-25 the Cloud Firestore metrics showed 56 requests in 7 days: 38% verified, 38% outdated client (no token: tabs on pre-App-Check builds, and the owner's `npm run dev`, whose `.env` points at production with no App Check key), 25% invalid (the SDK sends a placeholder when reCAPTCHA can't load, e.g. behind a blocker), 0 unknown origin. The live site does exchange tokens (HTTP 200), so verified traffic works. Not ready. When due, ask the owner to open https://console.firebase.google.com/project/stonetop-d76fb/appcheck/products → Cloud Firestore and read the counts, and the per-day chart for the last few days. If nearly all recent requests are verified, the owner first adds `VITE_APPCHECK_SITE_KEY` and a debug token to their local `.env` (README "App Check"), since enforcing stops an unauthenticated `npm run dev` working against production, then clicks **Enforce** (tabs on older builds stop saving until they refresh). If many are not, find out why before enforcing. Once it is enforced, delete this item and put the date in `apps/stonetop/README.md` "App Check".
- **Finish sharing the save code between stonetop and delta-green:** `diffPaths` and the merge helpers are `@dice-jar/diff`; stonetop saves a character, adds one, reorders and logs rolls the way delta-green does, as writes that queue offline; both apps now describe stored data with Zod (stonetop for what a backup restore may hold: `documentSchemas.ts`); and every app debounces saves with `useDebouncedSave` from `@dice-jar/browser`. Still different, and left alone on purpose until a problem shows: stonetop's steading lists (arrays merged by id inside the game document; moving them to maps keyed by id is a second data migration), its sheet reader `parseCharacterData` (tolerant, hand-written), restore (online only, by design), and `src/ui` with the tokens, which stay per app on purpose: each app is its own property with its own look, so UI components and styles are never moved to `packages/` or made to match another app.
- **bfrpg `settings.version` and `characterMigration.ts` (due 2026-12-07: the bfrpg release that writes `schemaVersion` went live on 2026-11-22 at about 9:17 pm US Eastern, 2026-11-23 UTC, and this waits two weeks after it):** that release writes `schemaVersion` and keeps `settings.version: 2.6` (`OLD_BUILD_VERSION` in `characterMigration.ts`) so a tab on the previous build does not treat a migrated character as legacy and rewrite its coins. Second release: delete `OLD_BUILD_VERSION`, drop it from `saveCharacter` and from `processCharacterData` (and its test in `characters.test.ts`), then let the migration remove the field from every document. Delete `characterMigration.ts` itself only after the migration has run on production and `npm run audit-backup` on a fresh backup reports 0 left to migrate. Delete this item when both are done.
- **bfrpg scripts run through a Vite build, stonetop's run with `node`:** bfrpg's `npm run backup`, `migrate`, `audit-backup` and `rehearse-migration` build with `vite build --ssr` first because its `src/` imports through `@/` and without file extensions, which plain node can't resolve; stonetop's scripts import by relative path and run as `node scripts/x.ts`. If bfrpg's imports ever become relative, switch it to `node` and drop `.scripts` from `.gitignore` and `eslint.config.js`. Delete this item when that is done or the owner picks one way for every app.
