/** The app's data and auth services, under the names the rest of the app imports. */
export { watchUserCharacters, watchCharacter, getCharacterById, saveCharacter, deleteCharacter } from './characters';
export { watchUserGames, watchGame, saveGame, deleteGame } from './games';
export { signInWithEmail, signUpWithEmail, signInWithGoogle, sendPasswordReset, signOut, onAuthStateChange } from './auth';

// Export migration and data utilities
export * from './characterMigration';
export * from './dataLoader';

// Re-export types
export type { AuthUser } from './auth';
export type { CharacterListItem } from './characters';
