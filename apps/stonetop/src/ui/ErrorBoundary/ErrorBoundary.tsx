import { ErrorBoundary as Boundary } from '@dice-jar/browser';
import type { ReactNode } from 'react';
import { Button } from '@/ui';
import { Heading } from '@/ui';
import { Text } from '@/ui';

interface Props {
  children: ReactNode;
  // Changing this value (e.g. the current route) clears a caught error so
  // navigating away from a broken page recovers without a hard reload.
  resetKey?: string;
}

export const ErrorBoundary = ({ children, resetKey }: Props) => (
  <Boundary
    resetKey={resetKey}
    fallback={
      <main className="error-boundary-page">
        <div role="alert" className="error-boundary-sr-only field-sr-only" aria-atomic="true">
          Something went wrong.
        </div>
        <div className="error-boundary-content">
          <Text className="error-boundary-code">!</Text>
          <Heading as="h1" size="xl">
            Something went wrong.
          </Heading>
          <Text color="muted">Refresh the page to try again.</Text>
          <Button size="lg" onClick={() => window.location.reload()}>
            Refresh
          </Button>
        </div>
      </main>
    }
  >
    {children}
  </Boundary>
);
