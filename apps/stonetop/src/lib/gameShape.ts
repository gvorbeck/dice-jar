// The move from one `games/{id}` document (characters and rolls as arrays inside it) to a game document plus
// `characters/{id}` and `rolls/{id}` subcollections. See MIGRATION.md. Pure functions over raw Firestore data and
// no Firestore calls, so they are testable locally and the same code can drive the migration script, the reverse
// script and the app's backup export.
//
// Lossless by construction: every field of the raw data is carried over untouched, including ones this build
// doesn't know about. Anything that cannot be carried over exactly makes `splitGame` refuse the game (it never
// drops or repairs data), so a refused game is left as it is and reported.

export const SCHEMA_VERSION = 2;

type Raw = Record<string, unknown>;
export interface SplitGame {
  game: Raw;
  characters: { id: string; data: Raw }[];
  rolls: { id: string; data: Raw }[];
}
export type SplitResult = { ok: true; split: SplitGame } | { ok: false; problems: string[] };

const isObject = (v: unknown): v is Raw => typeof v === 'object' && v !== null && !Array.isArray(v);

// Firestore document ids: not empty, no '/', not '.' or '..', not `__x__`, at most 1500 bytes.
const isDocId = (id: unknown): id is string =>
  typeof id === 'string' &&
  id !== '' &&
  id !== '.' &&
  id !== '..' &&
  !id.includes('/') &&
  !/^__.*__$/.test(id) &&
  new TextEncoder().encode(id).length <= 1500;

// Position in the original array, so the order survives (a subcollection has none of its own).
const ORDER = 'order';

const entries = (name: string, list: unknown, problems: string[]) => {
  if (list === undefined) return [];
  if (!Array.isArray(list)) {
    problems.push(`${name} is not an array`);
    return [];
  }
  const seen = new Set<string>();
  const out: { id: string; data: Raw }[] = [];
  list.forEach((item, i) => {
    if (!isObject(item)) return void problems.push(`${name}[${i}] is not an object`);
    if (!isDocId(item.id)) return void problems.push(`${name}[${i}] has no usable id`);
    if (ORDER in item) return void problems.push(`${name}[${i}] already has an "${ORDER}" field`);
    if (seen.has(item.id)) return void problems.push(`${name}[${i}] repeats the id ${item.id}`);
    seen.add(item.id);
    out.push({ id: item.id, data: { ...item, [ORDER]: i } });
  });
  return out;
};

/** The v1 document, split for v2. `characters: []` stays in the game document because v1 builds' rules and parsers require the list. */
export const splitGame = (raw: Raw): SplitResult => {
  const problems: string[] = [];
  if (!isObject(raw)) return { ok: false, problems: ['the document is not an object'] };
  if ('schemaVersion' in raw) problems.push('the document already has a schemaVersion');
  const characters = entries('characters', raw.characters, problems);
  const rolls = entries('diceRolls', raw.diceRolls, problems);
  if (problems.length) return { ok: false, problems };
  const { diceRolls: _rolls, ...rest } = raw;
  return { ok: true, split: { game: { ...rest, characters: [], schemaVersion: SCHEMA_VERSION }, characters, rolls } };
};

const inOrder = (docs: { id: string; data: Raw }[]) =>
  [...docs]
    .sort((a, b) => (Number(a.data[ORDER]) || 0) - (Number(b.data[ORDER]) || 0) || a.id.localeCompare(b.id))
    .map(({ data }) => {
      const { [ORDER]: _order, ...item } = data;
      return item;
    });

/** The inverse of `splitGame`: the v1 document, rebuilt from a v2 game and its subcollections. Used to prove a migration and to roll one back. */
export const joinGame = ({ game, characters, rolls }: SplitGame): Raw => {
  const { schemaVersion: _version, ...rest } = game;
  // shortcut: an empty `diceRolls: []` and an absent one come back the same (absent); the app reads both as no rolls.
  return { ...rest, characters: inOrder(characters), ...(rolls.length ? { diceRolls: inOrder(rolls) } : {}) };
};
