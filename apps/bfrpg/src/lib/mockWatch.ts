type Listener = () => void;
const listeners = new Set<Listener>();

/** Tells every mock watcher the stored data changed. */
export const notifyMock = () => listeners.forEach((l) => l());

/** The mock stand-in for a Firestore listener: reads now, and again whenever the mock data changes. */
export function mockWatch<T>(read: () => Promise<T>, ok: (v: T) => void, bad: (e: Error) => void): () => void {
  let live = true;
  const run = () =>
    read().then(
      (v) => live && ok(v),
      (e) => live && bad(e instanceof Error ? e : new Error(String(e))),
    );
  void run();
  listeners.add(run);
  return () => {
    live = false;
    listeners.delete(run);
  };
}
