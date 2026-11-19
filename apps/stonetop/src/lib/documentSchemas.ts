import { z } from 'zod';
import { restoredLevel } from '@/lib/gameShape';
import { ROLL_TEXT_MAX_LENGTH } from '@/lib/constants';

// What a game, a character and a roll may hold when a backup is restored: the bounds and field lists of firestore.rules, written once.
// rulesAgree.test.ts reads them from the rules and fails when they differ. What the reader needs (a roll's mode, dice, mod and total) is
// left to the reader: a roll it would drop is refused by comparing its result with the backup.

const MAX_CHARACTERS = 20; // the app's party limit; the rules cannot count a subcollection
export const LIMITS = { name: 200, playbook: 50, level: 100, sheetFields: 100, characterId: 100, dice: 50 };

const text = (max: number) => z.string().max(max).nullish();
const number = z.number().nullish();

export const characterSchema = z.strictObject({
  id: z.string().min(1),
  name: z.string().max(LIMITS.name),
  playbook: z.string().max(LIMITS.playbook),
  // A missing level, or a number written as text, is repaired on restore (restoredLevel); anything else is refused, not guessed.
  level: z
    .unknown()
    .optional()
    .refine((level) => {
      const n = restoredLevel(level);
      return n !== undefined && n >= 0 && n <= LIMITS.level;
    }),
  data: z
    .record(z.string(), z.unknown())
    .refine((sheet) => Object.keys(sheet).length <= LIMITS.sheetFields)
    .optional(),
});

export const rollSchema = z.strictObject({
  id: z.string().min(1),
  characterId: z.string().max(LIMITS.characterId),
  createdAt: z.number(),
  characterName: text(ROLL_TEXT_MAX_LENGTH),
  moveName: text(ROLL_TEXT_MAX_LENGTH),
  resource: text(ROLL_TEXT_MAX_LENGTH),
  stat: text(50),
  band: text(50),
  notation: text(2000),
  breakdown: text(10000),
  dropped: number,
  burned: z.boolean().optional(),
  dice: z.array(z.unknown()).max(LIMITS.dice).optional(),
  mode: z.unknown().optional(),
  mod: z.unknown().optional(),
  total: z.unknown().optional(),
});

// The game as a backup holds it: one document, with the characters and rolls inside. The rules take the same fields, minus `diceRolls`
// (a restore moves the rolls to their own documents) and plus `schemaVersion` and `restoreToken`, which a restore sets itself.
export const gameSchema = z.strictObject({
  name: z.string(),
  createdAt: z.number(),
  characters: z.array(z.unknown()).max(MAX_CHARACTERS),
  diceRolls: z.array(z.unknown()).optional(),
  content: z.unknown().optional(),
  threats: z.unknown().optional(),
  iWonder: z.unknown().optional(),
  steading: z.unknown().optional(),
  notes: z.unknown().optional(),
  notesLocks: z.unknown().optional(),
});

const PROBLEMS: Record<string, string> = {
  id: 'has no id',
  name: `needs a name of up to ${LIMITS.name} characters`,
  playbook: `needs a playbook of up to ${LIMITS.playbook} characters`,
  level: `needs a level that is a number from 0 to ${LIMITS.level}`,
  data: `has sheet data that is not a set of up to ${LIMITS.sheetFields} fields`,
  characterId: `needs a character id of up to ${LIMITS.characterId} characters`,
  createdAt: 'needs a time it was made',
  characterName: 'has text that is too long',
  moveName: 'has text that is too long',
  resource: 'has text that is too long',
  stat: 'has text that is too long',
  band: 'has text that is too long',
  notation: 'has working that is too long',
  breakdown: 'has working that is too long',
  dropped: 'has a number that is not a number',
  burned: 'has a burned that is not true or false',
  dice: `needs dice that are a list of up to ${LIMITS.dice}`,
};

/** The first thing wrong with a character or roll, in words for the import message: "has more than..." and the like. */
const problemWith = (schema: typeof characterSchema | typeof rollSchema, piece: unknown): string | undefined => {
  const found = schema.safeParse(piece);
  if (found.success) return undefined;
  const issue = found.error.issues[0]!;
  if (issue.code === 'unrecognized_keys') return `has fields this version of Hearthfire cannot store (${issue.keys.join(', ')})`;
  return PROBLEMS[String(issue.path[0])] ?? 'is not a character or roll this version of Hearthfire can restore';
};

/** The first character or roll in a backup that could not be restored, as "character 2 needs…", or undefined when all can. */
export const piecesProblem = (game: Record<string, unknown>): string | undefined => {
  const lists = [
    ['character', game.characters, characterSchema],
    ['roll', game.diceRolls, rollSchema],
  ] as const;
  for (const [what, list, schema] of lists) {
    if (!Array.isArray(list)) continue;
    for (const [i, piece] of list.entries()) {
      const found = problemWith(schema, piece);
      if (found) return `${what} ${i + 1} ${found}`;
    }
  }
  return undefined;
};

/** Whether a backup's game fields are all allowed and well-formed, and which fields it has that this version cannot store. */
export const checkGame = (game: unknown): { valid: boolean; unknownFields: string[] } => {
  const found = gameSchema.safeParse(game);
  if (found.success) return { valid: true, unknownFields: [] };
  const unknown = found.error.issues.find((issue) => issue.code === 'unrecognized_keys');
  return { valid: false, unknownFields: unknown?.code === 'unrecognized_keys' ? unknown.keys : [] };
};
