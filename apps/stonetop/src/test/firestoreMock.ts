import { vi } from 'vitest';
import { assembleGame, splitGame } from '@/lib/gameShape';

// In-memory Firestore stand-in. Hooks and src/lib/game.ts import the real
// firebase/firestore functions (doc/getDoc/updateDoc/runTransaction/onSnapshot/
// addDoc/collection/arrayUnion); this module backs all of them with a plain Map
// so tests run without a real Firebase connection or emulator.
//
// Usage — at the top of a test file, before importing the code under test:
//
//   vi.mock('firebase/firestore', () => firestoreMockModule());
//   import { firestoreStore } from '@/test/firestoreMock';
//
// then seed/inspect docs via firestoreStore between renders.

type DocData = Record<string, unknown>;

// path -> document data. A missing key means the doc does not exist.
const docs = new Map<string, DocData>();

// path -> set of snapshot listeners registered through onSnapshot. A collection listener gets a query snapshot.
type Listener = (snap: ReturnType<typeof makeSnapshot>) => void;
type CollectionListener = (snap: ReturnType<typeof makeQuerySnapshot>) => void;
const listeners = new Map<string, Set<Listener>>();
const collectionListeners = new Map<string, Set<CollectionListener>>();

const makeSnapshot = (path: string) => {
  const data = docs.get(path);
  const id = path.split('/').pop() ?? path;
  return {
    id,
    exists: () => data !== undefined,
    // Return a structural clone so callers can't mutate the store in place,
    // mirroring Firestore's snapshot semantics.
    data: () => (data === undefined ? undefined : structuredClone(data)),
  };
};

// The documents directly under a collection path, like a getDocs(collection(...)) result.
const makeQuerySnapshot = (collectionPath: string) => {
  const docsHere = [...docs.keys()]
    .filter((p) => p.startsWith(`${collectionPath}/`) && !p.slice(collectionPath.length + 1).includes('/'))
    .sort()
    .map((p) => makeSnapshot(p));
  return { docs: docsHere, size: docsHere.length, empty: docsHere.length === 0 };
};

const emit = (path: string) => {
  const snap = makeSnapshot(path);
  listeners.get(path)?.forEach((l) => l(snap));
  const parent = path.slice(0, path.lastIndexOf('/'));
  const collection = collectionListeners.get(parent);
  if (collection?.size) {
    const query = makeQuerySnapshot(parent);
    collection.forEach((l) => l(query));
  }
};

// A doc/collection reference is just its path plus a discriminator; the mocked
// firebase/firestore functions read `.path` off whatever they're handed.
interface Ref {
  path: string;
  __kind: 'doc' | 'collection';
}

const arrayUnionMarker = Symbol('arrayUnion');
interface ArrayUnionOp {
  [arrayUnionMarker]: true;
  values: unknown[];
}

const deleteFieldMarker = Symbol('deleteField');

// A field path of exact steps, as the real FieldPath: no step is read as a dotted path.
class FieldPath {
  readonly segments: string[];
  constructor(...segments: string[]) {
    this.segments = segments;
  }
}

// Set (or delete) the value at `segments` inside `target`.
const setAtPath = (target: Record<string, unknown>, segments: string[], value: unknown) => {
  const isDelete = value !== null && typeof value === 'object' && (value as Record<symbol, unknown>)[deleteFieldMarker] === true;
  let cursor = target;
  for (const part of segments.slice(0, -1)) {
    if (typeof cursor[part] !== 'object' || cursor[part] === null) cursor[part] = {};
    cursor = cursor[part] as Record<string, unknown>;
  }
  const last = segments[segments.length - 1]!;
  if (isDelete) delete cursor[last];
  else cursor[last] = value;
};

// Apply an updateDoc payload onto a target object, honoring `a.b.c` dot-paths
// (Firestore's nested-field syntax) and arrayUnion sentinels.
const applyUpdate = (target: DocData, payload: DocData): DocData => {
  const next = structuredClone(target);
  for (const [key, value] of Object.entries(payload)) {
    if (value && typeof value === 'object' && (value as ArrayUnionOp)[arrayUnionMarker]) {
      const existing = Array.isArray(next[key]) ? (next[key] as unknown[]) : [];
      next[key] = [...existing, ...(value as ArrayUnionOp).values];
      continue;
    }
    setAtPath(next, key.split('.'), value);
  }
  return next;
};

