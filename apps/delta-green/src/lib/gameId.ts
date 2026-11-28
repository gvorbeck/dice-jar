import { store } from '@dice-jar/browser';
import { SAVED_AGENT_BAK, SAVED_AGENT_KEY } from './storage';

/** localStorage key of the games this browser opened. */
export const RECENT_GAMES = 'dg.games';

/** True when an Agent saved by the old local-only editor is still in this browser. */
export const hasSavedAgent = () => store.get(SAVED_AGENT_KEY) !== null;
/** Once that Agent is added to a game, stop offering it; a `.bak` copy stays in case the write never lands. */
export const forgetSavedAgent = () => {
  const s = store.get(SAVED_AGENT_KEY);
  if (s !== null && store.set(SAVED_AGENT_BAK, s)) store.remove(SAVED_AGENT_KEY); // only once the copy is safe
};
