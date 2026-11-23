import { describe, it, expect, vi, afterEach } from 'vitest';
import { sanitizeFilename, formatDate, generateCharacterSheetText } from './characterExport';
import { createMockCharacter, createMockEquipment } from '@/test/helpers';

afterEach(() => vi.useRealTimers());

describe('sanitizeFilename', () => {
  it('lowercases, hyphenates spaces and drops other characters', () => {
    expect(sanitizeFilename('  Sir Bob  the <Bold>! ')).toBe('sir-bob-the-bold');
  });
});

describe('formatDate', () => {
  it('is YYYY-MM-DD', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-23T12:00:00Z'));
    expect(formatDate()).toBe('2026-11-23');
  });
});

describe('generateCharacterSheetText', () => {
  it('prints the header, name, race, class and level', () => {
    const text = generateCharacterSheetText(createMockCharacter({ name: 'Brom', xp: 1500, level: 2 }));
    expect(text).toContain('BASIC FANTASY RPG - CHARACTER SHEET');
    expect(text).toContain('CHARACTER NAME: Brom');
    expect(text).toMatch(/LEVEL: 2\s+XP: 1,500/);
    expect(text).toContain('ABILITY SCORES');
    expect(text).toContain('Strength:');
    expect(text).toContain('Saving Throws:');
  });

  // Equipment categories in the data are lowercase ('swords', 'bows', 'armor', 'shields'), so a weapon is an item with damage.
  it('lists weapons, armor and general gear under their own headings', () => {
    const text = generateCharacterSheetText(
      createMockCharacter({
        equipment: [
          createMockEquipment({ name: 'Longsword', category: 'swords', damage: '1d8', wearing: true }),
          createMockEquipment({ name: 'Chain Mail', category: 'armor', AC: 14, wearing: true }),
          createMockEquipment({ name: 'Wooden Shield', category: 'shields', AC: 1 }),
          createMockEquipment({ name: 'Rope', category: 'general-equipment', amount: 2 }),
        ],
      }),
    );
    expect(text).toContain('Weapons:\n  • Longsword (equipped) (1d8)');
    expect(text).toContain('  • Chain Mail (equipped) (AC 14)');
    expect(text).toContain('  • Wooden Shield (AC 1)');
    expect(text).toContain('General Equipment:\n  • Rope (2)');
    expect(text).not.toContain('General Equipment:\n  • Longsword');
  });

  it('prints only the coins a character has, and the languages', () => {
    const text = generateCharacterSheetText(createMockCharacter({ currency: { gold: 12, silver: 3 }, languages: ['Common', 'Elvish'] }));
    expect(text).toContain('Gold:     12 gp');
    expect(text).toContain('Silver:   3 sp');
    expect(text).not.toContain('Platinum');
    expect(text).toContain('Common, Elvish');
  });

  it('omits the currency and equipment sections when there is nothing to show', () => {
    const text = generateCharacterSheetText(createMockCharacter({ currency: { gold: 0 }, equipment: [] }));
    expect(text).not.toContain('Currency:');
    expect(text).not.toContain('EQUIPMENT');
  });

  it('groups spells by level and lists cantrips', () => {
    const text = generateCharacterSheetText(
      createMockCharacter({
        class: 'magic-user',
        spells: [
          { name: 'Sleep', level: { 'magic-user': 1 } },
          { name: 'Web', level: { 'magic-user': 2 } },
        ] as never,
        cantrips: [{ name: 'Light' }] as never,
      }),
    );
    expect(text).toContain('Level 1:\n  • Sleep');
    expect(text).toContain('Level 2:\n  • Web');
    expect(text).toContain('Cantrips/Orisons:\n  • Light');
  });
});
