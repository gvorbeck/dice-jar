import '@/utils'; // first: validation/rules and utils import each other, and this order is the one that loads
import { describe, it, expect } from 'vitest';
import { createMockCharacter, createMockAbilityScores, createMockEquipment } from '@/test/helpers';
import { calculateArmorClass, calculateMovementRate, calculateHitDie, getExperienceBonusPercent } from './character';

const withDex = (modifier: number, equipment = [] as ReturnType<typeof createMockEquipment>[]) =>
  createMockCharacter({ abilities: createMockAbilityScores({ dexterity: { value: 10, modifier } }), equipment });
const chain = createMockEquipment({ name: 'Chain Mail', category: 'armor', AC: 15, wearing: true });
const shield = createMockEquipment({ name: 'Shield', category: 'shields', AC: '+1', wearing: true });

// An unarmored character is AC 11 and armor gives its own AC (Core Rules p. 11); the Dexterity bonus or penalty is applied to
// Armor Class (Core Rules p. 4).
describe('calculateArmorClass with Dexterity', () => {
  it('adds the Dexterity bonus to an unarmored AC of 11', () => {
    expect(calculateArmorClass(withDex(0))).toBe(11);
    expect(calculateArmorClass(withDex(2))).toBe(13);
  });

  it('takes the Dexterity penalty off too', () => {
    expect(calculateArmorClass(withDex(-3))).toBe(8);
  });

  it('adds it to armor and a shield', () => {
    expect(calculateArmorClass(withDex(-1, [chain]))).toBe(14);
    expect(calculateArmorClass(withDex(1, [chain, shield]))).toBe(17);
  });

  it('works the bonus out from the score when the sheet has no modifier', () => {
    const abilities = createMockAbilityScores({ dexterity: { value: 16 } as never });
    expect(calculateArmorClass(createMockCharacter({ abilities, equipment: [] }))).toBe(13);
  });

  it('takes the Strength bonus from the score when there is no modifier, for capacity too', () => {
    const abilities = createMockAbilityScores({ strength: { value: 6 } as never }); // -1: 50 lb light (Core Rules p. 42)
    expect(
      calculateMovementRate(
        createMockCharacter({
          abilities,
          equipment: [createMockEquipment({ name: 'Anvil', weight: 55, amount: 1 })],
          settings: { useCoinWeight: false },
        }),
      ),
    ).toBe("30'");
  });

  it('leaves alone something with no ability scores, like a monster', () => {
    expect(calculateArmorClass({ equipment: [chain] })).toBe(15);
  });
});

// Movement is adjusted by armor and by load (Core Rules p. 42), and a character is lightly loaded up to 60 lb (p. 42), counting the
// armor worn. A Strength modifier of 0 keeps the limits at 60 and 150.
describe('calculateMovementRate with the load', () => {
  const average = createMockAbilityScores({ strength: { value: 10, modifier: 0 } });
  const leather = createMockEquipment({ name: 'Leather Armor', category: 'armor', AC: 13, wearing: true, weight: 15 });
  const metal = createMockEquipment({ name: 'Chain Mail', category: 'armor', AC: 15, wearing: true, weight: 40 });
  const pack = (weight: number) => createMockEquipment({ name: 'Anvil', weight, amount: 1 });
  const speed = (equipment: ReturnType<typeof createMockEquipment>[]) =>
    calculateMovementRate(createMockCharacter({ abilities: average, equipment, settings: { useCoinWeight: false } }));

  it.each([
    ['no armor', "40'", "30'", []],
    ['leather armor', "30'", "20'", [leather]],
    ['metal armor', "20'", "10'", [metal]],
  ] as const)('%s is %s lightly loaded and %s heavily loaded', (_name, light, heavy, worn) => {
    expect(speed([...worn])).toBe(light);
    expect(speed([...worn, pack(100)])).toBe(heavy);
  });

  it('counts the armor worn toward the load', () => {
    expect(speed([metal, pack(20)])).toBe("20'"); // 60 lb in all
    expect(speed([metal, pack(21)])).toBe("10'"); // 61 lb
  });

  it('counts coins (20 to the pound, Equipment Emporium p. 46) but not a beast of burden', () => {
    const horse = createMockEquipment({ name: 'Horse', category: 'beasts-of-burden', weight: 1000, amount: 1 });
    const character = (equipment: ReturnType<typeof createMockEquipment>[], gold: number) =>
      createMockCharacter({ abilities: average, equipment, currency: { copper: 0, silver: 0, electrum: 0, gold, platinum: 0 } });
    expect(calculateMovementRate(character([pack(55)], 100))).toBe("40'"); // 60 lb
    expect(calculateMovementRate(character([pack(55)], 120))).toBe("30'"); // 61 lb
    expect(calculateMovementRate(character([horse], 0))).toBe("40'");
  });

  it("pools a beast's capacity with the character's (shortcut, see getCharacterLoad)", () => {
    const mule = createMockEquipment({ name: 'Mule', category: 'beasts-of-burden', weight: 0, amount: 1, lowCapacity: 300, capacity: 600 }); // Core Rules p. 63
    expect(
      calculateMovementRate(createMockCharacter({ abilities: average, equipment: [pack(200), mule], settings: { useCoinWeight: false } })),
    ).toBe("40'");
  });
});

