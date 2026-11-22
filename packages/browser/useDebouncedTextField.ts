import { useState, useCallback } from 'react';
import { useDebouncedSave } from './useDebouncedSave';
import { useFirestoreSync } from './useFirestoreSync';
import { useLatest } from './useLatest';

// Shared state for a single free-text field (onChange takes the new text, so it suits native inputs and React Aria alike) backed by a debounced Firestore
// write: local optimistic value, debounce-on-change, flush-on-blur, and a
// pending guard so remote echoes don't clobber in-flight edits.
export const useDebouncedTextField = (firestoreValue: string, save: (value: string) => Promise<void>, delay = 1500) => {
  const [value, setValue] = useState(firestoreValue);
  const { onChange: debouncedChange, flush, isPending, isPendingRef, noteRemoteValue } = useDebouncedSave(save, delay);

  // Shares the app's one remote-sync gate, which also *defers* a value that lands
  // mid-save and flushes it once the save settles — the hand-rolled guard this
  // replaced returned early and dropped that value outright (#171).
  useFirestoreSync(
    firestoreValue,
    (remote) => {
      // Not pending, so this is an authoritative remote value (not our own echo).
      // Tell the debounce hook so a value another client overwrote can be re-saved
      // if the user types it again, instead of being deduped away.
      noteRemoteValue(remote);
      setValue(remote);
    },
    isPendingRef,
  );

  const onChange = useCallback(
    (next: string) => {
      setValue(next);
      debouncedChange(next);
    },
    [debouncedChange],
  );

  // Blur writes what is in the field now instead of waiting out the delay.
  const latest = useLatest(value);
  const onBlur = useCallback(() => void flush(latest.current), [flush, latest]);

  return { value, onChange, onBlur, isPending };
};
