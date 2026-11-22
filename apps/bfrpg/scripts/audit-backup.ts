// What migrating a backup would do, from the file alone: reads and writes nothing. Usage: npm run audit-backup -- <file>
import * as fs from 'fs';
import { planAll, type Backup } from './migrateRun.ts';

const file = process.argv[2];
if (!file || !fs.existsSync(file)) {
  console.error('Usage: npm run audit-backup -- <backup file>');
  process.exit(1);
}
const plans = planAll(JSON.parse(fs.readFileSync(file, 'utf8')) as Backup);
const count = (status: string) => plans.filter((p) => p.plan.status === status).length;
console.log(
  `${plans.length} documents: ${count('current')} current, ${count('migrate')} to migrate (1 read + 1 write each), ${count('refused')} refused`,
);
for (const { docPath, plan } of plans) if (plan.status === 'refused') console.log(`  refused ${docPath}: ${plan.reason}`);
process.exit(count('refused') ? 1 : 0);
