import { expect, it } from 'vitest';
import html from '../../index.html?raw';

// Declared in index.html: the build drops it from App.css, and without it the reset's `padding: 0` beats component rules in production.
it('index.html declares the CSS layer order', () => {
  expect(html).toMatch(/<style>\s*@layer base, components;\s*<\/style>/);
});
