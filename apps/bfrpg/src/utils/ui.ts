/**
 * UI utilities - consolidated from formatters.ts, buttonStyles.ts, tooltipUtils.ts, and fabValidation.ts
 * Contains formatting, styling, positioning, and validation utilities for UI components
 */

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

type ClassValue = string | number | boolean | undefined | null | { [key: string]: boolean | undefined | null } | ClassValue[];

export function cn(...inputs: ClassValue[]): string {
  const classes: string[] = [];

  for (const input of inputs) {
    if (!input) continue;

    if (typeof input === 'string' || typeof input === 'number') {
      classes.push(String(input));
    } else if (Array.isArray(input)) {
      const nested = cn(...input);
      if (nested) classes.push(nested);
    } else if (typeof input === 'object') {
      for (const [key, value] of Object.entries(input)) {
        if (value) classes.push(key);
      }
    }
  }

  return classes.join(' ');
}

export const displayValue = (value: string | number | undefined | null, fallback = '—'): string => {
  return value !== null && value !== undefined && value !== '' ? String(value) : fallback;
};

export const formatLargeNumber = (value: number, threshold = 999999): string => {
  if (value <= threshold) {
    return value.toLocaleString();
  }

  if (value >= 1000000) {
    const millions = value / 1000000;
    return `${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}M`;
  }

  const thousands = value / 1000;
  return `${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)}K`;
};

export const truncateText = (text: string, maxLength: number = 150): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
};

export function getEntityDeletionDescription(variant: 'error' | 'warning', _entityName: string, title: string): string {
  if (variant === 'error') {
    return `and all their adventures, equipment, and memories will be lost to the void. This action cannot be undone, reversed, or recovered by any magic known to mortals.`;
  }

  if (variant === 'warning' && title.includes('Player')) {
    return `will be removed from this game session. They will no longer appear in the player list or have access to game features. This action can be reversed by re-adding them to the game.`;
  }

  return `and all its campaigns, player data, and battle records will be lost to the void. This action cannot be undone, reversed, or recovered by any magic known to mortals.`;
}