// Direct access to the store for seeding and asserting in tests.
export const firestoreStore = {
  reset() {
    docs.clear();
    listeners.clear();
    collectionListeners.clear();
  },
  set(path: string, data: DocData) {
    docs.set(path, structuredClone(data));
    emit(path);
  },
  get(path: string): DocData | undefined {
    const data = docs.get(path);
    return data === undefined ? undefined : structuredClone(data);
  },
  /** Writes without telling listeners, so a test can leave a client holding a copy that is out of date. */
  setQuietly(path: string, data: DocData) {
    docs.set(path, structuredClone(data));
  },
  /** Stores a game the way the app keeps it: the game document, with each character and roll in its own document. `game` is written as one document, as older fixtures are. */
  setGame(path: string, game: DocData) {
    const r = splitGame({ createdAt: 0, ...game });
    if (!r.ok) throw new Error(`fixture does not split: ${r.problems.join('; ')}`);
    firestoreStore.set(path, r.split.game);
    r.split.characters.forEach((c) => firestoreStore.set(`${path}/characters/${c.id}`, c.data));
    r.split.rolls.forEach((c) => firestoreStore.set(`${path}/rolls/${c.id}`, c.data));
  },
  /** The stored game put back together as one document, to assert on. */
  getGame(path: string): DocData | undefined {
    const game = docs.get(path);
    if (game === undefined) return undefined;
    const stored = (col: string) => firestoreStore.list(`${path}/${col}`);
    return assembleGame(game, stored('characters'), stored('rolls'));
  },
  /** The documents directly under a collection path, with their ids. */
  list(collectionPath: string): { id: string; data: DocData }[] {
    return makeQuerySnapshot(collectionPath).docs.map((d) => ({ id: d.id, data: d.data() as DocData }));
  },
  has(path: string): boolean {
    return docs.has(path);
  },
  delete(path: string) {
    docs.delete(path);
    emit(path);
  },
};

