import { Suspense, lazy, useState } from 'react';
import './App.css';
import { ErrorBoundary, ToastProvider } from '@dice-jar/browser';
import { ErrorPage, Notification, LoadingState } from '@/components/ui/core/feedback';
import { Header } from '@/components/app/Header';
import { Footer } from '@/components/app/Footer';
import { Routes } from '@/components/app/Routes';
import { useAppData, useNetworkStatus } from '@/hooks';
import { getInitialAlerts, type AlertConfig } from '@/constants';

const SignInModal = lazy(() => import('./components/modals/auth/SignInModal'));

const OFFLINE_ALERT: AlertConfig = {
  message: "You're offline. Changes will be saved when you reconnect.",
  type: 'warning',
  dismissible: false,
};

// Inner app component, inside the toast provider
function AppContent() {
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [alerts, setAlerts] = useState<AlertConfig[]>(() => getInitialAlerts());
  const { isOnline } = useNetworkStatus();

  useAppData();

  const handleSignInSuccess = () => {
    setIsSignInModalOpen(false);
  };

  const handleAlertClose = (alertIndex: number) => {
    setAlerts((prevAlerts) => prevAlerts.filter((_, index) => index !== alertIndex));
  };

  const headerProps = {
    setIsSignInModalOpen,
    // Last, so the dismissible alerts keep their indexes for onAlertClose.
    alerts: isOnline ? alerts : [...alerts, OFFLINE_ALERT],
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
  return (
    <ErrorBoundary
      fallback={
        <ErrorPage title="Something went wrong" message="We're sorry, but an unexpected error occurred. Please try refreshing the page." />
      }
    >
      <ToastProvider Entry={Notification}>
        <AppContent />
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
