/**
 * Application Infrastructure Constants
 * Core application configuration, storage, and environment setup
 */

// Firebase Configuration
export const FIREBASE_COLLECTIONS = {
  USERS: 'users',
  CHARACTERS: 'characters',
  GAMES: 'games',
} as const;

// Storage Configuration
export const STORAGE_KEYS = {
  NEW_CHARACTER: 'newCharacter',
  CHARACTER_DRAFT: 'characterDraft',
  DRAFT_GAME: 'draftGame',
  INCLUDE_SUPPLEMENTAL_RACE: 'includeSupplemental',
  INCLUDE_SUPPLEMENTAL_CLASS: 'includeSupplementalClass',
  USE_COMBINATION_CLASS: 'useCombinationClass',
  CUSTOM_CLASS_MAGIC_TOGGLE: 'customClassMagicToggle',
} as const;

export const CACHE_KEYS = {
  EQUIPMENT_ALL: 'equipment-all',
  GM_BINDER_SPELLS: 'gm-binder-spells',
  GM_BINDER_MONSTERS: 'gm-binder-monsters',
} as const;

// File Upload Configuration
export const FILE_UPLOAD = {
  AVATAR_MAX_SIZE_BYTES: 1 * 1024 * 1024, // 1MB
  AVATAR_MAX_SIZE_MB: 1,
} as const;
