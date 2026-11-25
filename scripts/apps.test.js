import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { test } from 'node:test';

const apps = resolve(import.meta.dirname, '../apps');
// The landing page is the Dice Jar, so it is the one app without the credit.
const gameApps = readdirSync(apps, { withFileTypes: true }).filter((d) => d.isDirectory() && d.name !== 'dice-jar');

const sources = (dir) =>
  readdirSync(dir, { recursive: true })
    .filter((f) => /\.tsx$/.test(f) && !/\.test\.tsx$/.test(f))
    .map((f) => readFileSync(join(dir, f), 'utf8').replace(/\/\*[\s\S]*?\*\/|^\s*\/\/.*$/gm, '')); // comments don't count; a `//` inside a string is not one

// shortcut: any file in src counts, not each page; the apps' e2e tests check every page, upgrade if a page ships without it.
for (const app of gameApps)
  test(`${app.name} shows "Another app pulled from the Dice Jar"`, () => {
    assert.ok(
      sources(join(apps, app.name, 'src')).some((s) => s.includes('<DiceJarCredit')),
      `render <DiceJarCredit /> from @dice-jar/browser in ${app.name}'s footer`,
    );
  });

const allApps = readdirSync(apps, { withFileTypes: true }).filter((d) => d.isDirectory());
const head = (app) => readFileSync(join(apps, app, 'index.html'), 'utf8');
// Regexes match the attribute order and double quotes the pages use today; adjust them if a tag is reordered.
const seo = {
  lang: /<html lang="\w+/,
  title: /<title>[^<]+<\/title>/,
  description: /<meta\s+name="description"\s+content="[^"]+"/,
  canonical: /<link rel="canonical"/,
  'color-scheme': /<meta name="color-scheme"/,
  'theme-color': /<meta name="theme-color"/,
  'og:title': /<meta property="og:title"/,
  'og:image': /<meta property="og:image" content="https:\/\/[^"]+"/, // the card a shared link shows; unfurlers need an absolute URL
  'twitter:card': /<meta name="twitter:card" content="summary_large_image"/,
  noscript: /<noscript>[\s\S]*\S[\s\S]*<\/noscript>/, // what crawlers that don't run JavaScript read
};
for (const app of allApps)
  test(`${app.name}'s index.html has the shared SEO tags`, () => {
    for (const [tag, re] of Object.entries(seo)) assert.match(head(app.name), re, `${app.name}/index.html: add ${tag}`);
    const image = new URL(head(app.name).match(/<meta property="og:image" content="([^"]+)"/)?.[1] ?? '', 'https://x').pathname;
    assert.ok(
      statSync(join(apps, app.name, 'public', image), { throwIfNoEntry: false })?.isFile(),
      `${app.name}: og:image points at ${image}, which is not in public/`,
    );
  });

for (const app of gameApps)
  test(`${app.name} describes itself to search engines and AI crawlers`, () => {
    assert.match(head(app.name), /<script type="application\/ld\+json">/, `${app.name}/index.html: add the WebApplication JSON-LD`);
    assert.ok(readFileSync(join(apps, app.name, 'public/llms.txt'), 'utf8').startsWith('# '), `add ${app.name}/public/llms.txt`);
  });

// A Content-Security-Policy blocks the fetch of the global alerts file unless its host is listed, and the banner hides that failure.
for (const app of gameApps) {
  const file = join(apps, app.name, 'firebase.json');
  const csp = statSync(file, { throwIfNoEntry: false })
    ? JSON.stringify(JSON.parse(readFileSync(file, 'utf8')).hosting).match(/Content-Security-Policy","value":"([^"]*)"/)?.[1]
    : undefined;
  if (csp)
    test(`${app.name}'s Content-Security-Policy lets the page fetch the global alerts file`, () => {
      const connect = csp.split(';').find((d) => d.trim().startsWith('connect-src')) ?? '';
      assert.ok(
        connect.split(/\s+/).includes('https://dicejar.games'),
        `${app.name}/firebase.json: add https://dicejar.games to connect-src`,
      );
    });
}
