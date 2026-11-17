const KEY = 'reloaded-for-new-build';
const WINDOW_MS = 10_000;

// Chrome, Firefox and Safari word a failed dynamic import differently.
const STALE_CHUNK = /dynamically imported module|Importing a module script failed/i;
export const isStaleChunk = (e: unknown) => e instanceof Error && STALE_CHUNK.test(e.message);

/**
 * After a deploy the hashed files an open tab still asks for are gone. Reload once to pick up the new build.
 * Returns false (and does nothing) if it already reloaded in the last few seconds, so a genuinely broken
 * deploy shows its error instead of looping.
 */
export function reloadForNewBuild(reload = () => location.reload(), now = Date.now()): boolean {
  // window.name survives a reload and works when sessionStorage is blocked, so the cooldown still holds.
  const store = (() => {
    try {
      sessionStorage.getItem(KEY);
      return { get: () => sessionStorage.getItem(KEY), set: (v: string) => sessionStorage.setItem(KEY, v) };
    } catch {
      return {
        get: () => (window.name.startsWith(`${KEY}=`) ? window.name.slice(KEY.length + 1) : null),
        set: (v: string) => (window.name = `${KEY}=${v}`),
      };
    }
  })();
  if (now - Number(store.get()) < WINDOW_MS) return false;
  store.set(String(now));
  reload();
  return true;
}
