/** A live app has a url and a look (its card's class, dressing it as that app); one still coming has neither. */
export type GameApp = { name: string; game: string; blurb: string } & (
  { url: string; look: 'dg' | 'st' } | { url?: undefined; look?: undefined }
);

export const APPS: GameApp[] = [
  {
    name: 'YOURCODENA.ME',
    game: 'Delta Green',
    blurb: "Create an Agent step by step, following the Agent's Handbook, and keep your Agents and roll log together in a shared game.",
    url: 'https://yourcodena.me/',
    look: 'dg',
  },
  {
    name: 'Hearthfire',
    game: 'Stonetop',
    blurb: 'Track a Stonetop campaign: the characters, the GM playbook and the steading, shared with the whole table.',
    url: 'https://hearthfire.camp/',
    look: 'st',
  },
  { name: 'codex-quest', game: 'Basic Fantasy RPG', blurb: 'Characters for Basic Fantasy RPG.' },
  { name: 'glyph-quest', game: 'Knave', blurb: 'Characters for Knave.' },
];

/** The host a card shows under its link, e.g. "hearthfire.camp". */
export const host = (url: string) => new URL(url).host;
