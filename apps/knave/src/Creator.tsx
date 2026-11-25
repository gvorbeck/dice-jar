import { useState } from 'react';
import { MAX_ITEMS, missing, type Character, type Item } from '@/model/character';
import {
  ABILITIES,
  ABILITY_NAMES,
  ARMOR_PIECES,
  MAX_SCORE,
  START_POINTS,
  STARTING_GEAR,
  WEAPONS,
  rollCareer,
  rollCoins,
  rollHp,
  rollScores,
  rollSpell,
  slotCount,
  careerItems,
  withCareer,
} from '@/rules';
import { CAREERS } from '@/rules/data/careers';
import { Btn, Check, Counter, DetailFields, Select, type Up } from '@/ui';
import { Hint, TableTitle } from '@/ui/bits';
import { Inventory } from './Inventory';

const STEPS = ['Abilities', 'Careers', 'Gear', 'Details'] as const;
const gear = (name: string, slots = 1, armor = false): Item => ({ name, slots, armor });
const SPELLBOOK = 'Spellbook: ';

/** Creation in the order of PC Creation (p. 4): abilities and hit points, careers, gear, then the finishing touches. */
export function Creator({ c, up, onDone }: { c: Character; up: Up; onDone: () => void }) {
  const [step, setStep] = useState(0);
  const left = START_POINTS - Object.values(c.abilities).reduce((a, b) => a + b, 0);
  const has = (name: string) => c.items.some((i) => i.name === name);
  const add = (item: Item) => up((d) => void (d.items.length < MAX_ITEMS && d.items.push(item)));
  const toggle = (item: Item, on: boolean) => (on ? add(item) : up((d) => void (d.items = d.items.filter((i) => i.name !== item.name))));
  const startItems = careerItems(c.careers);
  const books = c.items.filter((i) => i.name.startsWith(SPELLBOOK)).length;
  const issues = missing(c);

  const setCareer = (i: number, name: string) => up((d) => void (d.careers = withCareer(d.careers, i, name)));

  return (
    <>
      <h1>Create a character</h1>
      <nav aria-label="Creation steps">
        <ol className="steps">
          {STEPS.map((s, i) => (
            <li key={s}>
              <button className="btn" aria-current={i === step ? 'step' : undefined} onClick={() => setStep(i)}>
                {i + 1}. {s}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      {step === 0 && (
        <section aria-labelledby="abilities">
          <TableTitle>
            <span id="abilities">ABILITIES AND HIT POINTS</span>
          </TableTitle>
          <p>
            Place {START_POINTS} points among your abilities, more than one in the same score if you like. Or let fate decide: roll 3d6, and
            each die adds 1 to the ability with its number (p. 4).
          </p>
          <div className="row">
            <Btn onPress={() => up((d) => void (d.abilities = rollScores()))}>Roll 3d6</Btn>
            <Btn onPress={() => up((d) => void ABILITIES.forEach((a) => (d.abilities[a] = 0)))}>Clear</Btn>
          </div>
          <p role="status">{left > 0 ? `${left} ${left === 1 ? 'point' : 'points'} left to place.` : 'All points placed.'}</p>
          {ABILITIES.map((a) => (
            <Counter
              key={a}
              label={`${a.toUpperCase()} ${ABILITY_NAMES[a]}`}
              value={c.abilities[a]}
              max={left > 0 ? MAX_SCORE : c.abilities[a]}
              onChange={(v) => up((d) => void (d.abilities[a] = v))}
            />
          ))}
          <p>You start at level 1 with 0 XP and {slotCount(c.abilities.con)} item slots (10 + CON). Your hit points start as a d6.</p>
          <div className="row">
            <Btn onPress={() => up((d) => void (d.hpMax = d.hp = rollHp()))}>Roll hit points</Btn>
            <span>{c.hpMax ? `${c.hpMax} hit points` : 'Not rolled yet'}</span>
          </div>
        </section>
      )}

      {step === 1 && (
        <section aria-labelledby="careers">
          <TableTitle>
            <span id="careers">CAREERS</span>
          </TableTitle>
          <p>Roll or pick two careers (pp. 4-5). Each gives you three items.</p>
          {[0, 1].map((i) => (
            <div className="row" key={i}>
              <Select
                label={`Career ${i + 1}`}
                value={c.careers[i] ?? ''}
                disabled={i > c.careers.length}
                onChange={(v) => setCareer(i, v)}
              >
                <option value="">— choose —</option>
                {CAREERS.map((x) => (
                  <option key={x.name}>{x.name}</option>
                ))}
              </Select>
              <Btn label={`Roll career ${i + 1}`} disabled={i > c.careers.length} onPress={() => setCareer(i, rollCareer().name)}>
                Roll
              </Btn>
            </div>
          ))}
          <ul>
            {c.careers.map((n) => (
              <li key={n}>
                <b>{n}:</b> {CAREERS.find((x) => x.name === n)?.items.join(', ')}
              </li>
            ))}
          </ul>
        </section>
      )}

      {step === 2 && (
        <section aria-labelledby="starting-gear">
          <TableTitle>
            <span id="starting-gear">STARTING GEAR</span>
          </TableTitle>
          <p>
            You get your careers' items and 3d6×10 coins, plus 2 rations, a 50' rope, 2 torches, a quiver of 20 arrows, armor pieces and
            weapons (p. 38), all as many as you can carry (p. 4).
          </p>
          <div className="row">
            <Btn onPress={() => up((d) => void (d.coins = rollCoins()))}>Roll coins</Btn>
            <span>{c.coins} coins</span>
          </div>
          <div className="row">
            <Btn disabled={!startItems.length || startItems.every(has)} onPress={() => startItems.forEach((n) => !has(n) && add(gear(n)))}>
              Take my careers' items
            </Btn>
          </div>
          <h3>Supplies</h3>
          {STARTING_GEAR.map((n) => (
            <Check key={n} selected={has(n)} onChange={(on) => toggle(gear(n), on)}>
              {n}
            </Check>
          ))}
          <h3>Armor (1 slot and 1 AP each)</h3>
          {ARMOR_PIECES.map((n) => (
            <Check key={n} selected={has(n)} onChange={(on) => toggle(gear(n, 1, true), on)}>
              {n}
            </Check>
          ))}
          <h3>Weapons</h3>
          <div className="row">
            {WEAPONS.map((w) => (
              <Btn key={w.kind} onPress={() => add(gear(`${w.kind} (${w.damage})`, w.slots))}>
                Add {w.kind.toLowerCase()} ({w.damage}, {w.slots} {w.slots === 1 ? 'slot' : 'slots'})
              </Btn>
            ))}
          </div>
          <h3>Spell books</h3>
          <div className="row">
            <Btn disabled={books >= c.abilities.int} onPress={() => add(gear(SPELLBOOK + rollSpell()))}>
              Draw a random spell book
            </Btn>
            <span>
              {books} of {c.abilities.int} (one per point of INT, p. 4)
            </span>
          </div>
          <Inventory c={c} up={up} />
        </section>
      )}

      {step === 3 && (
        <section aria-labelledby="details">
          <TableTitle>
            <span id="details">FINISHING TOUCHES</span>
          </TableTitle>
          <DetailFields c={c} up={up} />

          <Hint>The tables on pp. 54-59 have ideas for names and details.</Hint>
          {issues.length > 0 && (
            <ul className="warn">
              {issues.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          )}
          <Btn className="primary" disabled={issues.length > 0} onPress={onDone}>
            Open sheet
          </Btn>
        </section>
      )}

      <div className="row">
        <Btn disabled={step === 0} onPress={() => setStep(step - 1)}>
          Back
        </Btn>
        <Btn disabled={step === STEPS.length - 1} onPress={() => setStep(step + 1)}>
          Next
        </Btn>
      </div>
    </>
  );
}
