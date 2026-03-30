import { beforeEach, describe, expect, it, vi } from 'vitest';

const experimentalTranscribeMock = vi.fn();
const getTranscriptionModelMock = vi.fn();
const getDefaultTranscriptionModelIdMock = vi.fn();

vi.mock('ai', () => ({
  experimental_transcribe: experimentalTranscribeMock,
}));

vi.mock('@/lib/provider', () => ({
  getTranscriptionModel: getTranscriptionModelMock,
  getDefaultTranscriptionModelId: getDefaultTranscriptionModelIdMock,
}));

describe('transcribeAudio', () => {
  beforeEach(() => {
    vi.resetModules();
    experimentalTranscribeMock.mockReset();
    getTranscriptionModelMock.mockReset();
    getDefaultTranscriptionModelIdMock.mockReset();
  });

  it('returns normalized transcription output', async () => {
    getDefaultTranscriptionModelIdMock.mockReturnValue('openai/whisper-1');
    getTranscriptionModelMock.mockReturnValue({ modelId: 'openai/whisper-1' });
    experimentalTranscribeMock.mockResolvedValue({
      text: 'Hello world',
      segments: [],
      language: 'en',
      durationInSeconds: 12,
      warnings: [],
      responses: [
        {
          timestamp: new Date('2026-03-30T00:00:00.000Z'),
          modelId: 'openai/whisper-1',
        },
      ],
      providerMetadata: {},
    });

    const { transcribeAudio } = await import('./transcribe-audio');
    const result = await transcribeAudio({
      audio: Buffer.from('fake-audio'),
      mediaType: 'audio/mpeg',
    });

    expect(result).toEqual({
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

  it('rejects empty audio inputs before the provider is called', async () => {
    const { transcribeAudio } = await import('./transcribe-audio');

    await expect(
      transcribeAudio({
        audio: Buffer.from(''),
        mediaType: 'audio/mpeg',
      })
    ).rejects.toThrow('Audio data is required');
    expect(experimentalTranscribeMock).not.toHaveBeenCalled();
  });

  it('normalizes missing transcription text into an error', async () => {
    getDefaultTranscriptionModelIdMock.mockReturnValue('openai/whisper-1');
    getTranscriptionModelMock.mockReturnValue({ modelId: 'openai/whisper-1' });
    experimentalTranscribeMock.mockResolvedValue({
      text: '',
      segments: [],
      language: 'en',
      durationInSeconds: 12,
      warnings: [],
      responses: [],
      providerMetadata: {},
    });

    const { transcribeAudio } = await import('./transcribe-audio');

    await expect(
      transcribeAudio({
        audio: Buffer.from('fake-audio'),
        mediaType: 'audio/mpeg',
      })
    ).rejects.toThrow('No transcript was generated');
  });
});
