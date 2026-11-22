import { useState } from 'react';
import { Button } from '@/components/ui';
import { TextInput, FormField } from '@/components/ui/core/primitives';
import { ErrorDisplay } from '@/components/ui/core/feedback';
import { Modal } from '@/components/modals';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from '@/components/ui/core/layout/Tabs';
import { useRun } from '@dice-jar/browser';
import { sendPasswordReset, signInWithEmail, signInWithGoogle, signUpWithEmail } from '@/services';
import GoogleSignInSection from './GoogleSignInSection';
import './SignInModal.css';

// Type guard for Firebase errors
function isFirebaseError(error: unknown): error is { code?: string } {
  return typeof error === 'object' && error !== null && 'code' in error;
}

// Error message constants
const AUTH_ERRORS = {
  PASSWORDS_DONT_MATCH: 'Passwords do not match.',
  PASSWORD_TOO_SHORT: 'Password must be at least 6 characters long.',
  USER_NOT_FOUND: 'No account found with this email address.',
  WRONG_PASSWORD: 'Incorrect password.',
  INVALID_EMAIL: 'Invalid email address.',
  TOO_MANY_REQUESTS: 'Too many failed attempts. Please try again later.',
  EMAIL_IN_USE: 'An account with this email already exists.',
  WEAK_PASSWORD: 'Password is too weak. Please choose a stronger password.',
  SIGN_IN_FAILED: 'Failed to sign in. Please try again.',
  SIGN_UP_FAILED: 'Failed to create account. Please try again.',
  PASSWORD_RESET_FAILED: 'Failed to send password reset email. Please try again.',
  GOOGLE_SIGN_IN_FAILED: 'Failed to sign in with Google. Please try again.',
  GOOGLE_SIGN_IN_CANCELLED: 'Google sign-in was cancelled.',
} as const;

// Firebase error code -> what to tell the user; anything else gets the action's own fallback.
const AUTH_CODES: Record<string, string> = {
  'auth/user-not-found': AUTH_ERRORS.USER_NOT_FOUND,
  'auth/wrong-password': AUTH_ERRORS.WRONG_PASSWORD,
  'auth/invalid-email': AUTH_ERRORS.INVALID_EMAIL,
  'auth/too-many-requests': AUTH_ERRORS.TOO_MANY_REQUESTS,
  'auth/email-already-in-use': AUTH_ERRORS.EMAIL_IN_USE,
  'auth/weak-password': AUTH_ERRORS.WEAK_PASSWORD,
  'auth/cancelled-popup-request': AUTH_ERRORS.GOOGLE_SIGN_IN_CANCELLED,
  'auth/popup-closed-by-user': AUTH_ERRORS.GOOGLE_SIGN_IN_CANCELLED,
};
const authMessage = (fallback: string) => (error: unknown) => (isFirebaseError(error) && error.code && AUTH_CODES[error.code]) || fallback;

// Custom hooks for form state management
function useSignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const reset = () => {
    setEmail('');
    setPassword('');
  };

  const isValid = email && password;

  return {
    email,
    setEmail,
    password,
    setPassword,
    reset,
    isValid,
  };
}

function useSignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const reset = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  const isValid = email && password && confirmPassword;

  return {
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    reset,
    isValid,
  };
}

function usePasswordResetForm() {
  const [email, setEmail] = useState('');

  const reset = () => {
    setEmail('');
  };

  const isValid = email;

  return {
    email,
    setEmail,
    reset,
    isValid,
  };
}

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (userData: { uid: string; email: string | null }) => void;
}

