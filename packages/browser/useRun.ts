import { useCallback, useRef, useState } from 'react';
import { isStaleChunk, reloadForNewBuild } from '@dice-jar/stale-build';

type FailMsg = string | ((e: unknown) => string);

/**
 * Runs a button's async work: `busy` while it runs, `err` (failMsg, or failMsg(error)) when it fails, and one reload if the error is a stale build.
 * `run` resolves to whether the work succeeded and never rejects; a call may pass its own failMsg.
 */
export function useRun(failMsg: FailMsg = '') {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const fallback = useRef(failMsg);
  fallback.current = failMsg;
  const run = useCallback(async (fn: () => Promise<unknown>, msg: FailMsg = fallback.current) => {
    setBusy(true);
    setErr('');
    try {
      await fn();
      return true;
    } catch (e) {
      if (!(isStaleChunk(e) && reloadForNewBuild())) setErr(typeof msg === 'string' ? msg : msg(e));
      return false;
    } finally {
      setBusy(false);
    }
  }, []);
  const clear = useCallback(() => setErr(''), []);
  return { busy, err, run, clear };
}
