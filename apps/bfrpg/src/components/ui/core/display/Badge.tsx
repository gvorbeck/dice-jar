import { forwardRef } from 'react';
import type { ReactNode, HTMLAttributes } from 'react';
import { cn } from '@/utils';
import './Badge.css';

type BadgeVariant = 'status' | 'supplemental' | 'combination' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(({ children, variant = 'status', size = 'sm', className, ...props }, ref) => {
  return (
    <span ref={ref} className={cn('badge', className)} data-variant={variant} data-size={size} {...props}>
      {children}
    </span>
  );
});

Badge.displayName = 'Badge';

export default Badge;
