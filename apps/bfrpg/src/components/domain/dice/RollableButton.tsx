import { forwardRef } from 'react';
import { cn } from '@dice-jar/cn';
import { StatusDot } from '@/components/ui/composite';
import './RollableButton.css';
import Button, { type ButtonProps } from '@/components/ui/core/primitives/Button';

interface RollableButtonProps extends Omit<ButtonProps, 'children'> {
  label: string;
  value: string | number;
  tooltip: string;
  size?: 'sm' | 'md' | 'lg';
}

const RollableButton = forwardRef<HTMLButtonElement, RollableButtonProps>(
  ({ label, value, tooltip, size = 'md', variant = 'ghost', className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant={variant}
        className={cn('rollable', className)}
        data-size={size}
        title={tooltip}
        aria-label={tooltip}
        role="button"
        {...props}
      >
        <div className="rollable-lead">
          <StatusDot size="xs" status="inactive" className="rollable-dot" ariaLabel="Rollable button indicator" />
          <span className="rollable-label">{label}</span>
        </div>
        <div className="rollable-value">{value}</div>
      </Button>
    );
  },
);

RollableButton.displayName = 'RollableButton';

export default RollableButton;
