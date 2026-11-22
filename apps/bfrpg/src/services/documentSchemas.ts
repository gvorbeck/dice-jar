import { z } from 'zod';

// What a saved character and game may hold, written once. The app reads with these (a failure is logged, never fatal) and imports are refused by them.
// shortcut: top-level objects are loose, so a field nobody listed survives; upgrade: make them strict and mirror the key lists in firestore.rules once the stored shape is settled.

/** The stored `schemaVersion` of characters and games. Documents written before it kept a decimal in settings.version (2.6 was the last); that counts as an older schema. */
export const SCHEMA_VERSION = 3;

// shortcut: a missing modifier is tolerated as stored (an old export may leave it out), upgrade: derive it from the score once the sheet needs it.
const abilityScore = z.looseObject({ value: z.number(), modifier: z.number().optional() });

export const characterSchema = z.looseObject({
  name: z.string(),
  race: z.string(),
  class: z.string(), // a class ID; a combination like "fighter-magic-user" is one ID
  level: z.number(),
  xp: z.number(),
  abilities: z.looseObject({
    strength: abilityScore,
    dexterity: abilityScore,
    constitution: abilityScore,
    intelligence: abilityScore,
    wisdom: abilityScore,
    charisma: abilityScore,
  }),
  hp: z.looseObject({ current: z.number(), max: z.number() }),
  currency: z.looseObject({ gold: z.number() }),
  // shortcut: about 10 stored items have a null amount; it's tolerated as stored, upgrade: default it once the sheet's reading of it is decided.
  equipment: z.array(z.looseObject({ name: z.string(), amount: z.number().nullish() })),
  languages: z.array(z.string()).optional(),
  cantrips: z.array(z.looseObject({ name: z.string() })).optional(),
  spells: z.array(z.looseObject({ name: z.string() })).optional(),
  avatar: z.string().optional(),
  desc: z.string().optional(),
  settings: z.looseObject({}).optional(),
  schemaVersion: z.number().optional(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
});

export const gameSchema = z.looseObject({
  name: z.string(),
  notes: z.string().optional(),
  schemaVersion: z.number().optional(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
  combatants: z.array(z.looseObject({ name: z.string(), ac: z.number().optional(), initiative: z.number() })).optional(),
  players: z.array(z.looseObject({ character: z.string(), user: z.string() })).optional(),
});

/** The first problem in a document, for a log line or an error message; undefined when it fits. */
export function problemWith(schema: z.ZodType, data: unknown): string | undefined {
  const result = schema.safeParse(data);
  if (result.success) return undefined;
  const [issue] = result.error.issues;
  return `${issue?.path.join('.') || 'document'}: ${issue?.message}`;
}
