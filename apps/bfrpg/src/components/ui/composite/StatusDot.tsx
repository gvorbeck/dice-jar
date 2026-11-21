import { cn } from '@dice-jar/cn';
import './StatusDot.css';

type StatusType = 'active' | 'inactive' | 'warning' | 'error' | 'success' | 'custom';
export type StatusDotColor = 'purple' | 'blue' | 'lime' | 'amber';

interface StatusDotProps {
  /** Semantic status type */
  status?: StatusType;
  /** A named colour that replaces the status colour */
  color?: StatusDotColor;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  /** Accessible label for screen readers */
  ariaLabel?: string;
}

export default function StatusDot({ status = 'active', color, size = 'sm', className, ariaLabel }: StatusDotProps) {
  return (
    <div
      className={cn('status-dot', className)}
      data-status={status}
      data-color={color}
      data-size={size}
      role="status"
      aria-label={ariaLabel}
    />
  );
}
