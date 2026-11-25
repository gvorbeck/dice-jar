import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { DiceJarCredit, SkipLink, useFocusMain } from '@dice-jar/browser';
import { useSiteTitle } from '@/lib/useSiteTitle';

/** Skip link, header, <main> and footer shared by every page. */
export const Page = ({ title, wide, children }: { title?: string; wide?: boolean; children: ReactNode }) => {
  useSiteTitle(title);
  useFocusMain();
  return (
    <>
      <SkipLink className="skip" />
      <header className="masthead">
        <Link to="/" className="wordmark">
          Glyph Quest
        </Link>
      </header>
      <main id="main" tabIndex={-1} className={wide ? 'wide' : undefined}>
        {children}
      </main>
      <footer>
        <p className="dim">
          <small>
            Knave is by Ben Milton, with art by Peter Mullen. This app is an independent production of{' '}
            <a href="https://iamgarrett.com" rel="noopener noreferrer" target="_blank">
              J. Garrett Vorbeck
            </a>{' '}
            and is not affiliated with Questing Beast LLC.
          </small>
        </p>
        <DiceJarCredit className="dim" />
      </footer>
    </>
  );
};

/** A page holding one box: errors, "not found" and the like. */
export const Notice = ({ page, title, children }: { page?: string; title: string; children: ReactNode }) => (
  <Page title={page}>
    <h1>{title}</h1>
    {children}
  </Page>
);
