/**
 * UI Design System Constants
 * Centralized design tokens, styling patterns, and UI configuration
 */

import { isMockMode } from '@/lib/mockMode';

// DOM Element Configuration
export const DOM_IDS = {
  MAIN_CONTENT: 'main-content',
  MOBILE_MENU: 'mobile-menu',
  ROOT: 'root',
} as const;

export const CSS_CLASSES = {
  SKIP_LINK: 'skip-link',
  SR_ONLY: 'sr-only',
} as const;

export const HTML_ROLES = {
  BANNER: 'banner',
  NAVIGATION: 'navigation',
  MAIN: 'main',
  CONTENTINFO: 'contentinfo',
  STATUS: 'status',
} as const;

// Currency UI Configuration
export const CURRENCY_UI_CONFIG = [
  {
    key: 'platinum' as const,
    label: 'Platinum',
    abbrev: 'pp',
  },
  {
    key: 'gold' as const,
    label: 'Gold',
    abbrev: 'gp',
  },
  {
    key: 'electrum' as const,
    label: 'Electrum',
    abbrev: 'ep',
  },
  {
    key: 'silver' as const,
    label: 'Silver',
    abbrev: 'sp',
  },
  {
    key: 'copper' as const,
    label: 'Copper',
    abbrev: 'cp',
  },
] as const;

// Badge variant mapping for special abilities
export const ABILITY_BADGE_VARIANTS = {
  darkvision: 'primary',
  'turn undead': 'warning',
  'sneak attack': 'danger',
  backstab: 'danger',
  immunity: 'success',
  detect: 'supplemental',
  'secret door': 'supplemental',
  spellcasting: 'status',
  rage: 'danger',
  tracking: 'supplemental',
  stealth: 'status',
  hide: 'status',
  climb: 'status',
  'move silently': 'status',
  'ghoul immunity': 'success',
} as const;

// Notification System Styling
export const NOTIFICATION_CONSTANTS = {
  ANIMATION_DURATION: 400,
  DEFAULT_DURATION: 0,
  FOCUS_DELAY: 100,
  MAX_NOTIFICATIONS: 5,
} as const;

// Game Sheet Specific Styles
export const GAME_SHEET_STYLES = {
  spacing: {
    section: 'mb-8',
    element: 'mb-4',
    content: 'space-y-6',
    cardGap: 'gap-4',
    innerSpacing: 'space-y-2',
  },
  layout: {
    cardGrid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    statusMessage: 'status-message',
    centeredContent: 'text-center py-12',
  },
  colors: {
    card: 'bg-zinc-800 border border-zinc-700 rounded-lg',
    text: {
      primary: 'text-zinc-100',
      secondary: 'text-zinc-400',
      error: 'text-red-400',
      loading: 'text-zinc-400',
    },
  },
  accessibility: {
    skipLink: 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-amber-400 text-zinc-900 px-4 py-2 rounded',
  },
} as const;

// Error and Loading Messages
export const ERROR_MESSAGES = {
  gameNotFound: 'Game not found',
  loadError: 'Failed to load game',
  updateError: 'Failed to update game. Please try again.',
  invalidUrl: 'Invalid game URL',
  permissionDenied: 'You do not have permission to edit this game',
} as const;

export const LOADING_MESSAGES = {
  loadingGame: 'Loading game...',
  updatingGame: 'Updating game...',
  savingChanges: 'Saving changes...',
  loadingPlayerData: 'Loading player data...',
} as const;

// Alert System Configuration
export interface AlertConfig {
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  dismissible: boolean;
  autoHide?: boolean;
  duration?: number; // in milliseconds
}

/**
 * Alert for mock mode users
 */
const MOCK_MODE_ALERT: AlertConfig = {
  message: 'Running in mock mode - data is stored locally.',
  type: 'warning',
  dismissible: true,
  autoHide: false,
};

/**
 * Get the appropriate alerts based on app state
 */
export function getInitialAlerts(): AlertConfig[] {
  const alerts: AlertConfig[] = [];

  // Always show welcome alert first
  // alerts.push(WELCOME_ALERT);

  // Add mock mode alert if in mock mode
  if (typeof window !== 'undefined') {
    try {
      if (isMockMode()) {
        alerts.push(MOCK_MODE_ALERT);
      }
    } catch (error) {
      // Fallback: if we can't determine mock mode, don't add the alert
      // Use logger when available, otherwise silently fail
      if (typeof error === 'object' && error !== null) {
        // Silent fallback - don't show alert if we can't determine mode
      }
    }
  }

  return alerts;
}
