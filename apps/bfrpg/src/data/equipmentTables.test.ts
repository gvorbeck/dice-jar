import { describe, it, expect } from 'vitest';
import equipment from './equipment/equipment.json';

const byName = (name: string) => {
  const found = equipment.find((e) => e.name === name);
  if (!found) throw new Error(`no equipment named ${name}`);
  return found;
};

// Weapons, Core Rules p. 11: [name in the data, price, currency, size, weight in lb, damage].
const WEAPONS = [
  ['Hand Axe', 4, 'gp', 'S', 5, '1d6'],
  ['Battle Axe', 7, 'gp', 'M', 7, '1d8'],
  ['Great Axe', 14, 'gp', 'L', 15, '1d10'],
  ['Dagger', 2, 'gp', 'S', 1, '1d4'],
  ['Silver† Dagger', 25, 'gp', 'S', 1, '1d4'],
  ['Longsword/Scimitar', 10, 'gp', 'M', 4, '1d8'],
  ['Two-Handed Sword', 18, 'gp', 'L', 10, '1d10'],
  ['Warhammer', 4, 'gp', 'S', 6, '1d6'],
  ['Mace', 6, 'gp', 'M', 10, '1d8'],
  ['Maul/Great Mace', 10, 'gp', 'L', 16, '1d10'],
  ['Club/Cudgel/Walking Staff', 2, 'sp', 'M', 1, '1d4'],
  ['Quarterstaff', 2, 'gp', 'L', 4, '1d6'],
  ['Pole Arm', 9, 'gp', 'L', 15, '1d10'],
] as const;

describe.each(WEAPONS)('weapon %s', (name, price, currency, size, weight, damage) => {
  it(`costs ${price} ${currency}, is size ${size}, weighs ${weight} lb and does ${damage} (Core Rules p. 11)`, () => {
    expect(byName(name)).toMatchObject({ costValue: price, costCurrency: currency, size, weight, damage });
  });
});

// Missile weapons, Core Rules p. 11: [name, price, currency, size, weight].
describe.each([
  ['Shortbow', 25, 'gp', 'M', 2],
  ['Longbow', 60, 'gp', 'L', 3],
  ['Light Crossbow', 30, 'gp', 'M', 7],
  ['Heavy Crossbow', 50, 'gp', 'L', 14],
  ['Sling', 1, 'gp', 'S', undefined],
] as const)('missile weapon %s', (name, price, currency, size, weight) => {
  it(`costs ${price} ${currency} and is size ${size} (Core Rules p. 11)`, () => {
    expect(byName(name)).toMatchObject({ costValue: price, costCurrency: currency, size });
    if (weight !== undefined) expect(byName(name).weight).toBe(weight);
  });
});

// Armor and Shields, Core Rules p. 11: [name, price, weight, armor class].
describe.each([
  ['Leather Armor', 20, 15, 13],
  ['Chain Mail', 60, 40, 15],
  ['Plate Mail', 300, 50, 17],
  ['Shield', 7, 5, '+1'],
] as const)('armor %s', (name, price, weight, ac) => {
  it(`costs ${price} gp, weighs ${weight} lb and gives AC ${ac} (Core Rules p. 11)`, () => {
    expect(byName(name)).toMatchObject({ costValue: price, costCurrency: 'gp', weight, AC: ac });
  });
});

// Ammunition, Core Rules p. 11: [name, price, currency, damage].
describe.each([
  ['Shortbow Arrow', 1, 'sp', '1d6'],
  ['Longbow Arrow', 2, 'sp', '1d8'],
  ['Light Quarrel', 2, 'sp', '1d6'],
  ['Heavy Quarrel', 4, 'sp', '1d8'],
] as const)('ammunition %s', (name, price, currency, damage) => {
  it(`costs ${price} ${currency} and does ${damage} (Core Rules p. 11)`, () => {
    const ammunition = equipment.find((e) => e.category === 'ammunition' && e.name.startsWith(name));
    expect(ammunition).toMatchObject({ costValue: price, costCurrency: currency, damage });
  });
});

// More weapons, Equipment Emporium p. 3: [name, price, currency, size].
describe.each([
  ['Pickaxe (Military Pick)', 6, 'gp', 'S'],
  ["Mattock (Footman's Pick)", 8, 'gp', 'M'],
  ['Defending Dagger', 7, 'gp', 'S'],
  ['Light Mace', 5, 'gp', 'S'],
  ['Morningstar', 7, 'gp', 'M'],
  ['Spear', 5, 'gp', 'M'],
  ['Boar Spear', 6, 'gp', 'M'],
  ['Lance', 10, 'gp', 'L'],
  ['Sickle', 2, 'gp', 'S'],
  ['Scythe', 7, 'gp', 'L'],
  ['Greatclub', 3, 'gp', 'L'],
] as const)('Emporium weapon %s', (name, price, currency, size) => {
  it(`costs ${price} ${currency} and is size ${size} (Equipment Emporium p. 3)`, () => {
    expect(byName(name)).toMatchObject({ costValue: price, costCurrency: currency, size });
  });
});

// Armor, Equipment Emporium p. 9 (a superset of the Core Rules list): [name, price, weight, armor class].
describe.each([
  ['Padded/Quilted Armor', 15, 10, 12],
  ['Hide Armor', 10, 30, 13],
  ['Studded Leather Armor', 30, 25, 14],
  ['Ring Mail', 25, 30, 14],
  ['Brigandine Armor', 80, 30, 15],
  ['Scale Mail', 80, 55, 16],
  ['Splint Mail', 100, 45, 16],
  ['Banded Mail', 200, 35, 16],
  ['Field Plate Mail', 500, 70, 18],
  ['Full Plate Mail', 1500, 80, 19],
] as const)('Emporium armor %s', (name, price, weight, ac) => {
  it(`costs ${price} gp, weighs ${weight} lb and gives AC ${ac} (Equipment Emporium p. 9)`, () => {
    expect(byName(name)).toMatchObject({ costValue: price, costCurrency: 'gp', weight, AC: ac });
  });
});

// Shields, Armor and Shields p. 2: [name, price, weight]. A buckler adds +1 against melee only and a tower shield +3 against
// missiles, which the data's single AC value does not hold. The Core Rules' plain Shield weighs 5 lb, the Medium Shield 7 lb.
describe.each([
  ['Buckler Shield', 5, 2],
  ['Tower Shield', 15, 12],
] as const)('Emporium shield %s', (name, price, weight) => {
  it(`costs ${price} gp and weighs ${weight} lb (Armor and Shields p. 2)`, () => {
    expect(byName(name)).toMatchObject({ costValue: price, costCurrency: 'gp', weight });
  });
});
