/**
 * UI Component Types
 * Type definitions for UI components, styling, and design system elements
 */

import type { ButtonHTMLAttributes } from 'react';

// Button types
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'accent';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface BaseButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

// Validation types
export interface PropValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  context?: Record<string, unknown>;
}

// Loading state types
export interface UseLoadingStateOptions {
  initialState?: boolean;
}

export interface LoadingState {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  startLoading: () => void;
  stopLoading: () => void;
  withLoading: <T>(asyncFn: () => Promise<T>) => Promise<T>;
}

// Notification types
export interface ShowNotificationOptions {
  title?: string;
  priority?: 'info' | 'success' | 'warning' | 'error';
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  duration?: number;
  dismissible?: boolean;
}

export interface NotificationSystem {
  notifications: Array<{
    id: string;
    message: string | React.ReactNode;
    title?: string;
    priority?: 'info' | 'success' | 'warning' | 'error';
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
    duration?: number;
    dismissible?: boolean;
  }>;
  showNotification: (message: string | React.ReactNode, options?: ShowNotificationOptions) => string;
  showInfo: (message: string | React.ReactNode, options?: Omit<ShowNotificationOptions, 'priority'>) => string;
  showSuccess: (message: string | React.ReactNode, options?: Omit<ShowNotificationOptions, 'priority'>) => string;
  showWarning: (message: string | React.ReactNode, options?: Omit<ShowNotificationOptions, 'priority'>) => string;
  showError: (message: string | React.ReactNode, options?: Omit<ShowNotificationOptions, 'priority'>) => string;
  dismissNotification: (id: string) => void;
  clearAll: () => void;
  pauseAll: () => void;
  resumeAll: () => void;
}
