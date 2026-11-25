/**
 * UI Design System Constants
 * Centralized design tokens, styling patterns, and UI configuration
 */

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
