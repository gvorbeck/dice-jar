import React, { forwardRef, useState, useId, useEffect } from 'react';
import { Button as AriaButton, Input } from 'react-aria-components';
import { Icon } from '@/components';
import { cn } from '@dice-jar/cn';
import './TextInput.css';

type TextInputSize = 'sm' | 'md' | 'lg';

interface TextInputProps {
  value?: string;
  onChange?: (value: string) => void;
  maxLength?: number;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
  type?: 'text' | 'email' | 'password' | 'url' | 'tel';
  size?: TextInputSize;
  error?: boolean;
  showClearButton?: boolean;
  className?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onClear?: () => void;
}

const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      value = '',
      onChange,
      maxLength,
      placeholder,
      disabled = false,
      required = false,
      id,
      name,
      type = 'text',
      size = 'md',
      error = false,
      showClearButton = true,
      className = '',
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedBy,
      onBlur,
      onFocus,
      onKeyDown,
      onClear,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const clearButtonId = `${inputId}-clear`;
    const [inputValue, setInputValue] = useState(value);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;

      // Respect maxLength constraint
      if (maxLength && newValue.length > maxLength) {
        return;
      }

      setInputValue(newValue);
      onChange?.(newValue);
    };

    const handleClear = () => {
      setInputValue('');
      onChange?.('');
      onClear?.();

      // Return focus to the input after clearing
      if (ref && typeof ref === 'object' && ref.current) {
        ref.current.focus();
      }
    };

    const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
      onFocus?.(event);
    };

    const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
      onBlur?.(event);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      // Call external onKeyDown handler first
      onKeyDown?.(event);

      // Allow Escape key to clear the input if clear button is enabled
      if (event.key === 'Escape' && showClearButton && inputValue && !event.defaultPrevented) {
        event.preventDefault();
        handleClear();
      }
    };

    // Update local state when value prop changes
    useEffect(() => {
      setInputValue(value);
    }, [value]);

    const showClear = showClearButton && inputValue && inputValue.length > 0 && !disabled;

    const inputClasses = cn(
      'text-input',
      `text-input-${size}`,
      error && 'text-input-error',
      showClear && 'text-input-clearable',
      className,
    );

    return (
      <div className="text-input-wrap">
        <Input
          ref={ref}
          type={type}
          id={inputId}
          name={name}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          maxLength={maxLength}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy}
          aria-invalid={error || (maxLength !== undefined && inputValue.length > maxLength)}
          className={inputClasses}
          {...props}
        />

        {showClear && (
          <AriaButton id={clearButtonId} onPress={handleClear} aria-label="Clear input" className="text-input-clear">
            <Icon name="close" size="sm" aria-hidden={true} />
          </AriaButton>
        )}
      </div>
    );
  },
);

TextInput.displayName = 'TextInput';

export default TextInput;