// Elves, Gnomes and Halflings never roll larger than a d6 for hit points (Core Rules pp. 5-6, Gnomes Supplement p. 1), nor Dokkalfar
// (Dokkalfar p. 1). Half-ogres roll one size larger: d10 for a Fighter, d8 for a Cleric (Half Humans Supplement p. 1). A Half-elf
// does not suffer the elven limit.
describe('calculateHitDie by race', () => {
  const die = (race: string, cls: string) => calculateHitDie(createMockCharacter({ race, class: cls }));

  it.each([
    ['elf', 'fighter', '1d6'],
    ['elf', 'cleric', '1d6'],
    ['elf', 'thief', '1d4'],
    ['halfling', 'fighter', '1d6'],
    ['gnome', 'fighter', '1d6'],
    ['dokkalfar', 'fighter', '1d6'],
    ['half-elf', 'fighter', '1d8'],
    ['half-ogre', 'fighter', '1d10'],
    ['half-ogre', 'cleric', '1d8'],
    ['human', 'fighter', '1d8'],
    ['dwarf', 'fighter', '1d8'],
    // Bisren roll one size larger (a d4 becomes a d6, a d6 a d8), New Races Supplement p. 1; Phaerim one size smaller, a d4 becoming a d3 (p. 4).
    ['bisren', 'fighter', '1d10'],
    ['bisren', 'cleric', '1d8'],
    ['bisren', 'thief', '1d6'],
    ['phaerim', 'fighter', '1d6'],
    ['phaerim', 'cleric', '1d4'],
    ['phaerim', 'thief', '1d3'],
  ])('a %s %s rolls %s', (race, cls, expected) => {
    expect(die(race, cls)).toBe(expected);
  });
});

// Humans gain 10% on all experience earned (Core Rules p. 6); Half-orcs, Half-ogres and Half-elves 5% (Half Humans Supplement), a
// Half-elf not in a combination class.
describe('getExperienceBonusPercent', () => {
  const bonus = (race: string, cls = 'fighter') => getExperienceBonusPercent(createMockCharacter({ race, class: cls }));

  it.each([
    ['human', 'fighter', 10],
    ['half-orc', 'fighter', 5],
    ['half-ogre', 'cleric', 5],
    ['half-elf', 'fighter', 5],
    ['half-elf', 'fighter-magic-user', 0],
    ['half-elf', 'magic-user-thief', 0],
    ['dwarf', 'fighter', 0],
    ['elf', 'fighter-magic-user', 0],
    ['Tiefling', 'fighter', 0],
  ])('a %s %s gets %i%%', (race, cls, expected) => {
    expect(bonus(race, cls)).toBe(expected);
  });
});
