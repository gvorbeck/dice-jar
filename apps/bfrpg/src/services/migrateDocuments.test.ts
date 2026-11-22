import { describe, expect, it } from 'vitest';
import { getAllSampleCharacters } from '@/data/sampleCharacters';
import { getAllSampleGames } from '@/data/sampleGames';
import { planMigration } from './migrateDocuments';
import { SCHEMA_VERSION } from './documentSchemas';

const times = { created: 1_700_000_000_000, updated: 1_700_000_100_000 };
const apply = (stored: Record<string, unknown>, next: Record<string, unknown>) => ({ ...stored, ...next });

// A character from before the schemaVersion field: the old decimal lives in settings.version.
const old = () => {
  const { schemaVersion: _schemaVersion, ...character } = structuredClone(getAllSampleCharacters()[0]!);
  return { ...character, settings: { useCoinWeight: true, version: 2.6 } } as Record<string, unknown>;
};

describe('planMigration', () => {
  it('adds schemaVersion, keeps settings.version for the previous build, and backfills the times from the document', () => {
    const plan = planMigration('characters', old(), times);
    if (plan.status !== 'migrate') throw new Error(plan.status);
    expect(plan.next).toMatchObject({ schemaVersion: SCHEMA_VERSION, createdAt: times.created, updatedAt: times.updated });
    expect((plan.next['settings'] as Record<string, unknown>)['version']).toBe(2.6);
    expect((plan.next['settings'] as Record<string, unknown>)['useCoinWeight']).toBe(true);
  });

  it('writes only the changed leaves, and never touches the character itself', () => {
    const plan = planMigration('characters', old(), times);
    if (plan.status !== 'migrate') throw new Error(plan.status);
    expect(plan.changes.map(([path]) => path.join('.')).sort()).toEqual(['createdAt', 'schemaVersion', 'updatedAt']);
  });

  it('is idempotent: its own output plans as current, so a second run writes nothing', () => {
    const stored = old();
    const plan = planMigration('characters', stored, times);
    if (plan.status !== 'migrate') throw new Error(plan.status);
    expect(planMigration('characters', plan.next, times)).toEqual({ status: 'current' });
    expect(planMigration('characters', apply(stored, plan.next), times)).toEqual({ status: 'current' });
  });

  it('keeps the gold and current hit points of a modern character whose only old part is its version', () => {
    const modern = { ...old(), settings: { version: 2.5 }, currency: { gold: 9, silver: 3 }, hp: { current: 4, max: 10 } };
    const plan = planMigration('characters', modern, times);
    if (plan.status !== 'migrate') throw new Error(plan.status);
    expect(plan.next).toMatchObject({ currency: { gold: 9, silver: 3 }, hp: { current: 4, max: 10 } });
  });

  it('ignores key order, since Firestore hands objects back with sorted keys', () => {
    const plan = planMigration('characters', old(), times);
    if (plan.status !== 'migrate') throw new Error(plan.status);
    const reordered = {
      ...plan.next,
      equipment: (plan.next['equipment'] as Record<string, unknown>[]).map((item) => Object.fromEntries(Object.entries(item).reverse())),
    };
    expect(planMigration('characters', reordered, times)).toEqual({ status: 'current' });
  });

  it('gives a legacy character with no coins a currency, and one with no points a current hit points', () => {
    const { currency: _c, schemaVersion: _v, ...base } = structuredClone(getAllSampleCharacters()[0]!);
    const stored = { ...base, settings: { version: 2.2 }, hp: { max: 8 } } as Record<string, unknown>;
    const plan = planMigration('characters', stored, times);
    if (plan.status !== 'migrate') throw new Error(plan.status);
    expect(plan.next).toMatchObject({ currency: { gold: 0 }, hp: { current: 8, max: 8 } });
  });

  it('fills the xp, equipment and coins an old export leaves out, so it still imports', () => {
    const { xp: _x, equipment: _e, currency: _c, schemaVersion: _v, ...base } = structuredClone(getAllSampleCharacters()[0]!);
    const plan = planMigration('characters', { ...base, settings: { version: 2.6 } }, times);
    if (plan.status !== 'migrate') throw new Error(plan.status);
    expect(plan.next).toMatchObject({ xp: 0, equipment: [], currency: { gold: 0 } });
  });

  it('migrates the custom class of a character from before custom classes, and leaves it current afterwards', () => {
    const { schemaVersion: _v, ...base } = structuredClone(getAllSampleCharacters()[0]!);
    const stored = {
      ...base,
      class: 'custom',
      customClasses: { x: { name: 'Witch', hitDie: '1d6' } },
      settings: { version: 2.3 },
    } as Record<string, unknown>;
    const plan = planMigration('characters', stored, times);
    if (plan.status !== 'migrate') throw new Error(plan.status);
    expect(plan.next).toMatchObject({ class: 'witch' }); // the legacy rules turn a class name into an ID
    expect(plan.next).not.toHaveProperty('customClasses');
    expect(planMigration('characters', plan.next, times)).toEqual({ status: 'current' });
  });

  it('joins a description stored as a list of lines into one text, and nothing else changes', () => {
    const plan = planMigration('characters', { ...old(), desc: ['First line', 'Second line\n'] }, times);
    if (plan.status !== 'migrate') throw new Error(plan.status);
    expect(plan.next['desc']).toBe('First line\nSecond line\n');
    expect(planMigration('characters', { ...old(), desc: [] }, times)).toMatchObject({ status: 'migrate', next: { desc: '' } });
    expect(planMigration('characters', plan.next, times)).toEqual({ status: 'current' });
  });

  it('tolerates an item with no amount and a combatant with no armor class, as stored', () => {
    expect(planMigration('characters', { ...old(), equipment: [{ name: 'Rope', amount: null }] }, times).status).toBe('migrate');
    expect(planMigration('games', { name: 'G', combatants: [{ name: 'Orc', initiative: 3 }] }, times).status).toBe('migrate');
  });

  it('refuses what would not fit the schema, and what is not a character at all', () => {
    expect(planMigration('characters', { ...old(), level: 'three' }, times)).toMatchObject({ status: 'refused' });
    expect(planMigration('characters', { nothing: true }, times)).toMatchObject({ status: 'refused' });
  });

  it('migrates a game by adding the version and the times, and leaves a current game alone', () => {
    const game = structuredClone(getAllSampleGames()[0]!) as Record<string, unknown>;
    delete game['id'];
    const plan = planMigration('games', game, times);
    if (plan.status !== 'migrate') throw new Error(plan.status);
    expect(plan.next).toMatchObject({ schemaVersion: SCHEMA_VERSION, createdAt: times.created });
    expect(planMigration('games', plan.next, times)).toEqual({ status: 'current' });
    expect(planMigration('games', { notes: 'x' }, times)).toMatchObject({ status: 'refused' });
  });
});
