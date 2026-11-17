// Read-only: says which games differ between two backups, e.g. one from before the migration and one from after.
// Usage: node scripts/compare-backups.ts <before.json> <after.json>
import * as fs from 'fs';
import { compareBackups } from './compareBackups.ts';

const [beforeFile, afterFile] = process.argv.slice(2);
if (!beforeFile || !afterFile || ![beforeFile, afterFile].every((f) => fs.existsSync(f))) {
  console.error('Usage: node scripts/compare-backups.ts <before.json> <after.json>');
  process.exit(1);
}
const read = (file: string) => JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, unknown>;
const { same, differ, onlyInFirst, onlyInSecond } = compareBackups(read(beforeFile), read(afterFile));

console.log(
  `${same} games identical, ${differ.length} changed, ${onlyInFirst.length} only in the first, ${onlyInSecond.length} only in the second.`,
);
if (differ.length) console.log(`Changed: ${differ.join(', ')}`);
if (onlyInFirst.length) console.log(`Missing from the second: ${onlyInFirst.join(', ')}`);
if (onlyInSecond.length) console.log(`New in the second: ${onlyInSecond.join(', ')}`);
process.exit(onlyInFirst.length ? 1 : 0);
