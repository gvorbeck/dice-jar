import { useState } from 'react';
import { MAX_ITEMS, hasRoom, missing, type Character, type Item } from '@/model/character';
import {
  ABILITIES,
  ABILITY_NAMES,
  ARMOR_PIECES,
  MAX_SCORE,
  START_POINTS,
  STARTING_GEAR,
  WEAPONS,
  armorClass,
  rollCareer,
  rollCoins,
  rollHp,
  rollScores,
  rollSpell,
  slotCount,
  slotsUsed,
  withCareer,
  withCareerItems,
  careerItems,
  carried,
} from '@/rules';
import { CAREERS } from '@/rules/data/careers';
import { Btn, Check, Counter, DetailFields, Select, type Up } from '@/ui';
import { Hint, TableTitle } from '@/ui/bits';
import { AbilityScores } from './AbilityScores';
import { Inventory } from './Inventory';

const STEPS = ['Abilities', 'Careers', 'Gear', 'Details'] as const;
const gear = (name: string, slots = 1, armor = false): Item => ({ name, slots, armor });
const SPELLBOOK = 'Spellbook: ';

/** What the character looks like so far, beside whichever step is open. */
function SoFar({ c }: { c: Character }) {
  return (
    <aside className="so-far" aria-label="Your character so far">
      <AbilityScores scores={c.abilities} />
      <dl className="facts">
        <div>
          <dt>Hit points</dt>
          <dd>{c.hpMax || '–'}</dd>
        </div>
        <div>
          <dt>Armor Class</dt>
          <dd>{armorClass(c.items)}</dd>
        </div>
        <div>
          <dt>Slots</dt>
          <dd>
            {slotsUsed(c.items, c.coins)}/{slotCount(c.abilities.con)}
          </dd>
        </div>
        <div>
          <dt>Coins</dt>
          <dd>{c.coins}</dd>
        </div>
      </dl>
      <p>{c.careers.length ? c.careers.join(' · ') : 'No careers yet'}</p>
    </aside>
  );
}

