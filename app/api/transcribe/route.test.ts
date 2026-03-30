import { beforeEach, describe, expect, it, vi } from 'vitest';

const transcribeAudioMock = vi.fn();

vi.mock('@/lib/transcribe-audio', () => ({
  transcribeAudio: transcribeAudioMock,
}));

describe('POST /api/transcribe', () => {
  beforeEach(() => {
    vi.resetModules();
    transcribeAudioMock.mockReset();
  });

  it('returns a normalized transcription payload on success', async () => {
    transcribeAudioMock.mockResolvedValue({
      text: 'Hello world',
      segments: [],
      language: 'en',
      durationInSeconds: 12,
      modelId: 'openai/whisper-1',
      response: {
        timestamp: '2026-03-30T00:00:00.000Z',
        modelId: 'openai/whisper-1',
      },
      providerMetadata: {},
      warnings: [],
    });

    const formData = new FormData();
    formData.set(
      'audio',
      new File([new Uint8Array([1, 2, 3])], 'sample.mp3', { type: 'audio/mpeg' })
    );

    const { POST } = await import('./route');
    const response = await POST(
      new Request('http://localhost/api/transcribe', {
        method: 'POST',
        body: formData,
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      text: 'Hello world',
      segments: [],
      language: 'en',
      durationInSeconds: 12,
      modelId: 'openai/whisper-1',
      response: {
        timestamp: '2026-03-30T00:00:00.000Z',
        modelId: 'openai/whisper-1',
      },
      providerMetadata: {},
      warnings: [],
    });
  });

  it('returns a normalized error when the audio file is missing', async () => {
    const formData = new FormData();

    const { POST } = await import('./route');
    const response = await POST(
      new Request('http://localhost/api/transcribe', {
        method: 'POST',
        body: formData,
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Audio file is required' });
  });

  it('returns a normalized error when the media type is invalid', async () => {
    const formData = new FormData();
    formData.set('audio', new File([new Uint8Array([1, 2])], 'sample.txt', { type: 'text/plain' }));

    const { POST } = await import('./route');
    const response = await POST(
      new Request('http://localhost/api/transcribe', {
        method: 'POST',
        body: formData,
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Unsupported audio media type' });
  });

  it('returns a normalized error when the generated payload fails schema validation', async () => {
    transcribeAudioMock.mockResolvedValue({
      text: '',
      segments: [],
      language: 'en',
      durationInSeconds: 12,
      modelId: 'openai/whisper-1',
      response: {
        timestamp: '2026-03-30T00:00:00.000Z',
        modelId: 'openai/whisper-1',
      },
      providerMetadata: {},
      warnings: [],
    });

    const formData = new FormData();
    formData.set(
      'audio',
      new File([new Uint8Array([1, 2, 3])], 'sample.mp3', { type: 'audio/mpeg' })
    );

    const { POST } = await import('./route');
    const response = await POST(
      new Request('http://localhost/api/transcribe', {
        method: 'POST',
        body: formData,
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Too small: expected string to have >=1 characters',
    });
  });
});
