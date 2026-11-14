// Runs an npm script in every workspace that has it, packages before the apps that use them. `npm run --workspaces` fails while there are no workspaces yet.
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';

const script = process.argv[2];
const failed = [];
// shortcut: packages run alphabetically, not by their dependencies on each other; order them once one package needs another built first
for (const root of ['packages', 'apps']) {
  for (const name of readdirSync(root).sort()) {
    const dir = `${root}/${name}`;
    const pkg = `${dir}/package.json`;
    if (!existsSync(pkg) || !JSON.parse(readFileSync(pkg, 'utf8')).scripts?.[script]) continue;
    if (spawnSync('npm', ['run', script, '-w', dir], { stdio: 'inherit' }).status !== 0) failed.push(dir);
  }
}
if (failed.length) {
  console.error(`\n${script} failed in: ${failed.join(', ')}`);
  process.exit(1);
}
