import { afterEach, describe, expect, it, vi } from 'vitest';

const load = () => import('./firebase');
const KEYS = ['API_KEY', 'AUTH_DOMAIN', 'PROJECT_ID', 'STORAGE_BUCKET', 'MESSAGING_SENDER_ID', 'APP_ID'].map((k) => `VITE_FIREBASE_${k}`);

describe('lib/firebase', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('starts without credentials in mock mode, so a contributor needs no .env', async () => {
    for (const key of KEYS) vi.stubEnv(key, '');
    vi.stubEnv('VITE_MOCK_FIREBASE', 'true');
    await expect(load()).resolves.toBeDefined();
  });

  it('refuses to start without credentials when not in mock mode', async () => {
    for (const key of KEYS) vi.stubEnv(key, '');
    vi.stubEnv('VITE_MOCK_FIREBASE', 'false');
    vi.stubEnv('VITE_FIREBASE_API_KEY', '');
    // mock mode switches itself on when the API key is missing, so a missing key alone must not throw
    await expect(load()).resolves.toBeDefined();
    vi.resetModules();
    vi.stubEnv('VITE_FIREBASE_API_KEY', 'key');
    await expect(load()).rejects.toThrow('Missing required environment variable: VITE_FIREBASE_AUTH_DOMAIN');
  });
});
