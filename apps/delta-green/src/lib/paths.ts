// Where things live, in one place: Firestore document paths (shared with the Functions; layout in games.ts) and page URLs.
export const gamePath = (g: string) => `games/${g}`;
export const agentsPath = (g: string) => `games/${g}/agents`;
export const agentPath = (g: string, a: string) => `${agentsPath(g)}/${a}`;
export const rollsPath = (g: string) => `games/${g}/rolls`;
/** SAN losses the Discord bot is holding for a player's choice: amount and kind only, readable by the game page (Functions write it). */
export const pendingSanPath = (g: string) => `games/${g}/pendingSan`;
/** The game's Discord webhook (Functions only; the rules deny browsers). */
export const secretPath = (g: string) => `gameSecrets/${g}`;

/** The longest game ID; also passed to slugifyGameId so the Open box never makes one the Functions reject. */
export const MAX_ID = 100;
const GAME_ID = new RegExp(`^[a-z0-9-]{1,${MAX_ID}}$`);
/** Server-side check (Functions): any ID this app could have made, older short ones included. Kept here, free of browser packages, because the Functions bundle imports this file. */
export const isGameId = (s: string) => GAME_ID.test(s);

export const gameUrl = (g: string) => `/g/${g}`;
export const agentUrl = (g: string, a: string) => `${gameUrl(g)}/a/${a}`;
