import { describe, it, expect } from 'vitest';
import { cn } from '../cn';

describe('cn', () => {
  it('joins set names and drops falsy ones', () => {
    expect(cn('a', false, undefined, null, 'b')).toBe('a b');
    expect(cn()).toBe('');
  });
});
