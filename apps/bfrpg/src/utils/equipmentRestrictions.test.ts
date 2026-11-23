import '@/utils'; // first: validation/rules and utils import each other, and this order is the one that loads
import { describe, it, expect } from 'vitest';
import { allClasses, allRaces } from '@/data';
import equipmentData from '@/data/equipment/equipment.json';
import type { Equipment } from '@/types';
import { isEquipmentRestricted } from './equipment';

const item = (name: string) => {
  const found = equipmentData.find((e) => e.name === name);
  if (!found) throw new Error(`no equipment named ${name}`);
  return found as unknown as Equipment;
};
const restricted = (classId: string, name: string, raceId = 'human') =>
  isEquipmentRestricted(item(name), {
    race: allRaces.find((r) => r.id === raceId),
    classes: [allClasses.find((c) => c.id === classId)!],
    currency: 0,
  }).restricted;

describe('isEquipmentRestricted', () => {
  // Clerics wear any armor but use only blunt weapons: warhammer, mace, maul, club, quarterstaff, sling (Core Rules p. 7).
  it('limits Clerics to blunt weapons and lets them wear any armor', () => {
    expect(restricted('cleric', 'Mace')).toBe(false);
    expect(restricted('cleric', 'Warhammer')).toBe(false);
    expect(restricted('cleric', 'Sling')).toBe(false);
    expect(restricted('cleric', 'Maul/Great Mace')).toBe(false);
    expect(restricted('cleric', 'Club/Cudgel/Walking Staff')).toBe(false);
    expect(restricted('cleric', 'Quarterstaff')).toBe(false);
    expect(restricted('cleric', 'Longsword/Scimitar')).toBe(true);
    expect(restricted('cleric', 'Chain Mail')).toBe(false);
  });

  // Magic-Users are proficient only with the dagger and walking staff, and wear no armor or shield (Core Rules p. 8).
  it('limits Magic-Users to the dagger and walking staff, with no armor', () => {
    expect(restricted('magic-user', 'Dagger')).toBe(false);
    expect(restricted('magic-user', 'Club/Cudgel/Walking Staff')).toBe(false);
    expect(restricted('magic-user', 'Quarterstaff')).toBe(true);
    expect(restricted('magic-user', 'Longsword/Scimitar')).toBe(true);
    expect(restricted('magic-user', 'Leather Armor')).toBe(true);
  });

  // Thieves use any weapon but only leather armor, and no shields (Core Rules p. 8).
  it('lets Thieves use any weapon but only leather armor', () => {
    expect(restricted('thief', 'Two-Handed Sword')).toBe(false);
    expect(restricted('thief', 'Leather Armor')).toBe(false);
    expect(restricted('thief', 'Chain Mail')).toBe(true);
  });

  it('refuses a shield to Magic-Users and Thieves', () => {
    expect(restricted('magic-user', 'Shield')).toBe(true);
    expect(restricted('thief', 'Shield')).toBe(true);
    expect(restricted('fighter', 'Shield')).toBe(false);
  });

  // Druids: no metal armor or metal shields, staves allowed (Druid Supplement, p. 1).
  it('lets Druids use shields and staves but not metal armor', () => {
    expect(restricted('druid', 'Shield')).toBe(false);
    expect(restricted('druid', 'Quarterstaff')).toBe(false);
    expect(restricted('druid', 'Club/Cudgel/Walking Staff')).toBe(false);
    expect(restricted('druid', 'Chain Mail')).toBe(true);
  });

  // Scouts follow the Thief: no metal armor, no shields, any weapon (Scouts Supplement, p. 1).
  it('keeps Scouts to leather armor and no shield', () => {
    expect(restricted('scout', 'Leather Armor')).toBe(false);
    expect(restricted('scout', 'Chain Mail')).toBe(true);
    expect(restricted('scout', 'Shield')).toBe(true);
    expect(restricted('scout', 'Two-Handed Sword')).toBe(false);
  });

  it('puts no limit on a Fighter', () => {
    for (const name of ['Two-Handed Sword', 'Mace', 'Chain Mail', 'Dagger']) expect(restricted('fighter', name)).toBe(false);
  });

  // Dwarves may not use Large weapons (Core Rules p. 5).
  it('keeps Large weapons from a dwarf, even a Fighter', () => {
    expect(restricted('fighter', 'Two-Handed Sword', 'dwarf')).toBe(true);
    expect(restricted('fighter', 'Pole Arm', 'dwarf')).toBe(true);
    expect(restricted('fighter', 'Longbow', 'dwarf')).toBe(true);
    expect(restricted('fighter', 'Longsword/Scimitar', 'dwarf')).toBe(false);
  });

  // A Scout may not wear metal armor or use shields, and may use any weapon (Scouts Supplement, p. 1).
  it('holds a Scout to leather armor, no shield, and any weapon', () => {
    expect(restricted('scout', 'Leather Armor')).toBe(false);
    expect(restricted('scout', 'Chain Mail')).toBe(true);
    expect(restricted('scout', 'Shield')).toBe(true);
    expect(restricted('scout', 'Two-Handed Sword')).toBe(false);
  });

  it('never restricts ammunition, only the weapon that fires it', () => {
    const arrows = equipmentData.find((e) => e.category === 'ammunition')! as unknown as Equipment;
    const result = isEquipmentRestricted(arrows, {
      race: undefined,
      classes: [allClasses.find((c) => c.id === 'magic-user')!],
      currency: 0,
    });
    expect(result.restricted).toBe(false);
  });

  it('lets a combination class use what either class allows', () => {
    const fighterMage = allClasses.find((c) => c.id === 'fighter-magic-user')!;
    expect(isEquipmentRestricted(item('Chain Mail'), { race: undefined, classes: [fighterMage], currency: 0 }).restricted).toBe(false);
  });
});
