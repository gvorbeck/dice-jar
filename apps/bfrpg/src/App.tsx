import { Suspense, lazy, useState } from 'react';
import './App.css';
import { ErrorBoundary, GlobalAlerts, ToastProvider, type Alert } from '@dice-jar/browser';
import { ErrorPage, Notification, LoadingState } from '@/components/ui/core/feedback';
import { Header } from '@/components/app/Header';
import { Footer } from '@/components/app/Footer';
import { Routes } from '@/components/app/Routes';
import { useAppData, useNetworkStatus } from '@/hooks';

const SignInModal = lazy(() => import('./components/modals/auth/SignInModal'));

const OFFLINE_ALERT: Alert = {
  id: 'offline',
  message: "You're offline. Changes will be saved when you reconnect.",
  type: 'warning',
};

// Inner app component, inside the toast provider
function AppContent() {
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const { isOnline } = useNetworkStatus();

  useAppData();

  const handleSignInSuccess = () => {
    setIsSignInModalOpen(false);
  };

  return (
    <div className="app">
      <Header setIsSignInModalOpen={setIsSignInModalOpen} />
      <GlobalAlerts app="bfrpg" extra={isOnline ? [] : [OFFLINE_ALERT]} />
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