// Build the object passed to vi.mock('firebase/firestore', ...). Spies are
// fresh per call so a beforeEach can re-mock cleanly if desired.
export const firestoreMockModule = () => {
  let autoId = 0;

  const doc = vi.fn((_db: unknown, ...segments: string[]): Ref => ({
    path: segments.join('/'),
    __kind: 'doc',
  }));

  const collection = vi.fn((_db: unknown, ...segments: string[]): Ref => ({
    path: segments.join('/'),
    __kind: 'collection',
  }));

  const getDocs = vi.fn(async (ref: Ref) => makeQuerySnapshot(ref.path));
  const getDocsFromCache = vi.fn(async (ref: Ref) => makeQuerySnapshot(ref.path));

  const deleteDoc = vi.fn(async (ref: Ref) => {
    docs.delete(ref.path);
    emit(ref.path);
  });

  const getDoc = vi.fn(async (ref: Ref) => makeSnapshot(ref.path));
  // The store is the local cache as well as the server, so a cache read is the same read.
  const getDocFromCache = vi.fn(async (ref: Ref) => makeSnapshot(ref.path));
  const deleteField = vi.fn(() => ({ [deleteFieldMarker]: true }));

  // Either an object of changes, or the real (field, value, field, value, ...) form.
  const updateDoc = vi.fn(async (ref: Ref, first: DocData | FieldPath | string, ...rest: unknown[]) => {
    const existing = docs.get(ref.path);
    if (existing === undefined) throw Object.assign(new Error(`No document to update: ${ref.path}`), { code: 'not-found' });
    if (first instanceof FieldPath || typeof first === 'string') {
      const next = structuredClone(existing);
      const pairs = [first, ...rest];
      for (let i = 0; i < pairs.length; i += 2) {
        const field = pairs[i] as FieldPath | string;
        setAtPath(next, field instanceof FieldPath ? field.segments : field.split('.'), pairs[i + 1]);
      }
      docs.set(ref.path, next);
    } else {
      docs.set(ref.path, applyUpdate(existing, first));
    }
    emit(ref.path);
  });

  const setDoc = vi.fn(async (ref: Ref, data: DocData) => {
    docs.set(ref.path, structuredClone(data));
    emit(ref.path);
  });

  const addDoc = vi.fn(async (ref: Ref, data: DocData) => {
    const id = `auto-${++autoId}`;
    const path = `${ref.path}/${id}`;
    docs.set(path, structuredClone(data));
    emit(path);
    return { id, path };
  });

  const onSnapshot = vi.fn((ref: Ref, onNext: Listener | CollectionListener): (() => void) => {
    if (ref.__kind === 'collection') {
      let set = collectionListeners.get(ref.path);
      if (!set) {
        set = new Set();
        collectionListeners.set(ref.path, set);
      }
      set.add(onNext as CollectionListener);
      (onNext as CollectionListener)(makeQuerySnapshot(ref.path));
      return () => void set!.delete(onNext as CollectionListener);
    }
    let set = listeners.get(ref.path);
    if (!set) {
      set = new Set();
      listeners.set(ref.path, set);
    }
    set.add(onNext as Listener);
    // Fire once synchronously with the current state, matching Firestore's initial-snapshot behavior.
    (onNext as Listener)(makeSnapshot(ref.path));
    return () => void set!.delete(onNext as Listener);
  });

  // Writes queue up and apply together on commit, like a real batch.
  const writeBatch = vi.fn(() => {
    const ops: (() => void)[] = [];
    return {
      set: (ref: Ref, data: DocData) => void ops.push(() => docs.set(ref.path, structuredClone(data))),
      update: (ref: Ref, payload: DocData) =>
        void ops.push(() => {
          const existing = docs.get(ref.path);
          if (existing === undefined) throw Object.assign(new Error(`No document to update: ${ref.path}`), { code: 'not-found' });
          docs.set(ref.path, applyUpdate(existing, payload));
        }),
      delete: (ref: Ref) => void ops.push(() => docs.delete(ref.path)),
      commit: async () => {
        const before = new Map(docs);
        try {
          ops.forEach((op) => op());
        } catch (e) {
          docs.clear();
          before.forEach((v, k) => docs.set(k, v));
          throw e;
        }
        new Set([...before.keys(), ...docs.keys()]).forEach(emit);
      },
    };
  });

  // Minimal transaction implementation: get() reads current state, set()/update()
  // mutate the store. No real isolation, but enough to exercise read-modify-write
  // logic (withCharacters, createGameWithId) deterministically.
  const runTransaction = vi.fn(async (_db: unknown, updater: (tx: Transaction) => Promise<void>) => {
    const tx: Transaction = {
      get: async (ref: Ref) => makeSnapshot(ref.path),
      set: (ref: Ref, data: DocData) => {
        docs.set(ref.path, structuredClone(data));
        emit(ref.path);
      },
      delete: (ref: Ref) => {
        docs.delete(ref.path);
        emit(ref.path);
      },
      update: (ref: Ref, first: DocData | FieldPath | string, ...rest: unknown[]) => {
        const existing = docs.get(ref.path) ?? {};
        if (first instanceof FieldPath || typeof first === 'string') {
          const next = structuredClone(existing);
          const pairs = [first, ...rest];
          for (let i = 0; i < pairs.length; i += 2) {
            const field = pairs[i] as FieldPath | string;
            setAtPath(next, field instanceof FieldPath ? field.segments : field.split('.'), pairs[i + 1]);
          }
          docs.set(ref.path, next);
        } else {
          docs.set(ref.path, applyUpdate(existing, first));
        }
        emit(ref.path);
      },
    };
    await updater(tx);
  });

  const arrayUnion = vi.fn((...values: unknown[]): ArrayUnionOp => ({
    [arrayUnionMarker]: true,
    values,
  }));

  // src/lib/firebase.ts calls initializeFirestore at import time; return a dummy
  // db so that module loads under the same firebase/firestore mock. Tests should
  // also mock 'firebase/app' (vi.mock('firebase/app', () => ({ initializeApp: () => ({}) }))).
  const initializeFirestore = vi.fn(() => ({}));
  const persistentLocalCache = vi.fn((options: unknown) => options);
  const persistentMultipleTabManager = vi.fn(() => ({}));

  return {
    doc,
    collection,
    FieldPath,
    getDoc,
    getDocFromCache,
    deleteField,
    getDocs,
    getDocsFromCache,
    deleteDoc,
    writeBatch,
    updateDoc,
    setDoc,
    addDoc,
    onSnapshot,
    runTransaction,
    arrayUnion,
    initializeFirestore,
    persistentLocalCache,
    persistentMultipleTabManager,
  };
};

interface Transaction {
  get: (ref: Ref) => Promise<ReturnType<typeof makeSnapshot>>;
  set: (ref: Ref, data: DocData) => void;
  update: (ref: Ref, first: DocData | FieldPath | string, ...rest: unknown[]) => void;
  delete: (ref: Ref) => void;
}
