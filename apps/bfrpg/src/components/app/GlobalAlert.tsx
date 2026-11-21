import { Typography } from '@/components/ui/core/display';
import { Button } from '@/components/ui';
import { cn } from '@dice-jar/cn';
import type { AlertConfig } from '@/constants';
import './GlobalAlert.css';

interface GlobalAlertProps {
  alert: AlertConfig;
  onClose?: () => void;
  className?: string;
}

export function GlobalAlert({ alert, onClose, className = '' }: GlobalAlertProps) {
  if (!alert.message) {
    return null;
  }

  return (
    <div
      className={cn('alert', `alert-${alert.type}`, className)}
      role="alert"
      aria-live={alert.type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      <div className="alert-body">
        <Typography variant="bodySmall" color="primary">
          {alert.message}
        </Typography>
        {alert.dismissible && onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label={`Close ${alert.type} alert`}
            className="alert-close"
            icon="close"
          />
        )}
      </div>
    </div>
  );
}
