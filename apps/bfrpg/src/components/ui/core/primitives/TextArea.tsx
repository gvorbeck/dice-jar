import React, { forwardRef, useState, useId, useEffect } from 'react';
import { Button as AriaButton, TextArea as AriaTextArea } from 'react-aria-components';
import { Icon } from '@/components';
import { cn } from '@dice-jar/cn';
import './TextArea.css';

type TextAreaSize = 'sm' | 'md' | 'lg';

interface TextAreaProps {
  value?: string;
  onChange?: (value: string) => void;
  maxLength?: number;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
  size?: TextAreaSize;
  error?: boolean;
  showClearButton?: boolean;
  className?: string;
  label?: string;
  rows?: number;
  cols?: number;
  resize?: 'none' | 'both' | 'horizontal' | 'vertical';
  'aria-label'?: string;
  'aria-describedby'?: string;
  onBlur?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
  onClear?: () => void;
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
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
      size = 'sm',
      error = false,
      showClearButton = false,
      className = '',
      label,
      rows = 2,
      cols,
      resize = 'vertical',
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedBy,
      onBlur,
      onFocus,
      onClear,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const clearButtonId = `${inputId}-clear`;
    const [inputValue, setInputValue] = useState(value);

    const handleTextAreaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
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

    const handleFocus = (event: React.FocusEvent<HTMLTextAreaElement>) => {
      onFocus?.(event);
    };

    const handleBlur = (event: React.FocusEvent<HTMLTextAreaElement>) => {
      onBlur?.(event);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Allow Escape key to clear the textarea if clear button is enabled
      if (event.key === 'Escape' && showClearButton && inputValue) {
        event.preventDefault();
        handleClear();
      }
    };

    // Update local state when value prop changes
    useEffect(() => {
      setInputValue(value);
    }, [value]);

    const showClear = showClearButton && inputValue && inputValue.length > 0 && !disabled;

    const textAreaClasses = cn(
      'text-area',
      `text-area-${size}`,
      `text-area-${resize}`,
      error && 'text-area-error',
      showClear && 'text-area-clearable',
      className,
    );

    const effectiveAriaLabel = ariaLabel || label;

    return (
      <div className="text-area-wrap">
        {label && (
          <label htmlFor={inputId} className="text-area-label">
            {label}
            {required && <span className="text-area-required">*</span>}
          </label>
        )}

        <div className="text-area-wrap">
          <AriaTextArea
            ref={ref}
            id={inputId}
            name={name}
            value={inputValue}
            onChange={handleTextAreaChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            maxLength={maxLength}
            rows={rows}
            cols={cols}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            aria-label={effectiveAriaLabel}
            aria-describedby={ariaDescribedBy}
            aria-invalid={error || (maxLength !== undefined && inputValue.length > maxLength)}
            className={textAreaClasses}
            {...props}
          />

          {showClear && (
            <AriaButton id={clearButtonId} onPress={handleClear} aria-label="Clear input" className="text-area-clear">
              <Icon name="close" size="xs" aria-hidden={true} />
            </AriaButton>
          )}
        </div>
      </div>
    );
  },
);

TextArea.displayName = 'TextArea';

export default TextArea;
