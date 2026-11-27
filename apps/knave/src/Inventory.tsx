import { useState } from 'react';
import { MAX_ITEMS, hasRoom, type Character } from '@/model/character';
import { COINS_PER_SLOT, droppedSlots, slotCount, slotsUsed } from '@/rules';
import { Btn, Check, Select, Text, type Up } from '@/ui';
import { Alert, TableTitle } from '@/ui/bits';

/** Gear, with the slots it fills (p. 6): 10 + CON in all, wounds fill them from the top down. Used by the Gear step and the sheet. */
export function Inventory({
  c,
  up,
  onlyWhatFits,
}: {
  c: Character;
  up: Up;
  /** Creation takes only what can be carried (p. 4); in play loot may overflow, and the player picks what to drop. */
  onlyWhatFits?: boolean;
}) {
  const max = slotCount(c.abilities.con),
    used = slotsUsed(c.items, c.coins),
    drop = droppedSlots(used, max, c.wounds);
  const [name, setName] = useState('');
  const [slots, setSlots] = useState(1);
  const [armor, setArmor] = useState(false);
  const full = onlyWhatFits ? !hasRoom(c, slots) : c.items.length >= MAX_ITEMS;
  const add = () => {
    up((d) => void d.items.push({ name: name.trim(), slots, armor }));
    setName('');
    setArmor(false);
  };
  return (
    <section aria-labelledby="inventory">
      <TableTitle>
        <span id="inventory">GEAR</span>
      </TableTitle>
      <p>
        Slots: <b>{used}</b> of {max}
        {c.wounds > 0 && ` (${c.wounds} filled with wounds)`}. Each full {COINS_PER_SLOT} coins takes a slot.
      </p>
      <Alert>
        {drop > 0 &&
          `Drop gear worth ${drop} ${drop === 1 ? 'slot' : 'slots'}: ${c.wounds > 0 ? "wounded slots can't hold anything." : "it doesn't fit in your slots."}`}
      </Alert>
      {c.items.length > 0 && (
        <ul className="items">
          {c.items.map((it, i) => (
            <li key={i}>
              <span>
                {it.name}
                {it.armor && ' (armor)'}
              </span>
              <span className="dim">{it.slots === 1 ? '1 slot' : `${it.slots} slots`}</span>
              <Btn label={`Remove ${it.name}`} onPress={() => up((d) => void d.items.splice(i, 1))}>
                Remove
              </Btn>
            </li>
          ))}
        </ul>
      )}
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim() && !full) add();
        }}
      >
        <Text label="New item" value={name} onChange={setName} />
        <Select label="Slots" value={slots} onChange={(v) => setSlots(Number(v))}>
          {[1, 2, 3, 4].map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? 'slot' : 'slots'}
            </option>
          ))}
        </Select>
        <Check selected={armor} onChange={setArmor}>
          Armor piece
        </Check>
        <button className="btn" disabled={!name.trim() || full}>
          Add item
        </button>
      </form>
    </section>
  );
}
