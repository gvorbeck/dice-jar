import { forwardRef, useEffect, useState, useCallback, useRef } from 'react';
import type { ReactNode, HTMLAttributes } from 'react';
import { cn } from '@dice-jar/cn';
import { Typography } from '@/components/ui/core/display';
import { Button } from '@/components/ui/core/primitives';
import { NOTIFICATION_CONSTANTS } from '@/constants';
import './Notification.css';

type NotificationPriority = 'info' | 'success' | 'warning' | 'error';
export type NotificationPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';

export interface NotificationProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Unique identifier for the notification */
  id: string;
  /** Required message content */
  message: ReactNode;
  /** Optional title - hidden if not provided */
  title?: string;
  /** Visual priority/type affecting colors */
  priority?: NotificationPriority;
  /** Position on screen */
  position?: NotificationPosition;
  /** Auto-dismiss timer in milliseconds (0 = no auto-dismiss) */
  duration?: number;
  /** Callback fired when notification is dismissed */
  onDismiss?: (id: string) => void;
  /** Whether notification can be manually dismissed */
  dismissible?: boolean;
  /** Whether notification is visible (controls animation) */
  isVisible?: boolean;
}

const Notification = forwardRef<HTMLDivElement, NotificationProps>(
  (
    {
      id,
      message,
      title,
      priority = 'info',
      position = 'top-right',
      duration = 0,
      onDismiss,
      dismissible = true,
      isVisible = true,
      className,
      ...props
    },
    ref,
  ) => {
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);
    const dismissTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const notificationRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<HTMLDivElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);

    const handleDismiss = useCallback(() => {
      setIsAnimatingOut(true);

      // Clear any existing animation timeout
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }

      // Allow animation to complete before calling onDismiss
      animationTimeoutRef.current = setTimeout(() => {
        onDismiss?.(id);
      }, NOTIFICATION_CONSTANTS.ANIMATION_DURATION);
    }, [id, onDismiss]);

    // Auto-dismiss timer
    useEffect(() => {
      if (duration > 0 && isVisible) {
        // Clear any existing dismiss timeout
        if (dismissTimeoutRef.current) {
          clearTimeout(dismissTimeoutRef.current);
        }

        dismissTimeoutRef.current = setTimeout(() => {
          handleDismiss();
        }, duration);

        return () => {
          if (dismissTimeoutRef.current) {
            clearTimeout(dismissTimeoutRef.current);
          }
        };
      }

      return undefined;
    }, [duration, isVisible, handleDismiss]);

    // Cleanup effect for component unmount
    useEffect(() => {
      return () => {
        if (dismissTimeoutRef.current) {
          clearTimeout(dismissTimeoutRef.current);
        }
        if (animationTimeoutRef.current) {
          clearTimeout(animationTimeoutRef.current);
        }
      };
    }, []);

    // Once per notification: an inline ref callback would restart the bar on every re-render
    const timerShown = duration > 0 && isVisible && !isAnimatingOut;
    useEffect(() => {
      if (!timerShown) return undefined;
      // jsdom has no animate()
      const animation = timerRef.current?.animate?.([{ width: '100%' }, { width: '0%' }], { duration, easing: 'linear', fill: 'forwards' });
      return () => animation?.cancel();
    }, [timerShown, duration]);

    // Focus management for critical notifications with restoration
    useEffect(() => {
      if (isVisible && priority === 'error' && notificationRef.current) {
        // Store current focus before focusing the notification
        previousFocusRef.current = document.activeElement as HTMLElement;

        // Focus error notifications for immediate attention
        // Small delay to ensure the notification is rendered and positioned
        const focusTimer = setTimeout(() => {
          notificationRef.current?.focus();
        }, NOTIFICATION_CONSTANTS.FOCUS_DELAY);

        return () => {
          clearTimeout(focusTimer);
          // Restore focus when error notification is dismissed
          if (
            previousFocusRef.current &&
            document.contains(previousFocusRef.current) &&
            document.activeElement === notificationRef.current
          ) {
            previousFocusRef.current.focus();
          }
        };
      }

      return undefined;
    }, [isVisible, priority]);

    return (
      <div
        ref={(node) => {
          notificationRef.current = node;
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        className={cn('notification', className)}
        data-priority={priority}
        data-position={position}
        data-shown={(isVisible && !isAnimatingOut) || undefined}
        role="alert"
        aria-live={priority === 'error' ? 'assertive' : 'polite'}
        aria-atomic="true"
        tabIndex={priority === 'error' ? 0 : -1}
        {...props}
      >
        {/* Accent bar */}
        <div className="notification-accent" />

        {/* Close button */}
        {dismissible && (
          <Button
            onClick={handleDismiss}
            variant="ghost"
            size="sm"
            className="notification-close"
            aria-label="Dismiss notification"
            icon="close"
            iconSize="sm"
          ></Button>
        )}

        {/* Content */}
        <div className="notification-body" data-dismissible={dismissible || undefined}>
          {title && (
            <Typography variant="h6" color="slate">
              {title}
            </Typography>
          )}

          <Typography variant="body" color="slate">
            {message}
          </Typography>
        </div>

        {/* Progress bar for timed notifications (only when duration > 0) */}
        {duration > 0 && isVisible && !isAnimatingOut && (
          <div className="notification-timer">
            {/* Web Animations API: the duration is per notification, so it can't live in the stylesheet or an inline style */}
            <div ref={timerRef} />
          </div>
        )}
      </div>
    );
  },
);

Notification.displayName = 'Notification';

export default Notification;
