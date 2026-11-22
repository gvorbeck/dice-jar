import { describe, expect, it } from 'vitest';
import type { DocumentData } from 'firebase/firestore';
import { mockBasicCharacter } from '@/test/mocks/character-data';
import { needsMigration, OLD_BUILD_VERSION, processCharacterData } from './characterMigration';
import { SCHEMA_VERSION } from './documentSchemas';

const stored = (extra: Record<string, unknown>) => {
  const { schemaVersion: _v, settings: _s, ...character } = structuredClone(mockBasicCharacter);
  return { ...character, ...extra } as DocumentData; // what a snapshot hands needsMigration
};

describe('needsMigration', () => {
  it('is false for a character saved today: schemaVersion, plus settings.version for tabs on the previous build', () => {
    expect(needsMigration(stored({ schemaVersion: SCHEMA_VERSION, settings: { version: OLD_BUILD_VERSION } }))).toBe(false);
  });

  it('is true for one saved before schemaVersion', () => {
    expect(needsMigration(stored({ settings: { version: 2.6 } }))).toBe(true);
  });

  it('is true when settings.version is missing, so the previous build never sees it as legacy', () => {
    expect(needsMigration(stored({ schemaVersion: SCHEMA_VERSION }))).toBe(true);
  });

  it('is true when neither version is stored', () => {
    expect(needsMigration(stored({}))).toBe(true);
  });

  it("is false for processCharacterData's own output", () => {
    expect(needsMigration(processCharacterData(stored({ settings: { version: 2.5 } })) as never)).toBe(false);
  });
});
