# Knave

A character creator and party tracker for Knave 2nd Edition. It is going to run at [knave.dicejar.games](https://knave.dicejar.games/) and [glyph.quest](https://glyph.quest/).

It follows PC Creation in order: abilities and hit points, careers, gear, then a name and description. After that you keep playing from the sheet. A game keeps everyone's characters and rolls in one place. There are no accounts.

Rules MCP server: `knave-rules`. Every rule in `src/rules` cites its page.

## What's in it

- Character creation in four steps, same order as the book. Roll 3d6 for abilities, careers, coins and spell books, or choose.
- Shared games. You get an ID like `gravedigger-brewer-7f3k2a` and send the link to people. Anyone with the link can read and write the game. It's unlisted, not secret, so don't put anything in there you'd mind losing.
- A sheet for play: HP, wounds and item slots (gear and coins fill slots, wounds fill them from the top), Armor Class, XP and level-ups, coins, gear, notes. Rest and safe-haven buttons.
- Checks, attacks and free dice (`2d6+1`) with every roll in the game's log. You can't edit or delete log entries.
- The home page remembers the last five games you opened in this browser.

Left out for now: a Discord bot, a GM screen, backup and import, standalone sheets, a print stylesheet, and spell and item descriptions (the sheet shows names and points at the book).

## Routes

| Path                        |                                     |
| --------------------------- | ----------------------------------- |
| `/`                         | Open a game by ID or make a new one |
| `/g/:gameId`                | A game's characters and roll log    |
| `/g/:gameId/c/:characterId` | One character, creation and sheet   |

Anything else redirects to `/`.

## Stack

React 19, TypeScript, Vite, React Router, React Aria Components, Zod, Firebase (Firestore, Hosting, optional App Check). Tests are Vitest and Playwright. Lint is ESLint with jsx-a11y.

## Running locally

Use Node 24, since that's what CI runs.

```bash
npm install
```

```bash
cp .env.example .env
```

Put your own Firebase project's values in `.env`. `VITE_APPCHECK_SITE_KEY` is optional. If you set it, App Check starts up with reCAPTCHA Enterprise, but it does nothing until you also enable it in the Firebase console and enforce it for Firestore. Once it is enforced, `npm run dev` against production data needs a debug token: Firebase console → App Check → Apps → your web app → ⋮ → Manage debug tokens, then `VITE_APPCHECK_DEBUG_TOKEN` in `.env`. It's only used by the dev server, never in a build.

```bash
npm run dev -w apps/knave
```

Other scripts (run with `-w apps/knave`, or `npm run kn` from the root for the dev server):

|                      |                                                                         |
| -------------------- | ----------------------------------------------------------------------- |
| `npm run build`      | Typecheck, then build to `dist/`                                        |
| `npm test`           | Run the tests once                                                      |
| `npm run check`      | Lint, typecheck, unused code (knip), unit tests with the coverage floor |
| `npm run test:rules` | `firestore.rules` against the emulator (needs Java 21)                  |
| `npm run test:e2e`   | Click-through tests and the accessibility scan (needs Java 21)          |

## Where things are

```
src/
  pages/    Home, Game, Character (each loaded separately)
  rules/    the book's rules as functions (index.ts), and its tables (data/)
  model/    the Zod schema of a character
  lib/      Firestore, game IDs, diff saves, titles
  ui/       form controls (react-aria) and small shared pieces
  styles/   tokens and app CSS
  Creator.tsx  Sheet.tsx  Inventory.tsx  Roller.tsx
firestore.rules
functions/  the budget kill switch
```

The look follows the book: one-ink pages, blackletter headings, small-caps labels, a black bar over each box. Colours and fonts are tokens in `styles/tokens.css`, with a dark scheme.

## Data

Firestore, no auth. Knowing a game's ID is the only thing that gets you into it.

```
games/{gameId}                      { createdAt, schemaVersion }                      never changes
games/{gameId}/characters/{id}      { name, careers, level, hp, hpMax,                create, update, delete
                                      character, createdAt, updatedAt }
games/{gameId}/rolls/{id}           { characterId, characterName, label, detail,      create only
                                      total, createdAt }
```

The first five fields of a character are a copy of what the game page lists, so listing never parses a sheet. `character` is the sheet itself (`src/model/character.ts`). The rules don't let anyone list games or delete a game or a roll. Anyone with the link can delete a character, and that can't be undone. Cleanup has to be done by hand with admin access. Every write is checked against an allowed set of keys, string lengths and number ranges, so a roll can't come in as 10,000,000 or an ability score as 11.

The rules can't walk a list, so one gear item's fields are not bounded beyond the 60-item cap. They can't count documents either, so there's no cap on characters or rolls per game. App Check is the only thing that helps with that.

If you add a field to a document you have to add it to that document's `hasOnly` list (or, for the sheet, to `validCharacter`) in `firestore.rules`. `src/lib/characters.test.ts` catches this: it records what the app writes and fails when a field isn't in the rules, or the sheet goes past its 30-key cap.

When a character saves, it only sends the fields that changed since that tab last read or wrote them. Two people editing different parts of one sheet won't overwrite each other. If they edit the same field, whoever saves last wins. A sheet that's open doesn't show what another device saved until it's reloaded.

## Deploying

Pushing to `main` runs [the workflow](../../.github/workflows/deploy-knave.yml): build, deploy Firestore rules, deploy Functions (only when `functions/` changed), deploy Hosting to the `glyph-quest` project. The Firebase project is the old Glyph Quest one, so both domains are Hosting custom domains of its site: `knave.dicejar.games` and `glyph.quest` (add `knave` to the DNS of dicejar.games, then add both in the Firebase console → Hosting).

Rules go out before the new build. Tabs that are already open keep running the old build for a while, so the rules have to accept writes from both versions at once. That means adding a field takes two releases (allow it, then use it) and removing one also takes two (stop writing it, then stop allowing it).

After a deploy, an old tab may ask for a file that no longer exists. When that happens the app reloads once. If it fails again within a few seconds it shows the error instead of reloading forever.

The workflow needs these secrets: `KNAVE_FIREBASE_API_KEY`, `KNAVE_FIREBASE_AUTH_DOMAIN`, `KNAVE_FIREBASE_PROJECT_ID`, `KNAVE_FIREBASE_STORAGE_BUCKET`, `KNAVE_FIREBASE_MESSAGING_SENDER_ID`, `KNAVE_FIREBASE_APP_ID`, `KNAVE_APPCHECK_SITE_KEY` and `FIREBASE_SERVICE_ACCOUNT_GLYPH_QUEST`. That service account needs the Firebase Rules Admin role, and for the Functions step Cloud Functions Admin, Service Account User and Service Usage Consumer. The `firebase-tools` version and the hosting action are pinned and have to be bumped by hand. Dependabot does the other Actions.

### First release

This app replaces the Next.js app that used this project, which stored characters under `users/{uid}` behind Firebase Auth. The new rules don't mention `users`, so the first deploy closes that data to browsers and the old app stops working. Before the first release:

1. Decide whether the old data needs a backup. It was almost unused (about one day of activity in 30), and the plan is to start over.
2. Release. Open tabs of the old app stop saving.
3. Once the new app is live on both domains, delete the old `users` collection in the Firebase console (Firestore → Data → `users` → Delete collection). Firebase Auth users can stay or be removed in Authentication.
4. Create the budget and the `budget-alerts` topic (below) if the project doesn't have them yet.

| Function           | Region   | Does                                              |
| ------------------ | -------- | ------------------------------------------------- |
| `budgetKillSwitch` | us-east1 | Turns billing off at the $5 budget (next section) |

## If the site was shut off for going over budget

The project has a $5/month budget. When this month's actual cost reaches it, the `budgetKillSwitch` Function unlinks the billing account. Everything that costs money stops, and the site, the database or both stop working. You'll have budget emails at 50%, 90% and 100%.

Don't just turn billing back on. This month's cost is still over the budget, so the next budget alert (about every 30 minutes) shuts it off again. Do these in order:

1. **Find what cost money.** In the Google Cloud console, go to Billing → Reports. Set Group by to "SKU" and the time range to the current month. Usually it's Firestore reads or writes.
2. **Find who did it.** In the Firebase console, check Firestore → Usage for the spike. A single game ID showing up thousands of times is spam.
3. **Stop the cause before going back online.** Enforce App Check (Firebase console → App Check → Firestore → Enforce), delete the spam game in the Firestore console, or fix whatever rule or code let it through.
4. **Raise the budget for the rest of the month.** In Billing → Budgets & caps, edit the project's budget. Set the amount above what's already been spent, for example spent + $5. Skip this step if it's the 1st of a new month.
5. **Turn billing back on.** In the Firebase console, open ⚙ → Usage and billing → Details & settings → Modify plan, and choose Blaze.
6. **Check it works.** Open the site, open a game and make a roll.
7. **On the 1st of next month,** set the budget back to $5.

Don't leave billing off for long. Google may eventually delete resources in a project with no billing account.

## Legal

Knave is by Ben Milton, with art by Peter Mullen. This app is an independent production of J. Garrett Vorbeck and is not affiliated with Questing Beast LLC. The contents of this directory are © [J. Garrett Vorbeck](https://iamgarrett.com), excepting the game's own content. See [NOTICE](NOTICE).
