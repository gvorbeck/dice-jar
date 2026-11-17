import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as path from 'path';
import * as fs from 'fs';

const sourceId = process.argv[2];
if (!sourceId) {
  console.error('Usage: node scripts/duplicate-game.ts <sourceGameId> [newGameId]');
  process.exit(1);
}

const credentialsEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!credentialsEnv) {
  console.error('Set GOOGLE_APPLICATION_CREDENTIALS to the path of your Firebase service account JSON.');
  process.exit(1);
}

const serviceKeyPath = path.resolve(credentialsEnv);
if (!fs.statSync(serviceKeyPath, { throwIfNoEntry: false })?.isFile()) {
  console.error(`GOOGLE_APPLICATION_CREDENTIALS does not point to a file: ${serviceKeyPath}`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceKeyPath, 'utf8')) as ServiceAccount;
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const duplicate = async () => {
  const srcRef = db.collection('games').doc(sourceId);
  const snap = await srcRef.get();
  if (!snap.exists) {
    console.error(`No game found with ID: ${sourceId}`);
    process.exit(1);
  }

  const data = snap.data() as Record<string, unknown>;
  console.log(`Source game: ${data['name'] ?? '(unnamed)'} (${sourceId})`);

  const destRef = process.argv[3] ? db.collection('games').doc(process.argv[3]) : db.collection('games').doc();

  // Characters and rolls of a moved game live in subcollections that a document copy would leave behind.
  if (data.schemaVersion === 2) {
    console.error('This game has moved to subcollections; duplicating only its document would give a game with no characters.');
    process.exit(1);
  }

  const copy = { ...data, name: `${data['name'] ?? 'Stonetop Game'} (copy)` };
  // create() fails if the target exists, so a game made since we looked is never overwritten.
  await destRef.create(copy);

  console.log(`\nDuplicated to game ${destRef.id}`);
  console.log(`Open at: /game/${destRef.id}`);
};

duplicate().catch((err) => {
  console.error('Duplicate failed:', err);
  process.exit(1);
});