export default function SignInModal({ isOpen, onClose, onSuccess }: SignInModalProps) {
  // Shared state
  const [activeTab, setActiveTab] = useState('signin');
  const { busy: isLoading, err, run, clear } = useRun();
  const [invalid, setInvalid] = useState(''); // a form problem found before sending anything
  const error = invalid || err;
  const [resetSuccess, setResetSuccess] = useState(false);

  // Form state using custom hooks
  const signInForm = useSignInForm();
  const signUpForm = useSignUpForm();
  const resetForm = usePasswordResetForm();

  const signedIn = (userData: { uid: string; email: string | null }) => {
    if (onSuccess) onSuccess(userData);
    else onClose();
    resetForms();
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setInvalid('');
    await run(async () => signedIn(await signInWithEmail(signInForm.email, signInForm.password)), authMessage(AUTH_ERRORS.SIGN_IN_FAILED));
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    clear();
    if (signUpForm.password !== signUpForm.confirmPassword) return setInvalid(AUTH_ERRORS.PASSWORDS_DONT_MATCH);
    if (signUpForm.password.length < 6) return setInvalid(AUTH_ERRORS.PASSWORD_TOO_SHORT);
    setInvalid('');
    await run(async () => signedIn(await signUpWithEmail(signUpForm.email, signUpForm.password)), authMessage(AUTH_ERRORS.SIGN_UP_FAILED));
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setInvalid('');
    setResetSuccess(false);
    if (await run(() => sendPasswordReset(resetForm.email), authMessage(AUTH_ERRORS.PASSWORD_RESET_FAILED))) {
      setResetSuccess(true);
      resetForm.reset();
    }
  };

  const handleGoogleSignIn = async () => {
    setInvalid('');
    await run(async () => signedIn(await signInWithGoogle()), authMessage(AUTH_ERRORS.GOOGLE_SIGN_IN_FAILED));
  };

  const resetForms = () => {
    signInForm.reset();
    signUpForm.reset();
    resetForm.reset();
    setInvalid('');
    clear();
    setResetSuccess(false);
  };

  const handleClose = () => {
    resetForms();
    setActiveTab('signin');
    onClose();
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setInvalid(''); // Clear errors when switching tabs
    clear();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Authentication" size="sm">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabList aria-label="Authentication options">
          <Tab value="signin">Sign In</Tab>
          <Tab value="signup">Sign Up</Tab>
          <Tab value="reset">Reset Password</Tab>
        </TabList>

        <TabPanels>
          <TabPanel value="signin">
            <GoogleSignInSection
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              isPending={isLoading}
              dividerText="Or continue with email"
            />

            <form onSubmit={handleSignIn} className="auth-form">
              <FormField label="Email address" required>
                <TextInput
                  type="email"
                  value={signInForm.email}
                  onChange={signInForm.setEmail}
                  placeholder="Enter your email"
                  disabled={isLoading}
                />
              </FormField>

              <FormField label="Password" required>
                <TextInput
                  type="password"
                  value={signInForm.password}
                  onChange={signInForm.setPassword}
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
              </FormField>

              <div className="auth-forgot">
                <Button type="button" onClick={() => setActiveTab('reset')} variant="ghost" size="sm" disabled={isLoading}>
                  Forgot Password?
                </Button>
              </div>

              <ErrorDisplay error={error} />

              <Button type="submit" disabled={isLoading || !signInForm.isValid}>
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
          </TabPanel>

          <TabPanel value="signup">
            <GoogleSignInSection
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              isPending={isLoading}
              dividerText="Or create account with email"
            />

            <form onSubmit={handleSignUp} className="auth-form">
              <FormField label="Email address" required>
                <TextInput
                  type="email"
                  value={signUpForm.email}
                  onChange={signUpForm.setEmail}
                  placeholder="Enter your email"
                  disabled={isLoading}
                />
              </FormField>

              <FormField label="Password" required>
                <TextInput
                  type="password"
                  value={signUpForm.password}
                  onChange={signUpForm.setPassword}
                  placeholder="Create a password"
                  disabled={isLoading}
                />
              </FormField>

              <FormField label="Confirm password" required>
                <TextInput
                  type="password"
                  value={signUpForm.confirmPassword}
                  onChange={signUpForm.setConfirmPassword}
                  placeholder="Confirm your password"
                  disabled={isLoading}
                />
              </FormField>

              <ErrorDisplay error={error} />

              <Button type="submit" disabled={isLoading || !signUpForm.isValid}>
                {isLoading ? 'Creating Account...' : 'Sign Up'}
              </Button>
            </form>
          </TabPanel>

          <TabPanel value="reset">
            {resetSuccess ? (
              <div className="auth-sent">
                <div>
                  <p>Password reset email sent!</p>
                  <p>Check your email for instructions to reset your password.</p>
                </div>
                <Button onClick={() => setActiveTab('signin')} variant="ghost">
                  Back to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handlePasswordReset} className="auth-form">
                <div className="auth-intro">Enter your email address and we'll send you a link to reset your password.</div>

                <FormField label="Email address" required>
                  <TextInput
                    type="email"
                    value={resetForm.email}
                    onChange={resetForm.setEmail}
                    placeholder="Enter your email"
                    disabled={isLoading}
                  />
                </FormField>

                <ErrorDisplay error={error} />

                <Button type="submit" disabled={isLoading || !resetForm.isValid}>
                  {isLoading ? 'Sending...' : 'Send Reset Email'}
                </Button>

                <Button type="button" onClick={() => setActiveTab('signin')} variant="ghost">
                  Back to Sign In
                </Button>
              </form>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Modal>
  );
}
