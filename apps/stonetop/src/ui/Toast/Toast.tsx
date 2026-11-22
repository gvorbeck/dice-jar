import { useCallback } from 'react';
import { Group } from 'react-aria-components';
import { cn } from '@dice-jar/cn';
import { Button } from '@/ui';
import { Icon } from '@/ui';
import { Text } from '@/ui';
import type { ToastEntryProps } from '@dice-jar/browser';

/** Stonetop's look for a toast; the timing, dedupe and announcements are @dice-jar/browser's ToastProvider. */
export const ToastEntry = ({ item, onDismiss, onPause, onResume }: ToastEntryProps) => {
  const cx = cn('toast', `toast-${item.variant}`, item.exiting && 'toast-exiting');
  const iconCx = cn('toast-icon', `toast-${item.variant}`);
  const handleDismissItem = useCallback(() => onDismiss(item.id), [onDismiss, item.id]);
  const handlePause = useCallback(() => onPause(item.id), [onPause, item.id]);
  const handleResume = useCallback(() => onResume(item.id), [onResume, item.id]);
  const iconName = ({ error: 'warning', success: 'check', info: 'info' } as const)[item.variant];
  // Errors interrupt assertively via role="alert" here. Info/success are announced
  // by the persistent polite live region in ToastProvider instead of a role/aria-live
  // on this node — a live region mounted together with its own text isn't reliably
  // announced, so this visual toast stays silent for screen readers by design.
  const isError = item.variant === 'error';

  return (
    <Group
      aria-label={`${item.variant} notification`}
      className={cx}
      onHoverStart={handlePause}
      onHoverEnd={handleResume}
      onFocus={handlePause}
      onBlur={handleResume}
    >
      <Icon name={iconName} size="small" className={iconCx} />
      <Text as="span" size="xs" className="toast-body" role={isError ? 'alert' : undefined}>
        {item.message}
      </Text>
      <Button
        variant="ghost"
        size="sm"
        icon="close"
        className="toast-dismiss"
        onClick={handleDismissItem}
        aria-label="Dismiss notification"
      />
    </Group>
  );
};
