import { beforeEach, describe, expect, it, vi } from 'vitest';

const selectOpenRouterImageModelIdMock = vi.fn();

vi.mock('@/lib/openrouter-image-models', () => ({
  selectOpenRouterImageModelId: selectOpenRouterImageModelIdMock,
}));

describe('generateImageFromPrompt', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
    selectOpenRouterImageModelIdMock.mockReset();
    process.env.OPENROUTER_API_KEY = 'test-key';
  });

  it('returns a normalized data URL image payload from OpenRouter chat completions', async () => {
    selectOpenRouterImageModelIdMock.mockResolvedValue('black-forest-labs/flux.2-pro');

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 'resp_123',
            model: 'black-forest-labs/flux.2-pro',
            usage: {
              prompt_tokens: 10,
              completion_tokens: 20,
              total_tokens: 30,
            },
            choices: [
              {
                message: {
                  images: [
                    {
                      image_url: {
                        url: 'data:image/png;base64,ZmFrZS1pbWFnZS1ieXRlcw==',
                      },
                    },
                  ],
                },
              },
            ],
          }),
          {
            status: 200,
            headers: {
              'content-type': 'application/json',
              date: 'Tue, 31 Mar 2026 00:00:00 GMT',
            },
          }
        )
      );
    vi.stubGlobal('fetch', fetchMock);

    const { generateImageFromPrompt } = await import('./generate-image');
    const result = await generateImageFromPrompt({ prompt: 'A neon robot portrait' });

    expect(result).toEqual({
      prompt: 'A neon robot portrait',
      modelId: 'black-forest-labs/flux.2-pro',
      imageDataUrl: 'data:image/png;base64,ZmFrZS1pbWFnZS1ieXRlcw==',
      mediaType: 'image/png',
      response: {
        timestamp: '2026-03-31T00:00:00.000Z',
        modelId: 'black-forest-labs/flux.2-pro',
      },
      providerMetadata: {
        openrouter: {
          responseId: 'resp_123',
          usage: {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30,
          },
        },
      },
      warnings: [],
    });
    expect(selectOpenRouterImageModelIdMock).toHaveBeenCalledWith(undefined);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-key',
          Accept: 'application/json',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({
          model: 'black-forest-labs/flux.2-pro',
          messages: [
            {
              role: 'user',
              content: 'A neon robot portrait',
            },
          ],
          modalities: ['image'],
          image_config: {
            aspect_ratio: '16:9',
          },
          seed: 42,
        }),
      })
    );
  });

  it('rejects empty prompts before the provider is called', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { generateImageFromPrompt } = await import('./generate-image');

    await expect(generateImageFromPrompt({ prompt: '   ' })).rejects.toThrow('Prompt is required');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('normalizes missing image payloads into an error', async () => {
    selectOpenRouterImageModelIdMock.mockResolvedValue('black-forest-labs/flux.2-pro');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  images: [],
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

    const { generateImageFromPrompt } = await import('./generate-image');

    await expect(generateImageFromPrompt({ prompt: 'A neon robot portrait' })).rejects.toThrow(
      'No image was generated'
    );
  });

  it('surfaces OpenRouter error messages for image-only model requests', async () => {
    selectOpenRouterImageModelIdMock.mockResolvedValue('black-forest-labs/flux.2-pro');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: {
              message: 'No endpoints found that support the requested output modalities: image, text',
            },
          }),
          {
            status: 400,
            headers: {
              'content-type': 'application/json',
            },
          }
        )
      )
    );

    const { generateImageFromPrompt } = await import('./generate-image');

    await expect(generateImageFromPrompt({ prompt: 'A neon robot portrait' })).rejects.toThrow(
      'No endpoints found that support the requested output modalities: image, text'
    );
  });
});
