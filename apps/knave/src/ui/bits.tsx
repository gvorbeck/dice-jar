import type { ReactNode } from 'react';
import { copyLabel, copyNote, useCopy } from '@dice-jar/browser';
import { cn } from '@dice-jar/cn';

// Small shared pieces with no react-aria, so the landing and game pages can use them without the form-control chunk.

/** An error to announce; renders nothing when empty. */
export const Alert = ({ children }: { children: ReactNode }) =>
  children ? (
    <p className="warn" role="alert">
      {children}
    </p>
  ) : null;

/** A small dim note under a control. */
export const Hint = ({ children, className }: { children: ReactNode; className?: string }) => (
  <p className={cn('dim', className)}>
    <small>{children}</small>
  </p>
);

/** The black bar above a table or a box, as in the book. */
export const TableTitle = ({ children }: { children: ReactNode }) => <h2 className="table-title">{children}</h2>;

export const Loading = ({ what }: { what?: string }) => (
  <p className="dim" role="status">
    Loading{what && ` ${what}`}…
  </p>
);

/** Copies `text()` (read at click time) and says so, on the button and to screen readers. */
export function CopyButton({ text, label }: { text: () => string; label: string }) {
  const [copied, copy] = useCopy();
  return (
    <>
      <button className="btn" onClick={() => copy(text())}>
        {copyLabel(copied, label)}
      </button>
      <span className="sr-only" role="status">
        {copyNote(copied)}
      </span>
    </>
  );
}

/** A live list's error, loading or empty message, or the list itself. */
export function SubList<T>({
  sub,
  error,
  empty,
  children,
}: {
  sub: { data?: T[]; error?: Error };
  error: string;
  empty: string;
  children: (data: T[]) => ReactNode;
}) {
  if (sub.error) return <p className="warn">{error}</p>;
  if (sub.data === undefined) return <Loading />;
  return sub.data.length ? children(sub.data) : <p className="dim">{empty}</p>;
}
