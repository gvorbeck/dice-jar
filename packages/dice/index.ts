// Standard dice notation (https://en.wikipedia.org/wiki/Dice_notation) for every app's free-form roller; game rolls (2d6 moves, d% tests) stay in the app.
//
// Supported:
//   NdS            roll N dice with S sides            3d6, d20
//   d% / dF        percentile (d100) and Fudge (-1/0/+1) dice
//   khN klN kN     keep the N highest / lowest         4d6kh3, 2d20kl1
//   dhN dlN dN     drop the N highest / lowest         4d6dl1
//   !              exploding — a max-face die rolls again   3d6!
//   + - * /  ( )   arithmetic between any terms        2d6+1d4*2, (1d8+2)/2
// Division rounds down. Whitespace and case are ignored.

class DiceNotationError extends Error {}

export interface DiceRollOutcome {
  notation: string; // normalized input — lowercase, no spaces
  total: number;
  // Human-readable working: dice in brackets with discarded dice in parentheses, joined by the
  // original operators — "[6, 5, 3, (1)] + 2".
  breakdown: string;
}

export type DiceRollParse = { ok: true; outcome: DiceRollOutcome } | { ok: false; error: string };

// Guard rails so a typo like "9999d9999!" can't freeze the tab or bloat the shared game doc.
const MAX_DICE_PER_GROUP = 100;
const MAX_DICE_TOTAL = 300;
const MAX_SIDES = 1000;
// Longest plain number accepted, so a typo can't push an absurd total into the shared log.
const MAX_NUMBER_DIGITS = 6;
// Also bounds parenthesis nesting, so a pasted wall of "(" can't overflow the stack.
export const NOTATION_MAX_LENGTH = 500;

type Rng = () => number;

interface Value {
  value: number;
  text: string;
}

interface Ctx {
  src: string;
  pos: number;
  rng: Rng;
  diceRolled: number;
}

const isDigit = (c: string | undefined): boolean => c !== undefined && c >= '0' && c <= '9';

const peek = (ctx: Ctx): string | undefined => ctx.src[ctx.pos];

const fail = (message: string): never => {
  throw new DiceNotationError(message);
};

const readInt = (ctx: Ctx): number | null => {
  const start = ctx.pos;
  while (isDigit(peek(ctx))) ctx.pos++;
  if (ctx.pos - start > MAX_NUMBER_DIGITS) fail(`Numbers can have at most ${MAX_NUMBER_DIGITS} digits.`);
  return ctx.pos === start ? null : parseInt(ctx.src.slice(start, ctx.pos), 10);
};

// Consume one of the given prefixes (longest first) if the source continues with it.
const eat = (ctx: Ctx, ...tokens: string[]): string | null => {
  for (const t of tokens) {
    if (ctx.src.startsWith(t, ctx.pos)) {
      ctx.pos += t.length;
      return t;
    }
  }
  return null;
};

const rollOne = (ctx: Ctx, sides: number | 'F'): number => {
  ctx.diceRolled++;
  if (ctx.diceRolled > MAX_DICE_TOTAL) fail(`Too many dice — the limit is ${MAX_DICE_TOTAL} per roll.`);
  return sides === 'F' ? Math.floor(ctx.rng() * 3) - 1 : Math.floor(ctx.rng() * sides) + 1;
};

// Parse and roll one dice group; `count` has already been read, ctx sits on the 'd'.
const diceGroup = (ctx: Ctx, count: number): Value => {
  ctx.pos++; // 'd'
  let sides: number | 'F';
  if (eat(ctx, '%')) sides = 100;
  else if (eat(ctx, 'f')) sides = 'F';
  else {
    const n = readInt(ctx);
    if (n === null) return fail('Expected the number of sides after "d" (e.g. d20).');
    sides = n;
  }
  if (sides !== 'F' && (sides < 2 || sides > MAX_SIDES)) fail(`Dice need 2–${MAX_SIDES} sides.`);
  if (count < 1 || count > MAX_DICE_PER_GROUP) fail(`Roll 1–${MAX_DICE_PER_GROUP} dice at a time.`);

  const dice: number[] = [];
  for (let i = 0; i < count; i++) dice.push(rollOne(ctx, sides));

  // Modifiers, in the order written. Explode first so keep/drop sees the extra dice.
  const dropped = new Set<number>();
  for (;;) {
    if (eat(ctx, '!')) {
      if (sides === 'F') fail("Fudge dice can't explode.");
      // Every max-face die (including newly rolled ones) earns another die.
      for (let i = 0; i < dice.length; i++) if (dice[i] === sides) dice.push(rollOne(ctx, sides));
      continue;
    }
    const kind = eat(ctx, 'kh', 'kl', 'k', 'dh', 'dl', 'd');
    if (!kind) break;
    const n = readInt(ctx) ?? 1;
    // Rank the not-yet-discarded dice and mark the ones this modifier removes.
    const live = dice.map((_, i) => i).filter((i) => !dropped.has(i));
    const asc = [...live].sort((a, b) => dice[a]! - dice[b]! || a - b);
    const keep = kind[0] === 'k';
    const fromTop = kind === 'kh' || kind === 'k' || kind === 'dh';
    const ranked = fromTop ? asc.reverse() : asc;
    // Keep → discard everything past the first n; drop → discard the first n.
    (keep ? ranked.slice(n) : ranked.slice(0, n)).forEach((i) => dropped.add(i));
  }

  const kept = dice.filter((_, i) => !dropped.has(i));
  const total = kept.reduce((a, b) => a + b, 0);
  const faces = dice.map((v, i) => (dropped.has(i) ? `(${v})` : `${v}`)).join(', ');
  return { value: total, text: `[${faces}]` };
};

