import { experimental_generateSpeech } from 'ai';
import { z } from 'zod';
import { errorMessage } from '@/lib/errors';
import { getDefaultSpeechModelId, getSpeechModel } from '@/lib/provider';

export const SpeechGenerationInputSchema = z.object({
  text: z.string().trim().min(1, 'Text is required'),
  voice: z.string().trim().min(1).optional(),
  modelId: z.string().trim().min(1).optional(),
  outputFormat: z.enum(['mp3', 'wav']).optional(),
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

function normalizeAudioDataUrl(mediaType: string, base64: string) {
  return `data:${mediaType};base64,${base64}`;
}

export async function generateSpeechFromText(input: SpeechGenerationInput): Promise<SpeechGenerationResult> {
  const { text, voice, modelId, outputFormat, instructions, speed, language } =
    SpeechGenerationInputSchema.parse(input);
  const resolvedModelId = modelId ?? getDefaultSpeechModelId();

  try {
    const result = await experimental_generateSpeech({
      model: getSpeechModel(resolvedModelId),
      text,
      voice,
      outputFormat,
      instructions,
      speed,
      language,
    });

    if (!result.audio?.base64 || !result.audio.mediaType) {
      throw new Error('No audio was generated');
    }

    return {
      text,
      voice,
      modelId: resolvedModelId,
      audioDataUrl: normalizeAudioDataUrl(result.audio.mediaType, result.audio.base64),
      mediaType: result.audio.mediaType,
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
    throw new Error(errorMessage(error, 'Unable to generate speech'), { cause: error });
  }
}
