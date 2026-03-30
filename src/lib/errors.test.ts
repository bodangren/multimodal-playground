import { describe, expect, it } from 'vitest';
import { errorMessage } from './errors';

describe('errorMessage', () => {
  it('returns string errors when they contain text', () => {
    expect(errorMessage('  boom  ', 'fallback')).toBe('boom');
  });

  it('returns the fallback for empty strings and non-error values', () => {
    expect(errorMessage('   ', 'fallback')).toBe('fallback');
    expect(errorMessage(null, 'fallback')).toBe('fallback');
  });

  it('returns trimmed error messages from Error objects', () => {
    expect(errorMessage(new Error('  broken  '), 'fallback')).toBe('broken');
  });
});
