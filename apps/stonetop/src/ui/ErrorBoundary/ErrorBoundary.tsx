import { isStaleChunk, reloadForNewBuild } from '@dice-jar/stale-build';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/ui';
import { Heading } from '@/ui';
import { Text } from '@/ui';

interface Props {
  children: ReactNode;
  // Changing this value (e.g. the current route) clears a caught error so
  // navigating away from a broken page recovers without a hard reload.
  resetKey?: string;
}

interface State {
  hasError: boolean;
  resetKey?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, resetKey: this.props.resetKey };

  static getDerivedStateFromError = (): Partial<State> => ({ hasError: true });

  // Reset on resetKey change so a render error on one route doesn't blank the
  // whole app once the user navigates elsewhere.
  static getDerivedStateFromProps = (props: Props, state: State): Partial<State> | null =>
    props.resetKey !== state.resetKey ? { hasError: false, resetKey: props.resetKey } : null;

  componentDidCatch = (error: Error, info: ErrorInfo) => {
    // A page chunk that vanished in a deploy: reload to the new build instead of showing an error.
    if (isStaleChunk(error) && reloadForNewBuild()) return;
    console.error('ErrorBoundary caught an error:', error, info.componentStack);
  };

  render = () => {
    if (this.state.hasError) {
      return (
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
      );
    }
    return this.props.children;
  };
}
