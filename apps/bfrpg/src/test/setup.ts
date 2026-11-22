import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { mockFirebaseAuth, mockFirestore, resetFirebaseMocks } from './mocks/firebase';

// Cleanup after each test case
afterEach(() => {
  cleanup();
  resetFirebaseMocks();
});

// Auto-inject Firebase mocks globally
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => mockFirebaseAuth),
  onAuthStateChanged: vi.fn(),
  signInWithEmailAndPassword: mockFirebaseAuth.signInWithEmailAndPassword,
  createUserWithEmailAndPassword: mockFirebaseAuth.createUserWithEmailAndPassword,
  signOut: mockFirebaseAuth.signOut,
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => mockFirestore),
  initializeFirestore: vi.fn(() => mockFirestore),
  persistentLocalCache: vi.fn(),
  persistentMultipleTabManager: vi.fn(),
  connectFirestoreEmulator: vi.fn(),
  collection: mockFirestore.collection,
  doc: vi.fn(() => ({
    get: vi.fn().mockResolvedValue({
      exists: true,
      data: vi.fn().mockReturnValue({ name: 'Test Document' }),
    }),
    set: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  })),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
}));
