import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('openai-compat video', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.OPENROUTER_API_KEY = 'test-key';
  });

  it('returns b64_json video response', async () => {
    const mockResult = {
      prompt: 'A cat',
      modelId: 'alibaba/wan-2.6',
      videoDataUrl: 'data:video/mp4;base64,dmlkZW8=',
      mediaType: 'video/mp4',
      response: { timestamp: '2026-04-01T00:00:00Z', modelId: 'alibaba/wan-2.6' },
      providerMetadata: {},
      warnings: [],
    };

    vi.doMock('@/lib/generate-video', () => ({
      generateVideoFromPrompt: vi.fn().mockResolvedValue(mockResult),
    }));

    const { executeVideoGeneration, OpenAIVideoRequestSchema } = await import('./video');
    const result = await executeVideoGeneration(OpenAIVideoRequestSchema.parse({ prompt: 'A cat' }));

    expect(result.created).toBeGreaterThan(0);
    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toEqual({ b64_json: 'dmlkZW8=', revised_prompt: 'A cat' });

    vi.doUnmock('@/lib/generate-video');
  });

  it('throws when prompt is empty', async () => {
    const { OpenAIVideoRequestSchema } = await import('./video');
    expect(() => OpenAIVideoRequestSchema.parse({ prompt: '' })).toThrow();
  });

  it('rethrows when video generation fails', async () => {
    vi.doMock('@/lib/generate-video', () => ({
      generateVideoFromPrompt: vi.fn().mockRejectedValue(new Error('Unable to generate video')),
    }));

    const { executeVideoGeneration, OpenAIVideoRequestSchema } = await import('./video');
    await expect(executeVideoGeneration(OpenAIVideoRequestSchema.parse({ prompt: 'A cat' }))).rejects.toThrow('Unable to generate video');

    vi.doUnmock('@/lib/generate-video');
  });
});
