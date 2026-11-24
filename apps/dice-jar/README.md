# Dice Jar

The landing page at [dicejar.games](https://dicejar.games/): what Dice Jar is, and a card for each app. A static page with one URL, so it has no Firebase project, `firestore.rules`, `test:rules` or rules MCP server. It deploys to GitHub Pages ([deploy-dice-jar.yml](../../.github/workflows/deploy-dice-jar.yml)); Pages can't send custom headers, so it has no CSP header like the other apps.

## Where things are

- `src/apps.ts`: the app cards. An app without a `url` shows as "Coming soon".
- `public/alerts.json`: the messages every app shows in a banner (`GlobalAlerts` in `@dice-jar/browser` fetches it from `https://dicejar.games/alerts.json`). Edit it, merge to `main`, and only the landing page deploys. See "Posting a message" below.
- `src/styles/tokens.css`: the brand palette and fonts. The brand design document is the source; the contrast note there says which colors may be text.
- `public/logo-*.webp`: the logo, exported from the 1254 px master PNG with `cwebp -resize 560 0` and `-resize 1120 0`.
- `public/favicon.svg`: a simplified d20, since the full logo is unreadable at 16 px.

## Posting a message

Add an entry to the `alerts` list in `public/alerts.json`:

```json
{ "id": "2026-12-maintenance", "type": "warning", "message": "Short maintenance on Friday.", "apps": ["bfrpg"], "dismissible": true }
```

- `id`: unique, and never reused. A reader dismisses by id, so a reused id stays hidden for anyone who closed it.
- `type`: `info`, `warning`, `error` or `success`. An error is announced to screen readers at once; the rest politely.
- `message`: plain text.
- `apps`: which apps show it (`delta-green`, `stonetop`, `bfrpg`). Leave it out to show it in all of them.
- `dismissible`: `true` adds a close button; left out, the message stays until you remove it.

To take a message down, delete its entry. An entry that doesn't fit this shape is skipped by the apps, and `src/alerts.test.ts` fails on it, so the mistake shows up in CI. The apps' Content-Security-Policy lists `https://dicejar.games` under `connect-src`; a new app that shows alerts needs the same.
