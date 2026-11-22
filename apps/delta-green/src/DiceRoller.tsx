import { useId, useState } from 'react';
import { NOTATION_MAX_LENGTH, rollNotation, type DiceRollParse } from '@dice-jar/dice';
import { Btn } from './ui';

// The total is floored at 0 like the rest of the app's damage and loss numbers, so `1d4-5` reads `[1] - 5 → 0`.
export const describeRoll = (r: DiceRollParse, n: number): string =>
  `#${n} ${r.ok ? `${r.outcome.notation.toUpperCase()} ${r.outcome.breakdown} → ${Math.max(0, r.outcome.total)}` : r.error}`;

/** Any dice notation (2D6+1, 4d6kh3, 1D8+1D6): damage you deal, anything outward. */
// shortcut: the /dg roll bot (functions/src/dg.ts) still has its own narrower grammar, because Functions can't import @dice-jar packages; unify when the bot needs the same dice.
// shortcut: the result is shown here only, not in the game's roll log, because the rules only accept d% tests from browsers; log it once they allow dice entries.
export function DiceRoller() {
  const id = useId();
  const [expr, setExpr] = useState('1D6');
  const [out, setOut] = useState('');
  const [n, setN] = useState(0);
  const roll = () => {
    const r = rollNotation(expr);
    setN(n + 1); // numbers every outcome, errors too, so identical text still changes and gets announced
    setOut(describeRoll(r, n + 1));
  };
  return (
    <form
      className="row noprint"
      onSubmit={(e) => {
        e.preventDefault();
        roll();
      }}
    >
      <label className="lbl" htmlFor={id}>
        Dice
      </label>
      <input
        id={id}
        className="short-input"
        autoComplete="off"
        spellCheck={false}
        maxLength={NOTATION_MAX_LENGTH}
        value={expr}
        onChange={(e) => setExpr(e.target.value)}
      />
      <Btn onPress={roll}>Roll</Btn>
      <output>{out}</output>
    </form>
  );
}
