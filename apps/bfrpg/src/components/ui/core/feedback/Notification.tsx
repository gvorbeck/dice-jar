import { Group } from 'react-aria-components';
import type { ToastEntryProps } from '@dice-jar/browser';
import { Typography } from '@/components/ui/core/display';
import { Button } from '@/components/ui/core/primitives';
import './Notification.css';

/** Codex.Quest's look for a toast; the timing, dedupe and announcements are @dice-jar/browser's ToastProvider. */
export const Notification = ({ item, onDismiss, onPause, onResume }: ToastEntryProps) => (
  <Group
    aria-label={`${item.variant} notification`}
    className="notification"
    data-priority={item.variant}
    data-shown={!item.exiting || undefined}
    onHoverStart={() => onPause(item.id)}
    onHoverEnd={() => onResume(item.id)}
    onFocus={() => onPause(item.id)}
    onBlur={() => onResume(item.id)}
  >
    <div className="notification-accent" />
    <Button
      onClick={() => onDismiss(item.id)}
      variant="ghost"
      size="sm"
      className="notification-close"
      aria-label="Dismiss notification"
      icon="close"
      iconSize="sm"
    />
    <div className="notification-body" data-dismissible>
      {/* Errors interrupt; info and success are announced by the provider's polite live region. */}
      <Typography variant="body" color="slate" role={item.variant === 'error' ? 'alert' : undefined}>
        {item.message}
      </Typography>
    </div>
  </Group>
);
