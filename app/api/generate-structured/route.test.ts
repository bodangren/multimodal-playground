import { beforeEach, describe, expect, it, vi } from 'vitest';

const generateStructuredProductMock = vi.fn();

vi.mock('@/lib/generate-structured', () => ({
  generateStructuredProduct: generateStructuredProductMock,
}));

describe('POST /api/generate-structured', () => {
  beforeEach(() => {
    vi.resetModules();
    generateStructuredProductMock.mockReset();
  });

  it('returns normalized structured data on success', async () => {
    generateStructuredProductMock.mockResolvedValue({
      schema: 'product',
      data: {
        name: 'Task Prism',
        summary: 'A compact AI workflow tracker.',
        price: 12,
        featured: true,
        tags: ['ai'],
      },
      text: 'Structured output',
      modelId: 'openai/gpt-4o-mini',
      responseId: 'response-2',
      providerMetadata: {},
    });

    const { POST } = await import('./route');
    const response = await POST(
      new Request('http://localhost/api/generate-structured', {
        method: 'POST',
        body: JSON.stringify({ prompt: 'Describe a product', schema: 'product' }),
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      schema: 'product',
      data: {
        name: 'Task Prism',
        summary: 'A compact AI workflow tracker.',
        price: 12,
        featured: true,
        tags: ['ai'],
      },
      text: 'Structured output',
      modelId: 'openai/gpt-4o-mini',
      responseId: 'response-2',
      providerMetadata: {},
    });
  });

  it('returns a normalized error when the generated payload fails schema validation', async () => {
    generateStructuredProductMock.mockResolvedValue({
      schema: 'product',
      data: {
        name: 'Task Prism',
        summary: '',
        price: 12,
        featured: true,
        tags: ['ai'],
      },
      text: 'Structured output',
      modelId: 'openai/gpt-4o-mini',
      responseId: 'response-2',
      providerMetadata: {},
    });

    const { POST } = await import('./route');
    const response = await POST(
      new Request('http://localhost/api/generate-structured', {
        method: 'POST',
        body: JSON.stringify({ prompt: 'Describe a product', schema: 'product' }),
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Too small: expected string to have >=1 characters' });
  });

  it('returns a normalized error when the schema selection is missing', async () => {
    const { POST } = await import('./route');
    const response = await POST(
      new Request('http://localhost/api/generate-structured', {
        method: 'POST',
        body: JSON.stringify({ prompt: 'Describe a product', schema: '   ' }),
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Schema selection is required' });
  });
});
