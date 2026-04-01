import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('openai-compat audio speech', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.OPENROUTER_API_KEY = 'test-key';
  });

  it('returns audio buffer with correct content type', async () => {
    const mockResult = {
      text: 'Hello',
      voice: 'alloy',
      modelId: 'alibaba/wan-2.6',
      audioDataUrl: 'data:audio/mpeg;base64,aGVsbG8=',
      mediaType: 'audio/mpeg',
      response: { timestamp: '2026-04-01T00:00:00Z', modelId: 'alibaba/wan-2.6' },
      providerMetadata: {},
      warnings: [],
    };

    vi.doMock('@/lib/generate-speech', () => ({
      generateSpeechFromText: vi.fn().mockResolvedValue(mockResult),
    }));

    const { executeSpeechGeneration, OpenAISpeechRequestSchema } = await import('./audio');
    const result = await executeSpeechGeneration(OpenAISpeechRequestSchema.parse({ input: 'Hello world' }));

    expect(result.audioBuffer).toBeInstanceOf(Buffer);
    expect(result.contentType).toBe('audio/mpeg');

    vi.doUnmock('@/lib/generate-speech');
  });

  it('throws when input is empty', async () => {
    const { OpenAISpeechRequestSchema } = await import('./audio');
    expect(() => OpenAISpeechRequestSchema.parse({ input: '' })).toThrow();
  });
});

describe('openai-compat audio transcription', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.OPENROUTER_API_KEY = 'test-key';
  });

  it('returns transcript as JSON by default', async () => {
    const mockResult = {
      text: 'Hello world',
      segments: [],
      language: undefined,
      durationInSeconds: 5,
      modelId: 'openrouter/free',
      response: { timestamp: '2026-04-01T00:00:00Z', modelId: 'openrouter/free' },
      providerMetadata: {},
      warnings: [],
    };

    vi.doMock('@/lib/transcribe-audio', () => ({
      transcribeAudio: vi.fn().mockResolvedValue(mockResult),
    }));

    const { executeTranscription, OpenAITranscriptionRequestSchema } = await import('./audio');
    const result = await executeTranscription({
      fileBuffer: Buffer.from('fake-audio'),
      mediaType: 'audio/mpeg',
      options: OpenAITranscriptionRequestSchema.parse({}),
    });

    expect(result.contentType).toBe('application/json');
    expect(JSON.parse(result.text)).toEqual({ text: 'Hello world' });

    vi.doUnmock('@/lib/transcribe-audio');
  });

  it('returns plain text when response_format is text', async () => {
    const mockResult = {
      text: 'Hello world',
      segments: [],
      language: undefined,
      durationInSeconds: 5,
      modelId: 'openrouter/free',
      response: { timestamp: '2026-04-01T00:00:00Z', modelId: 'openrouter/free' },
      providerMetadata: {},
      warnings: [],
    };

    vi.doMock('@/lib/transcribe-audio', () => ({
      transcribeAudio: vi.fn().mockResolvedValue(mockResult),
    }));

    const { executeTranscription, OpenAITranscriptionRequestSchema } = await import('./audio');
    const result = await executeTranscription({
      fileBuffer: Buffer.from('fake-audio'),
      mediaType: 'audio/mpeg',
      options: OpenAITranscriptionRequestSchema.parse({ response_format: 'text' }),
    });

    expect(result.contentType).toBe('text/plain');
    expect(result.text).toBe('Hello world');

    vi.doUnmock('@/lib/transcribe-audio');
  });

  it('throws when transcription fails', async () => {
    vi.doMock('@/lib/transcribe-audio', () => ({
      transcribeAudio: vi.fn().mockRejectedValue(new Error('Unable to transcribe audio')),
    }));

    const { executeTranscription, OpenAITranscriptionRequestSchema } = await import('./audio');
    await expect(executeTranscription({
      fileBuffer: Buffer.from('fake-audio'),
      mediaType: 'audio/mpeg',
      options: OpenAITranscriptionRequestSchema.parse({}),
    })).rejects.toThrow('Unable to transcribe audio');

    vi.doUnmock('@/lib/transcribe-audio');
  });
});
