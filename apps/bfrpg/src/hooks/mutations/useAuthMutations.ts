import { sendPasswordReset, signInWithGoogle } from '@/services';
import { getErrorMessage, logger } from '@/utils';
import { useAction } from './useAction';

/**
 * Authentication-related actions
 */
export function useAuthMutations() {
  const reset = useAction(sendPasswordReset, (error) => logger.error('Password reset error:', error));
  const google = useAction(signInWithGoogle, (error) => logger.error('Google sign-in error:', error));

  const shape = <A extends unknown[], R>(a: ReturnType<typeof useAction<A, R>>) => ({
    mutateAsync: a.run,
    isPending: a.isPending,
    error: a.error ? getErrorMessage(a.error) : null,
    isError: !!a.error,
    isSuccess: a.isSuccess,
    reset: a.reset,
  });
  return { sendPasswordReset: shape(reset), signInWithGoogle: shape(google) };
}
