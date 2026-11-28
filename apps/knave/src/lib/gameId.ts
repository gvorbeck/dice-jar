import { newGameId, slugifyGameId } from '@dice-jar/game-id';
import { CAREERS } from '@/rules/data/careers';
import { MAX_ID } from './paths';

export const MIN_ID = 3;

// IDs read like "gravedigger-brewer-7f3k2a": two careers and six random characters.
const WORDS = CAREERS.map((c) => c.name.replace(' ', '-'));
export const makeGameId = () => newGameId(WORDS);

/** An ID this app would create or open: already in slug form and long enough. */
export const isOpenableId = (id: string) => id.length >= MIN_ID && slugifyGameId(id, MAX_ID) === id;

/** localStorage key of the games this browser opened. */
export const RECENT_GAMES = 'kn.games';
