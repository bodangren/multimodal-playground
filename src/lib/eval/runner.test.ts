import { describe, it, expect } from 'vitest';
import { evaluateAssertion, formatHarnessResult } from './runner';
import type { Assertion } from './fixtures';

describe('evaluateAssertion', () => {
  describe('contains', () => {
    it('passes when output contains the value (case insensitive)', () => {
      const assertion: Assertion = { type: 'contains', value: 'hello' };
      expect(evaluateAssertion(assertion, 'Hello World').passed).toBe(true);
      expect(evaluateAssertion(assertion, 'HELLO world').passed).toBe(true);
    });

    it('fails when output does not contain the value', () => {
      const assertion: Assertion = { type: 'contains', value: 'goodbye' };
      expect(evaluateAssertion(assertion, 'Hello World').passed).toBe(false);
    });
  });

  describe('notContains', () => {
    it('passes when output does not contain the value', () => {
      const assertion: Assertion = { type: 'notContains', value: 'goodbye' };
      expect(evaluateAssertion(assertion, 'Hello World').passed).toBe(true);
    });

    it('fails when output contains the value', () => {
      const assertion: Assertion = { type: 'notContains', value: 'hello' };
      expect(evaluateAssertion(assertion, 'Hello World').passed).toBe(false);
    });
  });

  describe('regex', () => {
    it('passes when output matches the regex', () => {
      const assertion: Assertion = { type: 'regex', value: '\\d+' };
      expect(evaluateAssertion(assertion, 'abc123def').passed).toBe(true);
    });

    it('fails when output does not match the regex', () => {
      const assertion: Assertion = { type: 'regex', value: '\\d+' };
      expect(evaluateAssertion(assertion, 'abcdef').passed).toBe(false);
    });

    it('handles case insensitive matching', () => {
      const assertion: Assertion = { type: 'regex', value: 'hello', description: 'Should say hello' };
      expect(evaluateAssertion(assertion, 'HELLO world').passed).toBe(true);
    });

    it('returns false for invalid regex patterns', () => {
      const assertion: Assertion = { type: 'regex', value: '[invalid' };
      const result = evaluateAssertion(assertion, 'test');
      expect(result.passed).toBe(false);
      expect(result.message).toContain('Invalid regex');
    });
  });

  describe('length', () => {
    it('passes when output length is within range', () => {
      const assertion: Assertion = { type: 'length', value: '5-10' };
      expect(evaluateAssertion(assertion, 'hello').passed).toBe(true);
      expect(evaluateAssertion(assertion, 'hi').passed).toBe(false);
      expect(evaluateAssertion(assertion, 'hello world!').passed).toBe(false);
    });

    it('handles edge cases of the range', () => {
      const assertion: Assertion = { type: 'length', value: '5-10' };
      expect(evaluateAssertion(assertion, 'hello').passed).toBe(true);
      expect(evaluateAssertion(assertion, '0123456789').passed).toBe(true);
    });

    it('returns false for invalid length format', () => {
      const assertion: Assertion = { type: 'length', value: 'invalid' };
      const result = evaluateAssertion(assertion, 'test');
      expect(result.passed).toBe(false);
      expect(result.message).toContain('Invalid length range');
    });
  });

  describe('custom', () => {
    it('returns not implemented message', () => {
      const assertion: Assertion = { type: 'custom', value: 'custom logic' };
      const result = evaluateAssertion(assertion, 'test');
      expect(result.passed).toBe(false);
      expect(result.message).toContain('not yet implemented');
    });
  });
});

describe('formatHarnessResult', () => {
  it('formats a successful result', () => {
    const result = {
      total: 2,
      passed: 2,
      failed: 0,
      durationMs: 100,
      results: [
        {
          fixtureId: 'test-1',
          passed: true,
          assertions: [
            { assertion: { type: 'contains' as const, value: 'test' }, passed: true, message: 'Should contain test' },
          ],
          durationMs: 50,
        },
        {
          fixtureId: 'test-2',
          passed: true,
          assertions: [
            { assertion: { type: 'regex' as const, value: '\\d+' }, passed: true, message: 'Should have digits' },
          ],
          durationMs: 50,
        },
      ],
    };

    const output = formatHarnessResult(result);
    expect(output).toContain('Passed: 2 ✓');
    expect(output).toContain('Failed: 0 ✗');
    expect(output).toContain('ALL TESTS PASSED');
  });

  it('formats a failed result with assertion details', () => {
    const result = {
      total: 1,
      passed: 0,
      failed: 1,
      durationMs: 50,
      results: [
        {
          fixtureId: 'failing-test',
          passed: false,
          assertions: [
            {
              assertion: { type: 'contains' as const, value: 'hello', description: 'Should greet' },
              passed: false,
              message: 'Should greet',
            },
          ],
          durationMs: 50,
        },
      ],
    };

    const output = formatHarnessResult(result);
    expect(output).toContain('Failed: 1 ✗');
    expect(output).toContain('[FAIL] failing-test');
    expect(output).toContain('✗ Should greet');
    expect(output).toContain('Expected: hello');
  });

  it('formats an error result', () => {
    const result = {
      total: 1,
      passed: 0,
      failed: 1,
      durationMs: 30,
      results: [
        {
          fixtureId: 'error-test',
          passed: false,
          assertions: [],
          error: 'Network timeout',
          durationMs: 30,
        },
      ],
    };

    const output = formatHarnessResult(result);
    expect(output).toContain('Error: Network timeout');
    expect(output).toContain('1 TEST(S) FAILED');
  });
});