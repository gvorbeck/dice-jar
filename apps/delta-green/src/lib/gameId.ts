import { slugifyGameId } from '@dice-jar/game-id';
import { store } from '@dice-jar/browser';
import { SAVED_AGENT_BAK, SAVED_AGENT_KEY } from './storage';

export const MIN_ID = 3;
const MAX_ID = 100; // slugifyGameId's default limit
/** Server-side check (Functions): any ID this app could have made, older short ones included. */
const GAME_ID = new RegExp(`^[a-z0-9-]{1,${MAX_ID}}$`);
export const isGameId = (s: string) => GAME_ID.test(s);

/** An ID this app would create or open: already in slug form and long enough. */
export const isOpenableId = (id: string) => id.length >= MIN_ID && slugifyGameId(id) === id;

// Games this browser has opened, newest first, so the landing page can offer a way back in.
const RECENT = 'dg.games';
export const recentGames = (): string[] => {
  try {
    const v = JSON.parse(store.get(RECENT) ?? '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
};
export const rememberGame = (id: string) => {
  store.set(RECENT, JSON.stringify([id, ...recentGames().filter((x) => x !== id)].slice(0, 5)));
};

/** True when an Agent saved by the old local-only editor is still in this browser. */
export const hasSavedAgent = () => store.get(SAVED_AGENT_KEY) !== null;
/** Once that Agent is added to a game, stop offering it; a `.bak` copy stays in case the write never lands. */
export const forgetSavedAgent = () => {
  const s = store.get(SAVED_AGENT_KEY);
  if (s !== null && store.set(SAVED_AGENT_BAK, s)) store.remove(SAVED_AGENT_KEY); // only once the copy is safe
};
