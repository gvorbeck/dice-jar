# Stonetop (Hearthfire)

This app lives in the dice-jar monorepo as `apps/stonetop`. It is known as Hearthfire on the web, at [hearthfire.camp](https://hearthfire.camp).

Rules MCP server: `stonetop-rules`.

A digital companion for [Stonetop](https://www.kickstarter.com/projects/1956101682/stonetop) — the tabletop RPG by Jeremy Strandberg. Hearthfire lets your whole party manage characters, share game state, and reference playbook content in real time, all from the browser.

**Live:** [hearthfire.camp](https://hearthfire.camp)

---

## Features

- **Shared game sessions** — create a game and share the ID; anyone with the link can join
- **Character sheets** — full digital playbooks for all 9 character classes, with persistent form fields
- **GM playbook** — quick-reference material for the Gamemaster
- **Real-time sync** — Firestore keeps every player's view in sync without a page refresh
- **No account required** — access is gated only by the game ID

---

## Tech Stack

| Layer     | Technology                                         |
| --------- | -------------------------------------------------- |
| Framework | React 19 + TypeScript                              |
| Build     | Vite                                               |
| Routing   | React Router v7                                    |
| UI        | React Aria Components, plain CSS with tokens       |
| Database  | Firebase Firestore                                 |
| Testing   | Vitest, Playwright + axe, Firestore rules emulator |
| Hosting   | Firebase Hosting (custom domain)                   |

---

## Getting Started

Use Node 24 (see `.nvmrc` at the repo root). From the repo root, `npm install` once. Run everything below from `apps/stonetop`, or add `-w apps/stonetop` from the root.

### Environment Variables

Copy `.env.example` to `.env` and fill in your Firebase project's values (never commit `.env`):

```bash
cp .env.example .env
```

`VITE_APPCHECK_SITE_KEY` is optional. If you set it, App Check starts up with reCAPTCHA Enterprise, but it does nothing until you also enable it in the Firebase console and enforce it for Firestore (see "App Check" below). If you enforce it, `npm run dev` against production data needs a debug token: Firebase console → App Check → Apps → your web app → ⋮ → Manage debug tokens → Add debug token. Put it in `.env` as `VITE_APPCHECK_DEBUG_TOKEN`. It's only used by the dev server, never in a build. Anyone with it can pass App Check, so keep it out of git and revoke it in the same dialog if it leaks.

### Development

```bash
npm run dev
```

Starts a Vite dev server at `http://localhost:5173`.

### Testing

```bash
npm test               # unit and component tests (Vitest, Firebase mocked, no .env needed)
npm run test:rules     # firestore.rules in the emulator (needs Java 21)
npm run test:e2e       # Playwright against the emulator, with an axe accessibility scan of every page
npm run check          # lint, types, unused code, tests with the coverage floor
```

### Production Build

```bash
npm run build
```

Output goes to `dist/`. Preview the build locally with:

```bash
npm run preview
```

---

## Project Structure

```
src/
├── ui/                   # Design-system kit and app chrome (Button, Input, Modal, PageLayout, Toast, GameGuard, RepeaterField, …)
├── character/            # Character sheet sections and per-playbook overrides
├── gm-playbook/          # GM and steading playbook sections
├── playbook/             # Parts shared by the playbook pages (notes editor, layout)
├── pages/
│   ├── Home/             # Create or join a game
│   ├── Game/             # Party roster and session hub
│   ├── CharacterPlaybook/ # Individual character sheet
│   ├── GmPlaybook/       # GM reference
│   └── SteadingPlaybook/ # Steading reference
├── lib/                  # Non-visual code: hooks (useGame, useDebouncedSave, …), Firestore access, dice, parsing
├── model/                # Shared TypeScript types
├── rules/                # Game data: moves, arcana, character creation
└── styles/               # tokens.css and app.css, imported once from main.tsx
```

---

## Firebase Setup

Hearthfire uses Firestore (no authentication). A game keeps its characters and dice rolls in their own documents (`MIGRATION.md` has the history):

```
games/{gameId}                    name, createdAt, schemaVersion: 2, content, threats, iWonder, steading, notes, notesLocks, restoreToken
                                  characters: []   (kept empty)
games/{gameId}/characters/{id}    id, name, playbook, level, data, order
games/{gameId}/rolls/{id}         id, characterId, characterName, moveName, stat, dice, mod, total, mode, band, createdAt, order, and optionally resource, dropped, burned, notation, breakdown
```

Access is unrestricted by user account: anyone with a game ID can read and write that game. Browsers cannot list games or delete a game. They can create, change and delete that game's characters and rolls (deleting is how a character is removed), and the rules do not cap the party size.

`firestore.rules` limits what can be written. The game document takes only the fields above, and a character or roll only the fields listed for it, with bounded sizes. If you add a field, add it to that list in the rules first and ship that in a release before the app writes it. `src/lib/__tests__/rulesAgree.test.ts` fails when a character or roll the app writes has a field the rules' list lacks, and when the backup import check's limits differ from the rules'. It does not check the fields of the game document.

### App Check

App Check makes Firestore refuse requests that don't come from the real site, which keeps a script from hammering the database with a leaked game ID. The app is ready for it: the shared Firebase setup starts App Check when `VITE_APPCHECK_SITE_KEY` is set. To turn it on:

1. In Google Cloud console, create a reCAPTCHA Enterprise key for the site (hearthfire.camp).
2. In Firebase console → App Check → Apps, register the web app with that key.
3. Add the site key as the repository secret `STONETOP_APPCHECK_SITE_KEY` and deploy (a push to `main`, or run the workflow by hand).
4. In App Check → APIs → Cloud Firestore, look at the request metrics for a few days. Only when almost all requests are verified, choose **Enforce**.

Enforcing blocks every request without a token. Tabs still open on a build from before step 3 stop saving until they refresh, and so does anything else that talks to Firestore as a browser. The admin scripts use the Admin SDK and are not affected.

---

## Deployment

Pushing to `main` runs [the workflow](../../.github/workflows/deploy-stonetop.yml): build, deploy Firestore rules, deploy Hosting to `stonetop-d76fb`. Rules go first, so a field added or removed takes two releases.

The workflow needs these repository secrets: `STONETOP_FIREBASE_API_KEY`, `STONETOP_FIREBASE_AUTH_DOMAIN`, `STONETOP_FIREBASE_PROJECT_ID`, `STONETOP_FIREBASE_STORAGE_BUCKET`, `STONETOP_FIREBASE_MESSAGING_SENDER_ID`, `STONETOP_FIREBASE_APP_ID`, and `FIREBASE_SERVICE_ACCOUNT_STONETOP_D76FB`. The service account needs the Firebase Rules Admin role. `STONETOP_APPCHECK_SITE_KEY` is optional: without it App Check stays off.

---

## License

This project is unofficial fan content. _Stonetop_ is designed by Jeremy Strandberg. All game content belongs to its respective owners. This tool is not affiliated with or endorsed by the Stonetop team.

The code is MIT (the root LICENSE). The Stonetop content and trade dress are covered by [NOTICE](NOTICE).

---

## Artwork & Trade Dress

The playbook icons, Seasons Change move icons, and monster/artifact/etc. icons used in this project are part of the official _Stonetop_ trade dress. Jeremy Strandberg has [confirmed](https://discord.com/channels/538756448914767872/825767574176137226/1506483106109063208) that the trade dress is free to use in fan projects, provided any such works are released under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) with proper attribution.

Maps and illustrations by Lucie Arnoux are copyright and are **not** included in this project.
