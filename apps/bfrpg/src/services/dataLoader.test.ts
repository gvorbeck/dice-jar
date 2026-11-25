import { describe, it, expect, vi, afterEach } from 'vitest';
import { loadAllEquipment, loadSpellsForClass, loadAllFirstLevelSpells, loadAllSpells, preloadCriticalData } from './dataLoader';

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('loadAllEquipment', () => {
  it('returns every item with none owned, and the same list the second time', async () => {
    const first = await loadAllEquipment();
    expect(first.length).toBeGreaterThan(100);
    expect(first.every((item) => item.amount === 0)).toBe(true);
    expect(await loadAllEquipment()).toBe(first);
  });
});

// A first level Magic-User already knows read magic and picks one other spell (Core Rules, p. 8), so it is left out of the choice.
describe('loadSpellsForClass', () => {
  it('lists a class its spells of one level, without read magic for a first level Magic-User', async () => {
    const spells = await loadSpellsForClass('magic-user', 1);
    expect(spells.length).toBeGreaterThan(0);
    expect(spells.every((s) => s.level['magic-user'] === 1)).toBe(true);
    expect(spells.some((s) => s.name === 'Read Magic')).toBe(false);
  });

  it('keeps read magic when asked for every level', async () => {
    const spells = await loadSpellsForClass('magic-user');
    expect(spells.some((s) => s.name === 'Read Magic')).toBe(true);
    expect(spells.some((s) => (s.level['magic-user'] ?? 0) > 1)).toBe(true);
  });

  it('gives a combination class its Magic-User spells', async () => {
    const mage = await loadSpellsForClass('magic-user', 1);
    expect((await loadSpellsForClass('fighter-magic-user', 1)).map((s) => s.name)).toEqual(mage.map((s) => s.name));
  });

  it('answers from the cache until it is 30 minutes old', async () => {
    vi.useFakeTimers();
    const first = await loadSpellsForClass('cleric', 2);
    expect(await loadSpellsForClass('cleric', 2)).toBe(first);
    vi.advanceTimersByTime(31 * 60 * 1000);
    const again = await loadSpellsForClass('cleric', 2);
    expect(again).not.toBe(first);
    expect(again).toEqual(first);
  });

  it('warns about an unknown class but gives it no spells, and lets a custom class through quietly', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await loadSpellsForClass('mystery')).toEqual([]);
    expect(warn).toHaveBeenCalledWith('Unknown class ID: mystery');
    warn.mockClear();
    await loadSpellsForClass('custom-witch');
    expect(warn).not.toHaveBeenCalled();
  });
});

describe('loading spells for custom classes', () => {
  it('offers every first level spell of any class except read magic', async () => {
    const spells = await loadAllFirstLevelSpells();
    expect(spells.length).toBeGreaterThan(0);
    expect(spells.every((s) => Object.values(s.level).includes(1))).toBe(true);
    expect(spells.some((s) => s.name === 'Read Magic')).toBe(false);
  });

  it('offers every spell of every level except read magic', async () => {
    const all = await loadAllSpells();
    expect(all.length).toBeGreaterThan((await loadAllFirstLevelSpells()).length);
    expect(all.some((s) => s.name === 'Read Magic')).toBe(false);
  });
});

describe('preloadCriticalData', () => {
  it('warms the cache without failing', async () => {
    await expect(preloadCriticalData()).resolves.toBeUndefined();
  });
});
