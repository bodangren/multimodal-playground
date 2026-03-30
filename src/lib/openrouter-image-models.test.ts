import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('openrouter image model discovery', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
    process.env.OPENROUTER_API_KEY = 'test-key';
  });

  it('filters image-capable models from the OpenRouter catalog', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [
            {
              id: 'openai/gpt-4o-mini',
              architecture: {
                output_modalities: ['text'],
              },
            },
            {
              id: 'black-forest-labs/flux-schnell',
              architecture: {
                output_modalities: ['image'],
              },
            },
          ],
        }),
        {
          status: 200,
          headers: {
            'content-type': 'application/json',
          },
        }
      )
    );
    vi.stubGlobal('fetch', fetchMock);

    const { listOpenRouterImageModels } = await import('./openrouter-image-models');
    const models = await listOpenRouterImageModels();

    expect(models).toEqual([
      {
        id: 'black-forest-labs/flux-schnell',
        architecture: {
          output_modalities: ['image'],
        },
      },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/models',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-key',
        }),
      })
    );
  });

  it('falls back to the first supported image model when the preferred model is not image-capable', async () => {
    const { resolveImageModelId } = await import('./openrouter-image-models');

    expect(
      resolveImageModelId(
        [
          {
            id: 'openai/gpt-4o-mini',
            architecture: {
              output_modalities: ['text'],
            },
          },
          {
            id: 'black-forest-labs/flux-schnell',
            architecture: {
              output_modalities: ['image'],
            },
          },
        ],
        { preferredModelId: 'openai/gpt-4o-mini' }
      )
    ).toBe('black-forest-labs/flux-schnell');
  });

  it('rejects unsupported image model selections when fallback is disabled', async () => {
    const { resolveImageModelId } = await import('./openrouter-image-models');

    expect(() =>
      resolveImageModelId(
        [
          {
            id: 'openai/gpt-4o-mini',
            architecture: {
              output_modalities: ['text'],
            },
          },
        ],
        { preferredModelId: 'openai/gpt-4o-mini', allowFallback: false }
      )
    ).toThrow('Model openai/gpt-4o-mini does not support image generation');
  });

  it('falls back to the first image-capable model when no preferred model is supplied', async () => {
    const { selectOpenRouterImageModelId } = await import('./openrouter-image-models');

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: [
              {
                id: 'openai/gpt-4o-mini',
                architecture: {
                  output_modalities: ['text'],
                },
              },
              {
                id: 'black-forest-labs/flux-schnell',
                architecture: {
                  output_modalities: ['image'],
                },
              },
            ],
          }),
          {
            status: 200,
            headers: {
              'content-type': 'application/json',
            },
          }
        )
      )
    );

    await expect(selectOpenRouterImageModelId()).resolves.toBe('black-forest-labs/flux-schnell');
  });

  it('normalizes OpenRouter catalog failures', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('nope', {
        status: 500,
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const { listOpenRouterModels } = await import('./openrouter-image-models');

    await expect(listOpenRouterModels()).rejects.toThrow('OpenRouter model catalog request failed with status 500');
  });
});
