// Saves games to ./firestore-backup-<timestamp>.json, all of them or just `--only id,id`. Read-only.
import * as fs from 'fs';
import * as path from 'path';
import { adminDb } from './admin.ts';
import { backupGames } from './backupCore.ts';

const flag = process.argv.indexOf('--only');
const only = flag === -1 ? undefined : process.argv[flag + 1]?.split(',').filter(Boolean);
if (flag !== -1 && !only?.length) {
  console.error('Usage: node scripts/backup.ts [--only id,id]');
  process.exit(1);
}

const data = await backupGames(adminDb(), {
  only,
  onProgress: (done, total) => {
    if (done % 100 === 0 && done !== total) console.log(`  ${done} / ${total} games`);
  },
});
const outPath = path.resolve(`./firestore-backup-${Date.now()}.json`);
fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
console.log(`Backed up ${Object.keys(data).length} documents to ${outPath}`);