/** Creation in the order of PC Creation (p. 4): abilities and hit points, careers, gear, then the finishing touches. */
export function Creator({ c, up, onDone }: { c: Character; up: Up; onDone: () => void }) {
  const [step, setStep] = useState(0);
  const left = START_POINTS - Object.values(c.abilities).reduce((a, b) => a + b, 0);
  const fromCareers = careerItems(c.careers);
  // A career's copy of a supply is not the supply: only copies beyond the career's count as picked here.
  const has = (name: string) => c.items.filter((i) => i.name === name).length > fromCareers.filter((n) => n === name).length;
  const room = (slots: number) => hasRoom(c, slots);
  const add = (item: Item) => up((d) => void (d.items.length < MAX_ITEMS && d.items.push(item)));
  const drop = (name: string) =>
    up((d) => {
      const i = d.items.findIndex((x) => x.name === name);
      if (i >= 0) d.items.splice(i, 1);
    });
  const toggle = (item: Item, on: boolean) => (on ? add(item) : drop(item.name));
  const ticked = carried(fromCareers, c.items);
  const books = c.items.filter((i) => i.name.startsWith(SPELLBOOK)).length;
  const issues = missing(c);

  const setCareer = (i: number, name: string) =>
    up((d) => {
      const careers = withCareer(d.careers, i, name);
      d.items = withCareerItems(d.items, d.careers, careers, (n) => gear(n));
      d.careers = careers;
    });

  return (
    <>
      <h1>Create a character</h1>
      <nav aria-label="Creation steps">
        <ol className="steps">
          {STEPS.map((s, i) => (
            <li key={s}>
              <button className="btn" aria-current={i === step ? 'step' : undefined} onClick={() => setStep(i)}>
                <span className="step-n">{i + 1}</span> {s}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div className="cols creator">
        <div>
          {step === 0 && (
            <section aria-labelledby="abilities">
              <TableTitle>
                <span id="abilities">ABILITIES AND HIT POINTS</span>
              </TableTitle>
              <p className="callout">
                Place {START_POINTS} points among your abilities, more than one in the same score if you like. Or let fate decide: roll 3d6,
                and each die adds 1 to the ability with its number (p. 4).
              </p>
              <div className="row">
                <Btn onPress={() => up((d) => void (d.abilities = rollScores()))}>Roll 3d6</Btn>
                <Btn onPress={() => up((d) => void ABILITIES.forEach((a) => (d.abilities[a] = 0)))}>Clear</Btn>
                <span role="status">{left > 0 ? `${left} ${left === 1 ? 'point' : 'points'} left to place.` : 'All points placed.'}</span>
              </div>
              <div className="ability-box">
                <div className="ability-cards">
                  {ABILITIES.map((a) => (
                    <Counter
                      key={a}
                      card
                      label={`${a.toUpperCase()} ${ABILITY_NAMES[a]}`}
                      value={c.abilities[a]}
                      max={left > 0 ? MAX_SCORE : c.abilities[a]}
                      onChange={(v) => up((d) => void (d.abilities[a] = v))}
                    />
                  ))}
                </div>
              </div>
              <p className="callout">
                You start at level 1 with 0 XP and {slotCount(c.abilities.con)} item slots (10 + CON). Your hit points start as a d6.
              </p>
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
              <p className="callout">Roll or pick two careers (pp. 4-5). Each gives you three items.</p>
              <div className="pair">
                {[0, 1].map((i) => {
                  const name = c.careers[i];
                  return (
                    <div className="pick" key={i}>
                      <h3>{i === 0 ? 'First career' : 'Second career'}</h3>
                      <div className="row">
                        <Select
                          label={`Career ${i + 1}`}
                          value={name ?? ''}
                          disabled={i > c.careers.length}
                          onChange={(v) => setCareer(i, v)}
                        >
                          <option value="">— choose —</option>
                          {CAREERS.map((x) => (
                            <option key={x.name} disabled={x.name === c.careers[1 - i]}>
                              {x.name}
                            </option>
                          ))}
                        </Select>
                        <Btn
                          label={`Roll career ${i + 1}`}
                          disabled={i > c.careers.length}
                          onPress={() => setCareer(i, rollCareer(c.careers).name)}
                        >
                          Roll
                        </Btn>
                      </div>
                      {name && (
                        <>
                          <p className="pick-name">{name}</p>
                          <ul className="chips">
                            {CAREERS.find((x) => x.name === name)?.items.map((it, n) => (
                              <li key={n}>{it}</li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {step === 2 && (
            <section aria-labelledby="starting-gear">
              <TableTitle>
                <span id="starting-gear">STARTING GEAR</span>
              </TableTitle>
              <p className="callout">
                Your careers' items are packed already: untick any you'd rather leave behind. You also get 3d6×10 coins, plus 2 rations, a
                50' rope, 2 torches, a quiver of 20 arrows, armor pieces and weapons (p. 38), all as many as you can carry (p. 4).
              </p>
              <div className="row">
                <Btn onPress={() => up((d) => void (d.coins = rollCoins()))}>Roll coins</Btn>
                <span>{c.coins} coins</span>
              </div>
              <div className="two">
                {fromCareers.length > 0 && (
                  <div>
                    <h3>From your careers</h3>
                    {fromCareers.map((n, i) => (
                      <Check
                        key={i}
                        selected={ticked[i]!}
                        disabled={!ticked[i] && !room(1)}
                        onChange={(on) => (on ? add(gear(n)) : drop(n))}
                      >
                        {n}
                      </Check>
                    ))}
                  </div>
                )}
                <div>
                  <h3>Supplies</h3>
                  {STARTING_GEAR.map((n) => (
                    <Check key={n} selected={has(n)} disabled={!has(n) && !room(1)} onChange={(on) => toggle(gear(n), on)}>
                      {n}
                    </Check>
                  ))}
                  <h3>Spell books</h3>
                  <div className="row">
                    <Btn disabled={books >= c.abilities.int || !room(1)} onPress={() => add(gear(SPELLBOOK + rollSpell()))}>
                      Draw a random spell book
                    </Btn>
                    <span>
                      {books} of {c.abilities.int} (one per point of INT, p. 4)
                    </span>
                  </div>
                </div>
                <div>
                  <h3>Armor (1 slot and 1 AP each)</h3>
                  {ARMOR_PIECES.map((n) => (
                    <Check key={n} selected={has(n)} disabled={!has(n) && !room(1)} onChange={(on) => toggle(gear(n, 1, true), on)}>
                      {n}
                    </Check>
                  ))}
                </div>
              </div>
              <h3>Weapons</h3>
              <ul className="callout">
                <li>A two-handed weapon deals d8 to a one-handed weapon's d6, but takes two slots (p. 38).</li>
                <li>Melee attacks add STR. Ranged attacks add WIS, and can't be made while you're in melee (p. 20).</li>
                <li>
                  A natural 1 on an attack breaks the weapon. So does a power attack, a melee hit you choose to roll with double damage dice
                  (p. 20).
                </li>
              </ul>
              <div className="row">
                {WEAPONS.map((w) => (
                  <Btn key={w.kind} disabled={!room(w.slots)} onPress={() => add(gear(`${w.kind} (${w.damage})`, w.slots))}>
                    Add {w.kind.toLowerCase()} ({w.damage}, {w.slots} {w.slots === 1 ? 'slot' : 'slots'})
                  </Btn>
                ))}
              </div>
              <Inventory c={c} up={up} onlyWhatFits />
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
        </div>

        <SoFar c={c} />
      </div>
    </>
  );
}
