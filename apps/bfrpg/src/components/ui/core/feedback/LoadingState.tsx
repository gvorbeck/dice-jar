import { memo } from 'react';
import { cn } from '@dice-jar/cn';
import { Typography } from '@/components/ui/core/display';
import './LoadingState.css';

interface LoadingStateProps {
  message?: string;
  isUpdating?: boolean;
  variant?: 'page' | 'inline' | 'overlay';
  className?: string;
}

export const LoadingState = memo(({ message = 'Loading...', variant = 'page', className }: LoadingStateProps) => (
  <div className="loading-wrap" data-variant={variant} role="status" aria-live="polite">
    <div className={cn('loading', variant !== 'overlay' && className)} data-variant={variant}>
      <div className="loading-spinner" aria-hidden="true" />
      <Typography variant="body">{message}</Typography>
    </div>
  </div>
));

LoadingState.displayName = 'LoadingState';
