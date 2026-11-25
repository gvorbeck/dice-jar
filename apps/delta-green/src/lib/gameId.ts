import { slugifyGameId } from '@dice-jar/game-id';
import { store } from '@dice-jar/browser';
import { MAX_ID } from './paths';
import { SAVED_AGENT_BAK, SAVED_AGENT_KEY } from './storage';

export const MIN_ID = 3;

/** An ID this app would create or open: already in slug form and long enough. */
export const isOpenableId = (id: string) => id.length >= MIN_ID && slugifyGameId(id, MAX_ID) === id;

/** localStorage key of the games this browser opened. */
export const RECENT_GAMES = 'dg.games';

/** True when an Agent saved by the old local-only editor is still in this browser. */
export const hasSavedAgent = () => store.get(SAVED_AGENT_KEY) !== null;
/** Once that Agent is added to a game, stop offering it; a `.bak` copy stays in case the write never lands. */
export const forgetSavedAgent = () => {
  const s = store.get(SAVED_AGENT_KEY);
  if (s !== null && store.set(SAVED_AGENT_BAK, s)) store.remove(SAVED_AGENT_KEY); // only once the copy is safe
};
