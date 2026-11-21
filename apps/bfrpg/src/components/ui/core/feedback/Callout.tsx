import { forwardRef } from 'react';
import type { ReactNode, HTMLAttributes } from 'react';
import { cn } from '@dice-jar/cn';
import { Icon } from '@/components/ui/core/display/Icon';
import type { IconName } from '@/components/ui/core/display/Icon';
import { Typography } from '@/components/ui/core/display';
import './Callout.css';

type CalloutVariant = 'info' | 'success' | 'warning' | 'error' | 'neutral';

interface CalloutProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: CalloutVariant;
  title?: string;
  icon?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const DEFAULT_ICONS: Record<CalloutVariant, IconName> = {
  info: 'info',
  success: 'check-circle',
  warning: 'exclamation-triangle',
  error: 'x-circle',
  neutral: 'info',
};

const Callout = forwardRef<HTMLDivElement, CalloutProps>(
  ({ children, variant = 'info', title, icon, size = 'md', className, ...props }, ref) => {
    const displayIcon = icon || <Icon name={DEFAULT_ICONS[variant]} size="md" aria-hidden={true} />;

    return (
      <div ref={ref} className={cn('callout', className)} data-variant={variant} data-size={size} role="note" {...props}>
        <div className="callout-head">
          <div className="callout-icon">{displayIcon}</div>
          {title && (
            <Typography variant="h6" weight="semibold">
              {title}
            </Typography>
          )}
        </div>
        <div className="callout-body" data-indent="">
          {children}
        </div>
      </div>
    );
  },
);

Callout.displayName = 'Callout';

export default Callout;
