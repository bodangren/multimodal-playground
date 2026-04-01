import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('openai-compat images', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.OPENROUTER_API_KEY = 'test-key';
  });

  it('returns b64_json response by default', async () => {
    const mockResult = {
      prompt: 'A cat',
      modelId: 'stability/sdxl',
      imageDataUrl: 'data:image/png;base64,abc123',
      mediaType: 'image/png',
      response: { timestamp: '2026-04-01T00:00:00Z', modelId: 'stability/sdxl' },
      providerMetadata: {},
      warnings: [],
    };

    vi.doMock('@/lib/generate-image', () => ({
      generateImageFromPrompt: vi.fn().mockResolvedValue(mockResult),
    }));

    const { executeImageGeneration, OpenAIImageRequestSchema } = await import('./images');
    const result = await executeImageGeneration(OpenAIImageRequestSchema.parse({ prompt: 'A cat' }));

    expect(result.created).toBeGreaterThan(0);
    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toEqual({ b64_json: 'abc123' });

    vi.doUnmock('@/lib/generate-image');
  });

  it('returns url response when response_format is url', async () => {
    const mockResult = {
      prompt: 'A cat',
      modelId: 'stability/sdxl',
      imageDataUrl: 'data:image/png;base64,abc123',
      mediaType: 'image/png',
      response: { timestamp: '2026-04-01T00:00:00Z', modelId: 'stability/sdxl' },
      providerMetadata: {},
      warnings: [],
    };

    vi.doMock('@/lib/generate-image', () => ({
      generateImageFromPrompt: vi.fn().mockResolvedValue(mockResult),
    }));

    const { executeImageGeneration, OpenAIImageRequestSchema } = await import('./images');
    const result = await executeImageGeneration(OpenAIImageRequestSchema.parse({ prompt: 'A cat', response_format: 'url' }));

    expect(result.data[0]).toEqual({ url: 'data:image/png;base64,abc123' });

    vi.doUnmock('@/lib/generate-image');
  });

  it('throws when prompt is empty', async () => {
    const { OpenAIImageRequestSchema } = await import('./images');
    expect(() => OpenAIImageRequestSchema.parse({ prompt: '' })).toThrow();
  });

  it('rethrows when image generation fails', async () => {
    vi.doMock('@/lib/generate-image', () => ({
      generateImageFromPrompt: vi.fn().mockRejectedValue(new Error('Unable to generate image')),
    }));

    const { executeImageGeneration, OpenAIImageRequestSchema } = await import('./images');
    await expect(executeImageGeneration(OpenAIImageRequestSchema.parse({ prompt: 'A cat' }))).rejects.toThrow('Unable to generate image');

    vi.doUnmock('@/lib/generate-image');
  });
});
