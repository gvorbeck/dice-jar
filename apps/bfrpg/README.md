<div align="center">
  <img src="./public/images/logo.webp" width="200" alt="Codex.Quest Logo" />

# 🔥 Codex.Quest

**Modern Character Creation for Basic Fantasy Role-Playing Game**

[![React](https://img.shields.io/badge/React-19.1-61dafb?style=flat&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.1-646cff?style=flat&logo=vite)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-12.2-ffca28?style=flat&logo=firebase)](https://firebase.google.com/)
[![Vitest](https://img.shields.io/badge/Vitest-4.0-729b1b?style=flat&logo=vitest)](https://vitest.dev/)
[![Playwright](https://img.shields.io/badge/Playwright-1.55-45ba4b?style=flat&logo=playwright)](https://playwright.dev/)

</div>

## Overview

Codex.Quest is a comprehensive web-based character creation and management system for Basic Fantasy Role-Playing Game (BFRPG). Built with modern React architecture and a beautiful, accessible interface, it provides players and Game Masters with powerful tools to create, manage, and track characters throughout their adventures.

### Key Features

- Step-by-step character creation wizard with guided experience
- Complete BFRPG race and class support (Core + Supplemental + custom race and class creation)
- Persistent character storage with Firebase integration
- Character sheet display and live editing capabilities
- Comprehensive dice rolling system
- Game session creation and management
- Encounter management with initiative tracking
- Encount and Treasure generation tools
- Real-time data synchronization across devices

## Architecture

### Frontend Stack

- **React 19** with functional components and hooks
- **TypeScript 5.9** for type-safe development
- **Vite 7.1** for fast development and optimized builds
- **Plain CSS** with design tokens (`src/styles/tokens.css`), one stylesheet beside each component, and `@dice-jar/cn` for conditional classes
- **react-router-dom 7** for client-side routing
- **`useSub`** (`@dice-jar/browser`) for live Firestore data, and **`@dice-jar/diff`** so saves send only the changed fields
- **`@dice-jar/browser`** for the rest every app shares: `store` (local storage), `useRun` (button actions), `useDebouncedSave` and `useDebouncedTextField` (saving as you type), and `ToastProvider` (notifications)
- **`@dice-jar/dice`** for dice notation

### Backend & Services

- **Firebase 12.2** for authentication and Firestore database
- **Real-time synchronization** for multiplayer features
- **Automated data migration** for schema evolution
- **Secure user authentication** with email/password and Google OAuth

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Quick Start (Emulators)

No Firebase project or credentials needed. From the repo root (Java 21 is required for the emulators):

```bash
npm install
npm run emulators -w apps/bfrpg      # Auth and Firestore emulators, in one terminal
npm run dev:emulated -w apps/bfrpg   # the app against them (.env.emulator), in another
```

Open the app and use **Sign Up**. The emulators start empty and forget everything when stopped. The `demo-` project ID and dummy keys in `.env.emulator` mean nothing can reach the real Firebase project.

### Production Installation

**For production deployment with Firebase:**

```bash
# Follow the steps above, then create .env with your Firebase config:
# VITE_FIREBASE_API_KEY=your_api_key
# VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
# VITE_FIREBASE_PROJECT_ID=your_project_id
# VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
# VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
# VITE_FIREBASE_APP_ID=your_app_id
# VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Build for production
npm run build
```

## Development

### Available Scripts

| Command                   | Description                                                               |
| ------------------------- | ------------------------------------------------------------------------- |
| `npm run dev`             | Start development server with Firebase (needs `.env`, see `.env.example`) |
| `npm run dev:emulated`    | Start development server against the emulators                            |
| `npm run emulators`       | Start the Auth and Firestore emulators                                    |
| `npm run build`           | Build for production (TypeScript + Vite)                                  |
| `npm run preview`         | Preview production build locally                                          |
| `npm run lint`            | Run ESLint on TypeScript/React files                                      |
| `npm run test`            | Run unit tests in watch mode                                              |
| `npm run test:ui`         | Run unit tests with visual interface                                      |
| `npm run test:run`        | Run unit tests once (for CI/commits)                                      |
| `npm run test:coverage`   | Run unit tests with coverage report                                       |
| `npm run test:rules`      | Test `firestore.rules` in the Firestore emulator (needs Java 21)          |
| `npm run test:e2e`        | Run end-to-end tests against the emulators (headless)                     |
| `npm run test:e2e:ui`     | Run E2E tests with visual debugging                                       |
| `npm run test:e2e:headed` | Run E2E tests with browser visible                                        |
| `npm run test:all`        | Run all tests (unit + E2E)                                                |
| `npm run test:ci`         | Full CI pipeline (lint + build + tests)                                   |

## Testing

We use a comprehensive two-layer testing approach for quality assurance:

**[Complete Testing Guide → TEST_PLAN.md](./TEST_PLAN.md)**

### Testing Architecture

- **Unit Tests (Vitest)**: Fast feedback for individual functions and components
- **E2E Tests (Playwright)**: Complete user workflow validation across browsers
- **Visual Interfaces**: Beautiful web dashboards for both testing layers
- **Coverage Reports**: Track which code needs more testing\*\*

## Accessibility Features

- **WCAG 2.1 AA compliance** target
- **Screen reader support** with proper ARIA labels
- **Keyboard navigation** throughout the application
- **Skip links** and semantic HTML structure
- **High contrast support** and readable typography
- **Responsive design** for all device types

### Development Guidelines

**[Read our comprehensive Style Guide](./src/components/STYLE_GUIDE.md)** for detailed development patterns, TypeScript best practices, performance optimization, and component architecture.

## License

This project is licensed under the [Creative Commons Attribution-ShareAlike 4.0 International License](http://creativecommons.org/licenses/by-sa/4.0/).

[![CC BY-SA 4.0](https://licensebuttons.net/l/by-sa/4.0/88x31.png)](http://creativecommons.org/licenses/by-sa/4.0/)

## Acknowledgments

- **Basic Fantasy RPG** community for the excellent open-source game system

---

<div align="center">
  <strong>Ready to create your next character?</strong><br>
  <em>Light up your adventures with codex.quest!</em> 🔥
</div>

## Rules

Rules logic and rules data come from the books, checked with the `basic-fantasy-rules` MCP server (Core Rules and the supplements the app supports). Cite the page in the test or comment, as the saving-throw, attack-bonus, carrying-capacity and spell-slot tests do.

## Data migration

Stored characters and games carry `schemaVersion` (3), `createdAt` and `updatedAt`. `settings.version` stays at 2.6 for one release so a tab still on the previous build keeps working; `schemaVersion` is the real version, and a document is migrated when it is opened. To bring everything over at once, without spending the daily Firestore quota (all from `apps/bfrpg`; the live steps use a service account in `./service-account.json`):

1. `npm run backup` reads every character and game once (one read each) into `firestore-backup-<timestamp>.json`.
2. `npm run audit-backup -- <file>` and `npm run rehearse-migration` (`BACKUP=<file>` for the real data) use no production reads or writes: the first works from the file, the second runs in the emulator and also checks that a second run does nothing.
3. `npm run migrate -- --backup <file>` is a dry run. Then `--write --only users/<uid>/characters/<id>` for one document, `--write --limit 200` for batches, then `--write`.

The scripts are built with Vite (`vite build --ssr`) before they run, because the app's code imports through `@/`, which plain `node` can't resolve; stonetop's scripts run directly with `node scripts/x.ts`.

A document already current costs nothing. One that migrates costs 1 read and 1 write (a transaction that skips it if it changed since the backup, then writes only the changed fields); `--verify` adds 1 read to check it. A document that would not fit its schema is refused and left alone. A run can be stopped and resumed: finished documents are remembered next to the backup file.
