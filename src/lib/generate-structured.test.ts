import { beforeEach, describe, expect, it, vi } from 'vitest';

const generateTextMock = vi.fn();

vi.mock('ai', () => ({
  Output: {
    object: vi.fn(({ schema, name, description }) => ({ schema, name, description })),
  },
  generateText: generateTextMock,
}));

describe('generateStructuredProduct', () => {
  beforeEach(() => {
    vi.resetModules();
    generateTextMock.mockReset();
    process.env.OPENROUTER_API_KEY = 'test-key';
  });

  it('returns normalized structured output', async () => {
    generateTextMock.mockResolvedValue({
      text: '{"name":"Task Prism","summary":"A compact AI workflow tracker.","price":12,"featured":true,"tags":["ai"]}',
      output: {
        name: 'Task Prism',
        summary: 'A compact AI workflow tracker.',
        price: 12,
        featured: true,
        tags: ['ai'],
      },
      response: {
        id: 'response-2',
        modelId: 'openai/gpt-4o-mini',
      },
      providerMetadata: {},
    });

    const { generateStructuredProduct } = await import('./generate-structured');
    const result = await generateStructuredProduct({
      prompt: 'Describe a product',
      schema: 'product',
    });

    expect(result).toEqual({
      schema: 'product',
      data: {
        name: 'Task Prism',
        summary: 'A compact AI workflow tracker.',
        price: 12,
        featured: true,
        tags: ['ai'],
      },
      text: '{"name":"Task Prism","summary":"A compact AI workflow tracker.","price":12,"featured":true,"tags":["ai"]}',
      modelId: 'openai/gpt-4o-mini',
      responseId: 'response-2',
      providerMetadata: {},
    });
    expect(generateTextMock).toHaveBeenCalledTimes(1);
  });

  it('rejects missing schema selections', async () => {
    const { generateStructuredProduct } = await import('./generate-structured');

    await expect(
      generateStructuredProduct({
        prompt: 'Describe a product',
        schema: '   ',
      })
    ).rejects.toThrow('Schema selection is required');
  });

  it('normalizes provider failures', async () => {
    generateTextMock.mockRejectedValue(new Error('upstream blew up'));

    const { generateStructuredProduct } = await import('./generate-structured');

    await expect(
      generateStructuredProduct({
        prompt: 'Describe a product',
        schema: 'product',
      })
    ).rejects.toThrow('upstream blew up');
  });
});
