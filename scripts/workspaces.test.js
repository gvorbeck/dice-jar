import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { after, before, test } from 'node:test';

const runner = resolve(import.meta.dirname, 'workspaces.js');
let root;

// A throwaway monorepo with the same shape as this one; each workspace's script prints a marker or fails.
function workspace(path, scripts) {
  mkdirSync(join(root, path), { recursive: true });
  writeFileSync(join(root, path, 'package.json'), JSON.stringify({ name: path.replace('/', '-'), private: true, scripts }));
}
const prints = (marker) => `node -e "console.log('${marker}')"`;
const run = (script) => spawnSync(process.execPath, [runner, script], { cwd: root, encoding: 'utf8' });

before(() => {
  root = mkdtempSync(join(tmpdir(), 'workspaces-'));
  writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'tmp', private: true, workspaces: ['apps/*', 'packages/*'] }));
  mkdirSync(join(root, 'apps'));
  mkdirSync(join(root, 'packages'));
  writeFileSync(join(root, 'apps/.gitkeep'), '');
});
after(() => rmSync(root, { recursive: true, force: true }));

test('succeeds when there are no workspaces', () => {
  assert.equal(run('typecheck').status, 0);
});

test('runs the script in workspaces that have it, packages first, and skips the rest', () => {
  workspace('apps/app', { go: prints('RAN-app'), other: prints('RAN-other') });
  workspace('packages/pkg', { go: prints('RAN-pkg') });
  workspace('packages/idle', { unrelated: prints('RAN-idle') });
  const { status, stdout } = run('go');
  assert.equal(status, 0);
  assert.ok(stdout.indexOf('RAN-pkg') !== -1 && stdout.indexOf('RAN-pkg') < stdout.indexOf('RAN-app'), 'packages run before apps');
  assert.ok(!stdout.includes('RAN-other') && !stdout.includes('RAN-idle'));
});

test('a failing workspace does not stop the others, and the run fails naming it', () => {
  workspace('apps/broken', { boom: 'node -e "process.exit(3)"' });
  workspace('apps/fine', { boom: prints('RAN-fine') });
  const { status, stdout, stderr } = run('boom');
  assert.equal(status, 1);
  assert.ok(stdout.includes('RAN-fine'));
  assert.ok(stderr.includes('apps/broken') && !stderr.includes('apps/fine'));
});
