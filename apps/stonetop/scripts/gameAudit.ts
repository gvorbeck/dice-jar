import { joinGame, splitGame } from '../src/lib/gameShape.ts';

// Read-only check of a backup (`{ gameId: document }`) before any game is moved: could each game be split, and does
// it join back to exactly what is stored? It looks at data only and writes nothing.

export interface GameAudit {
  id: string;
  /** Why the game cannot be moved (empty when it can). */
  problems: string[];
  characters: number;
  rolls: number;
  /** JSON size of the whole stored game, a lower bound on what Firestore counts against its 1 MiB limit. */
  bytes: number;
}

// Key order is not data: compare through a canonical form.
const canonical = (v: unknown): string =>
  JSON.stringify(v, (_k, x: unknown) =>
    x && typeof x === 'object' && !Array.isArray(x)
      ? Object.fromEntries(Object.entries(x as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)))
      : x,
  );

// An empty `diceRolls: []` comes back absent (see joinGame); that is the one normalisation, so it is allowed here.
const withoutEmptyRolls = (raw: Record<string, unknown>) => {
  const { diceRolls, ...rest } = raw;
  return Array.isArray(diceRolls) && diceRolls.length === 0 ? rest : raw;
};

/** Whether two stored games are the same data: key order does not matter, and an empty roll list equals none. */
export const sameGame = (a: Record<string, unknown>, b: Record<string, unknown>) =>
  canonical(withoutEmptyRolls(a)) === canonical(withoutEmptyRolls(b));

export const auditGames = (games: Record<string, unknown>): GameAudit[] =>
  Object.entries(games).map(([id, raw]) => {
    const bytes = new TextEncoder().encode(JSON.stringify(raw)).length;
    const result = splitGame(raw as Record<string, unknown>);
    if (!result.ok) return { id, problems: result.problems, characters: 0, rolls: 0, bytes };
    const { split } = result;
    const same = sameGame(joinGame(split), raw as Record<string, unknown>);
    return {
      id,
      problems: same ? [] : ['splitting and joining does not give back the stored document'],
      characters: split.characters.length,
      rolls: split.rolls.length,
      bytes,
    };
  });
