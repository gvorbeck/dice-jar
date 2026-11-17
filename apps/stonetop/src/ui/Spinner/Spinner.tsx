import { cn } from '@dice-jar/cn';

interface Props {
  className?: string;
  // Accessible label announced to screen readers; defaults to the common case.
  label?: string;
}

export const Spinner = ({ className, label = 'Loading…' }: Props) => (
  <span className={cn('spinner', className)} role="status" aria-label={label} />
);
