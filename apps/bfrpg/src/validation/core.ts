/**
 * Core validation engine with development-only runtime checks
 */

import type { ValidationRule, ValidationSchema, ValidationResult, ValidationContext } from '@/types/validation';

// Development-only validation context
const VALIDATION_CONTEXT: ValidationContext = {
  isDevelopment: import.meta.env.DEV,
  skipTypeGuards: import.meta.env.PROD,
};

/**
 * Core validation function with development-only optimizations
 */
export function validate<T>(value: T, schema: ValidationSchema<T>, context: ValidationContext = VALIDATION_CONTEXT): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let isValid = true;

  // Check if value is required
  if (schema.required && (value === null || value === undefined || value === '')) {
    return {
      isValid: false,
      errors: ['This field is required'],
      warnings: [],
    };
  }

  // Skip validation if value is empty and not required
  if (!schema.required && (value === null || value === undefined || value === '')) {
    return {
      isValid: true,
      errors: [],
      warnings: [],
    };
  }

  // Run validation rules
  for (const rule of schema.rules) {
    try {
      if (!rule.validate(value)) {
        errors.push(rule.message);
        isValid = false;
      }
    } catch (error) {
      errors.push(`Validation error: ${rule.name}`);
      isValid = false;

      // Only log in development
      if (context.isDevelopment) {
        console.error(`Validation rule "${rule.name}" failed:`, error);
      }
    }
  }

  return {
    isValid,
    errors: Object.freeze(errors),
    warnings: Object.freeze(warnings),
  };
}

/**
 * Create a validation rule with better error handling
 */
export function createRule<T>(name: string, validate: (value: T) => boolean, message: string): ValidationRule<T> {
  return {
    name,
    validate,
    message,
  };
}

/**
 * Create a validation schema
 */
export function createSchema<T>(rules: ValidationRule<T>[], required = false): ValidationSchema<T> {
  return {
    rules,
    required,
  };
}
