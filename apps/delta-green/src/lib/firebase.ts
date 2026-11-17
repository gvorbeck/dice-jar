import { initFirestore } from '@dice-jar/firebase';

// Config comes from the VITE_FIREBASE_* env vars (see .env.example); `app` is for the Discord function calls.
export const { app, db } = initFirestore(import.meta.env);
