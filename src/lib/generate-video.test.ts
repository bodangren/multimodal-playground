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

    getDefaultVideoModelIdMock.mockReturnValue('video-model-default');
    getVideoModelMock.mockReturnValue({ modelId: 'luma/video' });
    experimentalGenerateVideoMock.mockResolvedValue({
      video: fakeVideo,
      videos: [fakeVideo],
      warnings: [],
      responses: [
        {
          timestamp: new Date('2026-03-30T00:00:00.000Z'),
          modelId: 'luma/video',
        },
      ],
      providerMetadata: {},
    });

    const { generateVideoFromPrompt } = await import('./generate-video');
    const result = await generateVideoFromPrompt({
      prompt: 'Generate a cinematic skyline',
      modelId: 'luma/video',
    });

    expect(result).toEqual({
      prompt: 'Generate a cinematic skyline',
      modelId: 'luma/video',
      videoDataUrl: 'data:video/mp4;base64,ZmFrZS12aWRlby1ieXRlcw==',
      mediaType: 'video/mp4',
      response: {
        timestamp: '2026-03-30T00:00:00.000Z',
        modelId: 'luma/video',
      },
      providerMetadata: {},
      warnings: [],
    });
    expect(getVideoModelMock).toHaveBeenCalledWith('luma/video');
    expect(experimentalGenerateVideoMock).toHaveBeenCalledWith({
      model: { modelId: 'luma/video' },
      prompt: 'Generate a cinematic skyline',
      n: 1,
      aspectRatio: '16:9',
      seed: 42,
    });
  });

  it('rejects empty prompts before the provider is called', async () => {
    const { generateVideoFromPrompt } = await import('./generate-video');

    await expect(generateVideoFromPrompt({ prompt: '   ', modelId: 'luma/video' })).rejects.toThrow('Prompt is required');
    expect(experimentalGenerateVideoMock).not.toHaveBeenCalled();
  });

  it('normalizes missing video payloads into an error', async () => {
    getDefaultVideoModelIdMock.mockReturnValue('video-model-default');
    getVideoModelMock.mockReturnValue({ modelId: 'luma/video' });
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

    await expect(generateVideoFromPrompt({ prompt: 'Generate a cinematic skyline', modelId: 'luma/video' })).rejects.toThrow(
      'No video was generated'
    );
  });
});
