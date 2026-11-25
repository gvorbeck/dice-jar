import { useState } from 'react';
import { roll, rollNotation } from '@dice-jar/dice';
import { MAX_TOTAL, type Character } from '@/model/character';
import { ABILITIES, DEFAULT_DIFFICULTY, checkResult, checkTarget } from '@/rules';
import type { Ability } from '@/rules';
import { Btn, Num, Select } from '@/ui';
import { Alert, TableTitle } from '@/ui/bits';

type Kind = 'check' | 'attack';
const SIGNED = (n: number) => (n < 0 ? `− ${-n}` : `+ ${n}`);

/** Checks (pp. 6-7), attacks (p. 20) and free dice. `onRoll` logs to the game; what it returns is shown here too. */
export function Roller({ c, onRoll }: { c: Character; onRoll: (label: string, detail: string, total: number) => void }) {
  const [kind, setKind] = useState<Kind>('check');
  const [ability, setAbility] = useState<Ability | 'none'>('str');
  const [edge, setEdge] = useState(0);
  const [difficulty, setDifficulty] = useState(DEFAULT_DIFFICULTY);
  const [ac, setAc] = useState(12);
  const [dice, setDice] = useState('d6');
  const [bad, setBad] = useState('');
  const [said, setSaid] = useState('');

  const say = (label: string, detail: string, total: number) => {
    setSaid(`${label}: ${detail}`);
    onRoll(label, detail, total);
  };
  const check = () => {
    const d20 = roll('d20').total,
      score = ability === 'none' ? 0 : c.abilities[ability],
      attack = kind === 'attack',
      target = attack ? ac : checkTarget(difficulty);
    const r = checkResult(d20, score + edge, target, attack);
    const tag = ability === 'none' ? '' : ` (${ability.toUpperCase()})`;
    const detail = [
      `d20 ${d20}`,
      ability !== 'none' && `${SIGNED(score)} ${ability.toUpperCase()}`,
      edge !== 0 && `${SIGNED(edge)} ${edge > 0 ? 'advantage' : 'disadvantage'}`,
      `= ${r.total} against ${target}`,
    ]
      .filter(Boolean)
      .join(' ');
    say(attack ? `Attack${tag}` : `Check${tag}`, `${detail}: ${[r.hit ? 'success' : 'failure', ...r.notes].join(', ')}`, r.total);
  };
  const free = () => {
    const r = rollNotation(dice);
    setBad(r.ok ? (Math.abs(r.outcome.total) > MAX_TOTAL ? 'That total is too large to log.' : '') : r.error);
    if (r.ok && Math.abs(r.outcome.total) <= MAX_TOTAL)
      say(r.outcome.notation, `${r.outcome.breakdown} = ${r.outcome.total}`, r.outcome.total);
  };

  return (
    <section aria-labelledby="rolls">
      <TableTitle>
        <span id="rolls">ROLL</span>
      </TableTitle>
      <div className="row">
        <Select label="Roll type" value={kind} onChange={(v) => setKind(v as Kind)}>
          <option value="check">Check</option>
          <option value="attack">Attack</option>
        </Select>
        <Select label="Ability" value={ability} onChange={(v) => setAbility(v as Ability | 'none')}>
          {ABILITIES.map((a) => (
            <option key={a} value={a}>
              {a.toUpperCase()} {c.abilities[a]}
            </option>
          ))}
          <option value="none">No ability</option>
        </Select>
        <Select label="Advantage" value={edge} onChange={(v) => setEdge(Number(v))}>
          <option value={0}>No advantage</option>
          <option value={5}>Advantage +5</option>
          <option value={-5}>Disadvantage −5</option>
        </Select>
        {kind === 'check' ? (
          <Num label="Difficulty (0-10)" value={difficulty} max={10} onChange={setDifficulty} />
        ) : (
          <Num label="Target Armor Class" value={ac} max={30} onChange={setAc} />
        )}
        <Btn className="primary" onPress={check}>
          Roll d20
        </Btn>
      </div>
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          free();
        }}
      >
        <label className="field">
          Dice
          <input value={dice} onChange={(e) => setDice(e.target.value)} autoComplete="off" spellCheck={false} />
        </label>
        <button className="btn">Roll dice</button>
      </form>
      <Alert>{bad}</Alert>
      <p role="status">{said}</p>
    </section>
  );
}
