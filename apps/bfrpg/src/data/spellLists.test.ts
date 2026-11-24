import { describe, it, expect } from 'vitest';
import spells from './magic/spells.json';

const at = (cls: string, level: number) =>
  spells
    .filter((s) => (s.level as Record<string, number | null>)[cls] === level)
    .map((s) => s.name)
    .sort();
const names = (...list: string[]) => list.sort();

// Magic-User spells by level, Core Rules p. 16. Read Magic is known by every Magic-User and is not in the numbered list (p. 8).
const MAGIC_USER = [
  names('Read Magic', 'Charm Person', 'Detect Magic', 'Floating Disc', 'Hold Portal', 'Light*', 'Magic Missile', 'Magic Mouth', 'Protection from Evil*', 'Read Languages', 'Shield', 'Sleep', 'Ventriloquism'), // prettier-ignore
  names('Continual Light*', 'Detect Evil*', 'Detect Invisible', 'Invisibility', 'Knock', 'Levitate', 'Locate Object', 'Mind Reading', 'Mirror Image', 'Phantasmal Force', 'Web', 'Wizard Lock'), // prettier-ignore
  names('Clairvoyance', 'Darkvision', 'Dispel Magic', 'Fireball', 'Fly', 'Haste*', 'Hold Person', "Invisibility 10' Radius", 'Lightning Bolt', "Protection from Evil 10' Radius*", 'Protection from Normal Missiles', 'Water Breathing'), // prettier-ignore
  names('Charm Monster', 'Confusion', 'Dimension Door', 'Growth of Plants*', 'Hallucinatory Terrain', 'Ice Storm', 'Massmorph', 'Polymorph Other', 'Polymorph Self', 'Remove Curse*', 'Wall of Fire', 'Wizard Eye'), // prettier-ignore
  names('Animate Dead', 'Cloudkill', 'Conjure Elemental', 'Feeblemind*', 'Hold Monster', 'Magic Jar', 'Passwall', 'Telekinesis', 'Teleport', 'Wall of Stone'), // prettier-ignore
  names('Anti-Magic Shell', 'Death Spell', 'Disintegrate', 'Flesh to Stone*', 'Geas*', 'Invisible Stalker', 'Lower Water', 'Projected Image', 'Reincarnate', 'Wall of Iron'), // prettier-ignore
];

// Cleric spells by level, Core Rules pp. 15-16.
const CLERIC = [
  names('Cure Light Wounds*', 'Detect Evil*', 'Detect Magic', 'Light*', 'Protection from Evil*', 'Purify Food and Water', 'Remove Fear*', 'Resist Cold'), // prettier-ignore
  names('Bless*', 'Charm Animal', 'Find Traps', 'Hold Person', 'Resist Fire', "Silence 15' Radius", 'Speak with Animals', 'Spiritual Hammer'), // prettier-ignore
  names('Continual Light*', 'Cure Blindness*', 'Cure Disease*', 'Growth of Animals', 'Locate Object', 'Remove Curse*', 'Speak with Dead', 'Striking'), // prettier-ignore
  names('Animate Dead', 'Create Water', 'Cure Serious Wounds*', 'Dispel Magic', 'Neutralize Poison*', "Protection from Evil 10' Radius*", 'Speak with Plants', 'Sticks to Snakes', 'Stone Shape'), // prettier-ignore
  names('Commune', 'Create Food', 'Dispel Evil', 'Insect Plague', 'Quest*', 'Raise Dead*', 'True Seeing', 'Wall of Fire'), // prettier-ignore
  names('Animate Objects', 'Blade Barrier', 'Find the Path', 'Heal*', 'Regenerate', 'Restoration', 'Speak with Monsters', 'Word of Recall'), // prettier-ignore
];

describe.each(MAGIC_USER.map((list, i) => [i + 1, list] as const))('Magic-User spells of level %i (Core Rules p. 16)', (level, list) => {
  it('are the ones in the book', () => {
    expect(at('magic-user', level).map((n) => n.trim())).toEqual(list);
  });
});

