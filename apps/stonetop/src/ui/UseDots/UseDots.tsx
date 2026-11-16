import { cn } from '@dice-jar/cn';
import { Text } from '../Text/Text';

interface UseDotsProps {
  total: number;
  checked: number;
  onChange: (n: number) => void;
  disabled?: boolean;
  label?: string;
  // Overrides the group's aria-label without rendering a visible label (for callers that
  // already render their own visible label elsewhere, e.g. next to or above the dots).
  ariaLabel?: string;
}

export const UseDots = ({ total, checked, onChange, disabled, label, ariaLabel }: UseDotsProps) => {
  const dots = Array.from({ length: total }, (_, i) => {
    const filled = i < checked;
    const dotCx = cn('use-dots-use-dot field-focus-visible', filled && 'use-dots-use-dot-filled');
    return (
      <button
        key={`dot-${total}-${i}`}
        type="button"
        className={dotCx}
        aria-label={`Use ${i + 1}`}
        aria-pressed={filled}
        onClick={() => onChange(filled ? i : i + 1)}
        disabled={disabled}
      />
    );
  });
  return (
    <div role="group" className="use-dots-use-dots" aria-label={ariaLabel ?? label ?? `Uses: ${checked} of ${total}`}>
      {dots}
      {label && (
        <Text as="span" font="serif" size="xs" italic color="muted" className="nowrap" aria-hidden="true">
          {label}
        </Text>
      )}
    </div>
  );
};
