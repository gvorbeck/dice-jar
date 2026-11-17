// Read-only: how many games have moved to subcollections and how many have not. Usage: node scripts/migration-status.ts
import { adminDb } from './admin.ts';
import { migrationStatus } from './migrationStatus.ts';

const { total, moved, remaining } = await migrationStatus(adminDb());
console.log(`${total} games: ${moved} moved, ${remaining} not yet.`);
