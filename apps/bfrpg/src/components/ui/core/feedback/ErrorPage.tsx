import { Link } from 'react-router-dom';
import { TextHeader, Typography, Button } from '@/components/ui';
import './ErrorPage.css';
import './NotificationsDown.css';

interface ErrorPageProps {
  title: string;
  message: string;
  showHomeLink?: boolean;
}

/** What a page shows when something below it has crashed. */
export function ErrorPage({ title, message, showHomeLink = true }: ErrorPageProps) {
  return (
    <section className="error-page" role="alert">
      <TextHeader variant="h2" size="lg">
        {title}
      </TextHeader>
      <Typography variant="body" color="secondary">
        {message}
      </Typography>
      <div className="error-page-actions">
        <Button onClick={() => window.location.reload()}>Refresh Page</Button>
        {showHomeLink && <Link to="/">Return to Homepage</Link>}
      </div>
    </section>
  );
}

/** Stands in for the notification stack if it crashes. */
export function NotificationsDown() {
  return (
    <div role="alert" aria-live="assertive" className="notification-fallback">
      <Typography variant="helper" color="secondary">
        Notification system temporarily unavailable
      </Typography>
    </div>
  );
}
