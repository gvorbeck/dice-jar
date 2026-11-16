import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { connectFirestoreEmulator, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

// Config field -> the Vite env var it reads (see the app's .env.example). Fail loud at startup rather than as opaque Firestore errors.
const envVars = {
  apiKey: 'VITE_FIREBASE_API_KEY',
  authDomain: 'VITE_FIREBASE_AUTH_DOMAIN',
  projectId: 'VITE_FIREBASE_PROJECT_ID',
  storageBucket: 'VITE_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'VITE_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'VITE_FIREBASE_APP_ID',
} as const;

type Env = Record<string, string | boolean | undefined>;

/**
 * The app's Firestore, from its Vite env (pass `import.meta.env`).
 * The persistent cache lets pages open and writes queue while offline; the multi-tab manager keeps several open sheets coherent.
 * VITE_FIRESTORE_EMULATOR ("host:port") points browser tests at the local emulator, never at production data.
 * VITE_APPCHECK_SITE_KEY turns App Check on (off without it, and always off against the emulator).
 */
export function initFirestore(env: Env) {
  const missing = Object.values(envVars).filter((v) => !env[v]);
  if (missing.length) throw new Error(`Missing Firebase env vars: ${missing.join(', ')}. See .env.example.`);
  const app = initializeApp(Object.fromEntries(Object.entries(envVars).map(([k, v]) => [k, env[v]])));

  const emulator = env.VITE_FIRESTORE_EMULATOR; // "host:port"
  const siteKey = env.VITE_APPCHECK_SITE_KEY;
  // Dev only (never in a build): a debug token registered in the console lets localhost pass App Check against production.
  if (env.DEV && env.VITE_APPCHECK_DEBUG_TOKEN) Object.assign(globalThis, { FIREBASE_APPCHECK_DEBUG_TOKEN: env.VITE_APPCHECK_DEBUG_TOKEN });
  if (siteKey && !emulator)
    initializeAppCheck(app, { provider: new ReCaptchaEnterpriseProvider(String(siteKey)), isTokenAutoRefreshEnabled: true });

  const db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
  if (typeof emulator === 'string' && emulator) {
    const [host, port] = emulator.split(':');
    connectFirestoreEmulator(db, host || 'localhost', Number(port));
  }
  return { app, db };
}
