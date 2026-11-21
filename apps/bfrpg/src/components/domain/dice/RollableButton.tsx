import { forwardRef } from 'react';
import { SIZE_STYLES } from '@/constants';
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
  ({ label, value, tooltip, size = 'md', variant = 'ghost', className = '', ...props }, ref) => {
    const currentSize = SIZE_STYLES[size];

    const labelClasses = cn('rollable-label', currentSize.labelText, 'transition-colors');
    const valueClasses = cn('rollable-value', currentSize.contentText, 'transition-colors');

    return (
      <Button
        ref={ref}
        variant={variant}
        className={cn('rollable', className)}
        title={tooltip}
        aria-label={tooltip}
        role="button"
        {...props}
      >
        <div className="rollable-lead">
          <StatusDot size="xs" status="inactive" className="rollable-dot" ariaLabel="Rollable button indicator" />
          <span className={labelClasses}>{label}</span>
        </div>
        <div className={valueClasses}>{value}</div>
      </Button>
    );
  },
);

RollableButton.displayName = 'RollableButton';

export default RollableButton;
