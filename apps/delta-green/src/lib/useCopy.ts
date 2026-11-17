import type { CopyState } from '@dice-jar/browser';

/** Button label for each copy state; `idle` is the resting text. */
export const copyLabel = (s: CopyState, idle: string, ok = 'Link copied ✓') => (s === 'ok' ? ok : s === 'fail' ? 'Copy failed' : idle);

/** For a `role="status"` sr-only span beside the button, since a changed button label isn't announced. */
export const copyNote = (s: CopyState) => (s === 'ok' ? 'Copied' : s === 'fail' ? 'Copy failed: select and copy it by hand' : '');
