import { forwardRef, useId } from 'react';
import { Switch as AriaSwitch } from 'react-aria-components';
import { cn } from '@dice-jar/cn';
import './Switch.css';

interface SwitchProps {
  label: string;
  defaultActive?: boolean;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  helperText?: string;
  // lands on the RAC label, not the input, so don't wrap this in FormField (its htmlFor needs a labelable element)
  id?: string;
  name?: string;
  className?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

const Switch = forwardRef<HTMLLabelElement, SwitchProps>(
  (
    {
      label,
      defaultActive = false,
      checked,
      onCheckedChange,
      disabled,
      size = 'md',
      helperText,
      id: providedId,
      'aria-describedby': ariaDescribedBy,
      className = '',
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const switchId = providedId || generatedId;
    const helperTextId = helperText ? `${switchId}-helper` : undefined;

    return (
      <div className={cn('switch', `switch-${size}`, className)}>
        <AriaSwitch
          ref={ref}
          id={switchId}
          isSelected={checked}
          defaultSelected={checked === undefined ? defaultActive : undefined}
          onChange={onCheckedChange}
          isDisabled={disabled}
          aria-describedby={cn(ariaDescribedBy, helperTextId) || undefined}
          className="switch-row"
          {...props}
        >
          <span className="switch-label">{label}</span>
          <div className="switch-track">
            <div className="switch-thumb" aria-hidden="true" />
          </div>
        </AriaSwitch>

        {helperText && (
          <div id={helperTextId} className="switch-help" role="note">
            {helperText}
          </div>
        )}
      </div>
    );
  },
);

Switch.displayName = 'Switch';

export default Switch;