// Stone Shape is a Cleric 4 spell too (New Spells Supplement p. 16), so the Cleric's level 4 list holds it.
describe.each(CLERIC.map((list, i) => [i + 1, list] as const))('Cleric spells of level %i (Core Rules pp. 15-16)', (level, list) => {
  it('are the ones in the book', () => {
    expect(at('cleric', level).map((n) => n.trim())).toEqual(list);
  });
});

describe('spells that belong to another class', () => {
  const levelsOf = (name: string) => Object.entries(spells.find((s) => s.name === name)!.level).filter(([, level]) => level !== null);

  it('puts Starlight Blade with Spellcrafters at 5th level only (Spellcrafters Supplement p. 9)', () => {
    expect(levelsOf('Starlight Blade')).toEqual([['spellcrafter', 5]]);
  });

  it('puts Stone Shape with Clerics at 4th and Spellcrafters at 3rd (New Spells Supplement p. 16)', () => {
    expect(Object.fromEntries(levelsOf('Stone Shape'))).toEqual({ cleric: 4, spellcrafter: 3 });
  });

  it('puts Flame Strike with Druids at 5th level (Druid Supplement p. 2), not with Clerics (the Core Rules p. 15 fifth-level Cleric list has none)', () => {
    expect(levelsOf('Flame Strike')).toEqual([['druid', 5]]);
  });
});

// Supplement spell lists by level. The books' "(NS)" spells (New Spells Supplement) are not in the data. A few spells carry a different
// name than the book ("Assume Animal Form" for Take Animal Form, "Tree Sanctuary" for Tree Form, "Weather Summoning" for Summon
// Weather), and saved characters hold spells by name, so the data's names are kept. Read Magic is every arcane caster's own (p. 8).
const DRUID = [
  names('Animal Friendship', 'Create Water', 'Cure Light Wounds*', 'Detect Magic', 'Detect Snares and Pits', 'Entangle', 'Faerie Fire', 'Light*', 'Pass Without Trace', 'Resist Cold'), // prettier-ignore
  names('Charm Animal', 'Find Traps', 'Heat Metal*', 'Obscuring Mists', 'Produce Flame/Cold', 'Resist Fire', 'Slow Poison', 'Speak with Animals', 'Warp Wood*'), // prettier-ignore
  names('Assume Animal Form', 'Call Lightning', 'Cure Disease*', 'Hold Animal', 'Neutralize Poison*', 'Plant Growth', 'Protection From Fire', 'Water Breathing'), // prettier-ignore
  names('Call Woodland Beings', "Control Temperature, 10' Radius", 'Cure Serious Wounds*', 'Dispel Magic', 'Insect Plague', 'Lower Water', 'Protection From Lightning', 'Speak with Plants', 'Summon Animals I', 'Tree Sanctuary'), // prettier-ignore
  names('Commune With Nature', 'Control Winds', 'Dispel Evil', 'Flame Strike', 'Growth of Animals', 'Rock to Mud*', 'Summon Animals II', 'Wall of Fire'), // prettier-ignore
  names('Animate Natural Objects', 'Find the Path', 'Part Water', 'Pass Tree', 'Reincarnate', 'Summon Animals III', 'Weather Summoning', 'Word of Recall'), // prettier-ignore
];

describe.each(DRUID.map((list, i) => [i + 1, list] as const))('Druid spells of level %i (Druid Supplement p. 2)', (level, list) => {
  it('are the ones in the book', () => {
    expect(at('druid', level).map((n) => n.trim())).toEqual(list);
  });
});

