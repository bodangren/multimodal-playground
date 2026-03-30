import { beforeEach, describe, expect, it, vi } from 'vitest';

const generateVideoFromPromptMock = vi.fn();

vi.mock('@/lib/generate-video', () => ({
  generateVideoFromPrompt: generateVideoFromPromptMock,
}));

describe('POST /api/generate-video', () => {
  beforeEach(() => {
    vi.resetModules();
    generateVideoFromPromptMock.mockReset();
  });

  it('returns a normalized video payload on success', async () => {
    generateVideoFromPromptMock.mockResolvedValue({
      prompt: 'A neon city skyline',
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

    const { POST } = await import('./route');
    const response = await POST(
      new Request('http://localhost/api/generate-video', {
        method: 'POST',
        body: JSON.stringify({ prompt: 'A neon city skyline' }),
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      prompt: 'A neon city skyline',
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
  });

  it('returns a normalized error when the prompt is missing', async () => {
    const { POST } = await import('./route');
    const response = await POST(
      new Request('http://localhost/api/generate-video', {
        method: 'POST',
        body: JSON.stringify({ prompt: '   ' }),
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Prompt is required' });
  });

  it('returns a normalized error when the generated payload fails schema validation', async () => {
    generateVideoFromPromptMock.mockResolvedValue({
      prompt: 'A neon city skyline',
      modelId: 'luma/video',
      videoDataUrl: '',
      mediaType: 'video/mp4',
      response: {
        timestamp: '2026-03-30T00:00:00.000Z',
        modelId: 'luma/video',
      },
      providerMetadata: {},
      warnings: [],
    });

    const { POST } = await import('./route');
    const response = await POST(
      new Request('http://localhost/api/generate-video', {
        method: 'POST',
        body: JSON.stringify({ prompt: 'A neon city skyline' }),
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Too small: expected string to have >=1 characters',
    });
  });
});
