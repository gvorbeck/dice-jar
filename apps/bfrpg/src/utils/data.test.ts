import { describe, expect, it, vi } from 'vitest';
import { getErrorMessage, handleServiceError, sanitizeCharacterName } from './data';

describe('sanitizeCharacterName', () => {
  it('strips tags and characters a name may not hold, then trims', () => {
    expect(sanitizeCharacterName("  <b>Thorin</b> O'Brien-Smith Jr. 3<script>  ")).toBe("Thorin O'Brien-Smith Jr.");
  });

  it('does not leave a tag behind from nested brackets', () => {
    expect(sanitizeCharacterName('<<b>script>alert')).toBe('scriptalert');
  });
});

describe('getErrorMessage', () => {
  it('reads an Error, a string, or falls back', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('boom');
    expect(getErrorMessage('plain')).toBe('plain');
    expect(getErrorMessage(42)).toBe('An unexpected error occurred');
    expect(getErrorMessage(null, 'custom')).toBe('custom');
  });
});

describe('handleServiceError', () => {
  it('logs, then throws a ServiceError that keeps its action, context and cause', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const cause = new Error('network');
    let thrown: unknown;
    try {
      handleServiceError(cause, { action: 'save character', context: { id: 'c1' } });
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toMatchObject({
      name: 'ServiceError',
      message: 'Failed to save character',
      action: 'save character',
      context: { id: 'c1' },
      originalError: cause,
    });
    expect(log).toHaveBeenCalledOnce();
    log.mockRestore();
  });

  it('uses the fallback message when given', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => handleServiceError('x', { action: 'load', fallbackMessage: 'Could not load' })).toThrow('Could not load');
  });
});
