import { useCallback, useRef, useState } from 'react';

type State = { pending: boolean; error: Error | null; success: boolean };

/** Runs an async function and tracks pending / error / success. `run` resolves to the result and rethrows the original error. */
export function useAction<A extends unknown[], R>(fn: (...args: A) => Promise<R>, onError?: (error: Error, ...args: A) => void) {
  const [state, setState] = useState<State>({ pending: false, error: null, success: false });
  const latest = useRef({ fn, onError });
  latest.current = { fn, onError };

  const run = useCallback(async (...args: A): Promise<R> => {
    setState({ pending: true, error: null, success: false });
    try {
      const result = await latest.current.fn(...args);
      setState({ pending: false, error: null, success: true });
      return result;
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      setState({ pending: false, error, success: false });
      latest.current.onError?.(error, ...args);
      throw e;
    }
  }, []);

  const reset = useCallback(() => setState({ pending: false, error: null, success: false }), []);
  return { run, reset, isPending: state.pending, error: state.error, isSuccess: state.success };
}
