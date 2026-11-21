import React, { forwardRef, useState, useId } from 'react';
import { Input } from 'react-aria-components';
import { cn } from '@dice-jar/cn';
import './TextInput.css';

type NumberInputSize = 'sm' | 'md' | 'lg';

interface NumberInputProps {
  value?: number;
  onChange?: (value: number | undefined) => void;
  minValue?: number;
  maxValue?: number;
  step?: number;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
  size?: NumberInputSize;
  error?: boolean;
  className?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}

const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      value,
      onChange,
      minValue,
      maxValue,
      step = 1,
      placeholder,
      disabled = false,
      required = false,
      id,
      name,
      size = 'md',
      error = false,
      className = '',
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedBy,
      onBlur,
      onFocus,
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const [inputValue, setInputValue] = useState(value !== undefined ? value.toString() : '');
    const [prevValue, setPrevValue] = useState(value);

    // Sync inputValue with value prop during render
    if (value !== prevValue) {
      setPrevValue(value);
      if (value !== undefined) {
        setInputValue(value.toString());
      } else {
        setInputValue('');
      }
    }

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const inputVal = event.target.value;
      setInputValue(inputVal);

      if (inputVal === '') {
        onChange?.(undefined);
        return;
      }

      const numericValue = parseFloat(inputVal);

      if (!isNaN(numericValue)) {
        // Allow any numeric value during typing - validation happens on blur
        onChange?.(numericValue);
      }
    };

    const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
      // Validate and clamp value on blur
      if (value !== undefined) {
        let validatedValue = value;

        if (minValue !== undefined && value < minValue) {
          validatedValue = minValue;
          onChange?.(validatedValue);
        } else if (maxValue !== undefined && value > maxValue) {
          validatedValue = maxValue;
          onChange?.(validatedValue);
        }

        // Update display value to match the validated value
        setInputValue(validatedValue.toString());
      } else if (inputValue === '' && required) {
        // Handle required empty field - keep it empty but maintain state
        setInputValue('');
      }
      onBlur?.(event);
    };

    const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
      onFocus?.(event);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      // Call custom onKeyDown handler first if provided
      onKeyDown?.(event);

      // Allow: backspace, delete, tab, escape, enter
      if (
        ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'Home', 'End', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(
          event.key,
        )
      ) {
        return;
      }

      // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X (or Cmd on Mac)
      if ((event.ctrlKey || event.metaKey) && ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase())) {
        return;
      }

      // Ensure that it is a number and stop the keypress if not
      // Allow: digits, decimal point, minus sign
      if (event.key.length === 1 && !/^[0-9.-]$/.test(event.key) && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
      }
    };

    const inputClasses = cn('text-input', 'text-input-number', `text-input-${size}`, error && 'text-input-error', className);

    return (
      <Input
        ref={ref}
        type="number"
        inputMode="numeric"
        id={inputId}
        name={name}
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        min={minValue}
        max={maxValue}
        step={step}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-invalid={
          error || (value !== undefined && ((minValue !== undefined && value < minValue) || (maxValue !== undefined && value > maxValue)))
        }
        className={inputClasses}
        {...props}
      />
    );
  },
);

NumberInput.displayName = 'NumberInput';

export default NumberInput;
