import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('openrouter image model discovery', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
    process.env.OPENROUTER_API_KEY = 'test-key';
  });

  it('filters text-to-image models from the OpenRouter catalog', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [
            {
              id: 'black-forest-labs/flux.2-pro',
              architecture: {
                input_modalities: ['text', 'image'],
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
        id: 'black-forest-labs/flux.2-pro',
        architecture: {
          input_modalities: ['text', 'image'],
          output_modalities: ['image'],
        },
      },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/models?input_modalities=text&output_modalities=image',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-key',
        }),
      })
    );
  });

  it('falls back to the first supported image model when the preferred model is not text-to-image capable', async () => {
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
            id: 'black-forest-labs/flux.2-pro',
            architecture: {
              input_modalities: ['text', 'image'],
              output_modalities: ['image'],
            },
          },
        ],
        { preferredModelId: 'openai/gpt-4o-mini' }
      )
    ).toBe('black-forest-labs/flux.2-pro');
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

  it('falls back to the first text-to-image capable model when no preferred model is supplied', async () => {
    const { selectOpenRouterImageModelId } = await import('./openrouter-image-models');

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: [
              {
                id: 'black-forest-labs/flux.2-pro',
                architecture: {
                  input_modalities: ['text', 'image'],
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

    await expect(selectOpenRouterImageModelId()).resolves.toBe('black-forest-labs/flux.2-pro');
  });

  it('accepts image-only output models when they take text input', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: [
              {
                id: 'text-to-image/model',
                architecture: {
                  input_modalities: ['text'],
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

    const { listOpenRouterImageModels } = await import('./openrouter-image-models');

    await expect(listOpenRouterImageModels()).resolves.toEqual([
      {
        id: 'text-to-image/model',
        architecture: {
          input_modalities: ['text'],
          output_modalities: ['image'],
        },
      },
    ]);
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
