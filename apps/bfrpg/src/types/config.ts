// Service types
export interface ServiceErrorOptions {
  action: string;
  context?: Record<string, unknown>;
  fallbackMessage?: string;
}
