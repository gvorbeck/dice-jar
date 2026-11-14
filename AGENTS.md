# Working in this repo

A monorepo of tabletop RPG character apps. What's here and how it's laid out: [README.md](README.md). Each app's own README says what the app is and where things are in it. Read the code you're changing and its callers before editing.

## Rules

- Make the smallest change that fully works. Reuse what's in `packages/` and the app's own `src/lib`, `src/rules`, `src/model` before writing anything new. No abstractions, options, wrappers or "for later" code nobody asked for.
- An app never imports from another app. Code used by two apps moves to `packages/`; code used by one stays in that app.
- A change in `packages/` must pass the checks of every app that uses it.
- UI: React Aria Components, the shared UI components and the CSS tokens. No inline styles, no new hex colors, no other UI or CSS library. Add a token if one is missing.
- Ask before adding a dependency. The same dependency has the same version in every workspace.
- Delete code your change leaves unused. `npm run knip` fails on unused files, exports and dependencies.
- Bug fix: first write a test that fails, then fix the root cause in the shared code, not at each caller.
- New logic gets a test. Where it goes:
  - logic: `*.test.ts` next to the file;
  - `firestore.rules`: the app's `test/firestore.rules.test.ts`;
  - anything a player clicks through: the app's `e2e/`.
- Game rules come from the book. Before writing or changing rules logic or rules data, look it up with that app's rules MCP server (`rules-<game>`; each app's README names its server) and cite the page in the test or comment. Never use another game's server for it. If the app's server isn't connected, stop and say so.
- A known limit gets a comment: `// shortcut: <the limit>, <when to upgrade>`.
- Comments say why, in one line. No comments that repeat the code.
- A coverage floor only goes up. A new app starts at or above codename's floor (lines 77, statements 74, branches 68, functions 78).
- Never skip a hook (`--no-verify`), disable a lint rule inline, or lower a threshold to get a change through. Fix the cause or ask.
- Never commit, push or merge. The user does that.

## Branches and releases

- `main` is production and deploys. Never work on it. Work happens on `dev`, or on a branch cut from `dev` for bigger changes. If you find yourself on `main`, switch before editing anything.
- Changes reach `dev` by PR (or a direct push by the user), and reach `main` only by a PR from `dev` merged with a merge commit, never squash. Nothing is live until that release PR merges.
- A field added or removed takes two releases: one that allows it in `firestore.rules`, a later one that uses it. Plan the change as two PRs through `dev` and `main`.
- When you finish, tell the user what is ready to commit and on which branch. The workflow they follow is in [README.md](README.md) under "Working on a change".

## Done means

- `npm run check` passes at the root (format, lint, unused code, then types and unit tests with coverage in every workspace).
- If you touched an app's `firestore.rules`, `src/lib`, `src/pages` or Functions, or anything in `packages/`, `npm run test:rules` and `npm run test:e2e` pass for every affected app (`npm run test:rules -w apps/<app>`). Both need Java 21 on `PATH`.

## Things that trip people up

- An app's `functions/` is deployed by Firebase on its own, so it keeps its own `package.json` and lockfile and is not an npm workspace. It imports shared code by relative path and esbuild bundles it in. See codename's `functions/package.json` and the Functions steps in its deploy workflow.
- Saves are diffs against what the tab last read. Shared save code takes a document reference from the app and never builds a path. Never write a whole document, or you'll overwrite changes from another device.
- Firestore rules deploy before the build, and open tabs keep running the old build. Adding or removing a field takes two releases.
- E2E tests click a radio's or checkbox's `label.choice`; React Aria hides the input itself.

## Bringing an app in

An app is ready when all of these are true:

- Its `check`, `test:rules` and `test:e2e` pass.
- It has a workspace entry in `knip.jsonc` (and one for its `functions/`, if it has one).
- It has a coverage floor, at or above codename's.
- Its Dependabot entries exist (its `functions/` directory, if it has one).
- Nothing in it imports from another app.
- Every page has a `lang` attribute, a unique `<title>` and a description. Pages of link-only games (`/g/...`) are `noindex`, since a game is unlisted, not secret.
- Its e2e tests run the automated accessibility check (axe) on every page. The first app in adds `@axe-core/playwright` (ask the owner first) and the helper moves to `packages/` when a second app needs it.

## Planned work, and who raises it

The owner does not track these. When an import finishes, or the owner asks what is next, say which of them are now due.

- **After codename is in and green:** move `jsx-a11y` to its `strict` config, and raise TypeScript strictness in `tsconfig.base.json` one flag at a time, `noUncheckedIndexedAccess` first. One PR per change, and only when every app passes. Codename's own config is the floor until then, so none of this may land before it.
- **Before the first deploy workflow lands:** the owner decides on a `LICENSE` and a `SECURITY.md`. The games' text and rules are licensed content, so do not write either without them.
- **Before the first app is released:** confirm the GitHub settings in README.md "GitHub settings" are all on, and that the `checks` job is required on `dev` and `main`.
