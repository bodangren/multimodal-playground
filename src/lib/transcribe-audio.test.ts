import { beforeEach, describe, expect, it, vi } from 'vitest';

const getDefaultTranscriptionModelIdMock = vi.fn();

vi.mock('@/lib/provider', async () => {
  const actual = await vi.importActual<typeof import('@/lib/provider')>('@/lib/provider');

  return {
    ...actual,
    getDefaultTranscriptionModelId: getDefaultTranscriptionModelIdMock,
  };
});

describe('transcribeAudio', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
    getDefaultTranscriptionModelIdMock.mockReset();
    process.env.OPENROUTER_API_KEY = 'test-key';
  });

  it('returns normalized transcription output from OpenRouter chat completions', async () => {
    getDefaultTranscriptionModelIdMock.mockReturnValue('openrouter/free');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            id: 'resp_123',
            model: 'openrouter/free',
            usage: {
              prompt_tokens: 10,
              completion_tokens: 5,
              total_tokens: 15,
            },
            choices: [
              {
                message: {
                  content: 'Hello world',
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
      )
    );

    const { transcribeAudio } = await import('./transcribe-audio');
    const result = await transcribeAudio({
      audio: Buffer.from('fake-audio'),
      mediaType: 'audio/mpeg',
    });

    expect(result).toEqual({
      text: 'Hello world',
      segments: [],
      language: undefined,
      durationInSeconds: undefined,
      modelId: 'openrouter/free',
      response: {
        timestamp: '2026-03-31T00:00:00.000Z',
        modelId: 'openrouter/free',
      },
      providerMetadata: {
        openrouter: {
          responseId: 'resp_123',
          usage: {
            prompt_tokens: 10,
            completion_tokens: 5,
            total_tokens: 15,
          },
        },
      },
      warnings: [],
    });
  });

  it('rejects empty audio inputs before the provider is called', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { transcribeAudio } = await import('./transcribe-audio');

    await expect(
      transcribeAudio({
        audio: Buffer.from(''),
        mediaType: 'audio/mpeg',
      })
    ).rejects.toThrow('Audio data is required');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('normalizes missing transcription text into an error', async () => {
    getDefaultTranscriptionModelIdMock.mockReturnValue('openrouter/free');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: '',
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

    const { transcribeAudio } = await import('./transcribe-audio');

    await expect(
      transcribeAudio({
        audio: Buffer.from('fake-audio'),
        mediaType: 'audio/mpeg',
      })
    ).rejects.toThrow('No transcript was generated');
  });
});
