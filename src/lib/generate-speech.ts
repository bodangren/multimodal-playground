import { z } from 'zod';
import { errorMessage } from '@/lib/errors';
import { getDefaultSpeechModelId, getOpenRouterApiUrl, getOpenRouterAuthHeaders } from '@/lib/provider';

export const SpeechGenerationInputSchema = z.object({
  text: z.string().trim().min(1, 'Text is required'),
  voice: z.string().trim().min(1).optional(),
  modelId: z.string().trim().min(1).optional(),
  instructions: z.string().trim().min(1).optional(),
  speed: z.number().positive().optional(),
  language: z.string().trim().min(1).optional(),
});

export type SpeechGenerationInput = z.infer<typeof SpeechGenerationInputSchema>;

export type SpeechGenerationResult = {
  text: string;
  voice: string | undefined;
  modelId: string;
  audioDataUrl: string;
  mediaType: string;
  response: {
    timestamp: string;
    modelId: string;
  } | null;
  providerMetadata: Record<string, unknown>;
  warnings: Array<{ message?: string; details?: string }>;
};

type OpenRouterAudioChunk = {
  id?: string;
  model?: string;
  choices?: Array<{
    delta?: {
      audio?: {
        data?: string;
        transcript?: string;
      };
    };
  }>;
};

function pcm16ToWavBase64(pcmBase64: string, sampleRate = 24000): string {
  const pcmBytes = Uint8Array.from(atob(pcmBase64), (c) => c.charCodeAt(0));
  const numSamples = pcmBytes.length / 2;
  const byteRate = sampleRate * 2;
  const blockAlign = 2;
  const dataSize = pcmBytes.length;
  const bufferSize = 44 + dataSize;
  const buffer = new ArrayBuffer(bufferSize);
  const view = new DataView(buffer);

  view.setUint32(0, 0x52494646, false);
  view.setUint32(4, bufferSize - 8, true);
  view.setUint32(8, 0x57415645, false);
  view.setUint32(12, 0x666d7420, false);
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  view.setUint32(36, 0x64617461, false);
  view.setUint32(40, dataSize, true);

  for (let i = 0; i < pcmBytes.length; i++) {
    view.setUint8(44 + i, pcmBytes[i]);
  }

  const wavBytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < wavBytes.length; i += chunkSize) {
    const chunk = wavBytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function normalizeAudioDataUrl(mediaType: string, base64: string) {
  return `data:${mediaType};base64,${base64}`;
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
  return text || `OpenRouter speech request failed with status ${response.status}`;
}

async function readAudioSseStream(response: Response) {
  const reader = response.body?.getReader();

  if (!reader) {
    throw new Error('OpenRouter did not return an audio stream');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let responseId: string | null = null;
  let responseModel: string | null = null;
  let transcript = '';
  const audioChunks: string[] = [];

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });

    const events = buffer.split(/\r?\n\r?\n/);
    buffer = events.pop() ?? '';

    for (const event of events) {
      for (const line of event.split(/\r?\n/)) {
        if (!line.startsWith('data:')) {
          continue;
        }

        const data = line.slice(5).trim();
        if (!data) {
          continue;
        }

        if (data === '[DONE]') {
          return { audioBase64: audioChunks.join(''), transcript, responseId, responseModel };
        }

        const chunk = JSON.parse(data) as OpenRouterAudioChunk;
        responseId ??= chunk.id ?? null;
        responseModel ??= chunk.model ?? null;

        const audio = chunk.choices?.[0]?.delta?.audio;
        if (audio?.data) {
          audioChunks.push(audio.data);
        }
        if (audio?.transcript) {
          transcript += audio.transcript;
        }
      }
    }

    if (done) {
      break;
    }
  }

  return { audioBase64: audioChunks.join(''), transcript, responseId, responseModel };
}

export async function generateSpeechFromText(input: SpeechGenerationInput): Promise<SpeechGenerationResult> {
  const { text, voice, modelId, instructions, speed, language } =
    SpeechGenerationInputSchema.parse(input);
  const resolvedModelId = modelId ?? getDefaultSpeechModelId();

  try {
    const response = await fetch(getOpenRouterApiUrl('/chat/completions'), {
      method: 'POST',
      headers: {
        ...getOpenRouterAuthHeaders(),
        Accept: 'text/event-stream',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: resolvedModelId,
        messages: [
          {
            role: 'user',
            content: text,
          },
        ],
        modalities: ['text', 'audio'],
        audio: {
          voice: voice ?? 'alloy',
          format: 'pcm16',
        },
        instructions,
        speed,
        language,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(await readOpenRouterError(response));
    }

    const { audioBase64, responseId, responseModel } = await readAudioSseStream(response);

    if (!audioBase64) {
      throw new Error('No audio was generated');
    }

    const timestamp = response.headers.get('date');

    return {
      text,
      voice: voice ?? 'alloy',
      modelId: resolvedModelId,
      audioDataUrl: normalizeAudioDataUrl('audio/wav', pcm16ToWavBase64(audioBase64)),
      mediaType: 'audio/wav',
      response: {
        timestamp: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
        modelId: responseModel ?? resolvedModelId,
      },
      providerMetadata: {
        openrouter: {
          responseId,
        },
      },
      warnings: [],
    };
  } catch (error) {
    throw new Error(errorMessage(error, 'Unable to generate speech'), { cause: error });
  }
}
