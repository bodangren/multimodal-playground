import { experimental_transcribe } from 'ai';
import { z } from 'zod';
import { errorMessage } from '@/lib/errors';
import { getDefaultTranscriptionModelId, getTranscriptionModel } from '@/lib/provider';

const AudioInputSchema = z.custom<Buffer | Uint8Array | File>(
  (value) => value instanceof Uint8Array || value instanceof File,
  {
    message: 'Audio data is required',
  }
);

export const TranscriptionInputSchema = z.object({
  audio: AudioInputSchema,
  modelId: z.string().trim().min(1).optional(),
  mediaType: z.string().trim().min(1).optional(),
});

export type TranscriptionInput = z.infer<typeof TranscriptionInputSchema>;

export type TranscriptionResult = {
  text: string;
  segments: Array<{
    text: string;
    startSecond: number;
    endSecond: number;
  }>;
  language: string | undefined;
  durationInSeconds: number | undefined;
  modelId: string;
  response: {
    timestamp: string;
    modelId: string;
  } | null;
  providerMetadata: Record<string, unknown>;
  warnings: Array<{ message?: string; details?: string }>;
};

function isAudioMediaType(mediaType: string | undefined) {
  return !!mediaType && mediaType.toLowerCase().startsWith('audio/');
}

function normalizeAudioInput(audio: Buffer | Uint8Array | File) {
  if (audio instanceof File) {
    return audio.arrayBuffer().then((arrayBuffer) => ({
      bytes: new Uint8Array(arrayBuffer),
      mediaType: audio.type || undefined,
    }));
  }

  return Promise.resolve({
    bytes: audio instanceof Uint8Array ? audio : new Uint8Array(audio),
    mediaType: undefined,
  });
}

export async function transcribeAudio(input: TranscriptionInput): Promise<TranscriptionResult> {
  const { modelId, mediaType } = TranscriptionInputSchema.parse(input);
  const audio = input.audio;
  const resolvedModelId = modelId ?? getDefaultTranscriptionModelId();
  const normalized = await normalizeAudioInput(audio);
  const resolvedMediaType = mediaType ?? normalized.mediaType ?? 'audio/mpeg';

  if (normalized.bytes.length === 0) {
    throw new Error('Audio data is required');
  }

  if (!isAudioMediaType(resolvedMediaType)) {
    throw new Error('Unsupported audio media type');
  }

  try {
    const result = await experimental_transcribe({
      model: getTranscriptionModel(resolvedModelId),
      audio: normalized.bytes,
    });

    if (!result.text.trim()) {
      throw new Error('No transcript was generated');
    }

    return {
      text: result.text,
      segments: result.segments ?? [],
      language: result.language,
      durationInSeconds: result.durationInSeconds,
      modelId: result.responses[0]?.modelId ?? resolvedModelId,
      response: result.responses[0]
        ? {
            timestamp: result.responses[0].timestamp.toISOString(),
            modelId: result.responses[0].modelId,
          }
        : null,
      providerMetadata: result.providerMetadata ?? {},
      warnings: result.warnings ?? [],
    };
  } catch (error) {
    throw new Error(errorMessage(error, 'Unable to transcribe audio'), { cause: error });
  }
}
