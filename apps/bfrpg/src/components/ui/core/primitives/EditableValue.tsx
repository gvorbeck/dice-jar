import { useState, useRef, useEffect, forwardRef } from 'react';
import { NumberInput } from '@/components/ui/core/primitives';
import { Icon } from '@/components/ui/core/display';
import { cn } from '@dice-jar/cn';
import { useDebouncedSave } from '@dice-jar/browser';
import './EditableValue.css';

interface EditableValueProps {
  /** Current value */
  value: number;
  /** Called when value changes */
  onChange?: (value: number) => void;
  /** Minimum allowed value */
  minValue?: number;
  /** Maximum allowed value */
  maxValue?: number;
  /** Whether editing is enabled */
  editable?: boolean;
  /** Display format when not editing */
  displayValue?: string | number;
  /** CSS classes for the display container */
  displayClassName?: string;
  /** CSS classes for the edit input */
  inputClassName?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Accessibility label */
  ariaLabel?: string;
  /** Show edit icon on hover */
  showEditIcon?: boolean;
  /** Additional props for the display element */
  displayProps?: React.HTMLAttributes<HTMLDivElement>;
  /** Debounce delay in milliseconds (0 = no debounce) */
  debounceMs?: number;
}

const EditableValue = forwardRef<HTMLDivElement, EditableValueProps>(
  (
    {
      value,
      onChange,
      minValue = 0,
      maxValue = 999999,
      editable = false,
      displayValue,
      displayClassName,
      inputClassName,
      size = 'md',
      ariaLabel,
      showEditIcon = true,
      displayProps = {},
      debounceMs = 0,
    },
    ref,
  ) => {
    const [isEditing, setIsEditing] = useState(false);
    const [localValue, setLocalValue] = useState(value);
    const [prevValue, setPrevValue] = useState(value);
    const [lastCommittedValue, setLastCommittedValue] = useState(value);
    const inputRef = useRef<HTMLInputElement>(null);
    // With a delay, writes once typing pauses, and at once on blur or unmount.
    const { onChange: commitLater, flush, noteRemoteValue } = useDebouncedSave(async (v: number) => onChange?.(v), debounceMs);

    // Sync local value when external value changes (but not during active editing)
    if (value !== prevValue) {
      setPrevValue(value);
      // A value changed elsewhere must not leave our last save looking current, or retyping it is skipped.
      noteRemoteValue(value);
      if (!isEditing && value !== lastCommittedValue) {
        setLocalValue(value);
        setLastCommittedValue(value);
      }
    }

    // Auto-focus and select when entering edit mode
    useEffect(() => {
      if (isEditing && inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, [isEditing]);

    const handleClick = () => {
      if (editable) {
        setIsEditing(true);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (editable && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        setIsEditing(true);
      }
    };

    const handleValueChange = (newValue: number | undefined) => {
      if (newValue === undefined) return;
      setLocalValue(newValue);
      setLastCommittedValue(newValue);
      if (debounceMs > 0) commitLater(newValue);
      else onChange?.(newValue);
    };

    const handleBlur = () => {
      if (debounceMs > 0) void flush(localValue);
      setIsEditing(false);
    };

    const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter' || event.key === 'Escape') {
        setIsEditing(false);
      }
    };

    if (isEditing && editable) {
      return (
        <NumberInput
          ref={inputRef}
          value={localValue}
          onChange={handleValueChange}
          onBlur={handleBlur}
          onKeyDown={handleInputKeyDown}
          minValue={minValue}
          maxValue={maxValue}
          size={size}
          className={cn('editable-input', inputClassName)}
          {...(ariaLabel && { 'aria-label': ariaLabel })}
        />
      );
    }

    return (
      <div
        ref={ref}
        className={cn('editable', displayClassName)}
        data-editable={editable || undefined}
        aria-label={editable ? `${ariaLabel} (click to edit)` : ariaLabel}
        {...(editable && { onClick: handleClick, onKeyDown: handleKeyDown, role: 'button', tabIndex: 0 })}
        {...displayProps}
      >
        {displayValue ?? value}
        {editable && showEditIcon && <Icon name="edit" size="xs" className="editable-icon" aria-hidden={true} />}
      </div>
    );
  },
);

EditableValue.displayName = 'EditableValue';

export default EditableValue;
