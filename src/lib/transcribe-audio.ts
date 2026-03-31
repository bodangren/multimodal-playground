import { z } from 'zod';
import { errorMessage } from '@/lib/errors';
import { getDefaultTranscriptionModelId, getOpenRouterApiUrl, getOpenRouterAuthHeaders } from '@/lib/provider';

const AudioInputSchema = z.custom<Buffer | Uint8Array | File>(
  (value) => value instanceof Uint8Array || value instanceof File,
  {
    message: 'Audio data is required',
  }
);

const OpenRouterTranscriptionResponseSchema = z.object({
  id: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  usage: z
    .object({
      prompt_tokens: z.number().nonnegative().optional(),
      completion_tokens: z.number().nonnegative().optional(),
      total_tokens: z.number().nonnegative().optional(),
    })
    .optional(),
  choices: z
    .array(
      z.object({
        message: z.object({
          content: z.union([
            z.string(),
            z.array(
              z.object({
                type: z.string().min(1).optional(),
                text: z.string().optional(),
              })
            ),
          ]),
        }),
      })
    )
    .min(1, 'No transcription response choices were returned'),
});

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

function audioMediaTypeToFormat(mediaType: string) {
  const normalized = mediaType.toLowerCase();

  if (normalized === 'audio/mpeg' || normalized === 'audio/mp3') {
    return 'mp3';
  }
  if (normalized === 'audio/wav' || normalized === 'audio/x-wav') {
    return 'wav';
  }
  if (normalized === 'audio/aac') {
    return 'aac';
  }
  if (normalized === 'audio/ogg') {
    return 'ogg';
  }
  if (normalized === 'audio/flac') {
    return 'flac';
  }
  if (normalized === 'audio/mp4' || normalized === 'audio/x-m4a' || normalized === 'audio/m4a') {
    return 'm4a';
  }

  return mediaType.split('/')[1] ?? 'mp3';
}

function extractTranscriptText(content: string | Array<{ type?: string; text?: string }>) {
  if (typeof content === 'string') {
    return content.trim();
  }

  return content
    .map((part) => part.text?.trim() ?? '')
    .filter(Boolean)
    .join('\n')
    .trim();
}

async function readOpenRouterError(response: Response) {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    const payload: unknown = await response.json();

    if (
      typeof payload === 'object' &&
      payload !== null &&
      'error' in payload &&
      typeof (payload as { error?: unknown }).error === 'object' &&
      typeof (payload as { error?: { message?: unknown } }).error?.message === 'string'
    ) {
      return (payload as { error: { message: string } }).error.message;
    }
  }

  const text = (await response.text()).trim();
  return text || `OpenRouter transcription request failed with status ${response.status}`;
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
    const response = await fetch(getOpenRouterApiUrl('/chat/completions'), {
      method: 'POST',
      headers: {
        ...getOpenRouterAuthHeaders(),
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: resolvedModelId,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please transcribe this audio file.',
              },
              {
                type: 'input_audio',
                input_audio: {
                  data: Buffer.from(normalized.bytes).toString('base64'),
                  format: audioMediaTypeToFormat(resolvedMediaType),
                },
              },
            ],
          },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(await readOpenRouterError(response));
    }

    const payload = OpenRouterTranscriptionResponseSchema.parse(await response.json());
    const text = extractTranscriptText(payload.choices[0].message.content);

    if (!text) {
      throw new Error('No transcript was generated');
    }

    const timestamp = response.headers.get('date');

    return {
      text,
      segments: [],
      language: undefined,
      durationInSeconds: undefined,
      modelId: payload.model ?? resolvedModelId,
      response: {
        timestamp: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
        modelId: payload.model ?? resolvedModelId,
      },
      providerMetadata: {
        openrouter: {
          responseId: payload.id ?? null,
          usage: payload.usage ?? null,
        },
      },
      warnings: [],
    };
  } catch (error) {
    throw new Error(errorMessage(error, 'Unable to transcribe audio'), { cause: error });
  }
}
