import '@/utils'; // first: validation/rules and utils import each other, and this order is the one that loads
import { describe, it, expect } from 'vitest';
import equipmentPacks from '@/data/equipment/equipmentPacks.json';
import type { EquipmentPack } from '@/types';
import { createMockCharacter, createMockEquipment } from '@/test/helpers';
import {
  isArmorItem,
  isShieldItem,
  isWeaponItem,
  isWearableItem,
  isWornArmor,
  isWornShield,
  cleanEquipmentArray,
  ensureEquipmentAmount,
  formatWeight,
  formatCost,
  findEquipmentById,
  getEquipmentPacksByClass,
  applyEquipmentPackToCharacter,
} from './equipment';

describe('what an item is', () => {
  const armor = createMockEquipment({ category: 'armor', AC: 13 });
  const shield = createMockEquipment({ category: 'shields', AC: '+1' });
  const sword = createMockEquipment({ category: 'swords', damage: '1d8' });
  const bow = createMockEquipment({ category: 'bows' });

  it('tells armor, shields and weapons apart', () => {
    expect([isArmorItem(armor), isArmorItem(shield), isArmorItem(sword)]).toEqual([true, false, false]);
    expect([isShieldItem(shield), isShieldItem(armor)]).toEqual([true, false]);
    expect([isWearableItem(armor), isWearableItem(shield), isWearableItem(sword)]).toEqual([true, true, false]);
  });

  it('counts a bow as a weapon though it has no damage, and ammunition as not', () => {
    expect(isWeaponItem(bow)).toBe(true);
    expect(isWeaponItem(sword)).toBe(true);
    expect(isWeaponItem(createMockEquipment({ category: 'ammunition', damage: '1d6' }))).toBe(false);
  });

  it('knows worn armor from a worn shield', () => {
    expect(isWornArmor({ ...armor, wearing: true })).toBe(true);
    expect(isWornArmor(armor)).toBe(false);
    expect(isWornShield({ ...shield, wearing: true })).toBe(true);
    expect(isWornShield({ ...armor, wearing: true })).toBe(false);
  });
});

describe('equipment helpers', () => {
  it('drops items with none left, and never lets an amount fall below 1', () => {
    expect(cleanEquipmentArray([createMockEquipment({ amount: 0 }), createMockEquipment({ amount: 2 })])).toHaveLength(1);
    expect(ensureEquipmentAmount(createMockEquipment({ amount: 0 })).amount).toBe(1);
    expect(ensureEquipmentAmount(createMockEquipment({ amount: 4 })).amount).toBe(4);
  });

  it('formats total weight and cost', () => {
    expect(formatWeight(2.5, 3)).toBe('7.5 lbs');
    expect(formatWeight(0, 3)).toBe('—');
    expect(formatCost(7, 'gp', 2)).toBe('14 gp');
  });

  it('finds an item by id, or nothing, and gives the same answer twice', () => {
    const first = findEquipmentById('dagger-138');
    expect(first?.name).toBe('Dagger');
    expect(findEquipmentById('dagger-138')).toBe(first);
    expect(findEquipmentById('nope')).toBeNull();
    expect(findEquipmentById('nope')).toBeNull();
  });
});

describe('equipment packs', () => {
  const pack = equipmentPacks[0]! as EquipmentPack;

  it('offers a character the packs for their class, and the ones for everyone', () => {
    const ids = getEquipmentPacksByClass(createMockCharacter({ class: 'fighter' })).map((p) => p.id);
    expect(ids).toContain(pack.id);
    expect(ids).toContain('fighter-pack');
    expect(ids).not.toContain('cleric-pack');
    expect(getEquipmentPacksByClass(createMockCharacter({ class: 'witch' })).length).toBeGreaterThan(0);
  });

  it('charges the pack price and adds its items', () => {
    const before = createMockCharacter({ currency: { gold: 100 }, equipment: [] });
    const { character, result } = applyEquipmentPackToCharacter(before, pack);
    expect(result.success).toBe(true);
    expect(character.currency.gold).toBe(100 - pack.cost);
    expect(character.equipment.length).toBe(pack.items.length);
  });

  it('adds to an item the character already carries instead of listing it twice', () => {
    const once = applyEquipmentPackToCharacter(createMockCharacter({ currency: { gold: 100 }, equipment: [] }), pack).character;
    const twice = applyEquipmentPackToCharacter({ ...once, currency: { gold: 100 } }, pack).character;
    expect(twice.equipment).toHaveLength(once.equipment.length);
    expect(twice.equipment[0]!.amount).toBe(once.equipment[0]!.amount * 2);
  });

  it('refuses when the character cannot afford it', () => {
    const poor = createMockCharacter({ currency: { gold: 1 } });
    const { character, result } = applyEquipmentPackToCharacter(poor, pack);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Not enough gold');
    expect(character).toBe(poor);
  });

  it('refuses a pack that names an item the database lacks', () => {
    const broken: EquipmentPack = { ...pack, items: [{ equipmentId: 'no-such-item', quantity: 1 }] };
    const { result } = applyEquipmentPackToCharacter(createMockCharacter({ currency: { gold: 100 } }), broken);
    expect(result).toMatchObject({ success: false, missingItems: ['no-such-item'] });
  });
});
