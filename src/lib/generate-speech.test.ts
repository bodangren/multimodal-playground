import { beforeEach, describe, expect, it, vi } from 'vitest';

const getDefaultSpeechModelIdMock = vi.fn();

vi.mock('@/lib/provider', async () => {
  const actual = await vi.importActual<typeof import('@/lib/provider')>('@/lib/provider');

  return {
    ...actual,
    getDefaultSpeechModelId: getDefaultSpeechModelIdMock,
  };
});

describe('generateSpeechFromText', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
    getDefaultSpeechModelIdMock.mockReset();
    process.env.OPENROUTER_API_KEY = 'test-key';
  });

  it('returns a normalized speech payload from OpenRouter audio streaming chunks', async () => {
    getDefaultSpeechModelIdMock.mockReturnValue('alibaba/wan-2.6');

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode(
            'data: {"id":"resp_123","model":"alibaba/wan-2.6","choices":[{"delta":{"audio":{"data":"ZmFrZS1h","transcript":"Hello "}}}]}\n\n'
          )
        );
        controller.enqueue(
          new TextEncoder().encode(
            'data: {"choices":[{"delta":{"audio":{"data":"dWRpbw==","transcript":"there"}}}]}\n\n'
          )
        );
        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(stream, {
          status: 200,
          headers: {
            date: 'Tue, 31 Mar 2026 00:00:00 GMT',
          },
        })
      )
    );

    const { generateSpeechFromText } = await import('./generate-speech');
    const result = await generateSpeechFromText({
      text: 'Hello there',
      voice: 'alloy',
    });

    expect(result).toEqual({
      text: 'Hello there',
      voice: 'alloy',
      modelId: 'alibaba/wan-2.6',
      audioDataUrl: 'data:audio/mpeg;base64,ZmFrZS1hdWRpbw==',
      mediaType: 'audio/mpeg',
      response: {
        timestamp: '2026-03-31T00:00:00.000Z',
        modelId: 'alibaba/wan-2.6',
      },
      providerMetadata: {
        openrouter: {
          responseId: 'resp_123',
        },
      },
      warnings: [],
    });
  });

  it('rejects empty text before the provider is called', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { generateSpeechFromText } = await import('./generate-speech');

    await expect(generateSpeechFromText({ text: '   ' })).rejects.toThrow('Text is required');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('normalizes missing audio payloads into an error', async () => {
    getDefaultSpeechModelIdMock.mockReturnValue('alibaba/wan-2.6');

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode(
            'data: {"id":"resp_123","model":"alibaba/wan-2.6","choices":[{"delta":{"audio":{"transcript":"Hello there"}}}]}\n\n'
          )
        );
        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(stream, {
          status: 200,
        })
      )
    );

    const { generateSpeechFromText } = await import('./generate-speech');

    await expect(generateSpeechFromText({ text: 'Hello there' })).rejects.toThrow('No audio was generated');
  });
});
