import { beforeEach, describe, expect, it, vi } from 'vitest';

const generateImageFromPromptMock = vi.fn();

vi.mock('@/lib/generate-image', () => ({
  generateImageFromPrompt: generateImageFromPromptMock,
}));

describe('POST /api/generate-image', () => {
  beforeEach(() => {
    vi.resetModules();
    generateImageFromPromptMock.mockReset();
  });

  it('returns a normalized image payload on success', async () => {
    generateImageFromPromptMock.mockResolvedValue({
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

    const { POST } = await import('./route');
    const response = await POST(
      new Request('http://localhost/api/generate-image', {
        method: 'POST',
        body: JSON.stringify({ prompt: 'A neon robot portrait' }),
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
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
  });

  it('returns a normalized error when the prompt is missing', async () => {
    const { POST } = await import('./route');
    const response = await POST(
      new Request('http://localhost/api/generate-image', {
        method: 'POST',
        body: JSON.stringify({ prompt: '   ' }),
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Prompt is required' });
  });
});
