import { beforeEach, describe, expect, it, vi } from 'vitest';

const experimentalGenerateSpeechMock = vi.fn();
const getSpeechModelMock = vi.fn();
const getDefaultSpeechModelIdMock = vi.fn();

vi.mock('ai', () => ({
  experimental_generateSpeech: experimentalGenerateSpeechMock,
}));

vi.mock('@/lib/provider', () => ({
  getSpeechModel: getSpeechModelMock,
  getDefaultSpeechModelId: getDefaultSpeechModelIdMock,
}));

describe('generateSpeechFromText', () => {
  beforeEach(() => {
    vi.resetModules();
    experimentalGenerateSpeechMock.mockReset();
    getSpeechModelMock.mockReset();
    getDefaultSpeechModelIdMock.mockReset();
  });

  it('returns a normalized speech payload', async () => {
    getDefaultSpeechModelIdMock.mockReturnValue('openai/tts-1');
    getSpeechModelMock.mockReturnValue({ modelId: 'openai/tts-1' });
    experimentalGenerateSpeechMock.mockResolvedValue({
      audio: {
        base64: 'ZmFrZS1hdWRpbw==',
        mediaType: 'audio/mpeg',
      },
      warnings: [],
      responses: [
        {
          timestamp: new Date('2026-03-30T00:00:00.000Z'),
          modelId: 'openai/tts-1',
        },
      ],
      providerMetadata: {},
    });

    const { generateSpeechFromText } = await import('./generate-speech');
    const result = await generateSpeechFromText({
      text: 'Hello there',
      voice: 'alloy',
    });

    expect(result).toEqual({
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

  it('rejects empty text before the provider is called', async () => {
    const { generateSpeechFromText } = await import('./generate-speech');

    await expect(generateSpeechFromText({ text: '   ' })).rejects.toThrow('Text is required');
    expect(experimentalGenerateSpeechMock).not.toHaveBeenCalled();
  });

  it('normalizes missing audio payloads into an error', async () => {
    getDefaultSpeechModelIdMock.mockReturnValue('openai/tts-1');
    getSpeechModelMock.mockReturnValue({ modelId: 'openai/tts-1' });
    experimentalGenerateSpeechMock.mockResolvedValue({
      audio: {
        base64: '',
        mediaType: 'audio/mpeg',
      },
      warnings: [],
      responses: [],
      providerMetadata: {},
    });

    const { generateSpeechFromText } = await import('./generate-speech');

    await expect(generateSpeechFromText({ text: 'Hello there' })).rejects.toThrow('No audio was generated');
  });
});
