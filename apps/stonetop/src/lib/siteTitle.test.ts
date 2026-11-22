import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { SITE_TITLE } from './siteTitle';

it('matches the <title> in index.html', () => {
  const html = readFileSync('index.html', 'utf8');
  expect(html).toContain(`<title>${SITE_TITLE}</title>`);
});
