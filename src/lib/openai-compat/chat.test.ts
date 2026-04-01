import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('openai-compat chat', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.OPENROUTER_API_KEY = 'test-key';
  });

  it('builds OpenAI response for text-only messages', async () => {
    const mockResult = {
      text: 'Hello world',
      response: { id: 'resp-123', modelId: 'openai/gpt-4o' },
      usage: { inputTokens: 10, outputTokens: 5 },
      warnings: [],
    };

    vi.doMock('ai', () => ({
      generateText: vi.fn().mockResolvedValue(mockResult),
      Output: {
        object: vi.fn().mockReturnValue({}),
      },
    }));

    const { executeChatCompletion } = await import('./chat');
    const result = await executeChatCompletion({
      messages: [{ role: 'user', content: 'Say hello' }],
    });

    expect(result.object).toBe('chat.completion');
    expect(result.choices).toHaveLength(1);
    expect(result.choices[0].message.content).toBe('Hello world');
    expect(result.choices[0].finish_reason).toBe('stop');
    expect(result.model).toBe('openai/gpt-4o');
    expect(result.usage).toEqual({
      prompt_tokens: 10,
      completion_tokens: 5,
      total_tokens: 15,
    });

    vi.doUnmock('ai');
  });

  it('uses structured output when response_format has json_schema', async () => {
    const mockResult = {
      text: '{"name": "test"}',
      output: { name: 'test' },
      response: { id: 'resp-456', modelId: 'openai/gpt-4o' },
      usage: { inputTokens: 20, outputTokens: 10 },
      warnings: [],
    };

    vi.doMock('ai', () => ({
      generateText: vi.fn().mockResolvedValue(mockResult),
      Output: {
        object: vi.fn().mockReturnValue({}),
      },
    }));

    const { executeChatCompletion } = await import('./chat');
    const result = await executeChatCompletion({
      messages: [{ role: 'user', content: 'Generate a product' }],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'product',
          schema: { type: 'object', properties: { name: { type: 'string' } } },
        },
      },
    });

    expect(result.choices[0].message.content).toBe('{"name":"test"}');

    vi.doUnmock('ai');
  });

  it('throws when messages array is empty', async () => {
    const { executeChatCompletion } = await import('./chat');
    await expect(executeChatCompletion({ messages: [] })).rejects.toThrow();
  });

  it('uses default model when model is not specified', async () => {
    const mockResult = {
      text: 'Hi',
      response: { id: 'resp-789', modelId: 'openrouter/free' },
      usage: null,
      warnings: [],
    };

    vi.doMock('ai', () => ({
      generateText: vi.fn().mockResolvedValue(mockResult),
      Output: {
        object: vi.fn().mockReturnValue({}),
      },
    }));

    const { executeChatCompletion } = await import('./chat');
    const result = await executeChatCompletion({
      messages: [{ role: 'user', content: 'Hi' }],
    });

    expect(result.model).toBe('openrouter/free');

    vi.doUnmock('ai');
  });

  it('handles system messages', async () => {
    const mockResult = {
      text: 'Response',
      response: { id: 'resp-sys', modelId: 'openai/gpt-4o' },
      usage: null,
      warnings: [],
    };

    vi.doMock('ai', () => ({
      generateText: vi.fn().mockResolvedValue(mockResult),
      Output: {
        object: vi.fn().mockReturnValue({}),
      },
    }));

    const { executeChatCompletion } = await import('./chat');
    const result = await executeChatCompletion({
      messages: [
        { role: 'system', content: 'You are helpful' },
        { role: 'user', content: 'Hi' },
      ],
    });

    expect(result.choices[0].message.content).toBe('Response');

    vi.doUnmock('ai');
  });
});
