// Read-only: checks a backup file from `npm run backup` against the move to subcollections (see MIGRATION.md).
// Usage: node scripts/audit-backup.ts ./firestore-backup-<timestamp>.json
// Needs no credentials and writes nothing. Exits 1 if any game cannot be moved exactly.
import * as fs from 'fs';
import { auditGames } from './gameAudit.ts';

const file = process.argv[2];
if (!file || !fs.existsSync(file)) {
  console.error('Usage: node scripts/audit-backup.ts ./firestore-backup-<timestamp>.json');
  process.exit(1);
}

const games: unknown = JSON.parse(fs.readFileSync(file, 'utf8'));
if (typeof games !== 'object' || games === null || Array.isArray(games)) {
  console.error('That is not a backup file: expected an object of games keyed by id.');
  process.exit(1);
}

const audits = auditGames(games as Record<string, unknown>);
const refused = audits.filter((a) => a.problems.length);
for (const a of refused) console.log(`REFUSED ${a.id}\n${a.problems.map((p) => `  - ${p}`).join('\n')}`);

const kb = (n: number) => `${(n / 1024).toFixed(1)} KiB`;
const largest = [...audits].sort((a, b) => b.bytes - a.bytes)[0];
console.log(
  `\n${audits.length} games: ${audits.length - refused.length} can be moved, ${refused.length} refused.` +
    `\nCharacters ${audits.reduce((n, a) => n + a.characters, 0)}, rolls ${audits.reduce((n, a) => n + a.rolls, 0)}.` +
    (largest ? `\nLargest game: ${largest.id}, ${kb(largest.bytes)} of 1024 KiB.` : ''),
);
process.exit(refused.length ? 1 : 0);
