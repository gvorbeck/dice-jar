import { useEffect, useState } from 'react';
import { Button } from 'react-aria-components';
import { store } from './index';
import './GlobalAlerts.css';

/** Where the messages live: one file on the landing page, so a message goes out with a landing-page deploy only. */
export const ALERTS_URL = 'https://dicejar.games/alerts.json';

const TYPES = ['info', 'warning', 'error', 'success'] as const;

export type Alert = {
  id: string;
  type: (typeof TYPES)[number];
  message: string;
  /** The apps it applies to; left out, it applies to all of them. */
  apps?: string[];
  dismissible?: boolean;
};

const isAlert = (a: unknown): a is Alert => {
  const x = a as Partial<Alert> | null;
  return (
    typeof x === 'object' &&
    x !== null &&
    typeof x.id === 'string' &&
    x.id !== '' &&
    typeof x.message === 'string' &&
    x.message !== '' &&
    TYPES.includes(x.type as Alert['type']) &&
    (x.apps === undefined || (Array.isArray(x.apps) && x.apps.every((app) => typeof app === 'string'))) &&
    (x.dismissible === undefined || typeof x.dismissible === 'boolean')
  );
};

/** The valid messages in `{ "alerts": [...] }`; anything malformed is dropped, so one bad entry never blanks the rest. */
export const parseAlerts = (json: unknown): Alert[] => {
  const list = (json as { alerts?: unknown } | null)?.alerts;
  return Array.isArray(list) ? list.filter(isAlert) : [];
};

const DISMISSED_KEY = 'dicejar:alerts-dismissed';

const readDismissed = (): string[] => {
  try {
    const ids: unknown = JSON.parse(store.get(DISMISSED_KEY) ?? '[]');
    return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
};

/**
 * The Dice Jar messages for this app, then any the app adds itself (`extra`, never dismissible, e.g. "you're offline").
 * Nothing shows until the file loads, and nothing if it can't: a banner must never be the reason a page breaks.
 * shortcut: a message pushes the page down when it arrives, since it sits in the flow; make it an overlay if that proves jarring.
 * shortcut: it sits above each page's skip link, so a dismissible message is the first Tab stop; moving it into the page layouts would refetch the file on every route change, so move the skip links up to the App instead if that matters.
 */
export function GlobalAlerts({ app, extra = [] }: { app: string; extra?: Alert[] }) {
  const [remote, setRemote] = useState<Alert[]>([]);
  const [dismissed, setDismissed] = useState(readDismissed);

  useEffect(() => {
    let live = true;
    fetch(ALERTS_URL, { cache: 'no-cache' })
      .then((r) => {
        if (!r.ok) throw new Error(`alerts file: ${r.status}`);
        return r.json();
      })
      .then((json) => live && setRemote(parseAlerts(json)))
      .catch((e) => console.warn(e)); // a blocked fetch (say, a CSP without dicejar.games) must show up somewhere
    return () => {
      live = false;
    };
  }, []);

  const shown = remote.filter((a) => (!a.apps || a.apps.includes(app)) && !dismissed.includes(a.id));
  const dismiss = (id: string) => {
    const next = [...new Set([...readDismissed(), id])]; // re-read: another tab may have dismissed one since this one loaded
    setDismissed(next);
    store.set(DISMISSED_KEY, JSON.stringify(next));
  };

  if (shown.length + extra.length === 0) return null;
  return (
    <div className="dj-alerts">
      {[...shown, ...extra].map((a) => (
        <div
          key={`${shown.includes(a) ? 'remote' : 'extra'}-${a.id}`}
          className={`dj-alert dj-alert-${a.type}`}
          role={a.type === 'error' ? 'alert' : 'status'}
        >
          <p>{a.message}</p>
          {a.dismissible && shown.includes(a) && (
            <Button onPress={() => dismiss(a.id)} aria-label={`Dismiss: ${a.message}`}>
              ×
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
