import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('openai-compat models', () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.OPENROUTER_API_KEY;
  });

  it('formats OpenRouter models as OpenAI-compatible response', async () => {
    const mockModels = [
      { id: 'openai/gpt-4o', name: 'GPT-4o', architecture: { input_modalities: ['text'], output_modalities: ['text'] } },
      { id: 'stability/sdxl', name: 'SDXL', architecture: { input_modalities: ['text'], output_modalities: ['image'] } },
    ];

    vi.doMock('@/lib/openrouter-models', () => ({
      listOpenRouterModels: vi.fn().mockResolvedValue(mockModels),
    }));

    const { listOpenAICompatModels } = await import('./models');
    const result = await listOpenAICompatModels();

    expect(result.object).toBe('list');
    expect(result.data).toHaveLength(2);
    expect(result.data[0]).toEqual({
      id: 'openai/gpt-4o',
      object: 'model',
      created: expect.any(Number),
      owned_by: 'openrouter',
    });
    expect(result.data[1]).toEqual({
      id: 'stability/sdxl',
      object: 'model',
      created: expect.any(Number),
      owned_by: 'openrouter',
    });

    vi.doUnmock('@/lib/openrouter-models');
  });

  it('returns empty list when no models are available', async () => {
    vi.doMock('@/lib/openrouter-models', () => ({
      listOpenRouterModels: vi.fn().mockResolvedValue([]),
    }));

    const { listOpenAICompatModels } = await import('./models');
    const result = await listOpenAICompatModels();

    expect(result.object).toBe('list');
    expect(result.data).toHaveLength(0);

    vi.doUnmock('@/lib/openrouter-models');
  });

  it('rethrows when OpenRouter model listing fails', async () => {
    vi.doMock('@/lib/openrouter-models', () => ({
      listOpenRouterModels: vi.fn().mockRejectedValue(new Error('OpenRouter model catalog request failed with status 500')),
    }));

    const { listOpenAICompatModels } = await import('./models');
    await expect(listOpenAICompatModels()).rejects.toThrow('OpenRouter model catalog request failed with status 500');

    vi.doUnmock('@/lib/openrouter-models');
  });
});
