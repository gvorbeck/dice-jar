import { useId, forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@dice-jar/cn';
import { Text } from '../Text/Text';

interface BaseProps {
  label?: string;
  note?: string;
  id?: string;
  error?: string;
  className?: string;
}

type InputProps = BaseProps & { multiline?: false } & InputHTMLAttributes<HTMLInputElement>;
type TextareaProps = BaseProps & { multiline: true } & TextareaHTMLAttributes<HTMLTextAreaElement>;

type Props = InputProps | TextareaProps;

export const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, Props>(
  ({ label, note, id, error, className, multiline, 'aria-describedby': ariaDescribedBy, ...props }, ref) => {
    const generatedId = useId();
    const resolvedId = id ?? generatedId;
    const errorId = error ? `${generatedId}-error` : undefined;
    const noteId = note ? `${generatedId}-note` : undefined;
    // Merge any caller-supplied aria-describedby with the note/error ids we own.
    const describedBy = [ariaDescribedBy, noteId, errorId].filter((x): x is string => Boolean(x)).join(' ') || undefined;
    const cx = cn('input-input field-focus-visible', error && 'input-has-error', className);

    const el = multiline ? (
      <textarea
        ref={ref as React.Ref<HTMLTextAreaElement>}
        id={resolvedId}
        className={cx}
        {...(props as TextareaHTMLAttributes<HTMLTextAreaElement>)}
        aria-describedby={describedBy}
      />
    ) : (
      <input
        ref={ref as React.Ref<HTMLInputElement>}
        id={resolvedId}
        className={cx}
        {...(props as InputHTMLAttributes<HTMLInputElement>)}
        aria-describedby={describedBy}
      />
    );

    if (!label) {
      return (
        <>
          {el}
          {note && (
            <Text as="span" size="xs" color="muted" id={noteId}>
              {note}
            </Text>
          )}
          {error && (
            <span id={errorId} className="input-error">
              {error}
            </span>
          )}
        </>
      );
    }

    return (
      <div className="input-wrapper col gap-1">
        <div className="input-label-row">
          <label htmlFor={resolvedId} className="input-label field-label">
            {label}
          </label>
          {note && (
            <Text as="span" size="xs" color="muted" id={noteId}>
              {note}
            </Text>
          )}
        </div>
        {el}
        {error && (
          <span id={errorId} className="input-error">
            {error}
          </span>
        )}
      </div>
    );
  },
);
