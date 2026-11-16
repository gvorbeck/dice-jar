import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// A game is unlisted, not secret (AGENTS.md): the host tells search engines to skip /game/**, so no page needs its own tag.
describe('firebase.json hosting headers', () => {
  it('sends noindex for game pages only', () => {
    const { hosting } = JSON.parse(readFileSync('firebase.json', 'utf8'));
    const rules: { source: string; headers: { key: string; value: string }[] }[] = hosting.headers;
    const robots = rules.filter((r) => r.headers.some((h) => h.key === 'X-Robots-Tag' && h.value === 'noindex'));
    expect(robots.map((r) => r.source)).toEqual(['/game/**']);
  });
});
