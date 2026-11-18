import { describe, expect, it } from 'vitest';
import { APPS, host } from './apps';

describe('APPS', () => {
  it('links every live app over https, at its site root', () => {
    for (const { url } of APPS.filter((a) => a.url)) expect(url).toMatch(/^https:\/\/[^/]+\/$/);
  });

  it('names each app once', () => {
    expect(new Set(APPS.map((a) => a.name)).size).toBe(APPS.length);
  });
});

describe('host', () => {
  it('drops the scheme and path', () => {
    expect(host('https://hearthfire.camp/')).toBe('hearthfire.camp');
  });
});
