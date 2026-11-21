import { Suspense, lazy, useState, useEffect } from 'react';
import './App.css';
import { ErrorBoundary } from '@dice-jar/browser';
import { ErrorPage, NotificationContainer, NotificationsDown, LoadingState } from '@/components/ui/core/feedback';
import { Header } from '@/components/app/Header';
import { Footer } from '@/components/app/Footer';
import { Routes } from '@/components/app/Routes';
import { useAppData, useNetworkStatus } from '@/hooks';
import { useNotifications } from '@/hooks/ui/useNotifications';
import NotificationContext from '@/contexts/NotificationContext';
import { initializeFavicon } from '@/utils/favicon';
import { getInitialAlerts, type AlertConfig } from '@/constants';

const SignInModal = lazy(() => import('./components/modals/auth/SignInModal'));

// Inner app component that uses the notification context
function AppContent() {
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [alerts, setAlerts] = useState<AlertConfig[]>(() => getInitialAlerts());
  useNetworkStatus(); // This will automatically handle offline/online notifications

  useAppData();

  // Initialize favicon based on app mode
  useEffect(() => {
    initializeFavicon();
  }, []);

  const handleSignInSuccess = () => {
    setIsSignInModalOpen(false);
  };

  const handleAlertClose = (alertIndex: number) => {
    setAlerts((prevAlerts) => prevAlerts.filter((_, index) => index !== alertIndex));
  };

  const headerProps = {
    setIsSignInModalOpen,
    alerts,
    onAlertClose: handleAlertClose,
  };

  return (
    <div className="app">
      <Header {...headerProps} />
      <Routes />
      <Footer />

      {/* Sign In Modal - Lazy loaded */}
      {isSignInModalOpen && (
        <Suspense fallback={<LoadingState message="Loading sign in..." variant="inline" />}>
          <SignInModal isOpen={isSignInModalOpen} onClose={() => setIsSignInModalOpen(false)} onSuccess={handleSignInSuccess} />
        </Suspense>
      )}
    </div>
  );
}

function App() {
  const notifications = useNotifications();

  return (
    <ErrorBoundary
      fallback={
        <ErrorPage title="Something went wrong" message="We're sorry, but an unexpected error occurred. Please try refreshing the page." />
      }
    >
      <NotificationContext.Provider value={notifications}>
        <AppContent />

        {/* Global Notification Container */}
        <ErrorBoundary fallback={<NotificationsDown />}>
          <NotificationContainer notifications={notifications.notifications} onDismiss={notifications.dismissNotification} />
        </ErrorBoundary>
      </NotificationContext.Provider>
    </ErrorBoundary>
  );
}

export default App;
