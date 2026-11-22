import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteApp, getApps } from 'firebase-admin/app';
import { adminDb } from './index';

const reset = () => Promise.all(getApps().map((app) => deleteApp(app)));

describe('adminDb', () => {
  beforeEach(reset);
  afterEach(async () => {
    await reset();
    vi.unstubAllEnvs();
  });

  it('uses the emulator project when the emulator is set, and starts the app only once', () => {
    vi.stubEnv('FIRESTORE_EMULATOR_HOST', '127.0.0.1:8080');
    vi.stubEnv('GCLOUD_PROJECT', undefined);
    const first = adminDb('demo-test');
    expect(getApps()[0]?.options.projectId).toBe('demo-test');
    expect(adminDb('demo-test')).toBe(first); // a second app would throw
  });

  it('refuses to run without a key and without the emulator', () => {
    vi.stubEnv('FIRESTORE_EMULATOR_HOST', '');
    vi.stubEnv('GOOGLE_APPLICATION_CREDENTIALS', '');
    const exit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => adminDb('demo-test')).toThrow('exit');
    expect(exit).toHaveBeenCalledWith(1);
  });
});
