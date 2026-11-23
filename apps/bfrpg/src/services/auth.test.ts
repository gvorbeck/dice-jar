import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithPopup,
} from 'firebase/auth';
import { signInWithEmail, signUpWithEmail, signInWithGoogle, sendPasswordReset, signOut, onAuthStateChange } from './auth';

vi.mock('@/lib/firebase', () => ({ auth: { name: 'auth' } }));
vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  signInWithPopup: vi.fn(),
  GoogleAuthProvider: class {},
}));

const user = { uid: 'u1', email: 'a@b.test', displayName: 'Ada', refreshToken: 'secret' };
const expected = { uid: 'u1', email: 'a@b.test', displayName: 'Ada' };
beforeEach(() => vi.clearAllMocks());

describe('auth service', () => {
  it('signs in with an email and keeps only the uid, email and name', async () => {
    vi.mocked(signInWithEmailAndPassword).mockResolvedValue({ user } as never);
    expect(await signInWithEmail('a@b.test', 'pw')).toEqual(expected);
    expect(signInWithEmailAndPassword).toHaveBeenCalledWith({ name: 'auth' }, 'a@b.test', 'pw');
  });

  it('signs up with an email', async () => {
    vi.mocked(createUserWithEmailAndPassword).mockResolvedValue({ user } as never);
    expect(await signUpWithEmail('a@b.test', 'pw')).toEqual(expected);
  });

  it('signs in with Google through a popup', async () => {
    vi.mocked(signInWithPopup).mockResolvedValue({ user } as never);
    expect(await signInWithGoogle()).toEqual(expected);
  });

  it('sends a password reset and signs out', async () => {
    await sendPasswordReset('a@b.test');
    expect(sendPasswordResetEmail).toHaveBeenCalledWith({ name: 'auth' }, 'a@b.test');
    await signOut();
    expect(firebaseSignOut).toHaveBeenCalledWith({ name: 'auth' });
  });

  it('passes on auth state changes in our shape, or null when signed out', () => {
    const unsubscribe = vi.fn();
    vi.mocked(onAuthStateChanged).mockImplementation(((_auth: unknown, cb: (u: unknown) => void) => {
      cb(user);
      cb(null);
      return unsubscribe;
    }) as never);
    const callback = vi.fn();
    expect(onAuthStateChange(callback)).toBe(unsubscribe);
    expect(callback.mock.calls).toEqual([[expected], [null]]);
  });
});
