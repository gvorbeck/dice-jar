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

  // App Check loads reCAPTCHA Enterprise and exchanges its token: a policy that blocks either breaks the page for everyone once a site key is set.
  it('lets App Check load reCAPTCHA and reach its token service', () => {
    const { hosting } = JSON.parse(readFileSync('firebase.json', 'utf8'));
    const csp: string = hosting.headers
      .flatMap((r: { headers: { key: string; value: string }[] }) => r.headers)
      .find((h: { key: string }) => h.key === 'Content-Security-Policy').value;
    const directive = (name: string) =>
      csp
        .split(';')
        .map((d) => d.trim())
        .find((d) => d.startsWith(`${name} `)) ?? '';
    expect(directive('script-src')).toContain('https://www.google.com/recaptcha/');
    expect(directive('script-src')).toContain('https://www.gstatic.com/recaptcha/');
    expect(directive('connect-src')).toContain('https://firebaseappcheck.googleapis.com');
    expect(directive('connect-src')).toContain('https://content-firebaseappcheck.googleapis.com');
    expect(directive('frame-src')).toContain('https://www.google.com/recaptcha/');
  });
});
