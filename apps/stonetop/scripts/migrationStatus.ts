import type { Firestore } from 'firebase-admin/firestore';

/** How many games there are and how many have moved to subcollections, from two counts: no game is read. */
export const migrationStatus = async (db: Firestore) => {
  const games = db.collection('games');
  const [total, moved] = await Promise.all([games.count().get(), games.where('schemaVersion', '==', 2).count().get()]);
  return { total: total.data().count, moved: moved.data().count, remaining: total.data().count - moved.data().count };
};
