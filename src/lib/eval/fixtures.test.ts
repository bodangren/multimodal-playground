import { describe, it, expect } from 'vitest';
import { validateFixtures, FixtureSchema } from './fixtures';

describe('FixtureSchema', () => {
  it('validates a complete text fixture', () => {
    const fixture = {
      id: 'text-hello-world',
      description: 'Basic hello world text generation',
      modality: 'text',
      input: {
        prompt: 'Say hello world',
        modelId: 'openrouter/anthropic/claude-3-haiku',
      },
      assertions: [
        { type: 'contains', value: 'hello', description: 'Output should contain hello' },
        { type: 'length', value: '10-100', description: 'Output should be reasonable length' },
      ],
      tags: ['smoke', 'text'],
      enabled: true,
    };

    const result = FixtureSchema.safeParse(fixture);
    expect(result.success).toBe(true);
  });

  it('validates a minimal fixture with defaults', () => {
    const fixture = {
      id: 'minimal-text-fixture',
      modality: 'text',
      input: {
        prompt: 'Test prompt',
      },
      assertions: [
        { type: 'contains', value: 'test' },
      ],
    };

    const result = FixtureSchema.safeParse(fixture);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.enabled).toBe(true);
      expect(result.data.tags).toBeUndefined();
    }
  });

  it('rejects fixture with no assertions', () => {
    const fixture = {
      id: 'no-assertions',
      modality: 'text',
      input: { prompt: 'Test' },
      assertions: [],
    };

    const result = FixtureSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it('rejects fixture with invalid modality', () => {
    const fixture = {
      id: 'invalid-modality',
      modality: 'audio',
      input: { prompt: 'Test' },
      assertions: [{ type: 'contains', value: 'test' }],
    };

    const result = FixtureSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });

  it('rejects fixture with empty prompt', () => {
    const fixture = {
      id: 'empty-prompt',
      modality: 'text',
      input: { prompt: '' },
      assertions: [{ type: 'contains', value: 'test' }],
    };

    const result = FixtureSchema.safeParse(fixture);
    expect(result.success).toBe(false);
  });
});

describe('validateFixtures', () => {
  it('validates an array of fixtures', () => {
    const fixtures = [
      {
        id: 'fixture-1',
        modality: 'text',
        input: { prompt: 'Test 1' },
        assertions: [{ type: 'contains', value: 'test' }],
      },
      {
        id: 'fixture-2',
        modality: 'image',
        input: { prompt: 'Test 2' },
        assertions: [{ type: 'regex', value: 'data:image' }],
      },
    ];

    const result = validateFixtures(fixtures);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('fixture-1');
    expect(result[1].id).toBe('fixture-2');
  });

  it('throws on invalid fixture data', () => {
    const invalidData = [
      {
        id: 'invalid',
        modality: 'text',
        input: { prompt: '' },
        assertions: [],
      },
    ];

    expect(() => validateFixtures(invalidData)).toThrow('Fixture validation failed');
  });

  it('rejects non-array input', () => {
    expect(() => validateFixtures({ id: 'not-array' })).toThrow();
  });
});