const factor = (ctx: Ctx): Value => {
  if (eat(ctx, '-')) {
    const v = factor(ctx);
    return { value: -v.value, text: `-${v.text}` };
  }
  if (eat(ctx, '(')) {
    const v = expression(ctx);
    if (!eat(ctx, ')')) fail('Missing closing parenthesis.');
    return { value: v.value, text: `(${v.text})` };
  }
  const n = readInt(ctx);
  if (peek(ctx) === 'd') return diceGroup(ctx, n ?? 1);
  if (n === null) {
    const c = peek(ctx);
    return fail(c === undefined ? 'The roll ends early — expected a number or dice.' : `Unexpected "${c}".`);
  }
  return { value: n, text: `${n}` };
};

const term = (ctx: Ctx): Value => {
  let left = factor(ctx);
  for (;;) {
    const op = eat(ctx, '*', '/');
    if (!op) return left;
    const right = factor(ctx);
    if (op === '/' && right.value === 0) fail("Can't divide by zero.");
    left = {
      value: op === '*' ? left.value * right.value : Math.floor(left.value / right.value),
      text: `${left.text} ${op} ${right.text}`,
    };
  }
};

const expression = (ctx: Ctx): Value => {
  let left = term(ctx);
  for (;;) {
    const op = eat(ctx, '+', '-');
    if (!op) return left;
    const right = term(ctx);
    left = {
      value: op === '+' ? left.value + right.value : left.value - right.value,
      text: `${left.text} ${op} ${right.text}`,
    };
  }
};

// Roll a dice-notation string. Never throws — a bad expression comes back as `{ ok: false, error }`
// so the UI can show it inline. `rng` is injectable for deterministic tests.
export const rollNotation = (input: string, rng: Rng = Math.random): DiceRollParse => {
  const notation = input.toLowerCase().replace(/×/g, '*').replace(/÷/g, '/').replace(/\s+/g, '');
  if (!notation) return { ok: false, error: 'Enter a roll, like 2d6+1.' };
  if (notation.length > NOTATION_MAX_LENGTH) return { ok: false, error: `Keep the roll under ${NOTATION_MAX_LENGTH} characters.` };

  const ctx: Ctx = { src: notation, pos: 0, rng, diceRolled: 0 };
  try {
    const result = expression(ctx);
    if (ctx.pos < notation.length) fail(`Unexpected "${notation[ctx.pos]}".`);
    if (!Number.isSafeInteger(result.value)) fail('That total is too large.');
    return { ok: true, outcome: { notation, total: result.value, breakdown: result.text } };
  } catch (e) {
    if (e instanceof DiceNotationError) return { ok: false, error: e.message };
    throw e;
  }
};

/** Rolls notation the app wrote itself (a fixed "1d20", a hit die from rules data), where bad notation is a bug: throws instead of returning it. */
export const roll = (notation: string, rng: Rng = Math.random): DiceRollOutcome => {
  const parsed = rollNotation(notation, rng);
  if (!parsed.ok) throw new Error(`Invalid dice notation "${notation}": ${parsed.error}`);
  return parsed.outcome;
};

/** A shuffled copy (Fisher–Yates), so every order is equally likely; a sort with a random comparator is not. */
export const shuffle = <T>(items: readonly T[], rng: Rng = Math.random): T[] => {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
};

// A trailing dice term with no modifiers, e.g. the "2d6" in "1d8+2d6", so tapping d6 again can bump it
// to "3d6" instead of appending "+d6". Group 1 is whatever precedes the count, 2 the count, 3 the sides.
const TRAILING_DICE = /^(.*?(?:^|[+-]))(\d*)d(\d+)$/;
// A trailing flat modifier, e.g. the "+2" in "2d6+2".
const TRAILING_MOD = /([+-])(\d+)$/;

// Fold one die-button press into the notation field.
export const withDie = (notation: string, sides: number): string => {
  const text = notation.trim();
  if (!text) return `d${sides}`;
  const m = TRAILING_DICE.exec(text);
  if (m && parseInt(m[3]!, 10) === sides) return `${m[1]}${parseInt(m[2] || '1', 10) + 1}d${sides}`;
  return `${text}+d${sides}`;
};

// Nudge the trailing flat modifier by `delta`, adding one if there isn't any, and dropping it at zero.
export const withModifier = (notation: string, delta: number): string => {
  const text = notation.trim();
  if (!text) return text;
  const m = TRAILING_MOD.exec(text);
  const current = m ? parseInt(m[2]!, 10) * (m[1] === '-' ? -1 : 1) : 0;
  const next = current + delta;
  const base = m ? text.slice(0, m.index) : text;
  if (next === 0) return base;
  return `${base}${next > 0 ? '+' : '-'}${Math.abs(next)}`;
};
