import { describe, expect, it } from 'vitest';
import { applyStatDeltas } from './statDeltas';
import type { CharacterData } from '@/model';

const sheet = (over: Partial<CharacterData>) => ({ statHp: '10', statArmor: '1', statXp: '3', ...over }) as CharacterData;

describe('applyStatDeltas', () => {
  it('adds each delta to the current value as a string', () => {
    expect(applyStatDeltas(sheet({}), { statHp: -4, statArmor: 1, statXp: -2 })).toMatchObject({
      statHp: '6',
      statArmor: '2',
      statXp: '1',
    });
  });
  it('treats a blank or missing value as 0', () => {
    expect(applyStatDeltas(sheet({ statHp: '' }), { statHp: 2 })).toMatchObject({ statHp: '2' });
  });
  it('lets HP and armor go negative', () => {
    expect(applyStatDeltas(sheet({ statHp: '1' }), { statHp: -3 })).toMatchObject({ statHp: '-2' });
  });
  it('refuses to overspend XP, so a second payment from the same balance fails', () => {
    expect(applyStatDeltas(sheet({ statXp: '2' }), { statXp: -2 })).toMatchObject({ statXp: '0' });
    expect(() => applyStatDeltas(sheet({ statXp: '1' }), { statXp: -2 })).toThrow('Not enough XP');
  });
  it('lets a guard refuse the change against the fresh sheet before anything is applied', () => {
    const refuse = () => {
      throw new Error('no');
    };
    expect(() => applyStatDeltas(sheet({}), { statXp: -2 }, refuse)).toThrow('no');
    expect(applyStatDeltas(sheet({}), { statXp: -2 }, () => {})).toMatchObject({ statXp: '1' });
  });
  it('does not change the sheet it was given', () => {
    const before = sheet({});
    applyStatDeltas(before, { statXp: -2 });
    expect(before.statXp).toBe('3');
  });
});
