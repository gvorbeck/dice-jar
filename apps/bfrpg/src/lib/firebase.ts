// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { FIREBASE_ENV_KEYS } from '@/constants';
import { isMockMode } from './mockMode';

// Validate required environment variables
const requiredEnvVars = [
  FIREBASE_ENV_KEYS.API_KEY,
  FIREBASE_ENV_KEYS.AUTH_DOMAIN,
  FIREBASE_ENV_KEYS.PROJECT_ID,
  FIREBASE_ENV_KEYS.STORAGE_BUCKET,
  FIREBASE_ENV_KEYS.MESSAGING_SENDER_ID,
  FIREBASE_ENV_KEYS.APP_ID,
] as const;

// Mock mode runs without credentials: the services never reach Firebase, so placeholders are enough to initialise the SDK
const mock = isMockMode();

requiredEnvVars.forEach((varName) => {
  if (!mock && !import.meta.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});

const firebaseConfig = {
  apiKey: import.meta.env[FIREBASE_ENV_KEYS.API_KEY] || 'mock',
  authDomain: import.meta.env[FIREBASE_ENV_KEYS.AUTH_DOMAIN] || 'mock',
  projectId: import.meta.env[FIREBASE_ENV_KEYS.PROJECT_ID] || 'mock',
  storageBucket: import.meta.env[FIREBASE_ENV_KEYS.STORAGE_BUCKET] || 'mock',
  messagingSenderId: import.meta.env[FIREBASE_ENV_KEYS.MESSAGING_SENDER_ID] || 'mock',
  appId: import.meta.env[FIREBASE_ENV_KEYS.APP_ID] || 'mock',
  measurementId: import.meta.env[FIREBASE_ENV_KEYS.MEASUREMENT_ID],
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
