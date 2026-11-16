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

Hearthfire uses Firestore (no authentication). The database structure is:

```
games (collection)
└── {gameId} (document)
    ├── id: string
    ├── name: string
    ├── createdAt: timestamp
    ├── characters: CharacterData[]
    ├── content: ContentLists
    ├── threats: string
    └── iWonder: string
```

Access is unrestricted by user account — anyone with a game ID can read and write it. Adjust your Firestore security rules accordingly for your deployment.

---

## Deployment

Pushing to `main` runs [the workflow](../../.github/workflows/deploy-stonetop.yml): build, deploy Firestore rules, deploy Hosting to `stonetop-d76fb`. Rules go first, so a field added or removed takes two releases.

The workflow needs these repository secrets: `STONETOP_FIREBASE_API_KEY`, `STONETOP_FIREBASE_AUTH_DOMAIN`, `STONETOP_FIREBASE_PROJECT_ID`, `STONETOP_FIREBASE_STORAGE_BUCKET`, `STONETOP_FIREBASE_MESSAGING_SENDER_ID`, `STONETOP_FIREBASE_APP_ID`, and `FIREBASE_SERVICE_ACCOUNT_STONETOP_D76FB`. The service account needs the Firebase Rules Admin role.

---

## License

This project is unofficial fan content. _Stonetop_ is designed by Jeremy Strandberg. All game content belongs to its respective owners. This tool is not affiliated with or endorsed by the Stonetop team.

The code is MIT (the root LICENSE). The Stonetop content and trade dress are covered by [NOTICE](NOTICE).

---

## Artwork & Trade Dress

The playbook icons, Seasons Change move icons, and monster/artifact/etc. icons used in this project are part of the official _Stonetop_ trade dress. Jeremy Strandberg has [confirmed](https://discord.com/channels/538756448914767872/825767574176137226/1506483106109063208) that the trade dress is free to use in fan projects, provided any such works are released under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) with proper attribution.

Maps and illustrations by Lucie Arnoux are copyright and are **not** included in this project.
