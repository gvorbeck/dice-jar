import { initFirestore } from '@dice-jar/firebase';

// Config comes from the VITE_FIREBASE_* env vars (see .env.example).
export const { db } = initFirestore(import.meta.env);
