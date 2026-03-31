import { beforeEach, describe, expect, it, vi } from 'vitest';

const experimentalGenerateVideoMock = vi.fn();
const getVideoModelMock = vi.fn();
const getDefaultVideoModelIdMock = vi.fn();

vi.mock('ai', () => ({
  experimental_generateVideo: experimentalGenerateVideoMock,
}));

vi.mock('@/lib/provider', () => ({
  getVideoModel: getVideoModelMock,
  getDefaultVideoModelId: getDefaultVideoModelIdMock,
}));

describe('generateVideoFromPrompt', () => {
  beforeEach(() => {
    vi.resetModules();
    experimentalGenerateVideoMock.mockReset();
    getVideoModelMock.mockReset();
    getDefaultVideoModelIdMock.mockReset();
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-key';
  });

  it('returns a normalized video payload', async () => {
    const fakeVideo = {
      base64: 'ZmFrZS12aWRlby1ieXRlcw==',
      uint8Array: new Uint8Array([1, 2, 3]),
      mediaType: 'video/mp4',
    };

    getDefaultVideoModelIdMock.mockReturnValue('veo-2.0-generate-001');
    getVideoModelMock.mockReturnValue({ modelId: 'veo-2.0-generate-001' });
    experimentalGenerateVideoMock.mockResolvedValue({
      video: fakeVideo,
      videos: [fakeVideo],
      warnings: [],
      responses: [
        {
          timestamp: new Date('2026-03-30T00:00:00.000Z'),
          modelId: 'veo-2.0-generate-001',
        },
      ],
      providerMetadata: {},
    });

    const { generateVideoFromPrompt } = await import('./generate-video');
    const result = await generateVideoFromPrompt({
      prompt: 'Generate a cinematic skyline',
      modelId: 'veo-2.0-generate-001',
    });

    expect(result).toEqual({
      prompt: 'Generate a cinematic skyline',
      modelId: 'veo-2.0-generate-001',
      videoDataUrl: 'data:video/mp4;base64,ZmFrZS12aWRlby1ieXRlcw==',
      mediaType: 'video/mp4',
      response: {
        timestamp: '2026-03-30T00:00:00.000Z',
        modelId: 'veo-2.0-generate-001',
      },
      providerMetadata: {},
      warnings: [],
    });
    expect(getVideoModelMock).toHaveBeenCalledWith('veo-2.0-generate-001');
    expect(experimentalGenerateVideoMock).toHaveBeenCalledWith({
      model: { modelId: 'veo-2.0-generate-001' },
      prompt: 'Generate a cinematic skyline',
      n: 1,
      aspectRatio: '16:9',
      seed: 42,
    });
  });

  it('rejects empty prompts before the provider is called', async () => {
    const { generateVideoFromPrompt } = await import('./generate-video');

    await expect(generateVideoFromPrompt({ prompt: '   ', modelId: 'veo-2.0-generate-001' })).rejects.toThrow(
      'Prompt is required'
    );
    expect(experimentalGenerateVideoMock).not.toHaveBeenCalled();
  });

  it('fails clearly when an OpenRouter video-generation model is selected', async () => {
    const { generateVideoFromPrompt } = await import('./generate-video');

    await expect(
      generateVideoFromPrompt({ prompt: 'Generate a cinematic skyline', modelId: 'openai/sora-2-pro' })
    ).rejects.toThrow('OpenRouter video generation is still alpha and is not implemented in this app yet');
    expect(experimentalGenerateVideoMock).not.toHaveBeenCalled();
  });

  it('normalizes missing video payloads into an error', async () => {
    getDefaultVideoModelIdMock.mockReturnValue('veo-2.0-generate-001');
    getVideoModelMock.mockReturnValue({ modelId: 'veo-2.0-generate-001' });
    experimentalGenerateVideoMock.mockResolvedValue({
      video: {
        base64: '',
        uint8Array: new Uint8Array(),
        mediaType: 'video/mp4',
      },
      videos: [],
      warnings: [],
      responses: [],
      providerMetadata: {},
    });

    const { generateVideoFromPrompt } = await import('./generate-video');

    await expect(
      generateVideoFromPrompt({ prompt: 'Generate a cinematic skyline', modelId: 'veo-2.0-generate-001' })
    ).rejects.toThrow('No video was generated');
  });
});
