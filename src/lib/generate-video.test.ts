import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/provider', () => ({
  getOpenRouterApiUrl: vi.fn((path: string) => `https://openrouter.ai/api/v1${path}`),
  getOpenRouterAuthHeaders: vi.fn(() => ({ Authorization: 'Bearer test-key' })),
  getDefaultVideoModelId: vi.fn(() => 'alibaba/wan-2.6'),
}));

describe('generateVideoFromPrompt', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns a normalized video payload from an OpenRouter video response', async () => {
    const fakeVideoUrl = 'data:video/mp4;base64,ZmFrZS12aWRlby1ieXRlcw==';

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 'gen-abc123',
          model: 'alibaba/wan-2.6',
          usage: { prompt_tokens: 10, completion_tokens: 0, total_tokens: 10 },
          choices: [
            {
              message: {
                videos: [{ video_url: { url: fakeVideoUrl } }],
              },
            },
          ],
        }),
        {
          status: 200,
          headers: {
            'content-type': 'application/json',
            date: 'Mon, 31 Mar 2026 00:00:00 GMT',
          },
        }
      )
    );
    vi.stubGlobal('fetch', fetchMock);

    const { generateVideoFromPrompt } = await import('./generate-video');
    const result = await generateVideoFromPrompt({
      prompt: 'Generate a cinematic skyline',
      modelId: 'alibaba/wan-2.6',
    });

    expect(result).toEqual({
      prompt: 'Generate a cinematic skyline',
      modelId: 'alibaba/wan-2.6',
      videoDataUrl: 'data:video/mp4;base64,ZmFrZS12aWRlby1ieXRlcw==',
      mediaType: 'video/mp4',
      response: {
        timestamp: '2026-03-31T00:00:00.000Z',
        modelId: 'alibaba/wan-2.6',
      },
      providerMetadata: {
        openrouter: {
          responseId: 'gen-abc123',
          usage: { prompt_tokens: 10, completion_tokens: 0, total_tokens: 10 },
        },
      },
      warnings: [],
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          model: 'alibaba/wan-2.6',
          messages: [{ role: 'user', content: 'Generate a cinematic skyline' }],
          modalities: ['video'],
        }),
      })
    );
  });

  it('rejects empty prompts before the provider is called', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { generateVideoFromPrompt } = await import('./generate-video');

    await expect(generateVideoFromPrompt({ prompt: '   ' })).rejects.toThrow('Prompt is required');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('normalizes missing video payloads into an error', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 'gen-empty',
          model: 'alibaba/wan-2.6',
          choices: [{ message: { videos: [] } }],
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }
      )
    );
    vi.stubGlobal('fetch', fetchMock);

    const { generateVideoFromPrompt } = await import('./generate-video');

    await expect(
      generateVideoFromPrompt({ prompt: 'Generate a cinematic skyline' })
    ).rejects.toThrow('No video was generated');
  });

  it('surfaces OpenRouter error messages', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: { message: 'Model is overloaded' },
        }),
        {
          status: 503,
          headers: { 'content-type': 'application/json' },
        }
      )
    );
    vi.stubGlobal('fetch', fetchMock);

    const { generateVideoFromPrompt } = await import('./generate-video');

    await expect(
      generateVideoFromPrompt({ prompt: 'Generate a cinematic skyline' })
    ).rejects.toThrow('Model is overloaded');
  });

  it('fetches remote video URLs and converts to data URLs', async () => {
    const videoBytes = Buffer.from('fake-remote-video');

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 'gen-remote',
            model: 'alibaba/wan-2.6',
            choices: [
              {
                message: {
                  videos: [{ video_url: { url: 'https://cdn.example.com/video.mp4' } }],
                },
              },
            ],
          }),
          {
            status: 200,
            headers: {
              'content-type': 'application/json',
              date: 'Mon, 31 Mar 2026 00:00:00 GMT',
            },
          }
        )
      )
      .mockResolvedValueOnce(
        new Response(videoBytes, {
          status: 200,
          headers: { 'content-type': 'video/mp4' },
        })
      );
    vi.stubGlobal('fetch', fetchMock);

    const { generateVideoFromPrompt } = await import('./generate-video');
    const result = await generateVideoFromPrompt({ prompt: 'A remote video test' });

    expect(result.mediaType).toBe('video/mp4');
    expect(result.videoDataUrl).toBe(
      `data:video/mp4;base64,${videoBytes.toString('base64')}`
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenLastCalledWith('https://cdn.example.com/video.mp4');
  });
});
