import { beforeEach, describe, expect, it, vi } from 'vitest';

const generateSpeechFromTextMock = vi.fn();

vi.mock('@/lib/generate-speech', () => ({
  generateSpeechFromText: generateSpeechFromTextMock,
}));

describe('POST /api/generate-speech', () => {
  beforeEach(() => {
    vi.resetModules();
    generateSpeechFromTextMock.mockReset();
  });

  it('returns a normalized speech payload on success', async () => {
    generateSpeechFromTextMock.mockResolvedValue({
      text: 'Hello there',
      voice: 'alloy',
      modelId: 'openai/tts-1',
      audioDataUrl: 'data:audio/mpeg;base64,ZmFrZS1hdWRpbw==',
      mediaType: 'audio/mpeg',
      response: {
        timestamp: '2026-03-30T00:00:00.000Z',
        modelId: 'openai/tts-1',
      },
      providerMetadata: {},
      warnings: [],
    });

    const { POST } = await import('./route');
    const response = await POST(
      new Request('http://localhost/api/generate-speech', {
        method: 'POST',
        body: JSON.stringify({ text: 'Hello there', voice: 'alloy' }),
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      text: 'Hello there',
      voice: 'alloy',
      modelId: 'openai/tts-1',
      audioDataUrl: 'data:audio/mpeg;base64,ZmFrZS1hdWRpbw==',
      mediaType: 'audio/mpeg',
      response: {
        timestamp: '2026-03-30T00:00:00.000Z',
        modelId: 'openai/tts-1',
      },
      providerMetadata: {},
      warnings: [],
    });
  });

  it('returns a normalized error when text input is missing', async () => {
    const { POST } = await import('./route');
    const response = await POST(
      new Request('http://localhost/api/generate-speech', {
        method: 'POST',
        body: JSON.stringify({ text: '   ' }),
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Text is required' });
  });

  it('returns a normalized error when the generated payload fails schema validation', async () => {
    generateSpeechFromTextMock.mockResolvedValue({
      text: 'Hello there',
      voice: 'alloy',
      modelId: 'openai/tts-1',
      audioDataUrl: '',
      mediaType: 'audio/mpeg',
      response: {
        timestamp: '2026-03-30T00:00:00.000Z',
        modelId: 'openai/tts-1',
      },
      providerMetadata: {},
      warnings: [],
    });

    const { POST } = await import('./route');
    const response = await POST(
      new Request('http://localhost/api/generate-speech', {
        method: 'POST',
        body: JSON.stringify({ text: 'Hello there', voice: 'alloy' }),
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Too small: expected string to have >=1 characters',
    });
  });
});
