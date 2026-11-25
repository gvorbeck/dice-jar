import { z } from 'zod';
import { ABILITIES, MAX_SCORE, START_POINTS, slotCount, slotsUsed, type Ability } from '@/rules';

/** Lengths the rules in firestore.rules also enforce. */
export const MAX_LINE = 100;
export const MAX_PROSE = 4000;
export const MAX_ITEMS = 60;
export const MAX_XP = 9_999_999;
/** The largest total a roll can log. */
export const MAX_TOTAL = 9_999_999;

const score = z.number().int().min(0).max(MAX_SCORE);
const whole = (max: number) => z.number().int().min(0).max(max);
const item = z.object({ name: z.string().max(MAX_LINE), slots: whole(99), armor: z.boolean() });

const schema = z.object({
  version: z.literal(1),
  created: z.boolean(),
  name: z.string().max(MAX_LINE),
  description: z.string().max(MAX_PROSE),
  abilities: z.object(Object.fromEntries(ABILITIES.map((a) => [a, score])) as Record<Ability, typeof score>),
  careers: z.array(z.string().max(MAX_LINE)).max(2),
  level: z.number().int().min(1).max(10),
  xp: whole(MAX_XP),
  hp: whole(999),
  hpMax: whole(999),
  wounds: whole(99),
  coins: whole(MAX_XP),
  items: z.array(item).max(MAX_ITEMS),
  notes: z.string().max(MAX_PROSE),
});

export type Character = z.infer<typeof schema>;
export type Item = Character['items'][number];

export const newCharacter = (): Character => ({
  version: 1,
  created: false,
  name: '',
  description: '',
  abilities: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
  careers: [],
  level: 1,
  xp: 0,
  hp: 0,
  hpMax: 0,
  wounds: 0,
  coins: 0,
  items: [],
  notes: '',
});

/** Stored data is never trusted: throws when it isn't a sheet this version understands. */
export const parseCharacter = (raw: unknown): Character => schema.parse(raw);

/** Set by 'Open sheet' once PC Creation (p. 4) is done. A flag, not a guess from the fields: the name and the gear change in play, and the creator's rolls must not reopen on a played sheet. */
export const isCreated = (c: Character) => c.created;

/** What still blocks the sheet, in the order the creation steps ask for it (p. 4). */
export const missing = (c: Character) =>
  [
    Object.values(c.abilities).reduce((a, b) => a + b, 0) < START_POINTS && `Place ${START_POINTS} ability points`,
    c.careers.length < 2 && 'Choose two careers',
    c.hpMax < 1 && 'Roll hit points',
    slotsUsed(c.items, c.coins) > slotCount(c.abilities.con) && 'Carry no more than your item slots', // p. 4: only what you can carry
    !c.name.trim() && 'Name your character',
  ].filter((m): m is string => !!m);

/** The fields the game page lists, copied beside the sheet so listing never parses one. */
export const summary = (c: Character) => ({
  name: c.name.trim(),
  careers: c.careers.join(', '),
  level: c.level,
  hp: c.hp,
  hpMax: c.hpMax,
});
