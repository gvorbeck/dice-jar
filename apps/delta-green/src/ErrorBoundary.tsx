import { Link } from 'react-router-dom';
import { ErrorBoundary as Boundary } from '@dice-jar/browser';
import type { ReactNode } from 'react';
import { Notice } from './pages/Page';

/** Catches a crash while rendering, so the visitor gets a way out instead of a blank page. Keyed by path in App, so navigating resets it. */
export const ErrorBoundary = ({ children }: { children: ReactNode }) => (
  <Boundary
    fallback={
      <Notice page="Error" title="SOMETHING WENT WRONG">
        <p className="warn" role="alert">
          This page hit an error. Your saved work is not affected.
        </p>
        <div className="row">
          <button className="btn" onClick={() => location.reload()}>
            Reload
          </button>
          <Link className="btn" to="/">
            Home
          </Link>
        </div>
      </Notice>
    }
  >
    {children}
  </Boundary>
);
