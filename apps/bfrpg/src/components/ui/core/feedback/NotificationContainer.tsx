import { createPortal } from 'react-dom';
import { cn } from '@dice-jar/cn';
import Notification from './Notification';
import type { NotificationProps, NotificationPosition } from './Notification';

interface NotificationData extends Omit<NotificationProps, 'onDismiss' | 'isVisible'> {
  id: string;
}

interface NotificationContainerProps {
  notifications: NotificationData[];
  position?: NotificationPosition;
  onDismiss: (id: string) => void;
  className?: string;
}

const NotificationContainer: React.FC<NotificationContainerProps> = ({ notifications, position = 'top-right', onDismiss, className }) => {
  if (notifications.length === 0) {
    return null;
  }

  const container = (
    <div className={cn('notifications', className)} data-position={position}>
      {notifications.map((notification) => (
        <Notification key={notification.id} {...notification} position={position} onDismiss={onDismiss} isVisible={true} />
      ))}
    </div>
  );

  // Render into portal to ensure proper z-index stacking
  return createPortal(container, document.body);
};

export default NotificationContainer;
