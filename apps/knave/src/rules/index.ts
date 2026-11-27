import { roll } from '@dice-jar/dice';
import { CAREERS } from './data/careers';
import { SPELLS } from './data/spells';

// Every rule here cites the Knave 2e page it comes from.

export const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;
export type Ability = (typeof ABILITIES)[number];
export type Scores = Record<Ability, number>;
/** p. 4 */
export const ABILITY_NAMES: Record<Ability, string> = {
  str: 'strength',
  dex: 'dexterity',
  con: 'constitution',
  int: 'intelligence',
  wis: 'wisdom',
  cha: 'charisma',
};
export const MAX_SCORE = 10; // p. 4: scores run 0 to 10
export const START_POINTS = 3; // p. 4

/** p. 4: each die adds 1 to the ability at its number, so 3-5-5 makes CON 1 and WIS 2. */
export const scoresFromDice = (dice: readonly number[]): Scores => {
  const s: Scores = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };
  for (const d of dice) s[ABILITIES[d - 1]!]++;
  return s;
};
export const rollScores = () => scoresFromDice(Array.from({ length: START_POINTS }, () => roll('d6').total));

/** p. 4, 6: 10 + CON item slots (and as many wounds before death). */
export const slotCount = (con: number) => 10 + con;
export const COINS_PER_SLOT = 500; // p. 6
/** p. 6: slots taken by gear and by coins (500 coins fill a slot). */
// shortcut: reads "500 coins use a full slot" as whole slots only, so 499 coins take none; round up if the owner prefers.
export const slotsUsed = (items: readonly { slots: number }[], coins: number) =>
  items.reduce((n, i) => n + i.slots, 0) + Math.floor(coins / COINS_PER_SLOT);
/** p. 4: you only take what you can carry, so an item needs its slots free. */
export const fits = (items: readonly { slots: number }[], coins: number, slots: number, con: number) =>
  slotsUsed(items, coins) + slots <= slotCount(con);
/** p. 6: wounds fill slots from the highest down, so gear that reaches into them must be dropped. */
export const droppedSlots = (used: number, max: number, wounds: number) => Math.max(0, used - (max - wounds));

/** p. 38: up to 7 armor pieces, each 1 AP. p. 4: AC is AP + 11. */
const MAX_ARMOR = 7;
export const armorClass = (items: readonly { armor: boolean }[]) => 11 + Math.min(MAX_ARMOR, items.filter((i) => i.armor).length);

/** p. 6, Leveling Up: XP needed for each level and the title. Hit points are rolled with as many d6 as the level. */
export const LEVELS = [
  { xp: 0, title: 'Wretch' },
  { xp: 2000, title: 'Lowlife' },
  { xp: 4000, title: 'Hoodlum' },
  { xp: 8000, title: 'Fool' },
  { xp: 16000, title: 'Dastard' },
  { xp: 32000, title: 'Cad' },
  { xp: 64000, title: 'Gadabout' },
  { xp: 125000, title: 'Rogue' },
  { xp: 250000, title: 'Jack' },
  { xp: 500000, title: 'Knave' },
] as const;
export const levelFor = (xp: number) => LEVELS.filter((l) => xp >= l.xp).length;

/** p. 6: a new level rolls HP with one more d6; a total not above the last maximum adds 1 to it instead. */
export const rerolledHp = (level: number, lastMax: number) => {
  const total = roll(`${level}d6`).total;
  return total > lastMax ? total : lastMax + 1;
};
/** p. 6: a level adds 1 to three different scores (10 is the most a score can be). */
export const raiseScores = (s: Scores, picks: readonly Ability[]): Scores => {
  const out = { ...s };
  for (const a of new Set(picks)) out[a] = Math.min(MAX_SCORE, out[a] + 1);
  return out;
};

/** p. 6: the three scores a level raises may be picked or random; this picks three different ones. */
export const rollPicks = () => {
  const picks = new Set<Ability>();
  while (picks.size < 3) picks.add(ABILITIES[roll('d6').total - 1]!);
  return [...picks];
};

/** pp. 6-7, 20: a d20 plus an ability against 11 + difficulty (5 unless the GM says otherwise), or against Armor Class for an attack. */
export const DEFAULT_DIFFICULTY = 5;
export const checkTarget = (difficulty: number) => 11 + difficulty;
export const checkResult = (d20: number, bonus: number, target: number, attack: boolean) => {
  const total = d20 + bonus;
  const notes = [];
  if (attack && total >= 21) notes.push('free maneuver'); // p. 20
  if (attack && d20 === 1) notes.push('weapon breaks'); // p. 20
  return { total, hit: total >= target, notes };
};

/** p. 4: the items of these careers, in order. */
export const careerItems = (careers: readonly string[]) => careers.flatMap((n) => CAREERS.find((c) => c.name === n)?.items ?? []);
/** p. 4: "you gain those careers' items". Swapping a career takes its items back out and puts the new one's in; the rest of the gear is left alone. */
export const withCareerItems = <T extends { name: string }>(
  items: readonly T[],
  before: readonly string[],
  after: readonly string[],
  make: (name: string) => T,
) => {
  const kept = [...items];
  for (const name of careerItems(before.filter((c) => !after.includes(c)))) {
    const i = kept.findIndex((x) => x.name === name);
    if (i >= 0) kept.splice(i, 1);
  }
  return [...kept, ...careerItems(after.filter((c) => !before.includes(c))).map(make)];
};
/** For each name in order, whether the gear holds a copy for it: a name listed twice needs two copies. */
export const carried = (names: readonly string[], items: readonly { name: string }[]) =>
  names.map((n, i) => items.filter((x) => x.name === n).length > names.slice(0, i).filter((m) => m === n).length);
/** The careers after choosing `name` for slot `i`; an empty name clears that slot and the ones after it. */
export const withCareer = (careers: readonly string[], i: number, name: string) =>
  name ? Object.assign([...careers], { [i]: name }) : careers.slice(0, i);

/** pp. 4-5: careers and spell books are rolled on d100, and a roll of 00 is 100. */
export const rollCareer = (taken: readonly string[] = []) => {
  let career;
  // Not the book's rule: a repeat gains nothing, so this app rolls again.
  do career = CAREERS[roll('d100').total - 1]!;
  while (taken.includes(career.name));
  return career;
};
export const rollSpell = () => SPELLS[roll('d100').total - 1]!;
export const rollCoins = () => roll('3d6*10').total; // p. 4
export const rollHp = () => roll('d6').total; // p. 4

/** p. 38: armor pieces, 1 slot and 1 AP each. */
export const ARMOR_PIECES = ['Shield', 'Helmet', 'Gambeson', 'Mail shirt', 'Breastplate', 'Arm plate', 'Leg plate'] as const;
/** p. 38: weapons by kind, with slots and damage. */
export const WEAPONS = [
  { kind: 'One-handed weapon', slots: 1, damage: 'd6' },
  { kind: 'Two-handed weapon', slots: 2, damage: 'd8' },
  { kind: 'Sling', slots: 1, damage: 'd4' },
  { kind: 'Bow', slots: 2, damage: 'd6' },
] as const;
/** p. 4: starting gear besides careers, armor and weapons. One slot each (p. 6: small items that fit in a hand share one). */
export const STARTING_GEAR = ['2 rations', "50' rope", '2 torches', 'Quiver of 20 arrows'] as const;
