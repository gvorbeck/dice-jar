import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  initializeApp: vi.fn(() => 'app'),
  initializeAppCheck: vi.fn(),
  initializeFirestore: vi.fn(() => 'db'),
  connectFirestoreEmulator: vi.fn(),
}));
vi.mock('firebase/app', () => ({ initializeApp: m.initializeApp }));
vi.mock('firebase/app-check', () => ({ initializeAppCheck: m.initializeAppCheck, ReCaptchaEnterpriseProvider: class {} }));
vi.mock('firebase/firestore', () => ({
  initializeFirestore: m.initializeFirestore,
  connectFirestoreEmulator: m.connectFirestoreEmulator,
  persistentLocalCache: () => ({}),
  persistentMultipleTabManager: () => ({}),
}));
import { initFirestore } from './index';

const env = {
  VITE_FIREBASE_API_KEY: 'k',
  VITE_FIREBASE_AUTH_DOMAIN: 'a',
  VITE_FIREBASE_PROJECT_ID: 'p',
  VITE_FIREBASE_STORAGE_BUCKET: 's',
  VITE_FIREBASE_MESSAGING_SENDER_ID: 'm',
  VITE_FIREBASE_APP_ID: 'i',
};

describe('initFirestore', () => {
  beforeEach(() => vi.clearAllMocks());

  it('names every missing env var', () => {
    expect(() => initFirestore({ ...env, VITE_FIREBASE_APP_ID: '', VITE_FIREBASE_API_KEY: undefined })).toThrow(
      'VITE_FIREBASE_API_KEY, VITE_FIREBASE_APP_ID',
    );
  });

  it('maps the env onto the Firebase config and uses no emulator or App Check by default', () => {
    expect(initFirestore(env)).toEqual({ app: 'app', db: 'db' });
    expect(m.initializeApp).toHaveBeenCalledWith({
      apiKey: 'k',
      authDomain: 'a',
      projectId: 'p',
      storageBucket: 's',
      messagingSenderId: 'm',
      appId: 'i',
    });
    expect(m.connectFirestoreEmulator).not.toHaveBeenCalled();
    expect(m.initializeAppCheck).not.toHaveBeenCalled();
  });

  it('connects the emulator, and then skips App Check', () => {
    initFirestore({ ...env, VITE_FIRESTORE_EMULATOR: '127.0.0.1:8080', VITE_APPCHECK_SITE_KEY: 'site' });
    expect(m.connectFirestoreEmulator).toHaveBeenCalledWith('db', '127.0.0.1', 8080);
    expect(m.initializeAppCheck).not.toHaveBeenCalled();
  });

  it('turns App Check on when a site key is set', () => {
    initFirestore({ ...env, VITE_APPCHECK_SITE_KEY: 'site' });
    expect(m.initializeAppCheck).toHaveBeenCalledTimes(1);
  });

  it('defaults the emulator host, and registers the App Check debug token only in dev', () => {
    initFirestore({ ...env, VITE_FIRESTORE_EMULATOR: ':8080', DEV: true, VITE_APPCHECK_DEBUG_TOKEN: 'tok' });
    expect(m.connectFirestoreEmulator).toHaveBeenCalledWith('db', 'localhost', 8080);
    expect((globalThis as unknown as Record<string, unknown>).FIREBASE_APPCHECK_DEBUG_TOKEN).toBe('tok');
  });
});
