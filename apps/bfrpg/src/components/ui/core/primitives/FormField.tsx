import { useId, cloneElement, isValidElement } from 'react';
import type { ReactNode } from 'react';
import { Icon } from '@/components/ui/core/display';
import { cn } from '@dice-jar/cn';
import './FormField.css';

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

interface FormFieldProps {
  label: string;
  children: ReactNode;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  validation?: ValidationResult;
}

export default function FormField({ label, children, error, hint, required = false, className = '', validation }: FormFieldProps) {
  const fieldId = useId();

  // Use validation error if provided, otherwise use explicit error prop
  const finalError = validation?.error || error;

  const errorId = finalError ? `${fieldId}-error` : undefined;
  const hintId = hint ? `${fieldId}-hint` : undefined;

  return (
    <div className={cn('form-field', className)}>
      <label htmlFor={fieldId} className="form-field-label">
        {label}
        {required && (
          <span className="form-field-required" aria-label="required">
            *
          </span>
        )}
      </label>

      <div className="form-field-control">
        {isValidElement(children)
          ? cloneElement(children as React.ReactElement<Record<string, unknown>>, {
              id: fieldId,
              'aria-describedby': [errorId, hintId].filter(Boolean).join(' ') || undefined,
              'aria-required': required || undefined,
              'aria-invalid': finalError ? 'true' : undefined,
            })
          : children}
      </div>

      {hint && (
        <span id={hintId} className="form-field-hint">
          {hint}
        </span>
      )}

      {finalError && (
        <div id={errorId} className="form-field-error" role="alert" aria-live="polite">
          <Icon name="exclamation-triangle" size="xs" />
          {finalError}
        </div>
      )}
    </div>
  );
}
