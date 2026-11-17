import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as path from 'path';
import { assembleGame, type Stored } from '../src/lib/gameShape.ts';
import * as fs from 'fs';

const serviceKeyPath = path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS ?? '');
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS || !fs.existsSync(serviceKeyPath)) {
  console.error('Set GOOGLE_APPLICATION_CREDENTIALS to the path of your Firebase service account JSON.');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceKeyPath, 'utf8')) as ServiceAccount;
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const backup = async () => {
  const snapshot = await db.collection('games').get();
  const data: Record<string, unknown> = {};
  const stored = (snap: FirebaseFirestore.QuerySnapshot): Stored[] => snap.docs.map((d) => ({ id: d.id, data: d.data() }));
  for (const doc of snapshot.docs) {
    const game = doc.data();
    // A moved game is saved as the one document it was before, so every backup has one shape and any tool can read it.
    data[doc.id] =
      game.schemaVersion === 2
        ? assembleGame(game, stored(await doc.ref.collection('characters').get()), stored(await doc.ref.collection('rolls').get()))
        : game;
  }
  const outPath = path.resolve(`./firestore-backup-${Date.now()}.json`);
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
  console.log(`Backed up ${snapshot.size} documents to ${outPath}`);
};

backup().catch((err) => {
  console.error('Backup failed:', err);
  process.exit(1);
});
