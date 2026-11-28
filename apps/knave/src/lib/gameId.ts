import { newGameId } from '@dice-jar/game-id';
import { CAREERS } from '@/rules/data/careers';

// IDs read like "gravedigger-brewer-7f3k2a": two careers and six random characters.
const WORDS = CAREERS.map((c) => c.name.replace(' ', '-'));
export const makeGameId = () => newGameId(WORDS);

/** localStorage key of the games this browser opened. */
export const RECENT_GAMES = 'kn.games';
