# Dice Jar

The landing page at [dicejar.games](https://dicejar.games/): what Dice Jar is, and a card for each app. A static page with one URL, so it has no Firebase project, `firestore.rules`, `test:rules` or rules MCP server. It deploys to GitHub Pages ([deploy-dice-jar.yml](../../.github/workflows/deploy-dice-jar.yml)); Pages can't send custom headers, so it has no CSP header like the other apps.

## Where things are

- `src/apps.ts`: the app cards. An app without a `url` shows as "Coming soon".
- `src/styles/tokens.css`: the brand palette and fonts. The brand design document is the source; the contrast note there says which colors may be text.
- `public/logo-*.webp`: the logo, exported from the 1254 px master PNG with `cwebp -resize 560 0` and `-resize 1120 0`.
- `public/favicon.svg`: a simplified d20, since the full logo is unreadable at 16 px.
