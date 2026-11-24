import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseAlerts } from '@dice-jar/browser';

// The apps drop a malformed message and show the rest; a typo here would silently hide a message, so it fails CI instead.
describe('public/alerts.json', () => {
  const json = JSON.parse(readFileSync('public/alerts.json', 'utf8')) as { alerts: { id: string; apps?: string[] }[] };

  it('has only valid messages', () => {
    expect(parseAlerts(json)).toHaveLength(json.alerts.length);
  });

  it('gives every message its own id, since a reader dismisses by id', () => {
    expect(new Set(json.alerts.map((a) => a.id)).size).toBe(json.alerts.length);
  });

  it('names only apps that exist', () => {
    const known = ['delta-green', 'stonetop', 'bfrpg'];
    for (const a of json.alerts) for (const app of a.apps ?? []) expect(known).toContain(app);
  });
});
