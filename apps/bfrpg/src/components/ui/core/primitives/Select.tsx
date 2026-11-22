import { forwardRef, useId } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { Icon } from '@/components/ui/core/display/Icon';
import { cn } from '@dice-jar/cn';
import './Select.css';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children' | 'size'> {
  label: string;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  helperText?: string;
  size?: 'sm' | 'md' | 'lg';
  onValueChange?: (value: string) => void;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      options,
      placeholder,
      error,
      helperText,
      size = 'md',
      onValueChange,
      onChange,
      disabled,
      required,
      id: providedId,
      className = '',
      'aria-describedby': ariaDescribedBy,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const selectId = providedId || generatedId;
    const errorId = error ? `${selectId}-error` : undefined;
    const helperTextId = helperText ? `${selectId}-helper` : undefined;

    // Combine all describedby IDs
    const describedByIds = cn(ariaDescribedBy, errorId, helperTextId) || undefined;

    const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
      const newValue = event.target.value;

      // Call the custom handler if provided
      if (onValueChange) {
        onValueChange(newValue);
      }

      // Call the native onChange handler if provided
      if (onChange) {
        onChange(event);
      }
    };

    const selectClasses = cn('select', `select-${size}`, error && 'select-error', className);

    return (
      <div>
        <label htmlFor={selectId} className={cn('select-label', `select-label-${size}`)}>
          {label}
          {required && (
            <span className="select-required" aria-label="required">
              *
            </span>
          )}
        </label>

        <div className="select-control">
          <select
            ref={ref}
            id={selectId}
            onChange={handleChange}
            disabled={disabled}
            required={required}
            aria-describedby={describedByIds}
            aria-invalid={error ? true : undefined}
            className={selectClasses}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Custom dropdown arrow */}
          <div className="select-chevron">
            <Icon name="chevron-down" size="md" aria-hidden={true} />
          </div>
        </div>

        {helperText && (
          <div id={helperTextId} className="select-help" role="note">
            {helperText}
          </div>
        )}

        {error && (
          <div id={errorId} className="select-message" role="alert" aria-live="assertive">
            {error}
          </div>
        )}
      </div>
    );
  },
);

Select.displayName = 'Select';

export default Select;
