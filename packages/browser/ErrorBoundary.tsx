import { isStaleChunk, reloadForNewBuild } from '@dice-jar/stale-build';
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** What to show once something below has crashed. */
  fallback: ReactNode;
  /** Changing this (e.g. the route) clears a caught error, so navigating away from a broken page recovers without a reload. */
  resetKey?: string;
}

/** Catches a render crash so the visitor gets the app's own fallback instead of a blank page. */
export class ErrorBoundary extends Component<Props, { failed: boolean; resetKey?: string }> {
  state = { failed: false, resetKey: this.props.resetKey };

  static getDerivedStateFromError = () => ({ failed: true });

  static getDerivedStateFromProps = (props: Props, state: { resetKey?: string }) =>
    props.resetKey !== state.resetKey ? { failed: false, resetKey: props.resetKey } : null;

  componentDidCatch = (error: unknown, info: ErrorInfo) => {
    // A page chunk that vanished in a deploy: reload once onto the new build instead of showing an error.
    if (!(isStaleChunk(error) && reloadForNewBuild())) console.error('ErrorBoundary caught an error:', error, info.componentStack);
  };

  render = () => (this.state.failed ? this.props.fallback : this.props.children);
}
