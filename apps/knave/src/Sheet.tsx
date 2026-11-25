import { useState } from 'react';
import { MAX_XP, type Character } from '@/model/character';
import {
  ABILITIES,
  ABILITY_NAMES,
  LEVELS,
  armorClass,
  levelFor,
  raiseScores,
  rerolledHp,
  rollPicks,
  slotCount,
  slotsUsed,
  type Ability,
} from '@/rules';
import { Btn, Check, Counter, DetailFields, Num, Text, type Up } from '@/ui';
import { Hint, TableTitle } from '@/ui/bits';
import { Inventory } from './Inventory';
import { Roller } from './Roller';

/** A level raises three different scores and rerolls hit points (p. 6). XP is never reset. */
function LevelUp({ c, up }: { c: Character; up: Up }) {
  const [picks, setPicks] = useState<Ability[]>([]);
  const go = (chosen: Ability[]) => {
    up((d) => {
      d.level++;
      d.abilities = raiseScores(d.abilities, chosen);
      d.hpMax = rerolledHp(d.level, d.hpMax);
    });
    setPicks([]);
  };
  return (
    <section aria-labelledby="level-up">
      <TableTitle>
        <span id="level-up">LEVEL UP</span>
      </TableTitle>
      <p>
        You have the XP for level {c.level + 1}. Add 1 to three different abilities and reroll your hit points with {c.level + 1}d6 (a total
        not above your last maximum adds 1 to it instead).
      </p>
      {ABILITIES.map((a) => (
        <Check
          key={a}
          selected={picks.includes(a)}
          onChange={(on) => setPicks((p) => (on ? (p.length < 3 ? [...p, a] : p) : p.filter((x) => x !== a)))}
        >
          {a.toUpperCase()} {c.abilities[a]}
        </Check>
      ))}
      <div className="row">
        <Btn className="primary" disabled={picks.length !== 3} onPress={() => go(picks)}>
          Level up
        </Btn>
        <Btn onPress={() => go(rollPicks())}>Pick three at random and level up</Btn>
      </div>
    </section>
  );
}

export function Sheet({
  c,
  up,
  failed,
  onRoll,
}: {
  c: Character;
  up: Up;
  failed: string;
  onRoll: (label: string, detail: string, total: number) => void;
}) {
  const slots = slotCount(c.abilities.con);
  const dead = c.wounds >= slots; // p. 6: all slots filled with wounds
  const next = LEVELS[c.level]?.xp; // undefined at level 10
  return (
    <>
      <h1>{c.name.trim() || 'Unnamed'}</h1>
      <p>
        Level {c.level} {LEVELS[c.level - 1]?.title} · {c.careers.join(', ')}
      </p>
      {c.description && <p>{c.description}</p>}
      <p className="warn" role="alert">
        {failed}
      </p>

      <div className="cols">
        <div>
          <section aria-labelledby="abilities">
            <TableTitle>
              <span id="abilities">ABILITIES</span>
            </TableTitle>
            <dl className="abilities">
              {ABILITIES.map((a) => (
                <div key={a}>
                  <dt>
                    {a.toUpperCase()}
                    <span className="sr-only"> {ABILITY_NAMES[a]}</span>
                  </dt>
                  <dd>{c.abilities[a]}</dd>
                </div>
              ))}
            </dl>
            <Hint>
              Spell books per day: {c.abilities.int} (INT). Companions and patron blessings: {c.abilities.cha} (CHA). Item slots and wounds:
              10 + CON.
            </Hint>
          </section>

          <section aria-labelledby="vitals">
            <TableTitle>
              <span id="vitals">VITALS</span>
            </TableTitle>
            <p>
              Armor Class <b>{armorClass(c.items)}</b>. Slots used {slotsUsed(c.items, c.coins)} of {slots}.
            </p>
            <Counter
              label="HP"
              value={c.hp}
              max={c.hpMax}
              warn={c.hp === 0}
              note={`of ${c.hpMax}`}
              onChange={(v) => up((d) => void (d.hp = v))}
            />
            <Counter
              label="Wounds"
              value={c.wounds}
              max={slots}
              warn={c.wounds > 0}
              note={`of ${slots}`}
              onChange={(v) => up((d) => void (d.wounds = v))}
            />
            <p className="warn" role="status">
              {dead && 'Every slot is filled with a wound: this character is dead (p. 6).'}
              {!dead && c.hp === 0 && 'At 0 HP, each point of damage fills a slot with a wound, from the highest down (p. 6).'}
            </p>
            <div className="row">
              <Btn disabled={dead} onPress={() => up((d) => void (d.hp = d.hpMax))}>
                Rest: HP to maximum
              </Btn>
              <Btn disabled={c.wounds === 0} onPress={() => up((d) => void d.wounds--)}>
                Safe haven: heal a wound
              </Btn>
            </div>
            <Hint>Rest needs two watches of sleep and a meal the night before; a safe haven heals a wound too (p. 6).</Hint>
            <div className="row">
              <Num label="XP" value={c.xp} max={MAX_XP} onChange={(v) => up((d) => void (d.xp = v))} />
              <Num label="Coins" value={c.coins} max={MAX_XP} onChange={(v) => up((d) => void (d.coins = v))} />
            </div>
            <Hint>
              {next === undefined ? 'Level 10 is the top.' : `Level ${c.level + 1} at ${next.toLocaleString('en-US')} XP.`} A coin of
              treasure brought back from a dangerous place is 1 XP (p. 6).
            </Hint>
          </section>

          {levelFor(c.xp) > c.level && <LevelUp c={c} up={up} />}
        </div>
        <div>
          <Inventory c={c} up={up} />
          <Roller c={c} onRoll={onRoll} />

          <section aria-labelledby="details">
            <TableTitle>
              <span id="details">DETAILS</span>
            </TableTitle>
            <DetailFields c={c} up={up} />
          </section>

          <section aria-labelledby="notes">
            <TableTitle>
              <span id="notes">NOTES</span>
            </TableTitle>
            <Text label="Notes" area value={c.notes} onChange={(v) => up((d) => void (d.notes = v))} />
          </section>
        </div>
      </div>
    </>
  );
}
