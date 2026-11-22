/**
 * Data utilities - consolidated from currency.ts, sanitization.ts, logger.ts, serviceErrorHandler.ts, and gmBinderUtils.ts
 * Contains currency conversion, data sanitization, error handling, and GMBinder utilities
 */
import { SPELL_CATEGORIES, SPELL_LEVEL_THRESHOLDS, MONSTER_CATEGORIES, MONSTER_NAME_PATTERNS } from '@/constants';
import type { Monster, Spell, ServiceErrorOptions } from '@/types';

// ============================================================================
// ERROR HANDLING
// ============================================================================

class ServiceError extends Error {
  public readonly action: string;
  public readonly context: Record<string, unknown> | undefined;
  public readonly originalError: unknown;

  constructor(action: string, originalError: unknown, context?: Record<string, unknown>, fallbackMessage?: string) {
    const message = fallbackMessage || `Failed to ${action}`;
    super(message);
    this.name = 'ServiceError';
    this.action = action;
    this.originalError = originalError;
    this.context = context;
  }
}

export function handleServiceError(error: unknown, options: ServiceErrorOptions): never {
  const { action, context, fallbackMessage } = options;

  console.error(`Error ${action}:`, error);

  throw new ServiceError(action, error, context, fallbackMessage);
}

/**
 * Extracts error message from unknown error type
 * Always returns a string for consistent error handling across components
 */
export function getErrorMessage(error: unknown, fallbackMessage: string = 'An unexpected error occurred'): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return fallbackMessage;
}

// ============================================================================
// DATA SANITIZATION
// ============================================================================

function stripHtml(html: string): string {
  // Repeat until stable so nested input like "<<b>script>" can't leave a tag behind
  let prev: string;
  do {
    prev = html;
    html = html.replace(/<[^>]*>/g, '');
  } while (html !== prev);
  return html;
}

export function sanitizeCharacterName(name: string): string {
  // Remove any HTML tags first
  const plainText = stripHtml(name);

  // Allow only letters, spaces, hyphens, apostrophes, and periods
  // This matches the validation schema pattern
  return plainText.replace(/[^a-zA-Z\s\-'.]/g, '').trim();
}

// ============================================================================
// GMBINDER UTILITIES
// ============================================================================

export function categorizeSpell(spell: Spell): string {
  const levels = Object.values(spell.level).filter((level) => level !== null);
  const maxLevel = Math.max(...(levels as number[]));

  if (maxLevel <= SPELL_LEVEL_THRESHOLDS.LOW_MAX) {
    return SPELL_CATEGORIES.LOW_LEVEL;
  }

  if (maxLevel <= SPELL_LEVEL_THRESHOLDS.MID_MAX) {
    return SPELL_CATEGORIES.MID_LEVEL;
  }

  if (maxLevel <= SPELL_LEVEL_THRESHOLDS.HIGH_5_6_MAX) {
    return SPELL_CATEGORIES.HIGH_LEVEL_5_6;
  }

  return SPELL_CATEGORIES.HIGH_LEVEL_7_9;
}

export function categorizeMonster(monster: Monster): string {
  const name = monster.name.toLowerCase();

  // Check each category's patterns
  for (const [category, patterns] of Object.entries(MONSTER_NAME_PATTERNS)) {
    if (patterns.some((pattern) => name.includes(pattern))) {
      return category;
    }
  }

  // Default category if no patterns match
  return MONSTER_CATEGORIES.MISCELLANEOUS;
}

export function createSearchableText(monster: Monster): string {
  return [monster.name, ...(monster.variants || []).map(([variantName]) => variantName).filter(Boolean)].join(' ').toLowerCase();
}
