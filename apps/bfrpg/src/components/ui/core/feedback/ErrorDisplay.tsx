import type { ReactNode } from 'react';
import { cn } from '@dice-jar/cn';
import './ErrorDisplay.css';

interface ErrorDisplayProps {
  error?: string | ReactNode;
  className?: string;
}

export default function ErrorDisplay({ error, className }: ErrorDisplayProps) {
  if (!error) return null;

  return (
    <div role="alert" className={cn('error-display', className)}>
      {error}
    </div>
  );
}
