import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
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