describe('other supplement spell lists', () => {
  const lists: [string, number, string[], string][] = [
    ['illusionist', 1, names('Audible Glamer', 'Change Self', 'Color Spray', 'Dancing Lights', 'Detect Illusion', 'Detect Invisible', 'Gaze Reflection', 'Light*', 'Magic Mouth', 'Mirror Image', 'Phantasmal Image', 'Read Magic', 'Ventriloquism'), 'Illusionist Supplement p. 2 (the book names Detect Invisible "Detect Invisibility")'], // prettier-ignore
    ['illusionist', 4, names('Advanced Illusion', 'Confusion', 'Dispel Magic', 'Hallucinatory Terrain', 'Hold Person', 'Improved Invisibility', 'Massmorph', 'Phantasmal Killer', 'Rainbow Pattern', "Silence 15' Radius", 'Solid Fog', 'Suggestion'), 'Illusionist Supplement p. 3'], // prettier-ignore
    ['illusionist', 5, names('Cloudkill', 'Dream', 'Feeblemind*', 'Mirage Arcana', 'Mislead', 'Nightmare', 'Programmed Illusion', 'Projected Image', 'Seeming', 'Wizard Eye'), 'Illusionist Supplement p. 3'], // prettier-ignore
    ['necromancer', 1, names('Call Poltergeist', 'Chill', 'Corpse Servant', 'Decay Flesh', 'Detect Magic', 'Light*', 'Locate Corpse', 'Protection from Undead*', 'Read Languages', 'Read Magic', 'Remove Fear*', 'Stench', 'Ventriloquism'), 'Necromancer Supplement p. 2'], // prettier-ignore
    ['necromancer', 3, names('Darkvision', 'Dispel Magic', 'Drainblade', 'Ectoplasm', 'Fossilize', 'Halt Undead', "Protection from Undead 10' Radius*", 'Ray of Exhaustion', 'Speak with Dead', 'Spirit Wrack', 'Summon Spirit', 'Vampiric Touch'), 'Necromancer Supplement p. 2'], // prettier-ignore
    ['necromancer', 6, names('Anti-Magic Shell', 'Control Undead', 'Death Spell', 'Disintegrate', 'Eyebite', 'Projected Image', 'Symbol of Fear', 'Undeath', 'Undeath to Death', 'Wall of Iron'), 'Necromancer Supplement p. 2'], // prettier-ignore
    ['spellcrafter', 1, names('Alarm', 'Break Restrictions', 'Detect Magic', 'Enhance Armor*', 'Enhance Weapon*', 'Hold Portal', 'Light*', 'Magic Missile', 'Protection from Evil*', 'Read Languages', 'Repair*', 'Resist Cold'), 'Spellcrafters Supplement p. 2'], // prettier-ignore
  ];

  it.each(lists)('%s level %i is the book list (%#)', (cls, level, list) => {
    expect(at(cls, level).map((n) => n.trim())).toEqual(list);
  });
});

// Ranges and durations as the Core Rules print them (spell descriptions, pp. 17-40). Only the spells read from the book are here.
describe.each([
  ['Hold Person', "180'", '2d8 turns'],
  ['Hold Monster', "180'", '2d8 turns'],
  ['Hold Portal', "100'+10'/level", '1 round/level'],
  ['Floating Disc', '0', '5 turns +1/level'],
  ['Flesh to Stone*', "30'/level", 'permanent'],
  ['Clairvoyance', "60'", '12 turns'],
  ['Cloudkill', "100'+10'/level", '6 rounds/level'],
  ['Commune', 'self', '1 round/level'],
  ['Confusion', "280'+10'/ level", '2 rounds+1/level'],
  ['Cure Serious Wounds*', 'touch', 'instantaneous'],
  ['Darkvision', 'touch', '1 hour/level'],
  ['Death Spell', "240'", 'instantaneous'],
  ['Detect Evil*', "60'", '1 round/level'],
  ['Detect Invisible', "60'", '1 turn/level'],
  ['Ice Storm', "300'+30'/level", '1 round'],
  ['Wall of Stone', "15' per level", 'permanent'],
  ['Water Breathing', 'touch', '2 hours/level'],
  ['Ventriloquism', "60'", '1 turn/level'],
  ['Wall of Fire', "180'", '1 round/level (or special)'],
] as const)('spell %s', (name, range, duration) => {
  it(`has range ${range} and lasts ${duration}`, () => {
    expect(spells.find((s) => s.name.trim() === name)).toMatchObject({ range, duration });
  });
});
