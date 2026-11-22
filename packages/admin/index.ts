import { getApps, initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Firestore through the Admin SDK, for an app's backup, migration and rehearsal scripts. Safe to call again: the app starts once.
 * The emulator when FIRESTORE_EMULATOR_HOST is set (tests, rehearsals; `demoProjectId` is its project), otherwise the service account
 * in GOOGLE_APPLICATION_CREDENTIALS, so a script can't reach production without the key on purpose.
 */
export const adminDb = (demoProjectId: string) => {
  if (getApps().length) return getFirestore();
  if (process.env['FIRESTORE_EMULATOR_HOST']) {
    initializeApp({ projectId: process.env['GCLOUD_PROJECT'] ?? demoProjectId });
    return getFirestore();
  }
  const keyPath = path.resolve(process.env['GOOGLE_APPLICATION_CREDENTIALS'] ?? '');
  if (!process.env['GOOGLE_APPLICATION_CREDENTIALS'] || !fs.existsSync(keyPath)) {
    console.error('Set GOOGLE_APPLICATION_CREDENTIALS to the path of your Firebase service account JSON.');
    process.exit(1);
  }
  initializeApp({ credential: cert(JSON.parse(fs.readFileSync(keyPath, 'utf8')) as ServiceAccount) });
  return getFirestore();
};
