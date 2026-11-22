import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { initFirestore } from '@dice-jar/firebase';

// Config comes from the Vite env (.env.example). VITE_FIRESTORE_EMULATOR / VITE_AUTH_EMULATOR ("host:port") point the app at the local emulators.
const { app, db } = initFirestore(import.meta.env);
export { db };

export const auth = getAuth(app);
const authEmulator = import.meta.env['VITE_AUTH_EMULATOR'];
if (authEmulator) connectAuthEmulator(auth, `http://${authEmulator}`, { disableWarnings: true });
