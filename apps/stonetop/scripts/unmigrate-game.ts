// Puts one moved game back in a single document, with whatever has been saved since (MIGRATION.md). Without --write it only checks.
// Usage: node scripts/unmigrate-game.ts <gameId> [--write]
import { adminDb } from '@dice-jar/admin';
import { unmigrateGame } from './migrateCore.ts';

const gameId = process.argv[2];
if (!gameId || gameId.startsWith('--')) {
  console.error('Usage: node scripts/unmigrate-game.ts <gameId> [--write]');
  process.exit(1);
}
const write = process.argv.includes('--write');
const db = adminDb('demo-stonetop');

if (!write) {
  const game = await db.collection('games').doc(gameId).get();
  console.log(
    !game.exists
      ? `No game found with ID: ${gameId}`
      : game.data()?.schemaVersion === 2
        ? 'This game has moved. Pass --write to put it back.'
        : 'This game has not moved; nothing to do.',
  );
  process.exit(0);
}
const outcome = await unmigrateGame(db, gameId);
console.log(
  outcome.status === 'put back'
    ? `Put back ${outcome.characters} characters and ${outcome.rolls} rolls.`
    : `Nothing changed: ${outcome.status}.`,
);
process.exit(outcome.status === 'put back' ? 0 : 1);
