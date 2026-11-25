// Where things live, in one place: Firestore document paths (layout in games.ts) and page URLs.
export const gamePath = (g: string) => `games/${g}`;
export const charactersPath = (g: string) => `games/${g}/characters`;
export const characterPath = (g: string, c: string) => `${charactersPath(g)}/${c}`;
export const rollsPath = (g: string) => `games/${g}/rolls`;

/** The longest game ID; also passed to slugifyGameId so the Open box never makes one the rules reject. */
export const MAX_ID = 100;

export const gameUrl = (g: string) => `/g/${g}`;
export const characterUrl = (g: string, c: string) => `${gameUrl(g)}/c/${c}`;
