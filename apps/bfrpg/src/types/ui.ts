/**
 * UI Component Types
 * Type definitions for UI components, styling, and design system elements
 */

import type { ButtonHTMLAttributes } from 'react';

// Button types
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'accent';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface BaseButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
}
