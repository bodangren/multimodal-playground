import { describe, expect, it } from 'vitest';
import { errorMessage } from './errors';

describe('errorMessage', () => {
  it('returns a trimmed string error message', () => {
    expect(errorMessage('  text failed  ', 'fallback')).toBe('text failed');
  });

  it('returns an Error message', () => {
    expect(errorMessage(new Error('  structured failed  '), 'fallback')).toBe('structured failed');
  });

  it('falls back when the error is empty', () => {
    expect(errorMessage(undefined, 'fallback')).toBe('fallback');
  });
});
