import { beforeEach, describe, expect, it, vi } from 'vitest';

const experimentalGenerateImageMock = vi.fn();
const selectOpenRouterImageModelIdMock = vi.fn();
const getImageModelMock = vi.fn();

vi.mock('ai', () => ({
  experimental_generateImage: experimentalGenerateImageMock,
}));

vi.mock('@/lib/openrouter-image-models', () => ({
  selectOpenRouterImageModelId: selectOpenRouterImageModelIdMock,
}));

vi.mock('@/lib/provider', () => ({
  getImageModel: getImageModelMock,
}));

describe('generateImageFromPrompt', () => {
  beforeEach(() => {
    vi.resetModules();
    experimentalGenerateImageMock.mockReset();
    selectOpenRouterImageModelIdMock.mockReset();
    getImageModelMock.mockReset();
    process.env.OPENROUTER_API_KEY = 'test-key';
  });

  it('returns a normalized data URL image payload', async () => {
    selectOpenRouterImageModelIdMock.mockResolvedValue('black-forest-labs/flux-schnell');
    getImageModelMock.mockReturnValue({ modelId: 'black-forest-labs/flux-schnell' });
    experimentalGenerateImageMock.mockResolvedValue({
      image: {
        base64: 'ZmFrZS1pbWFnZS1ieXRlcw==',
        mediaType: 'image/png',
      },
      images: [
        {
          base64: 'ZmFrZS1pbWFnZS1ieXRlcw==',
          mediaType: 'image/png',
        },
      ],
      warnings: [],
      responses: [
        {
          timestamp: new Date('2026-03-30T00:00:00.000Z'),
          modelId: 'black-forest-labs/flux-schnell',
        },
      ],
      providerMetadata: {},
      usage: {},
    });

    const { generateImageFromPrompt } = await import('./generate-image');
    const result = await generateImageFromPrompt({ prompt: 'A neon robot portrait' });

    expect(result).toEqual({
      prompt: 'A neon robot portrait',
      modelId: 'black-forest-labs/flux-schnell',
      imageDataUrl: 'data:image/png;base64,ZmFrZS1pbWFnZS1ieXRlcw==',
      mediaType: 'image/png',
      response: {
        timestamp: '2026-03-30T00:00:00.000Z',
        modelId: 'black-forest-labs/flux-schnell',
      },
      providerMetadata: {},
      warnings: [],
    });
    expect(selectOpenRouterImageModelIdMock).toHaveBeenCalledTimes(1);
    expect(getImageModelMock).toHaveBeenCalledWith('black-forest-labs/flux-schnell');
    expect(experimentalGenerateImageMock).toHaveBeenCalledWith({
      model: { modelId: 'black-forest-labs/flux-schnell' },
      prompt: 'A neon robot portrait',
      n: 1,
      aspectRatio: '16:9',
      seed: 42,
    });
  });

  it('rejects empty prompts before the provider is called', async () => {
    const { generateImageFromPrompt } = await import('./generate-image');

    await expect(generateImageFromPrompt({ prompt: '   ' })).rejects.toThrow('Prompt is required');
    expect(experimentalGenerateImageMock).not.toHaveBeenCalled();
  });

  it('normalizes missing image payloads into an error', async () => {
    selectOpenRouterImageModelIdMock.mockResolvedValue('black-forest-labs/flux-schnell');
    getImageModelMock.mockReturnValue({ modelId: 'black-forest-labs/flux-schnell' });
    experimentalGenerateImageMock.mockResolvedValue({
      image: {
        base64: '',
        mediaType: 'image/png',
      },
      images: [],
      warnings: [],
      responses: [],
      providerMetadata: {},
      usage: {},
    });

    const { generateImageFromPrompt } = await import('./generate-image');

    await expect(generateImageFromPrompt({ prompt: 'A neon robot portrait' })).rejects.toThrow(
      'No image was generated'
    );
  });
});
