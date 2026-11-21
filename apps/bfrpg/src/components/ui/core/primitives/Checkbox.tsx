import { forwardRef, useId } from 'react';
import { Checkbox as AriaCheckbox } from 'react-aria-components';
import { Icon } from '@/components/ui/core/display/Icon';
import { cn } from '@dice-jar/cn';
import './Checkbox.css';

const CHECK_ICON_SIZE = { sm: 'xs', md: 'sm', lg: 'md' } as const;

interface CheckboxProps {
  /** The label text displayed next to the checkbox */
  label: string;
  /** Default checked state for uncontrolled usage */
  defaultChecked?: boolean;
  /** Controlled checked state */
  checked?: boolean;
  /** Callback fired when the checked state changes */
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  /** Visual size of the checkbox */
  size?: 'sm' | 'md' | 'lg';
  /** Helper text displayed below the checkbox */
  helperText?: string;
  /** Whether the checkbox should display in an indeterminate state */
  indeterminate?: boolean;
  // lands on the RAC label, not the input, so don't wrap this in FormField (its htmlFor needs a labelable element)
  id?: string;
  name?: string;
  className?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

const Checkbox = forwardRef<HTMLLabelElement, CheckboxProps>(
  (
    {
      label,
      defaultChecked = false,
      checked,
      onCheckedChange,
      disabled,
      size = 'md',
      helperText,
      indeterminate = false,
      id: providedId,
      'aria-describedby': ariaDescribedBy,
      className = '',
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const checkboxId = providedId || generatedId;
    const helperTextId = helperText ? `${checkboxId}-helper` : undefined;

    return (
      <div className={cn('checkbox', `checkbox-${size}`, className)}>
        <AriaCheckbox
          ref={ref}
          id={checkboxId}
          isSelected={checked}
          defaultSelected={checked === undefined ? defaultChecked : undefined}
          isIndeterminate={indeterminate}
          onChange={onCheckedChange}
          isDisabled={disabled}
          aria-describedby={cn(ariaDescribedBy, helperTextId) || undefined}
          className="checkbox-row"
          {...props}
        >
          {({ isSelected, isIndeterminate }) => (
            <>
              <div className="checkbox-box">
                {isIndeterminate ? (
                  <Icon name="minus" size={CHECK_ICON_SIZE[size]} aria-hidden={true} />
                ) : (
                  isSelected && <Icon name="check" size={CHECK_ICON_SIZE[size]} aria-hidden={true} />
                )}
              </div>
              <span className="checkbox-label">{label}</span>
            </>
          )}
        </AriaCheckbox>

        {helperText && (
          <div id={helperTextId} className="checkbox-help" role="note">
            {helperText}
          </div>
        )}
      </div>
    );
  },
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
